"use client";

import { useState } from "react";
import { X, Clock, Save, Activity, CalendarClock, UserCheck, CheckCircle2, CalendarDays } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { updateSurgeryPhaseTimes } from "@/app/actions/cirugias";

function formatForInput(dateStr: string | null | undefined) {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "";
    
    // Convert to local time string format for datetime-local
    const tzOffset = date.getTimezoneOffset() * 60000; // offset in milliseconds
    const localISOTime = (new Date(date.getTime() - tzOffset)).toISOString().slice(0, 16);
    return localISOTime;
}

export function PhaseTimesModal({ surgery, onClose }: { surgery: any, onClose: () => void }) {
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");

    const keys = [
        "actualStartTime",
        "anesthesiaStartTime",
        "preIncisionTime",
        "surgeryEndTime",
        "patientExitTime",
        "urpaExitTime",
        "completedTime"
    ];
    
    const hasAnyRegisteredTime = keys.some(key => surgery.surgery[key]);

    const [times, setTimes] = useState(() => {
        const rawValues = {
            actualStartTime: formatForInput(surgery.surgery.actualStartTime),
            anesthesiaStartTime: formatForInput(surgery.surgery.anesthesiaStartTime),
            preIncisionTime: formatForInput(surgery.surgery.preIncisionTime),
            surgeryEndTime: formatForInput(surgery.surgery.surgeryEndTime),
            patientExitTime: formatForInput(surgery.surgery.patientExitTime),
            urpaExitTime: formatForInput(surgery.surgery.urpaExitTime),
            completedTime: formatForInput(surgery.surgery.completedTime),
        };

        const allEmpty = keys.every(key => !rawValues[key as keyof typeof rawValues]);

        if (allEmpty) {
            const now = new Date();
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const day = String(now.getDate()).padStart(2, '0');
            const todayMidnight = `${year}-${month}-${day}T00:00`;
            
            return {
                actualStartTime: todayMidnight,
                anesthesiaStartTime: todayMidnight,
                preIncisionTime: todayMidnight,
                surgeryEndTime: todayMidnight,
                patientExitTime: todayMidnight,
                urpaExitTime: todayMidnight,
                completedTime: todayMidnight,
            };
        }

        return { ...rawValues };
    });

    const [bulkDate, setBulkDate] = useState(() => {
        const keys = ["actualStartTime", "anesthesiaStartTime", "preIncisionTime", "surgeryEndTime", "patientExitTime", "urpaExitTime", "completedTime"];
        let initialDateStr = "";
        for (const key of keys) {
            const val = formatForInput(surgery.surgery[key]);
            if (val) {
                initialDateStr = val.split('T')[0];
                break;
            }
        }
        if (initialDateStr) return initialDateStr;

        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    });

    const handleApplyBulkDate = () => {
        if (!bulkDate) return;
        const newTimes = { ...times };
        let currentActiveValue = `${bulkDate}T00:00`;

        for (const key of keys) {
            const currentVal = times[key as keyof typeof times];
            if (currentVal) {
                currentActiveValue = currentVal;
            } else {
                newTimes[key as keyof typeof newTimes] = currentActiveValue;
            }
        }
        setTimes(newTimes);
    };

    const phasesList = [
        { key: "actualStartTime", label: "Ingreso a Quirófano" },
        { key: "anesthesiaStartTime", label: "Inicio de Anestesia" },
        { key: "preIncisionTime", label: "Antes de Incisión" },
        { key: "surgeryEndTime", label: "Fin de Cirugía" },
        { key: "patientExitTime", label: "Salida de Paciente" },
        { key: "urpaExitTime", label: "Salida URPA" },
        { key: "completedTime", label: "Alta Definitiva" }
    ];

    const validateTimes = () => {
        const errors: Record<string, string> = {};
        let previousValidTime: number | null = null;
        let previousValidLabel = "";

        for (let i = 0; i < phasesList.length; i++) {
            const phase = phasesList[i];
            const valStr = times[phase.key as keyof typeof times];
            
            if (valStr) {
                const timeMs = new Date(valStr).getTime();
                
                if (previousValidTime !== null && timeMs < previousValidTime) {
                    errors[phase.key] = `Debe ser igual o posterior a ${previousValidLabel}`;
                } else {
                    previousValidTime = timeMs;
                    previousValidLabel = phase.label;
                }
            }
        }
        return errors;
    };

    const errors = validateTimes();
    const hasErrors = Object.keys(errors).length > 0;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setTimes({
            ...times,
            [e.target.name]: e.target.value
        });
    };

    const handleSave = async () => {
        if (hasErrors) return; // Prevent saving if there are errors

        setLoading(true);
        setErrorMsg("");

        const payload = {
            surgeryId: surgery.surgery.id,
            actualStartTime: times.actualStartTime || null,
            anesthesiaStartTime: times.anesthesiaStartTime || null,
            preIncisionTime: times.preIncisionTime || null,
            surgeryEndTime: times.surgeryEndTime || null,
            patientExitTime: times.patientExitTime || null,
            urpaExitTime: times.urpaExitTime || null,
            completedTime: times.completedTime || null,
        };

        const res = await updateSurgeryPhaseTimes(payload);
        setLoading(false);

        if (res.error) {
            setErrorMsg(res.error);
        } else {
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />
            
            <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="relative w-full max-w-4xl bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col max-h-[90vh]"
            >
                {/* Header */}
                <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[var(--color-hospital-blue)]/10 flex items-center justify-center">
                            <Clock className="text-[var(--color-hospital-blue)]" size={20} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-zinc-900 dark:text-white leading-tight">Tiempos y Fases</h2>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                {surgery.patientPii?.nombres} {surgery.patientPii?.apellidos} - Sala {surgery.operatingRoom?.name || 'S/A'}
                            </p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto custom-scrollbar flex-grow bg-zinc-50/30 dark:bg-zinc-900/30">
                    {errorMsg && (
                        <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100">
                            {errorMsg}
                        </div>
                    )}

                    {/* Panel de Ajuste Rápido de Fecha */}
                    <div className="mb-6 p-4 bg-zinc-50/50 dark:bg-zinc-800/20 border border-zinc-200/60 dark:border-zinc-800 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-[var(--color-hospital-blue)]/10 text-[var(--color-hospital-blue)] rounded-xl hidden sm:block">
                                <CalendarDays size={20} />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-sm font-bold text-zinc-800 dark:text-zinc-200">Ajustar Día General</span>
                                <span className="text-xs text-zinc-500 dark:text-zinc-400">Establece la fecha seleccionada con hora 00:00 para todas las fases.</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 self-stretch sm:self-auto">
                            <input 
                                type="date"
                                value={bulkDate}
                                onChange={(e) => setBulkDate(e.target.value)}
                                className="flex-grow sm:flex-grow-0 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 px-3 py-2 rounded-xl text-sm focus:ring-2 focus:ring-[var(--color-hospital-blue)] focus:border-transparent outline-none [color-scheme:light] dark:[color-scheme:dark] text-zinc-900 dark:text-white"
                            />
                            <button
                                type="button"
                                onClick={handleApplyBulkDate}
                                className="px-4 py-2 bg-[var(--color-hospital-blue)] hover:bg-blue-700 text-white font-semibold text-sm rounded-xl transition-all shadow-md shadow-blue-500/10 active:scale-95 flex items-center gap-1.5"
                            >
                                <CalendarDays size={16} />
                                Aplicar
                            </button>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <PhaseInput 
                            name="actualStartTime" 
                            label="Ingreso a Quirófano" 
                            value={times.actualStartTime} 
                            onChange={handleChange} 
                            icon={<Activity size={16} className="text-amber-500" />}
                            error={errors.actualStartTime}
                            isInitiallyEmpty={hasAnyRegisteredTime && !surgery.surgery.actualStartTime}
                        />
                        <PhaseInput 
                            name="anesthesiaStartTime" 
                            label="Inicio de Anestesia" 
                            value={times.anesthesiaStartTime} 
                            onChange={handleChange} 
                            icon={<Activity size={16} className="text-purple-500" />}
                            error={errors.anesthesiaStartTime}
                            isInitiallyEmpty={hasAnyRegisteredTime && !surgery.surgery.anesthesiaStartTime}
                        />
                        <PhaseInput 
                            name="preIncisionTime" 
                            label="Antes de Incisión" 
                            value={times.preIncisionTime} 
                            onChange={handleChange} 
                            icon={<Activity size={16} className="text-fuchsia-500" />}
                            error={errors.preIncisionTime}
                            isInitiallyEmpty={hasAnyRegisteredTime && !surgery.surgery.preIncisionTime}
                        />
                        <PhaseInput 
                            name="surgeryEndTime" 
                            label="Fin de Cirugía" 
                            value={times.surgeryEndTime} 
                            onChange={handleChange} 
                            icon={<Activity size={16} className="text-cyan-500" />}
                            error={errors.surgeryEndTime}
                            isInitiallyEmpty={hasAnyRegisteredTime && !surgery.surgery.surgeryEndTime}
                        />
                        <PhaseInput 
                            name="patientExitTime" 
                            label="Salida de Paciente" 
                            value={times.patientExitTime} 
                            onChange={handleChange} 
                            icon={<UserCheck size={16} className="text-orange-500" />}
                            error={errors.patientExitTime}
                            isInitiallyEmpty={hasAnyRegisteredTime && !surgery.surgery.patientExitTime}
                        />
                        <PhaseInput 
                            name="urpaExitTime" 
                            label="Salida URPA" 
                            value={times.urpaExitTime} 
                            onChange={handleChange} 
                            icon={<CalendarClock size={16} className="text-indigo-500" />}
                            error={errors.urpaExitTime}
                            isInitiallyEmpty={hasAnyRegisteredTime && !surgery.surgery.urpaExitTime}
                        />
                        <PhaseInput 
                            name="completedTime" 
                            label="Alta Definitiva" 
                            value={times.completedTime} 
                            onChange={handleChange} 
                            icon={<CheckCircle2 size={16} className="text-emerald-500" />}
                            error={errors.completedTime}
                            isInitiallyEmpty={hasAnyRegisteredTime && !surgery.surgery.completedTime}
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-zinc-100 dark:border-zinc-800 flex justify-end gap-3 bg-white dark:bg-zinc-900">
                    <button 
                        onClick={onClose}
                        className="px-5 py-2.5 rounded-xl font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                        disabled={loading}
                    >
                        Cancelar
                    </button>
                    <button 
                        onClick={handleSave}
                        className="flex items-center gap-2 px-6 py-2.5 bg-[var(--color-hospital-blue)] hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-500/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={loading || hasErrors}
                    >
                        {loading ? <Activity size={18} className="animate-spin" /> : <Save size={18} />}
                        {loading ? 'Guardando...' : 'Guardar Tiempos'}
                    </button>
                </div>
            </motion.div>
        </div>
    );
}

