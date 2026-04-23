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
    'urpa_exit': { title: 'Pase a URPA / Recuperación', color: 'text-indigo-700', border: 'border-indigo-200', bg: 'bg-indigo-50 dark:bg-indigo-900/20', iconColor: 'text-indigo-500' },
    'completed': { title: 'Alta Definitiva', color: 'text-emerald-700', border: 'border-emerald-200', bg: 'bg-emerald-50 dark:bg-emerald-900/20', iconColor: 'text-emerald-500' },
};

const NEXT_PHASE_MAP: Record<string, string | null> = {
    'in_progress': 'anesthesia_start',
    'anesthesia_start': 'pre_incision',
    'pre_incision': 'surgery_end',
    'surgery_end': 'patient_exit',
    'patient_exit': 'urpa_exit', // Se manejará dinámicamente si skipUrpa es true
    'urpa_exit': 'completed',
    'completed': null
};

export function PhaseTransitionModal({
    isOpen,
    onClose,
    surgeryId,
    targetPhase: initialTargetPhase,
    patientName,
    onSuccess,
    initialTime
}: {
    isOpen: boolean;
    onClose: () => void;
    surgeryId: string;
    targetPhase: string;
    patientName: string;
    onSuccess: (nextPhase?: string | null) => void;
    initialTime?: string;
    urgencyType?: string;
}) {
    const [targetPhase, setTargetPhase] = useState(initialTargetPhase);
    const [transitionTime, setTransitionTime] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const [skipUrpa, setSkipUrpa] = useState(false);
    const [isDeathByEmergency, setIsDeathByEmergency] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setTargetPhase(initialTargetPhase);
            setSkipUrpa(false);
            setIsDeathByEmergency(false);

            if (initialTime) {
                setTransitionTime(initialTime);
            } else {
                const now = new Date();
                const year = now.getFullYear();
                const month = String(now.getMonth() + 1).padStart(2, '0');
                const day = String(now.getDate()).padStart(2, '0');
                const hours = String(now.getHours()).padStart(2, '0');
                const minutes = String(now.getMinutes()).padStart(2, '0');

                setTransitionTime(`${year}-${month}-${day}T${hours}:${minutes}`);
            }
            setErrorMsg("");
        }
    }, [isOpen, initialTargetPhase, initialTime]);

    if (!isOpen || !phaseConfig[targetPhase]) return null;

    const config = phaseConfig[targetPhase];
    const nextPhasePossible = targetPhase === 'patient_exit' && skipUrpa ? 'completed' : NEXT_PHASE_MAP[targetPhase];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setErrorMsg("");

        try {
            const formData = new FormData();
            formData.append('id', surgeryId);
            formData.append('status', targetPhase);
            formData.append('transition_time', transitionTime);
            if (targetPhase === 'completed') {
                formData.append('isDeathByEmergency', String(isDeathByEmergency));
            }

            const res = await updateSurgeryStatus(formData);
            if (res?.error) {
                setErrorMsg(res.error);
            } else {
                if (nextPhasePossible) {
                    // Si hay una siguiente fase, actualizamos el modal internamente
                    setTargetPhase(nextPhasePossible);
                    
                    // Mantenemos el TIEMPO que el usuario acaba de usar para la siguiente etapa
                    // (Persistencia heredada según requerimiento)
                    setTransitionTime(transitionTime);
                } else {
                    onSuccess(null);
                }
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

                            {targetPhase === 'completed' && urgencyType === 'EMERGENCIA' && (
                                <div className="mb-6 p-4 rounded-xl bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-800/50">
                                    <label className="flex items-center gap-3 cursor-pointer group">
                                        <div className="relative flex items-center">
                                            <input
                                                type="checkbox"
                                                checked={isDeathByEmergency}
                                                onChange={(e) => setIsDeathByEmergency(e.target.checked)}
                                                className="w-5 h-5 rounded border-rose-300 text-rose-600 focus:ring-rose-500 cursor-pointer"
                                            />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-rose-900 dark:text-rose-300">¿Fallecimiento en Emergencia?</span>
                                            <span className="text-[11px] text-rose-700/70 dark:text-rose-400/60 font-medium">Marcar si el acto quirúrgico resultó en el deceso del paciente.</span>
                                        </div>
                                    </label>
                                </div>
                            )}

                            {targetPhase === 'patient_exit' && (
                                <div className="mb-6 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/50">
                                    <label className="flex items-center gap-3 cursor-pointer group">
                                        <div className="relative flex items-center">
                                            <input
                                                type="checkbox"
                                                checked={!skipUrpa}
                                                onChange={(e) => setSkipUrpa(!e.target.checked)}
                                                className="w-5 h-5 rounded border-blue-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                            />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-blue-900 dark:text-blue-300">¿Ingresa a URPA / Recuperación?</span>
                                            <span className="text-[11px] text-blue-700/70 dark:text-blue-400/60 font-medium">Desmarcar si el paciente pasa directamente a sala o alta.</span>
                                        </div>
                                    </label>
                                </div>
                            )}

                            <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-2 flex items-center gap-2">
                                <Clock size={16} className="text-[var(--color-hospital-blue)]" />
                                Tiempo de Registro (Ajustable)
                            </label>

                            <p className="text-xs text-zinc-500 mb-3 font-medium">
                                Confirma o ajusta la fecha y hora exacta en la que ocurrió este evento.
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
                                    Cerrar
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="px-5 py-2.5 w-full rounded-xl font-bold bg-[var(--color-hospital-blue)] text-white shadow hover:bg-blue-800 transition disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {isSubmitting ? 'Registrando...' : (nextPhasePossible ? 'Confirmar y Siguiente' : 'Finalizar Flujo')}
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
