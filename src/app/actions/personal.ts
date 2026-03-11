"use server";

import { db } from "@/db";
import { usersTable, staffProfiles, professions } from "@/db/schema";
import { eq, or } from "drizzle-orm";

export async function getMedicalStaffByProfession(professionName: string | string[]) {
    let professionFilter;
    if (Array.isArray(professionName)) {
        professionFilter = professionName.map(p => eq(professions.name, p));
    } else {
        professionFilter = [eq(professions.name, professionName)];
    }

    return await db.select({
        id: usersTable.id,
        name: usersTable.name,
        lastname: usersTable.lastname,
        dni: usersTable.dni,
        tuitionCode: staffProfiles.tuitionCode,
        professionName: professions.name,
    })
        .from(usersTable)
        .innerJoin(staffProfiles, eq(usersTable.id, staffProfiles.userId))
        .innerJoin(professions, eq(staffProfiles.professionId, professions.id))
        .where(or(...professionFilter));
}
