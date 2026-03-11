"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { AlertCircle, AlertTriangle, X, CheckCircle, Search, Loader2 } from "lucide-react";
import { editSurgery } from "@/app/actions/cirugias";
import { lookupPatientByDni } from "@/app/actions/pacientes";
import { motion, AnimatePresence } from "framer-motion";

export function EditSurgeryModal({
    isOpen,
    onClose,
    surgeryData,
    salas,
    specialties,
    staff
}: {
    isOpen: boolean;
    onClose: () => void;
    surgeryData: any;
    salas: any[];
    specialties: any[];
    staff: { surgeons: any[], anesthesiologists: any[], nurses: any[] };
}) {
    // Initial data loading
    const initialSurgeons = surgeryData?.team?.filter((t: any) => t.role === 'CIRUJANO').map((t: any) => t.staff.id) || [];
    const initialAnesthesiologists = surgeryData?.team?.filter((t: any) => t.role === 'ANESTESIOLOGO').map((t: any) => t.staff.id) || [];
    const initialNurses = surgeryData?.team?.filter((t: any) => t.role === 'ENFERMERO').map((t: any) => t.staff.id) || [];

    const dateObj = surgeryData?.surgery?.scheduledDate ? new Date(surgeryData.surgery.scheduledDate) : null;
    const initialDateStr = dateObj ? dateObj.toLocaleDateString('en-CA') : ''; // YYYY-MM-DD
    const initialTimeStr = dateObj ? dateObj.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : ''; // HH:MM

    const [patientDni, setPatientDni] = useState(surgeryData?.patientPii?.dni || "");
    const [patientName, setPatientName] = useState(surgeryData?.patientPii?.nombres ? `${surgeryData.patientPii.nombres} ${surgeryData.patientPii.apellidos}` : "");
    const [isSearching, setIsSearching] = useState(false);
    const [found, setFound] = useState<boolean | null>(true);
    const [source, setSource] = useState<string | null>("Base Local");
    const [submitting, setSubmitting] = useState(false);
    const [errorModalMsg, setErrorModalMsg] = useState<string>("");

    useEffect(() => {
        if (!isOpen) {
            setErrorModalMsg("");
        }
    }, [isOpen]);

    // Validation like in the form
    useEffect(() => {
        if (patientDni.length >= 8 && patientDni !== surgeryData?.patientPii?.dni) {
            setIsSearching(true);
            const timeoutId = setTimeout(async () => {
                const res = await lookupPatientByDni(patientDni);
                if (res && res.found) {
                    setPatientName(res.fullName || "");
                    setFound(true);
                    setSource(res.source || null);
                } else {
                    setPatientName("");
                    setFound(false);
                    setSource(null);
                }
                setIsSearching(false);
            }, 500);
            return () => clearTimeout(timeoutId);
        } else if (patientDni === surgeryData?.patientPii?.dni) {
            setPatientName(surgeryData?.patientPii?.nombres ? `${surgeryData.patientPii.nombres} ${surgeryData.patientPii.apellidos}` : "");
            setFound(true);
            setSource("Base Local");
            setIsSearching(false);
        } else {
            setPatientName("");
            setFound(null);
            setSource(null);
        }
    }, [patientDni, surgeryData]);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setSubmitting(true);
        const form = e.currentTarget;
        const formData = new FormData(form);

        const res = await editSurgery(formData);

        if (res?.error) {
            setErrorModalMsg(res.error);
        } else {
            onClose(); // Cerrar exitosamente
        }
        setSubmitting(false);
    };

    if (!isOpen || !surgeryData) return null;

    const inputClasses = "w-full px-3 py-2 border border-zinc-200 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-2 focus:ring-[var(--color-hospital-blue)] focus:border-transparent outline-none transition-all disabled:opacity-50 text-sm";
    const selectClasses = `${inputClasses} appearance-none bg-no-repeat bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%2371717A%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:10px_10px] bg-[position:right_1rem_center]`;

    return createPortal(
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                />
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    className="bg-white dark:bg-zinc-900 rounded-3xl shadow-xl border border-zinc-200/50 dark:border-zinc-800 z-10 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden"
                >
                    <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800/60 bg-zinc-50/50 dark:bg-zinc-900/50 flex justify-between items-center sticky top-0 z-20">
                        <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                            Editar Programación Quirúrgica
                        </h2>
                        <button onClick={onClose} className="p-2 rounded-xl text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 bg-stone-50/30 dark:bg-zinc-900">
                        {errorModalMsg && (
                            <div className="mb-6 p-4 bg-red-50 border border-red-200 dark:border-red-500/20 text-red-800 dark:bg-red-500/10 dark:text-red-300 rounded-2xl flex gap-3 shadow-sm">
                                <AlertTriangle className="shrink-0" size={20} />
                                <div className="text-sm font-semibold whitespace-pre-wrap">{errorModalMsg}</div>
                            </div>
                        )}

                        <form id="edit-surgery-form" onSubmit={handleSubmit} className="space-y-6">
                            <input type="hidden" name="id" value={surgeryData.surgery.id} />

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Left Column */}
                                <div className="space-y-6">
                                    <div className="p-5 bg-white dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm">
                                        <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-widest mb-4 border-b border-zinc-100 dark:border-zinc-700 pb-2">Datos Clínicos y Paciente</h3>

                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <label className="text-xs font-semibold text-zinc-500">Documento / ID Paciente</label>
                                                <div className="relative group">
                                                    <input
                                                        type="text"
                                                        name="patient_id"
                                                        required
                                                        value={patientDni}
                                                        onChange={(e) => setPatientDni(e.target.value)}
                                                        maxLength={12}
                                                        className={`${inputClasses} pl-4 pr-10`}
                                                    />
                                                    <div className="absolute right-3 top-2.5 flex items-center">
                                                        {isSearching ? <Loader2 className="h-4 w-4 animate-spin text-zinc-400" /> : <Search className="h-4 w-4 text-zinc-400" />}
                                                    </div>
                                                </div>
                                                {patientDni.length >= 8 && !isSearching && found && (
                                                    <div className="text-xs font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded inline-block mt-1">
                                                        ✓ {patientName}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-xs font-semibold text-zinc-500">Diagnóstico (Dx)</label>
                                                <textarea name="diagnosis" required defaultValue={surgeryData.surgery.diagnosis} className={`${inputClasses} h-20 resize-none`}></textarea>
                                            </div>

                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="space-y-2">
                                                    <label className="text-xs font-semibold text-zinc-500">Tipo Quirúrgico</label>
                                                    <select name="surgery_type" required defaultValue={surgeryData.surgery.surgeryType} className={selectClasses}>
                                                        <option value="Cirugía Menor">Cirugía Menor</option>
                                                        <option value="Cirugía Mayor">Cirugía Mayor</option>
                                                    </select>
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-xs font-semibold text-zinc-500">Prioridad</label>
                                                    <select name="urgency_type" required defaultValue={surgeryData.surgery.urgencyType || "ELECTIVO"} className={selectClasses}>
                                                        <option value="ELECTIVO">Electivo</option>
                                                        <option value="EMERGENCIA">Emergencia</option>
                                                    </select>
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-xs font-semibold text-zinc-500">Especialidad</label>
                                                <select name="specialty_id" required defaultValue={surgeryData.surgery.specialtyId} className={selectClasses}>
                                                    {specialties.map(spec => (
                                                        <option key={spec.id} value={spec.id}>{spec.name}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="space-y-2">
                                                    <label className="text-xs font-semibold text-zinc-500">Seguro</label>
                                                    <select name="insurance_type" required defaultValue={surgeryData.surgery.insuranceType} className={selectClasses}>
                                                        <option value="SIS">SIS</option>
                                                        <option value="SOAT">SOAT</option>
                                                        <option value="PARTICULAR">PARTICULAR</option>
                                                        <option value="SISPOL">SISPOL</option>
                                                    </select>
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-xs font-semibold text-zinc-500">Procedencia</label>
                                                    <input type="text" name="origin" required defaultValue={surgeryData.surgery.origin} className={inputClasses} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Column */}
                                <div className="space-y-6">
                                    <div className="p-5 bg-white dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm">
                                        <h3 className="text-sm font-bold text-[var(--color-hospital-blue)] dark:text-blue-400 uppercase tracking-widest mb-4 border-b border-zinc-100 dark:border-zinc-700 pb-2 flex justify-between items-center">
                                            Logística e Intervinientes
                                        </h3>

                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <label className="text-xs font-semibold text-zinc-500">Asignar Sala Quirúrgica</label>
                                                <select name="operating_room_id" defaultValue={surgeryData.surgery.operatingRoomId || ""} className={selectClasses}>
                                                    <option value="">-- Por definir (Pendiente) --</option>
                                                    {salas.map(sala => (
                                                        <option key={sala.id} value={sala.id}>{sala.name} {sala.status === 'unavailable' ? '(Mantenimiento)' : ''}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div className="grid grid-cols-3 gap-3">
                                                <div className="col-span-1 space-y-2">
                                                    <label className="text-xs font-semibold text-zinc-500">Fecha</label>
                                                    <input type="date" name="scheduled_date" required defaultValue={initialDateStr} className={inputClasses} />
                                                </div>
                                                <div className="col-span-1 space-y-2">
                                                    <label className="text-xs font-semibold text-zinc-500">Hora</label>
                                                    <input type="time" name="scheduled_time" required defaultValue={initialTimeStr} className={inputClasses} />
                                                </div>
                                                <div className="col-span-1 space-y-2">
                                                    <label className="text-xs font-semibold text-zinc-500">Duración</label>
                                                    <select name="estimated_duration" required defaultValue={surgeryData.surgery.estimatedDuration} className={`${inputClasses} px-2`}>
                                                        <option value="30 minutos">30 min (Exp.)</option>
                                                        <option value="1 hora">1 hora o menos</option>
                                                        <option value="2 horas">Hasta 2 horas</option>
                                                        <option value="3 horas">Hasta 3 horas</option>
                                                        <option value="4+ horas">4 horas a más</option>
                                                    </select>
                                                </div>
                                            </div>

                                            <div className="space-y-2 border-t border-zinc-100 dark:border-zinc-800 pt-3">
                                                <label className="text-xs font-semibold text-zinc-500">Cirujanos Involucrados</label>
                                                <select name="surgeons" multiple required defaultValue={initialSurgeons} className={`${inputClasses} h-20`}>
                                                    {staff.surgeons.map(s => <option key={s.id} value={s.id}>{s.name} {s.lastname} ({s.tuitionCode})</option>)}
                                                </select>
                                            </div>

                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="space-y-2">
                                                    <label className="text-xs font-semibold text-zinc-500">Anestesiólogos</label>
                                                    <select name="anesthesiologists" multiple defaultValue={initialAnesthesiologists} className={`${inputClasses} h-20`}>
                                                        {staff.anesthesiologists.map(a => <option key={a.id} value={a.id}>{a.name} {a.lastname}</option>)}
                                                    </select>
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-xs font-semibold text-zinc-500">Enfermeros</label>
                                                    <select name="nurses" multiple defaultValue={initialNurses} className={`${inputClasses} h-20`}>
                                                        {staff.nurses.map(n => <option key={n.id} value={n.id}>{n.name} {n.lastname}</option>)}
                                                    </select>
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-xs font-semibold text-zinc-500">Notas Opcionales</label>
                                                <textarea name="notes" defaultValue={surgeryData.surgery.notes || ""} className={`${inputClasses} h-12 resize-none`} placeholder="Medicamentos, materiales..."></textarea>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </form>
                    </div>

                    <div className="p-6 border-t border-zinc-100 dark:border-zinc-800/60 bg-white dark:bg-zinc-900 sticky bottom-0 z-20 flex gap-4 justify-end">
                        <button type="button" onClick={onClose} disabled={submitting} className="px-6 py-3 font-semibold text-zinc-600 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 rounded-xl transition-all">Cancelar</button>
                        <button type="submit" form="edit-surgery-form" disabled={submitting} className="px-8 py-3 font-bold text-white bg-[var(--color-hospital-blue)] hover:bg-[#09357a] rounded-xl shadow-md tooltip hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center gap-2">
                            {submitting ? 'Guardando Cambios...' : 'Guardar Re-Agendamiento'}
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>,
        document.body
    );
}
