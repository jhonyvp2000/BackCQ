"use client";

import { useState } from "react";
import { Edit2, ShieldAlert, CheckCircle, X, Shield, Play, Wrench } from "lucide-react";
import { updateOperatingRoom } from "@/app/actions/salas";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";

export function EditRoomButton({ sala }: { sala: any }) {
    const [isOpen, setIsOpen] = useState(false);
    const [name, setName] = useState(sala.name);
    const [status, setStatus] = useState(sala.status);
    const [submitting, setSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");

    const inputClasses = "w-full px-4 py-3 border border-zinc-200 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-2 focus:ring-[var(--color-hospital-blue)] focus:border-transparent outline-none transition-all";
    const selectClasses = `${inputClasses} appearance-none bg-no-repeat bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%2371717A%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:10px_10px] bg-[position:right_1rem_center]`;


    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setErrorMsg("");

        try {
            const formData = new FormData();
            formData.append("id", sala.id);
            formData.append("name", name);
            formData.append("status", status);

            await updateOperatingRoom(formData);
            setIsOpen(false);
        } catch (error: any) {
            setErrorMsg(error.message || "No se pudo actualizar la sala.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="text-blue-500 hover:text-blue-700 bg-blue-50 dark:bg-blue-900/20 p-2 rounded-lg transition-colors flex items-center justify-center"
                title="Editar Sala"
            >
                <Edit2 size={16} />
            </button>

            {isOpen && createPortal(
                <AnimatePresence>
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => !submitting && setIsOpen(false)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -10 }}
                            className="bg-white dark:bg-zinc-900 rounded-3xl shadow-xl border border-zinc-200/50 dark:border-zinc-800 z-10 w-full max-w-md overflow-hidden relative"
                        >
                            <div className="px-6 py-5 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
                                <div className="flex justify-between items-center">
                                    <h2 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-white flex items-center gap-2">
                                        <Edit2 size={18} className="text-blue-500" /> Editar Infraestructura
                                    </h2>
                                    <button
                                        onClick={() => setIsOpen(false)}
                                        disabled={submitting}
                                        className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors p-1 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>
                                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                                    ID: <span className="font-mono bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded">{sala.id.split('-')[0]}</span>
                                </p>
                            </div>

                            <form onSubmit={handleSave} className="p-6">
                                {errorMsg && (
                                    <div className="mb-6 p-4 bg-red-50 border border-red-200 dark:bg-red-900/10 dark:border-red-500/20 text-red-800 dark:text-red-300 rounded-2xl flex items-start gap-3 shadow-sm">
                                        <ShieldAlert className="shrink-0 mt-0.5" size={18} />
                                        <div className="text-sm font-semibold">{errorMsg}</div>
                                    </div>
                                )}

                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-zinc-500 uppercase tracking-widest pl-1">Identificador de Sala</label>
                                        <input
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            required
                                            className={inputClasses}
                                            placeholder="Ej. Quirófano Central"
                                            autoFocus
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-zinc-500 uppercase tracking-widest pl-1">Disponibilidad Actual</label>
                                        <div className="relative">
                                            <select
                                                value={status}
                                                onChange={(e) => setStatus(e.target.value)}
                                                className={`${selectClasses} font-semibold ${status === 'available' ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800/50' : status === 'maintenance' ? 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800/50' : ''}`}
                                            >
                                                <option value="available">Operativa y Disponible</option>
                                                <option value="maintenance">Bloqueada por Mantenimiento</option>
                                                <option value="occupied">Ocupada</option>
                                            </select>
                                            {status === 'available' && <Play size={16} className="absolute left-4 top-3.5 text-emerald-500 pointer-events-none" />}
                                            {status === 'maintenance' && <Wrench size={16} className="absolute left-4 top-3.5 text-amber-500 pointer-events-none" />}
                                            {status === 'occupied' && <ShieldAlert size={16} className="absolute left-4 top-3.5 text-red-500 pointer-events-none" />}
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-8 flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setIsOpen(false)}
                                        disabled={submitting}
                                        className="flex-1 py-3 font-semibold text-zinc-600 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 rounded-xl transition-all"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="flex-1 py-3 font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md tooltip hover:shadow-lg transition-all flex justify-center items-center gap-2"
                                    >
                                        {submitting ? (
                                            <span className="flex items-center gap-2"><div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin" /> Guardando...</span>
                                        ) : 'Confirmar Cambios'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                </AnimatePresence>,
                document.body
            )}
        </>
    );
}
