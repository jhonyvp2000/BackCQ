import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { Stethoscope, Bell } from "lucide-react";
import Link from "next/link";
import { ReactNode } from "react";

import { MegaMenu } from "./mega-menu";
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
        <div className="min-h-screen bg-[var(--color-hospital-bg)] flex flex-col">
            {/* Topbar / MegaMenu Header */}
            <header className="h-16 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 sticky top-0 z-40 flex items-center justify-between px-6 shadow-sm">
                
                {/* Branding Left */}
                <div className="flex items-center gap-6 h-full">
                    <Link href="/dashboard" className="flex items-center gap-2.5 mr-4 hover:opacity-90 transition-opacity">
                        <div className="w-9 h-9 bg-[var(--color-hospital-blue)] text-white rounded-lg flex items-center justify-center shadow-md">
                            <Stethoscope size={18} />
                        </div>
                        <div className="hidden sm:block">
                            <h2 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-white leading-none">Back<span className="text-[var(--color-hospital-light)]">CQ</span></h2>
                            <p className="text-[9px] uppercase tracking-wider text-zinc-500 font-bold leading-none mt-1">Centro Quirúrgico</p>
                        </div>
                    </Link>

                    {/* Central Mega Menu */}
                    <div className="hidden lg:block h-full">
                        <MegaMenu permissions={user.permissions || []} />
                    </div>
                </div>

                {/* Right Utilities */}
                <div className="flex items-center gap-4">
                    
                    {/* Anomalies Bell */}
                    <Link href="/dashboard/pacientes/huerfanos" className="relative p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors tooltip" title="Pacientes Huérfanos / Anomalías">
                        <Bell size={18} className={orphanCount > 0 ? "text-amber-500 animate-pulse" : "text-zinc-500"} />
                        {orphanCount > 0 && (
                            <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold flex items-center justify-center rounded-full border-2 border-white dark:border-zinc-900 shadow-sm shadow-red-500/50">
                                {orphanCount > 9 ? '+9' : orphanCount}
                            </span>
                        )}
                    </Link>

                    <div className="h-6 w-px bg-zinc-200 dark:bg-zinc-700 hidden sm:block"></div>

                    {/* User Profile Mini */}
                    <div className="hidden sm:flex items-center gap-3">
                        <div className="text-right">
                            <p className="text-[13px] font-bold text-zinc-900 dark:text-white leading-none">
                                {user.name?.split(' ')[0]} {user.lastname?.split(' ')[0]}
                            </p>
                            <p className="text-[10px] text-zinc-500 mt-1">{user.dni}</p>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-[var(--color-hospital-blue)] font-bold text-xs border border-blue-100 dark:border-blue-800">
                            {user.name?.[0]}{user.lastname?.[0]}
                        </div>
                    </div>

                    <LogoutButton />
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 flex flex-col w-full relative">
                {/* Page Content */}
                <div className="flex-1 p-6 sm:p-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
