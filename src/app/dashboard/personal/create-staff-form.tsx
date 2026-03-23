"use client";

import { useState } from "react";
import { Loader2, UserPlus, FileSignature, User, AlertCircle, CheckCircle } from "lucide-react";
import { createMedicalStaff } from "@/app/actions/personal";
import { motion, AnimatePresence } from "framer-motion";

export function CreateStaffForm({ professions }: { professions: any[] }) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [actionMsg, setActionMsg] = useState<{type: 'error' | 'success', text: string} | null>(null);
    
    // Basic dynamic styling function
    const getInputCls = (extra: string = "") => 
        `w-full text-sm rounded-xl border border-zinc-200 bg-white px-3 py-2 text-zinc-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white dark:focus:border-blue-400 dark:focus:ring-blue-400/10 transition-all ${extra}`;

    const getSelectCls = (extra: string = "") => {
        return `${getInputCls(extra)} appearance-none bg-no-repeat bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%2371717A%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:10px_10px] bg-[position:right_1rem_center]`;
    };

    const handleCreate = async (formData: FormData) => {
        setIsSubmitting(true);
        setActionMsg(null);
        try {
            const res = await createMedicalStaff(formData);
            if (res.error) {
                setActionMsg({ type: 'error', text: res.error });
            } else {
                setActionMsg({ type: 'success', text: 'Profesional registrado correctamente.' });
                (document.getElementById('createAsistForm') as HTMLFormElement)?.reset();
                setTimeout(() => setActionMsg(null), 5000);
            }
        } catch (error) {
            setActionMsg({ type: 'error', text: "Ocurrió un error inesperado." });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form id="createAsistForm" action={handleCreate} className="space-y-4">
            
            <AnimatePresence>
                {actionMsg && (
                    <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className={`p-3 rounded-xl border text-sm font-medium flex items-center gap-2 ${actionMsg.type === 'error' ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:border-red-900/50 dark:text-red-400' : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-900/50 dark:text-emerald-400'}`}
                    >
                        {actionMsg.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle size={16} />}
                        <span>{actionMsg.text}</span>
                    </motion.div>
                )}
            </AnimatePresence>
            
            <div className="space-y-1.5 pt-2">
                <label className="text-[10px] font-bold text-[var(--color-hospital-blue)] bg-blue-50 dark:bg-zinc-800 dark:text-blue-400 px-2 py-1 rounded-md mb-2 inline-flex uppercase tracking-wider">
                    Categoría: ASISTENCIAL
                </label>
            </div>

            <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1">
                    <User size={12} /> DNI / Identificador
                </label>
                <input
                    type="text"
                    name="dni"
                    required
                    maxLength={15}
                    placeholder="Ej. 70010203"
                    className={getInputCls()}
                />
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Nombres</label>
                    <input
                        type="text"
                        name="name"
                        required
                        placeholder="Nombres Completos"
                        className={getInputCls()}
                    />
                </div>
                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Apellidos</label>
                    <input
                        type="text"
                        name="lastname"
                        required
                        placeholder="Apellidos"
                        className={getInputCls()}
                    />
                </div>
            </div>

            <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1">
                    <FileSignature size={12} /> Especialidad / Profesión
                </label>
                <select 
                    name="professionId" 
                    required 
                    className={getSelectCls()}
                    defaultValue=""
                >
                    <option value="" disabled>Seleccione el Rol Ocupacional...</option>
                    {professions.map((prof: any) => (
                        <option key={prof.id} value={prof.id}>
                            {prof.name}
                        </option>
                    ))}
                </select>
                <p className="text-[11px] text-zinc-400 pl-1">Filtrado automáticamente por ASISTENCIAL.</p>
            </div>

            <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Código Colegiatura (CMP/CEP)</label>
                <input
                    type="text"
                    name="tuitionCode"
                    placeholder="Ej. 129032 (Opcional)"
                    className={getInputCls()}
                />
            </div>

            <div className="pt-4">
                <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={isSubmitting}
                    type="submit"
                    className="w-full relative flex items-center justify-center gap-2 rounded-xl bg-gradient-to-tr from-[var(--color-hospital-blue)] to-blue-600 px-4 py-3 text-sm font-bold text-white shadow-lg transition-all hover:shadow-blue-500/25 active:scale-95 disabled:opacity-70 disabled:pointer-events-none group overflow-hidden"
                >
                    <div className="absolute inset-0 w-full h-full -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
                    {isSubmitting ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        <UserPlus className="w-5 h-5" />
                    )}
                    <span className="relative z-10">{isSubmitting ? 'Registrando...' : 'Confirmar Personal'}</span>
                </motion.button>
            </div>
        </form>
    );
}
