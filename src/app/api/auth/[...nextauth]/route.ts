import NextAuth, { AuthOptions, User } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcrypt";
import { db } from "@/db";
import { usersTable, userSystemRoles, rolePermissions, permissionsTable } from "@/db/schema";
import { eq, and } from "drizzle-orm";

interface ExtendedUser extends User {
    id: string;
    dni: string;
    name: string;
    lastname: string;
    permissions: string[];
}

export const authOptions: AuthOptions = {
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                dni: { label: "DNI", type: "text" },
                password: { label: "Contraseña", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.dni || !credentials?.password) return null;

                try {
                    // 1. Fetch user from shared table
                    const users = await db.select().from(usersTable).where(eq(usersTable.dni, credentials.dni));
                    const user = users[0];

                    if (!user || !user.isActive) return null;

                    // 2. Verify password
                    const isPasswordValid = await bcrypt.compare(credentials.password, user.passwordHash);
                    if (!isPasswordValid) return null;

                    // 3. Verify system access for 'backcq'
                    const systemAccess = await db.select()
                        .from(userSystemRoles)
                        .where(
                            and(
                                eq(userSystemRoles.userId, user.id),
                                eq(userSystemRoles.systemId, 'backcq')
                            )
                        );

                    if (!systemAccess || systemAccess.length === 0) return null;

                    // Fetch permissions (atomics)
                    const permissionRows = await db.select({ action: permissionsTable.action })
                        .from(userSystemRoles)
                        .innerJoin(rolePermissions, eq(userSystemRoles.roleId, rolePermissions.roleId))
                        .innerJoin(permissionsTable, eq(rolePermissions.permissionId, permissionsTable.id))
                        .where(
                            and(
                                eq(userSystemRoles.userId, user.id),
                                eq(userSystemRoles.systemId, 'backcq')
                            )
                        );

                    const permissions = permissionRows.map(p => p.action);

                    return {
                        id: user.id,
                        dni: user.dni,
                        name: user.name,
                        lastname: user.lastname,
                        permissions
                    } as ExtendedUser;
                } catch (error) {
                    console.error("Auth error:", error);
                    return null;
                }
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                const extUser = user as ExtendedUser;
                token.id = extUser.id;
                token.dni = extUser.dni;
                token.name = extUser.name;
                token.lastname = extUser.lastname;
                token.permissions = extUser.permissions;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                (session.user as any).id = token.id;
                (session.user as any).dni = token.dni;
                (session.user as any).name = token.name;
                (session.user as any).lastname = token.lastname;
                (session.user as any).permissions = token.permissions || [];
            }
            return session;
        },
    },
    pages: {
        signIn: '/login',
    },
    session: { strategy: "jwt" },
    secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
