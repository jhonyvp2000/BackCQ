"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { createPaciente } from "@/app/actions/pacientes";
import { UbigeoSelector } from "./ubigeo-selector";
import { motion, AnimatePresence } from "framer-motion";

export function CreatePatientModal() {
    const [isOpen, setIsOpen] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        // Prevent default only if we wanted to handle the action manually via fetch, 
        // but Next.js <form action={}> handles it native server-side.
        // Wait, standard form action causes page reload unless it's a Client Action. 
        // We'll let NextJS handle it and just close on success? No, form action in Next 14 handles it cleanly.
        // But to close modal, we should use an action state, or just let it reload the page path.
        // For simplicity now, we can close it immediately or let it navigate.
        setTimeout(() => setIsOpen(false), 500); 
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="flex items-center text-sm font-semibold justify-center py-2 px-4 rounded-xl shadow-[0_2px_8px_rgba(33,121,202,0.25)] text-white bg-[var(--color-hospital-blue)] hover:bg-[#09357a] hover:shadow-[0_4px_12px_rgba(33,121,202,0.35)] transition-all uppercase tracking-wider gap-2"
            >
                <Plus size={16} /> Ingreso Manual (Offline)
            </button>

            <AnimatePresence>
                {isOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsOpen(false)}
                            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                        />
                        
                        {/* Modal Content */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
                                <h3 className="font-bold text-lg text-zinc-900 dark:text-white flex items-center gap-2">
                                    <Plus size={20} className="text-[var(--color-hospital-blue)]" /> Nuevo Paciente Manual
                                </h3>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="p-2 rounded-full text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 dark:hover:text-zinc-200 dark:hover:bg-zinc-800 transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <form action={createPaciente} onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Nombres Completos</label>
                                    <input
                                        type="text"
                                        name="nombres"
                                        required
                                        className="w-full px-4 py-2.5 border border-zinc-200 dark:border-zinc-700 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 text-zinc-900 dark:text-white focus:ring-2 focus:ring-[var(--color-hospital-light)] focus:border-transparent outline-none transition-all font-medium placeholder-zinc-400"
                                        placeholder="Ej. Juan Carlos"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Apellidos Completos</label>
                                    <input
                                        type="text"
                                        name="apellidos"
                                        required
                                        className="w-full px-4 py-2.5 border border-zinc-200 dark:border-zinc-700 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 text-zinc-900 dark:text-white focus:ring-2 focus:ring-[var(--color-hospital-light)] focus:border-transparent outline-none transition-all font-medium placeholder-zinc-400"
                                        placeholder="Ej. Pérez Gómez"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4 mt-2">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">DNI</label>
                                        <input
                                            type="text"
                                            name="dni"
                                            maxLength={8}
                                            className="w-full px-4 py-2.5 border border-zinc-200 dark:border-zinc-700 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 text-zinc-900 dark:text-white focus:ring-2 focus:ring-[var(--color-hospital-light)] focus:border-transparent outline-none transition-all font-medium placeholder-zinc-400"
                                            placeholder="8 dígitos (Opcional)"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">C. Extranjería</label>
                                        <input
                                            type="text"
                                            name="carnetExtranjeria"
                                            maxLength={20}
                                            className="w-full px-4 py-2.5 border border-zinc-200 dark:border-zinc-700 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 text-zinc-900 dark:text-white focus:ring-2 focus:ring-[var(--color-hospital-light)] focus:border-transparent outline-none transition-all font-medium placeholder-zinc-400"
                                            placeholder="Opcional"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 mt-2">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Pasaporte / Otro</label>
                                        <input
                                            type="text"
                                            name="pasaporte"
                                            maxLength={20}
                                            className="w-full px-4 py-2.5 border border-zinc-200 dark:border-zinc-700 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 text-zinc-900 dark:text-white focus:ring-2 focus:ring-[var(--color-hospital-light)] focus:border-transparent outline-none transition-all font-medium placeholder-zinc-400"
                                            placeholder="Opcional"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Historia Clínica</label>
                                        <input
                                            type="text"
                                            name="historiaClinica"
                                            className="w-full px-4 py-2.5 border border-zinc-200 dark:border-zinc-700 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 text-zinc-900 dark:text-white focus:ring-2 focus:ring-[var(--color-hospital-light)] focus:border-transparent outline-none transition-all font-medium placeholder-zinc-400"
                                            placeholder="N° HC (Opcional)"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 mt-2">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Sexo</label>
                                        <select
                                            name="sexo"
                                            required
                                            className="w-full px-4 py-2.5 border border-zinc-200 dark:border-zinc-700 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 text-zinc-900 dark:text-white focus:ring-2 focus:ring-[var(--color-hospital-light)] focus:border-transparent outline-none transition-all font-medium appearance-none"
                                        >
                                            <option value="">-- Sexo --</option>
                                            <option value="Masculino">Masculino</option>
                                            <option value="Femenino">Femenino</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">F. Nacimiento</label>
                                        <input
                                            type="date"
                                            name="fechaNacimiento"
                                            required
                                            className="w-full px-4 py-2.5 border border-zinc-200 dark:border-zinc-700 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 text-zinc-900 dark:text-white focus:ring-2 focus:ring-[var(--color-hospital-light)] focus:border-transparent outline-none transition-all font-medium [color-scheme:light] dark:[color-scheme:dark]"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5 mt-2">
                                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Ubigeo (INEI)</label>
                                    <UbigeoSelector name="ubigeo" />
                                </div>

                                <div className="pt-2 sticky bottom-0 bg-white dark:bg-zinc-900 border-t border-zinc-100 dark:border-zinc-800 pb-2">
                                    <button
                                        type="submit"
                                        className="w-full mt-2 flex justify-center py-3 px-4 rounded-xl shadow-[0_2px_8px_rgba(33,121,202,0.25)] text-sm font-bold text-white bg-[var(--color-hospital-blue)] hover:bg-[#09357a] hover:shadow-[0_4px_12px_rgba(33,121,202,0.35)] transition-all"
                                    >
                                        Guardar Paciente Offline
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
}

