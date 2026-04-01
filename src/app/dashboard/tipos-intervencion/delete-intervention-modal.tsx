"use client";

import { useState } from "react";
import { Loader2, AlertTriangle, CheckCircle, Target } from "lucide-react";
import { deleteInterventionType } from "@/app/actions/intervention-types";
import { motion, AnimatePresence } from "framer-motion";

export function DeleteInterventionModal({ initialData, onSuccess, onCancel }: { initialData: any, onSuccess: () => void, onCancel: () => void }) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [actionMsg, setActionMsg] = useState<{type: 'error' | 'success', text: string} | null>(null);

    const handleDelete = async () => {
        setIsSubmitting(true);
        setActionMsg(null);

        try {
            const res = await deleteInterventionType(initialData.id);

            if (res?.error) {
                setActionMsg({ type: 'error', text: res.error });
            } else {
                setActionMsg({ type: 'success', text: "Eliminación exitosa." });
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
        <div className="space-y-5">
            <AnimatePresence>
                {actionMsg && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className={`p-3 rounded-xl border text-sm font-medium flex gap-2 shadow-sm ${actionMsg.type === 'error' ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:border-red-900/50' : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-900/50'}`}
                    >
                        {actionMsg.type === 'error' ? <AlertTriangle size={16} className="shrink-0 mt-0.5" /> : <CheckCircle size={16} className="shrink-0 mt-0.5" />}
                        <span>{actionMsg.text}</span>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="flex flex-col items-center justify-center text-center space-y-3">
                <div className="h-16 w-16 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-500 rounded-full flex items-center justify-center mb-2 shadow-inner">
                    <Target size={32} />
                </div>
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white">¿Destruir Registro?</h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    Estás a punto de eliminar <span className="font-bold text-zinc-800 dark:text-zinc-200">"{initialData.name}"</span> del núcleo de Base de Datos. Esta acción es crítica.
                </p>
            </div>

            <div className="flex gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                <button
                    onClick={onCancel}
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 font-semibold text-sm hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors disabled:opacity-50"
                >
                    Cancelar
                </button>
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={isSubmitting}
                    onClick={handleDelete}
                    className="flex-1 relative flex items-center justify-center gap-2 rounded-xl bg-gradient-to-tr from-red-600 to-rose-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-red-500/20 transition-all hover:shadow-red-500/40 active:scale-95 disabled:opacity-70 disabled:pointer-events-none group overflow-hidden"
                >
                    <div className="absolute inset-0 w-full h-full -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
                    {isSubmitting ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        <AlertTriangle className="w-4 h-4" />
                    )}
                    <span className="relative z-10">{isSubmitting ? 'Destruyendo...' : 'Confirmar'}</span>
                </motion.button>
            </div>
        </div>
    );
}
