"use client";

import { useState } from "react";
import { Loader2, PlusCircle, AlertCircle, CheckCircle, Save } from "lucide-react";
import { createInterventionType, updateInterventionType } from "@/app/actions/intervention-types";
import { motion, AnimatePresence } from "framer-motion";

export function InterventionTypeForm({ initialData = null, onSuccess }: { initialData?: any, onSuccess: () => void }) {
    const isEdit = !!initialData;
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [actionMsg, setActionMsg] = useState<{type: 'error' | 'success', text: string} | null>(null);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);
        setActionMsg(null);

        const formData = new FormData(e.currentTarget);
        
        try {
            let res;
            if (isEdit) {
                res = await updateInterventionType(initialData.id, formData);
            } else {
                res = await createInterventionType(formData);
            }

            if (res?.error) {
                setActionMsg({ type: 'error', text: res.error });
            } else {
                setActionMsg({ type: 'success', text: `Tipo de Intervención ${isEdit ? 'actualizado' : 'registrado'} con éxito.` });
                setTimeout(() => {
                    onSuccess();
                }, 1000);
            }
        } catch (error) {
            setActionMsg({ type: 'error', text: "Ocurrió una anomalía de red imprevista." });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            <AnimatePresence>
                {actionMsg && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className={`p-3 rounded-xl border text-sm font-medium flex gap-2 shadow-sm ${actionMsg.type === 'error' ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:border-red-900/50' : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-900/50'}`}
                    >
                        {actionMsg.type === 'error' ? <AlertCircle size={16} className="shrink-0 mt-0.5" /> : <CheckCircle size={16} className="shrink-0 mt-0.5" />}
                        <span>{actionMsg.text}</span>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="space-y-4">
                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Código (Opcional)</label>
                    <input
                        type="text"
                        name="code"
                        defaultValue={initialData?.code || ''}
                        placeholder="Ej. APT"
                        className="w-full px-4 py-2.5 text-sm rounded-xl border border-zinc-200 bg-white dark:bg-zinc-950 dark:border-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all shadow-sm"
                    />
                </div>

                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Nombre del Tipo de Intervención <span className="text-red-500">*</span></label>
                    <input
                        type="text"
                        name="name"
                        required
                        defaultValue={initialData?.name || ''}
                        placeholder="Ej. ADENECTOMIA PROSTATICA TRANSVESICAL"
                        className="w-full px-4 py-2.5 text-sm rounded-xl border border-zinc-200 bg-white dark:bg-zinc-950 dark:border-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all shadow-sm font-medium uppercase"
                        onChange={(e) => e.target.value = e.target.value.toUpperCase()}
                    />
                </div>

                <div className="flex items-center gap-3 pt-2">
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            name="isActive"
                            value="true"
                            defaultChecked={initialData ? initialData.isActive : true}
                            className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-300 dark:peer-focus:ring-teal-800 rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-zinc-600 peer-checked:bg-teal-600"></div>
                        <span className="ml-3 text-sm font-medium text-zinc-700 dark:text-zinc-300">Activo</span>
                    </label>
                </div>
            </div>

            <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800">
                <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={isSubmitting}
                    type="submit"
                    className="w-full relative flex items-center justify-center gap-2 rounded-xl bg-gradient-to-tr from-teal-600 to-emerald-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-teal-500/10 transition-all hover:shadow-teal-500/30 active:scale-95 disabled:opacity-70 disabled:pointer-events-none group overflow-hidden"
                >
                    <div className="absolute inset-0 w-full h-full -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
                    {isSubmitting ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        <Save className="w-5 h-5" />
                    )}
                    <span className="relative z-10">{isSubmitting ? 'Procesando...' : (isEdit ? 'Actualizar Registro' : 'Guardar Registro')}</span>
                </motion.button>
            </div>
        </form>
    );
}
