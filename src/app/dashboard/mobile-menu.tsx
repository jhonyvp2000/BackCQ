"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { 
    Menu, X, Activity, FileText, Users, UserSquare2, Stethoscope, 
    ActivitySquare, SplitSquareHorizontal, BarChart, Files, 
    LayoutDashboard, MonitorPlay, ChevronRight 
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

export function MobileMenu({ 
    permissions = [], 
    user 
}: { 
    permissions?: string[], 
    user: { name?: string; lastname?: string; dni?: string } 
}) {
    const [isOpen, setIsOpen] = useState(false);
    const pathname = usePathname();

    // Close menu when route changes
    useEffect(() => {
        setIsOpen(false);
    }, [pathname]);

    // Prevent body scroll when menu is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => {
            document.body.style.overflow = "";
        };
    }, [isOpen]);

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
                { name: "Salas Quirúrgicas", href: "/dashboard/salas", icon: Users, description: "Gestión de quirófanos y operatividad." },
                { name: "Tipos de Intervención", href: "/dashboard/tipos-intervencion", icon: SplitSquareHorizontal, description: "Catálogo CPT/Kardex." },
                { name: "Diagnósticos", href: "/dashboard/diagnosticos", icon: ActivitySquare, description: "Base CIE-10." },
            ]
        },
        {
            id: 'operativo',
            label: 'Gestión Operativa',
            items: [
                { name: "Agenda de Intervenciones", href: "/dashboard/programaciones", icon: FileText, description: "Programación de cirugías.", requiredPermission: "ver:programacion" },
                { name: "Proyectar Agenda", href: "/dashboard/programaciones/tv", icon: MonitorPlay, description: "Vista de TV." },
                { name: "Pacientes", href: "/dashboard/pacientes", icon: UserSquare2, description: "Registro clínico." },
            ]
        },
        {
            id: 'admin',
            label: 'Administración',
            items: [
                { name: "Personal Médico", href: "/dashboard/personal", icon: Stethoscope, description: "Directorio del personal." },
                { name: "Reportes", href: "/dashboard/reportes", icon: BarChart, description: "Estadísticas y análisis." },
                { name: "Documentos", href: "/dashboard/documentos", icon: Files, description: "Plantillas y reportes." },
            ]
        }
    ];

    return (
        <div className="lg:hidden flex items-center">
            {/* Toggle Button */}
            <button 
                onClick={() => setIsOpen(true)}
                className="p-2 -ml-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white rounded-xl hover:bg-zinc-100/80 dark:hover:bg-zinc-800/50 transition-colors"
                aria-label="Abrir menú"
            >
                <Menu size={22} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop Overlay */}
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
                            onClick={() => setIsOpen(false)}
                        />

                        {/* Slide-over Drawer Panel */}
                        <motion.div 
                            initial={{ x: "-100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "-100%" }}
                            transition={{ type: "spring", damping: 30, stiffness: 300 }}
                            className="fixed inset-y-0 left-0 z-50 w-full max-w-[310px] bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 shadow-2xl flex flex-col h-full"
                        >
                            {/* Drawer Header */}
                            <div className="px-5 py-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/50">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 bg-[var(--color-hospital-blue)] text-white rounded-lg flex items-center justify-center shadow-md">
                                        <Stethoscope size={16} />
                                    </div>
                                    <div>
                                        <h2 className="text-md font-bold tracking-tight text-zinc-900 dark:text-white leading-none">Back<span className="text-[var(--color-hospital-light)]">CQ</span></h2>
                                        <p className="text-[8px] uppercase tracking-wider text-zinc-500 font-bold leading-none mt-0.5">Centro Quirúrgico</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setIsOpen(false)}
                                    className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            {/* User Profile Summary (Mobile Specific) */}
                            {user && (
                                <div className="px-5 py-4 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/30 dark:bg-zinc-800/10 flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-[var(--color-hospital-blue)] font-bold text-sm border border-blue-100 dark:border-blue-800">
                                        {user.name?.[0]}{user.lastname?.[0]}
                                    </div>
                                    <div>
                                        <p className="text-[13px] font-bold text-zinc-900 dark:text-white leading-none">
                                            {user.name} {user.lastname}
                                        </p>
                                        <p className="text-[10px] text-zinc-500 mt-1">DNI: {user.dni}</p>
                                    </div>
                                </div>
                            )}

                            {/* Drawer Links */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-5 custom-scrollbar">
                                {/* Panel principal link */}
                                <Link 
                                    href="/dashboard"
                                    className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                                        isPathActive('/dashboard', true) 
                                            ? 'text-[var(--color-hospital-blue)] bg-blue-50 dark:bg-blue-900/20 shadow-sm' 
                                            : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                                    }`}
                                >
                                    <div className="flex items-center gap-2.5">
                                        <LayoutDashboard size={18} />
                                        <span>Panel Principal</span>
                                    </div>
                                    <ChevronRight size={14} className="text-zinc-400" />
                                </Link>

                                {menuGroups.map((group) => {
                                    // Filter allowed items
                                    const items = group.items.filter(item => {
                                        if (item.requiredPermission) {
                                            return permissions.includes(item.requiredPermission);
                                        }
                                        return true;
                                    });

                                    if (items.length === 0) return null;

                                    return (
                                        <div key={group.id} className="space-y-1.5">
                                            <h3 className="px-3 text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                                                {group.label}
                                            </h3>
                                            <div className="space-y-0.5">
                                                {items.map((item) => {
                                                    const IconComponent = item.icon;
                                                    const active = isPathActive(item.href);
                                                    return (
                                                        <Link 
                                                            key={item.href}
                                                            href={item.href}
                                                            className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                                                                active 
                                                                    ? 'text-[var(--color-hospital-blue)] bg-blue-50/70 dark:bg-blue-900/20 shadow-sm font-semibold' 
                                                                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800/30'
                                                            }`}
                                                        >
                                                            <div className="flex items-center gap-2.5">
                                                                <IconComponent size={18} className={active ? 'text-[var(--color-hospital-blue)]' : 'text-zinc-500'} />
                                                                <span>{item.name}</span>
                                                            </div>
                                                            <ChevronRight size={14} className={active ? 'text-[var(--color-hospital-blue)]' : 'text-zinc-400'} />
                                                        </Link>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Drawer Footer */}
                            <div className="p-4 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/30 dark:bg-zinc-900/30 text-center text-[10px] text-zinc-400 font-medium">
                                BackCQ v0.1.0 • O.G.E.S.S.
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
