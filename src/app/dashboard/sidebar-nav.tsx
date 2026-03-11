"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, FileText, Users, UserSquare2, MapPin } from "lucide-react";

export function SidebarNav() {
    const pathname = usePathname();

    const navItems = [
        { name: "Dashboard", href: "/dashboard", icon: Activity },
        { name: "Salas", href: "/dashboard/salas", icon: Users },
        { name: "Pacientes", href: "/dashboard/pacientes", icon: UserSquare2 },
        { name: "Programaciones", href: "/dashboard/programaciones", icon: FileText },
        { name: "Ubigeo", href: "/dashboard/ubigeo", icon: MapPin },
    ];

    return (
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto w-full">
            {navItems.map((item) => {
                // Exact match for dashboard, startswith for sub-routes
                const isActive = item.href === '/dashboard'
                    ? pathname === item.href
                    : pathname.startsWith(item.href);

                const Icon = item.icon;

                return (
                    <Link
                        key={item.name}
                        href={item.href}
                        className={`flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all ${isActive
                            ? "bg-[#0D47A1] text-white font-bold shadow-sm"
                            : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white"
                            }`}
                    >
                        <Icon className={`mr-3 h-5 w-5 ${isActive ? "text-white" : ""}`} />
                        {item.name}
                    </Link>
                );
            })}
        </nav>
    );
}
