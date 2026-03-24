import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { Stethoscope, LogOut, FileText, Users, Settings } from "lucide-react";
import Link from "next/link";
import { ReactNode } from "react";

import { SidebarNav } from "./sidebar-nav";
import { getOrphans } from "@/app/actions/pacientes";
import { LogoutButton } from "@/components/layout/logout-button";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
    const session = await getServerSession(authOptions);

    if (!session) {
        redirect("/login");
    }

    const user = session.user as any;
    const orphans = await getOrphans();
    const orphanCount = orphans.length;

    return (
        <div className="min-h-screen bg-[var(--color-hospital-bg)] flex flex-col md:flex-row">
            {/* Sidebar */}
            <aside className="w-full md:w-64 bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 flex flex-col md:fixed md:h-full z-20">
                <div className="flex items-center p-6 border-b border-zinc-100 dark:border-zinc-800">
                    <div className="w-10 h-10 bg-[var(--color-hospital-blue)] text-white rounded-xl flex items-center justify-center shadow-lg">
                        <Stethoscope size={20} />
                    </div>
                    <div className="ml-3">
                        <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">Back<span className="text-[var(--color-hospital-light)]">CQ</span></h2>
                        <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-medium">Centro Quirúrgico</p>
                    </div>
                </div>

                <SidebarNav orphanCount={orphanCount} />

                <div className="p-4 border-t border-zinc-200 dark:border-zinc-800">
                    <div className="flex items-center">
                        <div className="w-9 h-9 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-[var(--color-hospital-blue)] font-bold uppercase border border-zinc-200 dark:border-zinc-700">
                            {user.name?.[0]}{user.lastname?.[0]}
                        </div>
                        <div className="ml-3 overflow-hidden">
                            <p className="text-sm font-medium text-zinc-900 dark:text-white truncate">
                                {user.name} {user.lastname}
                            </p>
                            <p className="text-xs text-zinc-500 truncate">{user.dni}</p>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col md:ml-64 w-full min-h-screen">
                {/* Topbar */}
                <header className="h-16 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 sticky top-0 z-10 hidden md:flex items-center justify-between px-8">
                    <div className="flex items-center">
                        <h1 className="text-[17px] font-semibold text-zinc-800 dark:text-white">Panel Principal</h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <LogoutButton />
                    </div>
                </header>

                {/* Page Content */}
                <div className="flex-1 p-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