function PhaseInput({ label, name, value, onChange, icon, error, isInitiallyEmpty }: any) {
    return (
        <div className={`bg-white dark:bg-zinc-800 p-4 rounded-2xl border ${error ? 'border-red-500 shadow-[0_0_0_1px_rgba(239,68,68,1)]' : isInitiallyEmpty ? 'border-amber-300 dark:border-amber-700/60 bg-amber-50/20 dark:bg-amber-950/10' : 'border-zinc-200/60 dark:border-zinc-700'} shadow-sm flex flex-col gap-2 transition-all`}>
            <div className="flex items-center gap-2 w-full">
                <div className={`p-1.5 rounded-lg border ${error ? 'bg-red-50 border-red-200 dark:bg-red-900/30 dark:border-red-800' : isInitiallyEmpty ? 'bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800' : 'bg-zinc-50 dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800'}`}>
                    {icon}
                </div>
                <label className="text-sm font-bold text-zinc-700 dark:text-zinc-200">{label}</label>
                {isInitiallyEmpty && (
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 rounded-full border border-amber-200 dark:border-amber-800 ml-auto flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                        Pendiente
                    </span>
                )}
            </div>
            <input 
                type="datetime-local" 
                name={name}
                value={value}
                onChange={onChange}
                className={`w-full mt-1 bg-zinc-50 dark:bg-zinc-900 border ${error ? 'border-red-300 dark:border-red-700 focus:ring-red-500' : isInitiallyEmpty ? 'border-amber-200 dark:border-amber-700/80 focus:ring-amber-500' : 'border-zinc-200 dark:border-zinc-700 focus:ring-[var(--color-hospital-blue)]'} rounded-xl px-3 py-2.5 text-sm text-zinc-900 dark:text-white focus:ring-2 focus:border-transparent outline-none transition-all`}
            />
            {error && (
                <span className="text-xs text-red-500 font-medium leading-tight mt-0.5">{error}</span>
            )}
        </div>
    );
}
