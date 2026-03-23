"use client";

import { useState } from "react";
import { Search, Edit2, Trash2, X, AlertTriangle, Loader2, Workflow, FileX, BadgeCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import { deleteProcedure, updateProcedure } from "@/app/actions/procedures";

export function ProceduresTable({ records }: { records: any[] }) {
    const [search, setSearch] = useState("");
    const [editPx, setEditPx] = useState<any>(null);
    const [deletePx, setDeletePx] = useState<any>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [actionMsg, setActionMsg] = useState<{type: 'error'|'success', text: string} | null>(null);

    // Motor de Búsqueda Multivariable (Operador AND)
    const filtered = records.filter(px => {
        if (!search.trim()) return true;
        
        const str = `${px.name} ${px.code || ""}`.toLowerCase();
        const searchTerms = search.toLowerCase().trim().split(/\s+/);
        
        return searchTerms.every(term => str.includes(term));
    });

    const handleDelete = async () => {
        setIsSubmitting(true);
        setActionMsg(null);
        try {
            const res = await deleteProcedure(deletePx.id);
            if (res.error) setActionMsg({ type: 'error', text: res.error });
            else setDeletePx(null);
        } catch (e: any) {
            setActionMsg({ type: 'error', text: e.message || 'Error de red.' });
        }
        setIsSubmitting(false);
    };

    const handleEditSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);
        setActionMsg(null);
        try {
            const formData = new FormData(e.currentTarget);
            const res = await updateProcedure(editPx.id, formData);
            if (res.error) setActionMsg({ type: 'error', text: res.error });
            else setEditPx(null);
        } catch (e: any) {
            setActionMsg({ type: 'error', text: e.message || 'Error de red.' });
        }
        setIsSubmitting(false);
    };

    const getInputCls = "w-full text-sm rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-zinc-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white dark:focus:border-blue-400 dark:focus:ring-blue-400/10 transition-all";

    return (
        <div className="flex flex-col h-full bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
            {/* Buscador Simple Oculto en Sticky */}
            <div className="sticky top-0 z-10 p-3 bg-zinc-50/80 dark:bg-zinc-800/80 backdrop-blur-xl border-b border-zinc-200 dark:border-zinc-800">
                <div className="relative max-w-lg mx-auto w-full">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                    <input
                        type="search"
                        placeholder="Filtrar variables (Ej. laparoscópica 47562)"
                        className="w-full pl-9 pr-4 py-2 text-sm rounded-full border border-zinc-200 focus:border-[var(--color-hospital-blue)] focus:ring-1 focus:ring-[var(--color-hospital-blue)] bg-white dark:bg-zinc-900 dark:border-zinc-700 dark:text-white transition-all shadow-sm"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <div className="flex-1 overflow-auto">
                {filtered.length === 0 ? (
                    <div className="p-8 text-center text-zinc-500 flex flex-col items-center justify-center h-[300px]">
                        <FileX size={40} className="text-zinc-300 dark:text-zinc-700 mb-3" />
                        <p className="font-semibold text-lg text-zinc-700 dark:text-zinc-300">Vacío Clínico</p>
                        <p className="text-sm mt-1">El motor multivariable descartó todos los patrones buscando "{search}".</p>
                    </div>
                ) : (
                    <table className="w-full text-left text-sm text-zinc-600 dark:text-zinc-300">
                        <thead className="sticky top-0 bg-white dark:bg-zinc-900 shadow-[0_1px_2px_0_rgba(0,0,0,0.05)] z-0 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                            <tr>
                                <th className="px-5 py-4 w-28">Matrícula (CPT)</th>
                                <th className="px-5 py-4">Descriptor Operativo</th>
                                <th className="px-5 py-4 w-32 hidden md:table-cell text-center">Auditoría</th>
                                <th className="px-5 py-4 w-24 text-right">Opciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/70">
                            {filtered.map((px) => (
                                <tr key={px.id} className="hover:bg-blue-50/40 dark:hover:bg-zinc-800/40 transition-colors group">
                                    <td className="px-5 py-3 font-mono text-zinc-900 dark:text-white font-bold bg-zinc-50/50 dark:bg-zinc-900/50">
                                        {px.code ? (
                                            <span className="px-2 py-0.5 rounded border border-zinc-200 dark:border-zinc-700 text-xs tracking-widest">{px.code}</span>
                                        ) : (
                                            <span className="text-xs text-zinc-400 italic font-sans font-normal">S/C</span>
                                        )}
                                    </td>
                                    <td className="px-5 py-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-900/20 text-teal-500 flex items-center justify-center shadow-sm">
                                                <Workflow size={14} />
                                            </div>
                                            <div className="font-medium text-zinc-900 dark:text-white leading-relaxed">{px.name}</div>
                                        </div>
                                    </td>
                                    <td className="px-5 py-3 hidden md:table-cell text-center">
                                        {px.isVerifiedMinsa ? (
                                            <span className="inline-flex items-center justify-center text-emerald-600 dark:text-emerald-400" title="Verificado MINSA">
                                                <BadgeCheck size={18} />
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center justify-center text-zinc-300 dark:text-zinc-600" title="Manual Local">
                                                <BadgeCheck size={18} />
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-5 py-3 text-right">
                                        <div className="flex justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button 
                                                onClick={() => { setEditPx(px); setActionMsg(null); }}
                                                className="p-1.5 text-zinc-400 hover:text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded-lg transition-colors"
                                                title="Reclasificar"
                                            >
                                                <Edit2 size={15} />
                                            </button>
                                            <button 
                                                onClick={() => { setDeletePx(px); setActionMsg(null); }}
                                                className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-lg transition-colors"
                                                title="Extirpar"
                                            >
                                                <Trash2 size={15} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Modal de Extirpación (Delete) */}
            {typeof document !== "undefined" && createPortal(
                <AnimatePresence>
                    {deletePx && (
                        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                                onClick={() => !isSubmitting && setDeletePx(null)}
                            />
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                className="bg-white dark:bg-zinc-900 rounded-3xl shadow-xl p-8 z-10 w-full max-w-sm relative overflow-hidden"
                            >
                                <div className="absolute top-0 left-0 w-full h-1.5 bg-red-500"></div>
                                <div className="w-14 h-14 rounded-full bg-red-50 dark:bg-red-900/20 text-red-500 flex items-center justify-center mb-5 mx-auto">
                                    <Trash2 size={24} />
                                </div>
                                <h3 className="text-lg font-bold text-center mb-2">Remover Procedimiento</h3>
                                <p className="text-zinc-500 text-center text-sm leading-relaxed mb-6">
                                    Eliminarás el registro CPT <strong className="text-red-500">{deletePx.code || 'S/C'}</strong> del catálogo operativo.
                                </p>

                                {actionMsg?.type === 'error' && (
                                    <div className="mb-6 p-3 rounded-lg text-xs font-semibold bg-red-50 text-red-700 flex gap-2">
                                        <AlertTriangle size={14} className="shrink-0 mt-0.5" /> <span>{actionMsg.text}</span>
                                    </div>
                                )}

                                <div className="flex gap-2">
                                    <button 
                                        disabled={isSubmitting}
                                        onClick={() => setDeletePx(null)} 
                                        className="flex-1 py-2.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-sm font-bold rounded-xl"
                                    >Abordar</button>
                                    <button 
                                        onClick={handleDelete}
                                        disabled={isSubmitting}
                                        className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-xl shadow-md flex justify-center items-center"
                                    >
                                        {isSubmitting ? <Loader2 size={16} className="animate-spin"/> : 'Extirpar'}
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>,
                document.body
            )}

            {/* Modal de Reclasificación (Edit) */}
            {typeof document !== "undefined" && createPortal(
                <AnimatePresence>
                    {editPx && (
                        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                                onClick={() => !isSubmitting && setEditPx(null)}
                            />
                            <motion.div
                                initial={{ opacity: 0, scale: 0.98, y: 15 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.98, y: -15 }}
                                className="bg-white dark:bg-zinc-900 rounded-[2rem] shadow-2xl p-8 z-10 w-full max-w-md relative overflow-hidden border border-zinc-200 dark:border-zinc-800/80"
                            >
                                <button
                                    type="button"
                                    onClick={() => !isSubmitting && setEditPx(null)}
                                    className="absolute right-5 top-5 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 p-2 rounded-full"
                                ><X size={18} /></button>

                                <h2 className="text-xl font-bold flex items-center gap-2 mb-6">
                                    <Edit2 className="text-teal-500" size={20} /> Reclasificación Operativa
                                </h2>

                                {actionMsg?.type === 'error' && (
                                    <div className="mb-5 p-3 rounded-lg text-xs font-semibold bg-red-50 text-red-700 flex gap-2">
                                        <AlertTriangle size={14} className="shrink-0 mt-0.5" /> <span>{actionMsg.text}</span>
                                    </div>
                                )}

                                <form onSubmit={handleEditSubmit} className="space-y-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Código CPT/SIGPS</label>
                                        <input 
                                            name="code" 
                                            defaultValue={editPx.code || ''} 
                                            maxLength={10}
                                            className={`${getInputCls} uppercase font-mono text-teal-600 dark:text-teal-400 font-bold`} 
                                            placeholder="Indefinido" 
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Descripción</label>
                                        <textarea 
                                            name="name" 
                                            defaultValue={editPx.name} 
                                            required 
                                            rows={3}
                                            className={`${getInputCls} resize-none`} 
                                        />
                                    </div>
                                    <label className="flex items-center gap-3 pt-2">
                                        <input type="checkbox" name="isVerifiedMinsa" value="true" defaultChecked={editPx.isVerifiedMinsa} className="w-4 h-4 rounded border-zinc-300 text-[var(--color-hospital-blue)] focus:ring-[var(--color-hospital-blue)]" />
                                        <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Entidad avalada por MINSA.</span>
                                    </label>

                                    <button 
                                        type="submit" 
                                        disabled={isSubmitting}
                                        className="w-full mt-4 flex items-center justify-center gap-2 bg-gradient-to-tr from-teal-600 to-emerald-600 text-white font-bold py-3 px-4 rounded-xl shadow-md hover:shadow-teal-500/20 active:scale-95 transition-all disabled:opacity-70"
                                    >
                                        {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <BadgeCheck size={16} />}
                                        Fusionar Cambios
                                    </button>
                                </form>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </div>
    );
}
