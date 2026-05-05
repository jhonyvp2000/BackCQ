"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Activity, FileText, Users, UserSquare2, Stethoscope, ActivitySquare, SplitSquareHorizontal, BarChart, Files, ChevronDown, LayoutDashboard } from "lucide-react";
import { MegaMenuItem } from "@/components/layout/mega-menu-item";
import { AnimatePresence, motion } from "framer-motion";

export function MegaMenu({ permissions = [] }: { permissions?: string[] }) {
    const pathname = usePathname();
    const [activeTab, setActiveTab] = useState<string | null>(null);
    let timeoutId: NodeJS.Timeout;

    const handleMouseEnter = (tab: string) => {
        clearTimeout(timeoutId);
        setActiveTab(tab);
    };

    const handleMouseLeave = () => {
        timeoutId = setTimeout(() => {
            setActiveTab(null);
        }, 150);
    };

    const isPathActive = (href: string, exact = false) => {
        if (exact) return pathname === href;
        if (href === '/dashboard/pacientes') return pathname.startsWith(href) && !pathname.includes('huerfanos');
        return pathname.startsWith(href);
    };

    const menuGroups = [
        {
            id: 'medico',
            label: 'Módulo Médico',
            items: [
                { name: "Salas Quirúrgicas", href: "/dashboard/salas", icon: Users, description: "Gestión de quirófanos y su operatividad diaria." },
                { name: "Tipos de Intervención", href: "/dashboard/tipos-intervencion", icon: SplitSquareHorizontal, description: "Catálogo de intervenciones CPT/Kardex." },
                { name: "Diagnósticos", href: "/dashboard/diagnosticos", icon: ActivitySquare, description: "Base de datos CIE-10 para diagnósticos médicos." },
            ]
        },
        {
            id: 'operativo',
            label: 'Gestión Operativa',
            items: [
                { name: "Agenda de Intervenciones", href: "/dashboard/programaciones", icon: FileText, description: "Programación central de cirugías.", requiredPermission: "ver:programacion" },
                { name: "Pacientes", href: "/dashboard/pacientes", icon: UserSquare2, description: "Registro y perfil clínico de pacientes." },
            ]
        },
        {
            id: 'admin',
            label: 'Administración',
            items: [
                { name: "Personal Médico", href: "/dashboard/personal", icon: Stethoscope, description: "Directorio de cirujanos, anestesiólogos y enfermería." },
                { name: "Reportes", href: "/dashboard/reportes", icon: BarChart, description: "Estadísticas y análisis del centro quirúrgico." },
                { name: "Documentos", href: "/dashboard/documentos", icon: Files, description: "Gestión de plantillas y reportes estandarizados." },
            ]
        }
    ];

    // Check if any tab is active natively (to highlight the top header tab)
    const isTabActive = (groupId: string) => {
        const group = menuGroups.find(g => g.id === groupId);
        return group?.items.some(item => isPathActive(item.href, false));
    };

    return (
        <nav className="flex items-center space-x-1 relative h-full">
            <Link 
                href="/dashboard" 
                className={`flex items-center px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${isPathActive('/dashboard', true) ? 'text-[var(--color-hospital-blue)] bg-blue-50 dark:bg-blue-900/20' : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}
            >
                <LayoutDashboard size={16} className="mr-2" />
                Panel
            </Link>

            {menuGroups.map((group) => {
                // Filter permissions
                const items = group.items.filter(item => {
                    if (item.requiredPermission) {
                        return permissions.includes(item.requiredPermission);
                    }
                    return true;
                });

                if (items.length === 0) return null;

                const isGroupHovered = activeTab === group.id;
                const isGroupActivePath = isTabActive(group.id);

                return (
                    <div 
                        key={group.id}
                        className="relative h-full flex items-center"
                        onMouseEnter={() => handleMouseEnter(group.id)}
                        onMouseLeave={handleMouseLeave}
                    >
                        <button className={`flex items-center px-4 py-2 text-sm font-semibold rounded-lg transition-colors outline-none ${isGroupHovered || isGroupActivePath ? 'text-[var(--color-hospital-blue)] bg-blue-50/50 dark:bg-blue-900/10' : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}>
                            {group.label}
                            <ChevronDown size={14} className={`ml-1.5 transition-transform duration-200 ${isGroupHovered ? 'rotate-180 text-[var(--color-hospital-blue)]' : 'text-zinc-400'}`} />
                        </button>

                        <AnimatePresence>
                            {isGroupHovered && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.98 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 5, scale: 0.98, transition: { duration: 0.1 } }}
                                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                                    className="absolute top-full left-0 mt-2 w-[400px] bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl shadow-xl z-50 overflow-hidden"
                                >
                                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-[var(--color-hospital-blue)]"></div>
                                    <div className="p-4 grid grid-cols-1 gap-2">
                                        {items.map(item => (
                                            <MegaMenuItem 
                                                key={item.href}
                                                href={item.href}
                                                icon={item.icon}
                                                title={item.name}
                                                description={item.description}
                                                isActive={isPathActive(item.href)}
                                            />
                                        ))}
                                    </div>
                                    <div className="px-5 py-3 bg-zinc-50 dark:bg-zinc-800/50 border-t border-zinc-100 dark:border-zinc-800 text-[11px] text-zinc-500 font-medium">
                                        Submódulo de {group.label}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                );
            })}
        </nav>
    );
}
