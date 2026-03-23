"use client";

import { useState } from "react";
import { Search, UserCircle2, Stethoscope, Mail, ShieldAlert, Edit2, Trash2, X, AlertTriangle, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import { deleteMedicalStaff, updateMedicalStaff } from "@/app/actions/personal";

export function StaffTable({ staff, professions }: { staff: any[], professions: any[] }) {
    const [search, setSearch] = useState("");
    const [editStaff, setEditStaff] = useState<any>(null);
    const [deleteStaff, setDeleteStaff] = useState<any>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [actionMsg, setActionMsg] = useState<{type: 'error'|'success', text: string} | null>(null);

    const filtered = staff.filter(s => {
        if (!search.trim()) return true;
        
        const str = `${s.name} ${s.lastname} ${s.dni} ${s.professionName} ${s.tuitionCode}`.toLowerCase();
        const searchTerms = search.toLowerCase().trim().split(/\s+/);
        
        // Operador Lógico AND: El profesional debe cumplir con TODOS los términos simultáneamente
        return searchTerms.every(term => str.includes(term));
    });

    const handleDelete = async () => {
        setIsSubmitting(true);
        setActionMsg(null);
        try {
            const res = await deleteMedicalStaff(deleteStaff.id);
            if (res.error) setActionMsg({ type: 'error', text: res.error });
            else {
                setDeleteStaff(null);
            }
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
            const res = await updateMedicalStaff(editStaff.id, formData);
            if (res.error) setActionMsg({ type: 'error', text: res.error });
            else {
                setEditStaff(null);
            }
        } catch (e: any) {
            setActionMsg({ type: 'error', text: e.message || 'Error de red.' });
        }
        setIsSubmitting(false);
    };

    const getInputCls = "w-full text-sm rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-zinc-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white dark:focus:border-blue-400 dark:focus:ring-blue-400/10 transition-all";
    const selectCls = `${getInputCls} appearance-none bg-no-repeat bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%2371717A%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:10px_10px] bg-[position:right_1rem_center]`;

    return (
        <div className="flex flex-col h-full bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
            {/* Buscador Simple Oculto en Sticky */}
            <div className="sticky top-0 z-10 p-3 bg-zinc-50 dark:bg-zinc-800/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800">
                <div className="relative max-w-lg mx-auto w-full">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                    <input
                        type="search"
                        placeholder="Filtrar por nombre, DNI o profesión..."
                        className="w-full pl-9 pr-4 py-2 text-sm rounded-full border border-zinc-200 focus:border-[var(--color-hospital-blue)] focus:ring-1 focus:ring-[var(--color-hospital-blue)] dark:bg-zinc-900 dark:border-zinc-700 dark:text-white transition-all shadow-sm"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <div className="flex-1 overflow-auto">
                {filtered.length === 0 ? (
                    <div className="p-8 text-center text-zinc-500 flex flex-col items-center justify-center h-full min-h-[300px]">
                        <ShieldAlert size={40} className="text-zinc-300 mb-3" />
                        <p className="font-semibold text-lg">Personal No Encontrado</p>
                        <p className="text-sm">No pudimos alinear su búsqueda con el catálogo base.</p>
                    </div>
                ) : (
                    <table className="w-full text-left text-sm text-zinc-600 dark:text-zinc-300">
                        <thead className="sticky top-0 bg-white dark:bg-zinc-900 shadow-sm z-10 text-xs font-semibold uppercase tracking-wider text-zinc-500 border-b border-zinc-200 dark:border-zinc-800">
                            <tr>
                                <th className="px-5 py-4">Identificador</th>
                                <th className="px-5 py-4">Profesional Asistencial</th>
                                <th className="px-5 py-4 hidden sm:table-cell">Especialidad Operativa</th>
                                <th className="px-5 py-4 hidden md:table-cell">Colegiatura</th>
                                <th className="px-5 py-4 text-right">Manejo</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
                            {filtered.map((s) => (
                                <tr key={s.id} className="hover:bg-blue-50/50 dark:hover:bg-zinc-800/50 transition-colors group">
                                    <td className="px-5 py-3 font-medium text-zinc-900 dark:text-white">
                                        {s.dni}
                                    </td>
                                    <td className="px-5 py-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900/40 text-[var(--color-hospital-blue)] flex items-center justify-center font-bold shadow-sm">
                                                {s.name.charAt(0)}{s.lastname.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="font-semibold text-zinc-900 dark:text-white tracking-tight">{s.name} {s.lastname}</div>
                                                <div className="flex items-center gap-1 text-[11px] text-zinc-500 mt-0.5">
                                                    <Mail size={10} /> {s.email || "Sin email asignado"}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-5 py-3 hidden sm:table-cell">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] uppercase font-bold tracking-widest border shadow-sm
                                            ${s.professionName === 'MEDICO CIRUJANO' ? 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30' : 
                                              s.professionName === 'ANESTESIOLOGO' ? 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/30' :
                                              s.professionName === 'ENFERMERO' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30' :
                                              'bg-zinc-50 text-zinc-700 border-zinc-200 dark:bg-zinc-900/30'}
                                        `}>
                                            <Stethoscope size={10} />
                                            {s.professionName}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3 hidden md:table-cell text-zinc-500 font-mono text-xs">
                                        {s.tuitionCode || "--"}
                                    </td>
                                    <td className="px-5 py-3 text-right">
                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button 
                                                onClick={() => { setEditStaff(s); setActionMsg(null); }}
                                                className="p-2 text-zinc-500 hover:text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded-xl transition-colors"
                                                title="Editar"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button 
                                                onClick={() => { setDeleteStaff(s); setActionMsg(null); }}
                                                className="p-2 text-zinc-500 hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-xl transition-colors"
                                                title="Eliminar"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Modal de Eliminación */}
            {typeof document !== "undefined" && createPortal(
                <AnimatePresence>
                    {deleteStaff && (
                        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                                onClick={() => !isSubmitting && setDeleteStaff(null)}
                            />
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: -20 }}
                                className="bg-white dark:bg-zinc-900 rounded-3xl shadow-xl p-6 md:p-8 z-10 w-full max-w-md relative overflow-hidden border border-red-100 dark:border-red-900/30"
                            >
                                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-red-500 to-rose-600"></div>
                                <div className="w-16 h-16 rounded-full bg-red-50 dark:bg-red-900/20 text-red-500 flex items-center justify-center mb-6 shadow-sm mx-auto">
                                    <Trash2 size={32} />
                                </div>
                                <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2 text-center">Inhabilitar Profesional</h3>
                                <p className="text-zinc-600 dark:text-zinc-400 mb-6 text-center text-sm leading-relaxed">
                                    Estás a punto de desvincular a <strong className="text-red-600 dark:text-red-400">{deleteStaff.name} {deleteStaff.lastname}</strong> del catálogo de programaciones. Esta acción podría ser denegada si el personal ya se encuentra asignado a una cirugía programada o terminada en el historial. ¿Confirmar purga?
                                </p>

                                {actionMsg && actionMsg.type === 'error' && (
                                    <div className="mb-6 p-4 rounded-xl text-sm font-medium bg-red-50/50 text-red-700 border border-red-200 dark:bg-red-900/20 dark:border-red-900/50 dark:text-red-400 flex gap-3 text-left shadow-sm">
                                        <AlertTriangle size={18} className="shrink-0 mt-0.5" /> <span>{actionMsg.text}</span>
                                    </div>
                                )}

                                <div className="flex gap-3 mt-8">
                                    <button 
                                        type="button" 
                                        disabled={isSubmitting}
                                        onClick={() => setDeleteStaff(null)} 
                                        className="flex-1 py-3 px-4 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-semibold rounded-2xl transition-colors disabled:opacity-50"
                                    >
                                        Cancelar Reversión
                                    </button>
                                    <button 
                                        onClick={handleDelete}
                                        disabled={isSubmitting}
                                        className="flex-1 py-3 px-4 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-2xl transition-all shadow-lg hover:shadow-red-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        {isSubmitting ? <Loader2 size={18} className="animate-spin"/> : <Trash2 size={18} />} Purga de Personal
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>,
                document.body
            )}

            {/* Modal de Edición Premium */}
            {typeof document !== "undefined" && createPortal(
                <AnimatePresence>
                    {editStaff && (
                        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                                onClick={() => !isSubmitting && setEditStaff(null)}
                            />
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: -20 }}
                                className="bg-white dark:bg-zinc-900 rounded-[2rem] shadow-2xl p-6 md:p-8 z-10 w-full max-w-lg relative border border-zinc-200 dark:border-zinc-800/80 overflow-hidden"
                            >
                                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>
                                <button
                                    type="button"
                                    onClick={() => !isSubmitting && setEditStaff(null)}
                                    className="absolute right-6 top-6 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-800 dark:hover:bg-zinc-700 p-2 rounded-full transition-colors"
                                >
                                    <X size={20} />
                                </button>

                                <div className="mb-6 pr-10">
                                    <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">Ficha Maestra</h2>
                                    <p className="text-sm text-zinc-500 mt-1 font-medium">Reescribir privilegios operacionales del profesional.</p>
                                </div>

                                {actionMsg && actionMsg.type === 'error' && (
                                    <div className="mb-6 p-4 rounded-xl text-sm font-medium bg-red-50/50 text-red-700 border border-red-200 dark:bg-red-900/20 dark:border-red-900/50 flex gap-2">
                                        <AlertTriangle size={18} className="shrink-0 mt-0.5" /> <span>{actionMsg.text}</span>
                                    </div>
                                )}

                                <form onSubmit={handleEditSubmit} className="space-y-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Identificador (DNI)</label>
                                        <input 
                                            name="dni" 
                                            defaultValue={editStaff.dni} 
                                            required 
                                            className={getInputCls} 
                                            placeholder="Ingresar DNI..." 
                                        />
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Nombres</label>
                                            <input 
                                                name="name" 
                                                defaultValue={editStaff.name} 
                                                required 
                                                className={getInputCls} 
                                                placeholder="Nombre(s)" 
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Apellidos</label>
                                            <input 
                                                name="lastname" 
                                                defaultValue={editStaff.lastname} 
                                                required 
                                                className={getInputCls} 
                                                placeholder="Apellido(s)" 
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Profesión Activa</label>
                                        <select 
                                            name="professionId" 
                                            required 
                                            className={selectCls}
                                            defaultValue={professions.find(p => p.name === editStaff.professionName)?.id || ''}
                                        >
                                            <option value="" disabled>Seleccione Ocupación...</option>
                                            {professions.map((p) => (
                                                <option key={p.id} value={p.id}>{p.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Colegiatura</label>
                                            <input 
                                                name="tuitionCode" 
                                                defaultValue={editStaff.tuitionCode || ''} 
                                                className={getInputCls} 
                                                placeholder="CMP/CEP" 
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Buzón Email</label>
                                            <input 
                                                name="email" 
                                                defaultValue={editStaff.email || ''} 
                                                className={getInputCls} 
                                                placeholder="Correo oficial" 
                                            />
                                        </div>
                                    </div>

                                    <div className="pt-6">
                                        <button 
                                            type="submit" 
                                            disabled={isSubmitting}
                                            className="w-full flex items-center justify-center gap-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-bold py-3.5 px-4 rounded-xl shadow-lg transition-all hover:bg-zinc-800 dark:hover:bg-zinc-100 active:scale-[0.98] disabled:opacity-70 disabled:pointer-events-none group"
                                        >
                                            {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Edit2 size={18} />}
                                            {isSubmitting ? 'Verificando y Guardando...' : 'Aplicar Transmutación'}
                                        </button>
                                    </div>
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
