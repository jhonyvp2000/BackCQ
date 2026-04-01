"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, FileText, Users, UserSquare2, MapPin, UserX, Stethoscope, ActivitySquare, SplitSquareHorizontal, BarChart } from "lucide-react";

export function SidebarNav({ orphanCount = 0, permissions = [] }: { orphanCount?: number, permissions?: string[] }) {
    const pathname = usePathname();

    let navItems = [
        { name: "Dashboard", href: "/dashboard", icon: Activity },
        { name: "Salas", href: "/dashboard/salas", icon: Users },
        { name: "Pacientes", href: "/dashboard/pacientes", icon: UserSquare2 },
        { name: "Anomalías", href: "/dashboard/pacientes/huerfanos", icon: UserX },
        { name: "Personal", href: "/dashboard/personal", icon: Stethoscope },
        { name: "Diagnósticos", href: "/dashboard/diagnosticos", icon: ActivitySquare },
        { name: "Tipos de Intervención", href: "/dashboard/tipos-intervencion", icon: SplitSquareHorizontal },
        { name: "Programaciones", href: "/dashboard/programaciones", icon: FileText, requiredPermission: "ver:programacion" },
        { name: "Reportes", href: "/dashboard/reportes", icon: BarChart },
    ];

    // Filter items based on permissions
    navItems = navItems.filter(item => {
        if (item.requiredPermission) {
            return permissions.includes(item.requiredPermission);
        }
        return true;
    });

    return (
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto w-full">
            {navItems.map((item) => {
                // Exact match for dashboard, startswith for sub-routes, except for pacientes to avoid double active with huerfanos
                const isActive = item.href === '/dashboard'
                    ? pathname === item.href
                    : item.href === '/dashboard/pacientes'
                        ? pathname.startsWith(item.href) && !pathname.includes('huerfanos')
                        : pathname.startsWith(item.href);

                const Icon = item.icon;
                const isAnomalyItem = item.name === "Anomalías" && orphanCount > 0;

                return (
                    <Link
                        key={item.name}
                        href={item.href}
                        className={`flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all relative overflow-hidden group ${isActive
                            ? "bg-[#0D47A1] text-white font-bold shadow-md"
                            : isAnomalyItem
                                ? "bg-red-50/70 hover:bg-red-100/90 dark:bg-red-900/10 dark:hover:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200/50 dark:border-red-900/30"
                                : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white"
                            }`}
                    >
                        {/* Parpadeo suave premium (Fondo y halo) */}
                        {isAnomalyItem && !isActive && (
                            <>
                                <span className="absolute inset-0 bg-red-400/10 dark:bg-red-500/10 animate-pulse pointer-events-none" />
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-red-400/20 dark:bg-red-400/10 rounded-full blur-md animate-pulse pointer-events-none" />
                            </>
                        )}
                        
                        <Icon className={`mr-3 h-5 w-5 z-10 transition-colors ${isActive ? "text-white" : isAnomalyItem ? "text-red-600 dark:text-red-500" : ""}`} />
                        <span className="z-10 flex-1">{item.name}</span>

                        {isAnomalyItem && (
                            <div className="z-10 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm animate-bounce shadow-red-500/30">
                                {orphanCount}
                            </div>
                        )}
                    </Link>
                );
            })}
        </nav>
    );
}
