"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { createPortal } from "react-dom";
import { updateSurgeryStatus } from "@/app/actions/cirugias";

const phaseConfig: Record<string, { title: string, color: string, border: string, bg: string, iconColor: string }> = {
    'in_progress': { title: 'Ingresar a Quirófano', color: 'text-amber-700', border: 'border-amber-200', bg: 'bg-amber-50 dark:bg-amber-900/20', iconColor: 'text-amber-500' },
    'anesthesia_start': { title: 'Inicio de Anestesia', color: 'text-purple-700', border: 'border-purple-200', bg: 'bg-purple-50 dark:bg-purple-900/20', iconColor: 'text-purple-500' },
    'pre_incision': { title: 'Antes de Incisión', color: 'text-fuchsia-700', border: 'border-fuchsia-200', bg: 'bg-fuchsia-50 dark:bg-fuchsia-900/20', iconColor: 'text-fuchsia-500' },
    'surgery_end': { title: 'Término de Cirugía', color: 'text-cyan-700', border: 'border-cyan-200', bg: 'bg-cyan-50 dark:bg-cyan-900/20', iconColor: 'text-cyan-500' },
    'patient_exit': { title: 'Salida de Paciente', color: 'text-orange-700', border: 'border-orange-200', bg: 'bg-orange-50 dark:bg-orange-900/20', iconColor: 'text-orange-500' },
    'urpa_exit': { title: 'Pase a URPA', color: 'text-indigo-700', border: 'border-indigo-200', bg: 'bg-indigo-50 dark:bg-indigo-900/20', iconColor: 'text-indigo-500' },
    'completed': { title: 'Alta Definitiva', color: 'text-emerald-700', border: 'border-emerald-200', bg: 'bg-emerald-50 dark:bg-emerald-900/20', iconColor: 'text-emerald-500' },
};

export function PhaseTransitionModal({
    isOpen,
    onClose,
    surgeryId,
    targetPhase,
    patientName,
    onSuccess
}: {
    isOpen: boolean;
    onClose: () => void;
    surgeryId: string;
    targetPhase: string;
    patientName: string;
    onSuccess: () => void;
}) {
    const [transitionTime, setTransitionTime] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");

    useEffect(() => {
        if (isOpen) {
            // Set current time dynamically, formatted for datetime-local
            const now = new Date();
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const day = String(now.getDate()).padStart(2, '0');
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');

            setTransitionTime(`${year}-${month}-${day}T${hours}:${minutes}`);
            setErrorMsg("");
        }
    }, [isOpen]);

    if (!isOpen || !phaseConfig[targetPhase]) return null;

    const config = phaseConfig[targetPhase];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setErrorMsg("");

        try {
            const formData = new FormData();
            formData.append('id', surgeryId);
            formData.append('status', targetPhase);
            formData.append('transition_time', transitionTime);

            const res = await updateSurgeryStatus(formData);
            if (res?.error) {
                setErrorMsg(res.error);
            } else {
                onSuccess();
            }
        } catch (error: any) {
            setErrorMsg("Ocurrió un error al intentar cambiar el estado.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 z-10 w-full max-w-md overflow-hidden relative"
                    >
                        {/* Header */}
                        <div className={`p-6 border-b border-zinc-100 dark:border-zinc-800 flex items-center gap-4 ${config.bg}`}>
                            <div className="w-12 h-12 rounded-full bg-white dark:bg-zinc-800 flex flex-shrink-0 items-center justify-center shadow-sm">
                                <CheckCircle2 size={24} className={config.iconColor} />
                            </div>
                            <div className="flex-1">
                                <h3 className={`text-xl font-bold ${config.color} flex items-center gap-2`}>
                                    {config.title}
                                </h3>
                                <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400 mt-1 truncate">
                                    Paciente: <span className="text-zinc-900 dark:text-zinc-100 font-bold">{patientName}</span>
                                </p>
                            </div>
                            <button
                                onClick={onClose}
                                className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6">

                            {errorMsg && (
                                <div className="mb-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-xl border border-red-200 dark:border-red-800 flex items-start gap-2 text-sm font-medium">
                                    <AlertCircle size={18} className="shrink-0 mt-0.5" />
                                    <span>{errorMsg}</span>
                                </div>
                            )}

                            <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-2 flex items-center gap-2">
                                <Clock size={16} className="text-[var(--color-hospital-blue)]" />
                                Tiempo de Registro (Ajustable)
                            </label>

                            <p className="text-xs text-zinc-500 mb-3 font-medium">
                                Confirma o ajusta la fecha y hora exacta en la que ocurrió este evento. Puedes editarla para regularizar eventos pasados.
                            </p>

                            <input
                                type="datetime-local"
                                value={transitionTime}
                                onChange={(e) => setTransitionTime(e.target.value)}
                                className="w-full bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-zinc-900 dark:text-zinc-100 font-medium transition-all [color-scheme:light] dark:[color-scheme:dark]"
                                required
                            />

                            <div className="mt-8 flex gap-3">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-5 py-2.5 w-full rounded-xl font-bold bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="px-5 py-2.5 w-full rounded-xl font-bold bg-[var(--color-hospital-blue)] text-white shadow hover:bg-blue-800 transition disabled:opacity-50"
                                >
                                    {isSubmitting ? 'Registrando...' : 'Confirmar Pase'}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
}
