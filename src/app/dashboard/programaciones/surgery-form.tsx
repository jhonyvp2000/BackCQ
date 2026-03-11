"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Plus, User, AlertCircle, CheckCircle, Search, Loader2, AlertTriangle, X, Shield, Users, CalendarDays, ChevronDown } from "lucide-react";
import { createSurgery } from "@/app/actions/cirugias";
import { lookupPatientByDni } from "@/app/actions/pacientes";
import { motion, AnimatePresence } from "framer-motion";

export function SurgerySchedulerForm({ salas, specialties, staff, canSchedule, diagnoses, procedures }: {
    salas: any[],
    specialties: any[],
    staff: { surgeons: any[], anesthesiologists: any[], nurses: any[] },
    canSchedule: boolean,
    diagnoses: any[],
    procedures: any[]
}) {
    const [patientDni, setPatientDni] = useState("");
    const [patientName, setPatientName] = useState("");
    const [isSearching, setIsSearching] = useState(false);
    const [found, setFound] = useState<boolean | null>(null);
    const [source, setSource] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [errorModalMsg, setErrorModalMsg] = useState<string>("");
    const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
    const [dxSearchTerm, setDxSearchTerm] = useState("");
    const [selectedDxIds, setSelectedDxIds] = useState<Set<string>>(new Set());
    const [procSearchTerm, setProcSearchTerm] = useState("");
    const [selectedProcIds, setSelectedProcIds] = useState<Set<string>>(new Set());
    const [surgSearchTerm, setSurgSearchTerm] = useState("");
    const [selectedSurgIds, setSelectedSurgIds] = useState<Set<string>>(new Set());
    const [anesSearchTerm, setAnesSearchTerm] = useState("");
    const [selectedAnesIds, setSelectedAnesIds] = useState<Set<string>>(new Set());
    const [nursSearchTerm, setNursSearchTerm] = useState("");
    const [selectedNursIds, setSelectedNursIds] = useState<Set<string>>(new Set());

    // Cloning State
    const [clonedData, setClonedData] = useState<any>(null);
    const [formKey, setFormKey] = useState(0);

    // Accordion State Manager
    const [openSection, setOpenSection] = useState<'patient' | 'classification' | 'team' | 'schedule'>('patient');

    useEffect(() => {
        const handleClone = (e: any) => {
            const row = e.detail;
            setClonedData(row);
            setPatientDni(row?.patientPii?.dni || ""); // Sync DNI state

            // Sync Staff Selection State
            const surg = row?.team?.filter((t: any) => t.role === 'CIRUJANO').map((t: any) => t.staff.id) || [];
            const anes = row?.team?.filter((t: any) => t.role === 'ANESTESIOLOGO').map((t: any) => t.staff.id) || [];
            const nurs = row?.team?.filter((t: any) => t.role === 'ENFERMERO').map((t: any) => t.staff.id) || [];
            setSelectedSurgIds(new Set(surg));
            setSelectedAnesIds(new Set(anes));
            setSelectedNursIds(new Set(nurs));

            setFormKey(prev => prev + 1); // Remount form with new defaultValues
            setOpenSection('patient');

            // Scroll to form smoothly
            window.scrollTo({ top: 0, behavior: 'smooth' });
        };
        window.addEventListener('CLONE_SURGERY', handleClone);
        return () => window.removeEventListener('CLONE_SURGERY', handleClone);
    }, []);

    // Extract initial values for team arrays
    const initialSurgeons = clonedData?.team?.filter((t: any) => t.role === 'CIRUJANO').map((t: any) => t.staff.id) || [];
    const initialAnesthesiologists = clonedData?.team?.filter((t: any) => t.role === 'ANESTESIOLOGO').map((t: any) => t.staff.id) || [];
    const initialNurses = clonedData?.team?.filter((t: any) => t.role === 'ENFERMERO').map((t: any) => t.staff.id) || [];

    const toggleSection = (section: 'patient' | 'classification' | 'team' | 'schedule') => {
        setOpenSection(prev => prev === section ? prev : section);
    };

    const removeDiacritics = (str: string) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    const searchTerms = removeDiacritics(dxSearchTerm.toLowerCase())
        .split(/\s+/)
        .filter(Boolean);

    const selectedDxList = diagnoses.filter(dx => selectedDxIds.has(dx.id));
    const filteredUnselectedDx = diagnoses
        .filter(dx => !selectedDxIds.has(dx.id))
        .filter(dx => {
            if (searchTerms.length === 0) return true;
            const fullText = removeDiacritics(`${dx.code} ${dx.name}`.toLowerCase());
            return searchTerms.every(term => fullText.includes(term));
        })
        .slice(0, 50);

    const toggleDx = (id: string, checked: boolean) => {
        const next = new Set(selectedDxIds);
        if (checked) next.add(id);
        else next.delete(id);
        setSelectedDxIds(next);
    };

    const procSearchTerms = removeDiacritics(procSearchTerm.toLowerCase())
        .split(/\s+/)
        .filter(Boolean);

    const selectedProcList = procedures.filter(proc => selectedProcIds.has(proc.id));
    const filteredUnselectedProc = procedures
        .filter(proc => !selectedProcIds.has(proc.id))
        .filter(proc => {
            if (procSearchTerms.length === 0) return true;
            const fullText = removeDiacritics(`${proc.code} ${proc.name}`.toLowerCase());
            return procSearchTerms.every(term => fullText.includes(term));
        })
        .slice(0, 50);

    const toggleProc = (id: string, checked: boolean) => {
        const next = new Set(selectedProcIds);
        if (checked) next.add(id);
        else next.delete(id);
        setSelectedProcIds(next);
    };

    const surgSearchTermsArr = removeDiacritics(surgSearchTerm.toLowerCase()).split(/\s+/).filter(Boolean);
    const selectedSurgList = staff.surgeons.filter(s => selectedSurgIds.has(s.id));
    const filteredUnselectedSurg = staff.surgeons
        .filter(s => !selectedSurgIds.has(s.id))
        .filter(s => {
            if (surgSearchTermsArr.length === 0) return true;
            const fullText = removeDiacritics(`${s.name} ${s.lastname} ${s.tuitionCode || ""}`).toLowerCase();
            return surgSearchTermsArr.every(term => fullText.includes(term));
        })
        .slice(0, 50);

    const toggleSurg = (id: string, checked: boolean) => {
        const next = new Set(selectedSurgIds);
        if (checked) next.add(id);
        else next.delete(id);
        setSelectedSurgIds(next);
    };

    const anesSearchTermsArr = removeDiacritics(anesSearchTerm.toLowerCase()).split(/\s+/).filter(Boolean);
    const selectedAnesList = staff.anesthesiologists.filter(a => selectedAnesIds.has(a.id));
    const filteredUnselectedAnes = staff.anesthesiologists
        .filter(a => !selectedAnesIds.has(a.id))
        .filter(a => {
            if (anesSearchTermsArr.length === 0) return true;
            const fullText = removeDiacritics(`${a.name} ${a.lastname} ${a.tuitionCode || ""}`).toLowerCase();
            return anesSearchTermsArr.every(term => fullText.includes(term));
        })
        .slice(0, 50);

    const toggleAnes = (id: string, checked: boolean) => {
        const next = new Set(selectedAnesIds);
        if (checked) next.add(id);
        else next.delete(id);
        setSelectedAnesIds(next);
    };

    const nursSearchTermsArr = removeDiacritics(nursSearchTerm.toLowerCase()).split(/\s+/).filter(Boolean);
    const selectedNursList = staff.nurses.filter(n => selectedNursIds.has(n.id));
    const filteredUnselectedNurs = staff.nurses
        .filter(n => !selectedNursIds.has(n.id))
        .filter(n => {
            if (nursSearchTermsArr.length === 0) return true;
            const fullText = removeDiacritics(`${n.name} ${n.lastname} ${n.professionName || ""}`).toLowerCase();
            return nursSearchTermsArr.every(term => fullText.includes(term));
        })
        .slice(0, 50);

    const toggleNurs = (id: string, checked: boolean) => {
        const next = new Set(selectedNursIds);
        if (checked) next.add(id);
        else next.delete(id);
        setSelectedNursIds(next);
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setSubmitting(true);
        const form = e.currentTarget;
        const formData = new FormData(form);

        const res = await createSurgery(formData);

        if (res?.error) {
            setErrorModalMsg(res.error);
            setIsErrorModalOpen(true);
        } else {
            form.reset();
            setPatientDni("");
            setPatientName("");
            setFound(null);
            setSource(null);
            setSelectedDxIds(new Set());
            setDxSearchTerm("");
            setSelectedProcIds(new Set());
            setProcSearchTerm("");
            setSelectedSurgIds(new Set());
            setSurgSearchTerm("");
            setSelectedAnesIds(new Set());
            setAnesSearchTerm("");
            setSelectedNursIds(new Set());
            setNursSearchTerm("");
            setOpenSection('patient'); // reset accordion
        }
        setSubmitting(false);
    };

    // Debounce the DNI search
    useEffect(() => {
        if (patientDni.length >= 5) {
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
        } else {
            setPatientName("");
            setFound(null);
            setSource(null);
        }
    }, [patientDni]);

    const inputClasses = "w-full px-4 py-2 border border-zinc-200 dark:border-zinc-700 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-2 focus:ring-[var(--color-hospital-blue)] focus:border-transparent outline-none transition-all disabled:opacity-50 text-sm";
    const selectClasses = `${inputClasses} appearance-none bg-no-repeat bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%2371717A%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:10px_10px] bg-[position:right_1rem_center]`;

    return (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] h-fit sticky top-24 transition-all duration-300">
            <h3 className="font-semibold text-lg text-zinc-900 dark:text-white mb-4 flex items-center">
                <div className="bg-blue-50 dark:bg-blue-900/30 p-2 rounded-xl mr-3">
                    <Plus size={18} className="text-[var(--color-hospital-blue)] dark:text-blue-400" />
                </div>
                Nueva Cirugía
            </h3>

            {!canSchedule && (
                <div className="mb-5 px-4 py-3 bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200 text-sm rounded-xl border border-amber-200 dark:border-amber-800/50 flex flex-col gap-1 shadow-sm">
                    <div className="flex items-center font-semibold">
                        <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
                        Bloque Quirúrgico Lleno
                    </div>
                    <p className="pl-7 text-amber-700/80 dark:text-amber-300/80">No hay salas disponibles operativas. Espera su liberación.</p>
                </div>
            )}
            {clonedData && (
                <div className="mb-5 px-4 py-3 bg-blue-50 dark:bg-blue-900/20 text-[var(--color-hospital-blue)] dark:text-blue-300 text-sm rounded-xl border border-blue-200 dark:border-blue-800/50 flex flex-col gap-1 shadow-sm font-semibold">
                    <div className="flex items-center">
                        <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
                        Modo Clonación Activo
                    </div>
                    <p className="pl-7 text-xs opacity-90 font-medium">Se han precargado los datos. Selecciona una nueva fecha y sala.</p>
                </div>
            )}

            <form key={formKey} onSubmit={handleSubmit} className="space-y-4">

                {/* --- SECCIÓN 1: PACIENTE & DIAGNÓSTICO --- */}
                <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-white dark:bg-zinc-900 shadow-sm transition-all duration-300">
                    <button
                        type="button"
                        onClick={() => toggleSection('patient')}
                        className={`w-full flex items-center justify-between p-4 text-left font-semibold \${openSection === 'patient' ? 'bg-blue-50/50 dark:bg-zinc-800/50 text-[var(--color-hospital-blue)] dark:text-blue-400' : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'}`}
                    >
                        <div className="flex items-center gap-3">
                            <User size={18} className={openSection === 'patient' ? "text-[var(--color-hospital-blue)] dark:text-blue-400" : "text-zinc-400"} />
                            <span>1. Detalle del Paciente</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <ChevronDown size={16} className={`transition-transform duration-300 \${openSection === 'patient' ? 'rotate-180' : ''}`} />
                        </div>
                    </button>

                    <motion.div
                        initial={false}
                        animate={{ height: openSection === 'patient' ? 'auto' : 0, opacity: openSection === 'patient' ? 1 : 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                    >
                        <div className="p-4 pt-2 space-y-4 border-t border-zinc-100 dark:border-zinc-800/60">
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Identificador (DNI / HC)</label>
                                <div className="relative group">
                                    <input
                                        type="text"
                                        name="patient_id"
                                        required
                                        disabled={!canSchedule}
                                        value={patientDni}
                                        onChange={(e) => setPatientDni(e.target.value)}
                                        maxLength={12}
                                        className={`\${inputClasses} pl-4 pr-10`}
                                        placeholder="Ej. 09791569"
                                    />
                                    <div className="absolute right-3 top-2.5 flex items-center">
                                        {isSearching ? <Loader2 className="h-4 w-4 animate-spin text-zinc-400" /> : <Search className="h-4 w-4 text-zinc-400" />}
                                    </div>
                                </div>

                                <AnimatePresence>
                                    {patientDni.length >= 5 && !isSearching && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className={`mt-2 rounded-xl p-3 text-sm flex items-start gap-2 border \${found ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/20 text-emerald-800 dark:text-emerald-300' : 'bg-red-50 border-red-200 dark:bg-red-500/10 dark:border-red-500/20 text-red-800 dark:text-red-300'}`}
                                        >
                                            {found ? (
                                                <>
                                                    <CheckCircle className="w-5 h-5 shrink-0" />
                                                    <div className="flex flex-col">
                                                        <span className="font-semibold">{patientName}</span>
                                                        <span className="text-xs opacity-80 uppercase tracking-widest mt-0.5 font-bold">Validado {source}</span>
                                                    </div>
                                                </>
                                            ) : (
                                                <>
                                                    <AlertCircle className="w-5 h-5 shrink-0" />
                                                    <div className="flex flex-col">
                                                        <span className="font-semibold">Borrador Manual.</span>
                                                        <span className="text-xs opacity-80 mt-0.5">Se asignará luego DNI temporal.</span>
                                                    </div>
                                                </>
                                            )}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            <div className="space-y-2 pt-2">
                                <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Catálogo de Diagnósticos (Dx)</label>
                                <div className="relative mb-2">
                                    <input
                                        type="text"
                                        placeholder="Buscar patología por código CIE o nombre..."
                                        value={dxSearchTerm}
                                        onChange={e => setDxSearchTerm(e.target.value)}
                                        className={`${inputClasses} pl-9 py-2`}
                                        disabled={!canSchedule}
                                    />
                                    <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
                                </div>
                                <div className="max-h-52 overflow-y-auto border border-zinc-200 dark:border-zinc-700 rounded-xl bg-zinc-50 dark:bg-zinc-800 p-2 space-y-1">
                                    {selectedDxList.map((dx) => (
                                        <label key={dx.id} className="flex items-center gap-3 p-2 rounded-lg bg-blue-50/50 dark:bg-blue-900/20 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors cursor-pointer cursor-allowed text-sm border border-blue-100 dark:border-blue-800/50">
                                            <input
                                                type="checkbox"
                                                name="diagnoses"
                                                value={dx.id}
                                                checked={true}
                                                onChange={(e) => toggleDx(dx.id, e.target.checked)}
                                                className="w-4 h-4 text-[var(--color-hospital-blue)] rounded border-zinc-300 focus:ring-[var(--color-hospital-blue)] dark:border-zinc-600 dark:bg-zinc-700"
                                            />
                                            <span className="font-semibold text-[var(--color-hospital-blue)] dark:text-blue-400">{dx.code}</span>
                                            <span className="text-zinc-700 dark:text-zinc-300 text-xs flex-1 truncate font-medium">{dx.name}</span>
                                        </label>
                                    ))}
                                    {filteredUnselectedDx.map((dx) => (
                                        <label key={dx.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700/50 transition-colors cursor-pointer cursor-allowed disabled:opacity-50 text-sm">
                                            <input
                                                type="checkbox"
                                                name="diagnoses"
                                                value={dx.id}
                                                checked={false}
                                                disabled={!canSchedule}
                                                onChange={(e) => toggleDx(dx.id, e.target.checked)}
                                                className="w-4 h-4 text-[var(--color-hospital-blue)] rounded border-zinc-300 focus:ring-[var(--color-hospital-blue)] dark:border-zinc-600 dark:bg-zinc-700"
                                            />
                                            <span className="font-semibold text-zinc-700 dark:text-zinc-200">{dx.code}</span>
                                            <span className="text-zinc-500 dark:text-zinc-400 text-xs flex-1 truncate">{dx.name}</span>
                                        </label>
                                    ))}
                                    {filteredUnselectedDx.length === 0 && selectedDxList.length === 0 && (
                                        <p className="text-sm text-zinc-500 p-4 text-center">No se encontraron diagnósticos que coincidan con la búsqueda.</p>
                                    )}
                                    {diagnoses.length > 0 && filteredUnselectedDx.length === 50 && (
                                        <p className="text-[10px] text-zinc-400 p-2 text-center uppercase tracking-widest font-bold">Mostrando los primeros 50 resultados. Continúa escribiendo para afinar.</p>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2 pt-2">
                                <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Catálogo de Procedimientos</label>
                                <div className="relative mb-2">
                                    <input
                                        type="text"
                                        placeholder="Buscar procedimiento por código o nombre..."
                                        value={procSearchTerm}
                                        onChange={e => setProcSearchTerm(e.target.value)}
                                        className={`${inputClasses} pl-9 py-2`}
                                        disabled={!canSchedule}
                                    />
                                    <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
                                </div>
                                <div className="max-h-52 overflow-y-auto border border-zinc-200 dark:border-zinc-700 rounded-xl bg-zinc-50 dark:bg-zinc-800 p-2 space-y-1">
                                    {selectedProcList.map((proc) => (
                                        <label key={proc.id} className="flex items-center gap-3 p-2 rounded-lg bg-blue-50/50 dark:bg-blue-900/20 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors cursor-pointer cursor-allowed text-sm border border-blue-100 dark:border-blue-800/50">
                                            <input
                                                type="checkbox"
                                                name="procedures"
                                                value={proc.id}
                                                checked={true}
                                                onChange={(e) => toggleProc(proc.id, e.target.checked)}
                                                className="w-4 h-4 text-[var(--color-hospital-blue)] rounded border-zinc-300 focus:ring-[var(--color-hospital-blue)] dark:border-zinc-600 dark:bg-zinc-700"
                                            />
                                            <span className="font-semibold text-[var(--color-hospital-blue)] dark:text-blue-400">{proc.code}</span>
                                            <span className="text-zinc-700 dark:text-zinc-300 text-xs flex-1 truncate font-medium">{proc.name}</span>
                                        </label>
                                    ))}
                                    {filteredUnselectedProc.map((proc) => (
                                        <label key={proc.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700/50 transition-colors cursor-pointer cursor-allowed disabled:opacity-50 text-sm">
                                            <input
                                                type="checkbox"
                                                name="procedures"
                                                value={proc.id}
                                                checked={false}
                                                disabled={!canSchedule}
                                                onChange={(e) => toggleProc(proc.id, e.target.checked)}
                                                className="w-4 h-4 text-[var(--color-hospital-blue)] rounded border-zinc-300 focus:ring-[var(--color-hospital-blue)] dark:border-zinc-600 dark:bg-zinc-700"
                                            />
                                            <span className="font-semibold text-zinc-700 dark:text-zinc-200">{proc.code}</span>
                                            <span className="text-zinc-500 dark:text-zinc-400 text-xs flex-1 truncate">{proc.name}</span>
                                        </label>
                                    ))}
                                    {filteredUnselectedProc.length === 0 && selectedProcList.length === 0 && (
                                        <p className="text-sm text-zinc-500 p-4 text-center">No se encontraron procedimientos que coincidan con la búsqueda.</p>
                                    )}
                                    {procedures.length > 0 && filteredUnselectedProc.length === 50 && (
                                        <p className="text-[10px] text-zinc-400 p-2 text-center uppercase tracking-widest font-bold">Mostrando los primeros 50 resultados.</p>
                                    )}
                                </div>
                            </div>

                            {/* Action button to continue */}
                            <div className="pt-2 flex justify-end">
                                <button type="button" onClick={() => toggleSection('classification')} className="text-sm font-semibold text-[var(--color-hospital-blue)] bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 px-4 py-2 rounded-xl transition-colors">Siguiente Paso &rarr;</button>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* --- SECCIÓN 2: CLASIFICACIÓN & SEGURO --- */}
                <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-white dark:bg-zinc-900 shadow-sm transition-all duration-300">
                    <button
                        type="button"
                        onClick={() => toggleSection('classification')}
                        className={`w-full flex items-center justify-between p-4 text-left font-semibold ${openSection === 'classification' ? 'bg-blue-50/50 dark:bg-zinc-800/50 text-[var(--color-hospital-blue)] dark:text-blue-400' : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'}`}
                    >
                        <div className="flex items-center gap-3">
                            <Shield size={18} className={openSection === 'classification' ? "text-[var(--color-hospital-blue)] dark:text-blue-400" : "text-zinc-400"} />
                            <span>2. Clasificación Clínica</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <ChevronDown size={16} className={`transition-transform duration-300 ${openSection === 'classification' ? 'rotate-180' : ''}`} />
                        </div>
                    </button>

                    <motion.div
                        initial={false}
                        animate={{ height: openSection === 'classification' ? 'auto' : 0, opacity: openSection === 'classification' ? 1 : 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                    >
                        <div className="p-4 pt-2 space-y-4 border-t border-zinc-100 dark:border-zinc-800/60">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Tipo Operación</label>
                                    <select name="surgery_type" required disabled={!canSchedule} defaultValue={clonedData?.surgery?.surgeryType || ""} className={selectClasses}>
                                        <option value="">- Tipo -</option>
                                        <option value="Cirugía Menor">Cirugía Menor</option>
                                        <option value="Cirugía Mayor">Cirugía Mayor</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Prioridad</label>
                                    <select name="urgency_type" required disabled={!canSchedule} defaultValue={clonedData?.surgery?.urgencyType || "ELECTIVO"} className={selectClasses}>
                                        <option value="ELECTIVO">Electivo</option>
                                        <option value="EMERGENCIA">Emergencia</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Especialidad</label>
                                <select name="specialty_id" required disabled={!canSchedule} defaultValue={clonedData?.surgery?.specialtyId || ""} className={selectClasses}>
                                    <option value="">- Seleccionar -</option>
                                    {specialties.map(spec => (
                                        <option key={spec.id} value={spec.id}>{spec.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Tipo de seguro</label>
                                    <select name="insurance_type" required disabled={!canSchedule} defaultValue={clonedData?.surgery?.insuranceType || ""} className={selectClasses}>
                                        <option value="">- Seguro -</option>
                                        <option value="SIS">SIS</option>
                                        <option value="SOAT">SOAT</option>
                                        <option value="PARTICULAR">PARTICULAR</option>
                                        <option value="SISPOL">SISPOL</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Procedencia</label>
                                    <input
                                        type="text"
                                        name="origin"
                                        required
                                        disabled={!canSchedule}
                                        defaultValue={clonedData?.surgery?.origin || ""}
                                        placeholder="Ej. Ambulatorio"
                                        className={inputClasses}
                                    />
                                </div>
                            </div>

                            <div className="pt-2 flex justify-end">
                                <button type="button" onClick={() => toggleSection('team')} className="text-sm font-semibold text-[var(--color-hospital-blue)] bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 px-4 py-2 rounded-xl transition-colors">Siguiente Paso &rarr;</button>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* --- SECCIÓN 3: EQUIPO ASISTENCIAL --- */}
                <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-white dark:bg-zinc-900 shadow-sm transition-all duration-300">
                    <button
                        type="button"
                        onClick={() => toggleSection('team')}
                        className={`w-full flex items-center justify-between p-4 text-left font-semibold ${openSection === 'team' ? 'bg-blue-50/50 dark:bg-zinc-800/50 text-[var(--color-hospital-blue)] dark:text-blue-400' : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'}`}
                    >
                        <div className="flex items-center gap-3">
                            <Users size={18} className={openSection === 'team' ? "text-[var(--color-hospital-blue)] dark:text-blue-400" : "text-zinc-400"} />
                            <span>3. Equipo Asistencial</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <ChevronDown size={16} className={`transition-transform duration-300 ${openSection === 'team' ? 'rotate-180' : ''}`} />
                        </div>
                    </button>

                    <motion.div
                        initial={false}
                        animate={{ height: openSection === 'team' ? 'auto' : 0, opacity: openSection === 'team' ? 1 : 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                    >
                        <div className="p-4 pt-2 space-y-4 border-t border-zinc-100 dark:border-zinc-800/60">
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Cirujano(s) Principal(es)</label>
                                <div className="relative mb-2">
                                    <input
                                        type="text"
                                        placeholder="Buscar por nombre, apellido o CMP..."
                                        value={surgSearchTerm}
                                        onChange={e => setSurgSearchTerm(e.target.value)}
                                        className={`${inputClasses} pl-9 py-2`}
                                        disabled={!canSchedule}
                                    />
                                    <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
                                </div>
                                <div className="max-h-40 overflow-y-auto border border-zinc-200 dark:border-zinc-700 rounded-xl bg-zinc-50 dark:bg-zinc-800 p-2 space-y-1">
                                    {selectedSurgList.map((s) => (
                                        <label key={s.id} className="flex items-center gap-3 p-2 rounded-lg bg-blue-50/50 dark:bg-blue-900/20 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors cursor-pointer cursor-allowed text-sm border border-blue-100 dark:border-blue-800/50">
                                            <input
                                                type="checkbox"
                                                name="surgeons"
                                                value={s.id}
                                                checked={true}
                                                onChange={(e) => toggleSurg(s.id, e.target.checked)}
                                                className="w-4 h-4 text-[var(--color-hospital-blue)] rounded border-zinc-300 focus:ring-[var(--color-hospital-blue)] dark:border-zinc-600 dark:bg-zinc-700"
                                            />
                                            <span className="font-semibold text-[var(--color-hospital-blue)] dark:text-blue-400">{s.name} {s.lastname}</span>
                                            <span className="text-zinc-700 dark:text-zinc-300 text-xs flex-1 truncate font-medium">({s.tuitionCode})</span>
                                        </label>
                                    ))}
                                    {filteredUnselectedSurg.map((s) => (
                                        <label key={s.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700/50 transition-colors cursor-pointer cursor-allowed disabled:opacity-50 text-sm">
                                            <input
                                                type="checkbox"
                                                name="surgeons"
                                                value={s.id}
                                                checked={false}
                                                disabled={!canSchedule}
                                                onChange={(e) => toggleSurg(s.id, e.target.checked)}
                                                className="w-4 h-4 text-[var(--color-hospital-blue)] rounded border-zinc-300 focus:ring-[var(--color-hospital-blue)] dark:border-zinc-600 dark:bg-zinc-700"
                                            />
                                            <span className="font-semibold text-zinc-700 dark:text-zinc-200">{s.name} {s.lastname}</span>
                                            <span className="text-zinc-500 dark:text-zinc-400 text-xs flex-1 truncate">({s.tuitionCode})</span>
                                        </label>
                                    ))}
                                    {filteredUnselectedSurg.length === 0 && selectedSurgList.length === 0 && (
                                        <p className="text-sm text-zinc-500 p-4 text-center">No se encontraron cirujanos.</p>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Anestesiólogo(s)</label>
                                <div className="relative mb-2">
                                    <input
                                        type="text"
                                        placeholder="Buscar por nombre o apellido..."
                                        value={anesSearchTerm}
                                        onChange={e => setAnesSearchTerm(e.target.value)}
                                        className={`${inputClasses} pl-9 py-2`}
                                        disabled={!canSchedule}
                                    />
                                    <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
                                </div>
                                <div className="max-h-40 overflow-y-auto border border-zinc-200 dark:border-zinc-700 rounded-xl bg-zinc-50 dark:bg-zinc-800 p-2 space-y-1">
                                    {selectedAnesList.map((a) => (
                                        <label key={a.id} className="flex items-center gap-3 p-2 rounded-lg bg-blue-50/50 dark:bg-blue-900/20 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors cursor-pointer cursor-allowed text-sm border border-blue-100 dark:border-blue-800/50">
                                            <input
                                                type="checkbox"
                                                name="anesthesiologists"
                                                value={a.id}
                                                checked={true}
                                                onChange={(e) => toggleAnes(a.id, e.target.checked)}
                                                className="w-4 h-4 text-[var(--color-hospital-blue)] rounded border-zinc-300 focus:ring-[var(--color-hospital-blue)] dark:border-zinc-600 dark:bg-zinc-700"
                                            />
                                            <span className="font-semibold text-[var(--color-hospital-blue)] dark:text-blue-400">{a.name} {a.lastname}</span>
                                            <span className="text-zinc-700 dark:text-zinc-300 text-xs flex-1 truncate font-medium">({a.tuitionCode})</span>
                                        </label>
                                    ))}
                                    {filteredUnselectedAnes.map((a) => (
                                        <label key={a.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700/50 transition-colors cursor-pointer cursor-allowed disabled:opacity-50 text-sm">
                                            <input
                                                type="checkbox"
                                                name="anesthesiologists"
                                                value={a.id}
                                                checked={false}
                                                disabled={!canSchedule}
                                                onChange={(e) => toggleAnes(a.id, e.target.checked)}
                                                className="w-4 h-4 text-[var(--color-hospital-blue)] rounded border-zinc-300 focus:ring-[var(--color-hospital-blue)] dark:border-zinc-600 dark:bg-zinc-700"
                                            />
                                            <span className="font-semibold text-zinc-700 dark:text-zinc-200">{a.name} {a.lastname}</span>
                                            <span className="text-zinc-500 dark:text-zinc-400 text-xs flex-1 truncate">({a.tuitionCode})</span>
                                        </label>
                                    ))}
                                    {filteredUnselectedAnes.length === 0 && selectedAnesList.length === 0 && (
                                        <p className="text-sm text-zinc-500 p-4 text-center">No se encontraron anestesiólogos.</p>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Enfermero(s)</label>
                                <div className="relative mb-2">
                                    <input
                                        type="text"
                                        placeholder="Buscar por nombre, apellido o rol..."
                                        value={nursSearchTerm}
                                        onChange={e => setNursSearchTerm(e.target.value)}
                                        className={`${inputClasses} pl-9 py-2`}
                                        disabled={!canSchedule}
                                    />
                                    <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
                                </div>
                                <div className="max-h-40 overflow-y-auto border border-zinc-200 dark:border-zinc-700 rounded-xl bg-zinc-50 dark:bg-zinc-800 p-2 space-y-1">
                                    {selectedNursList.map((n) => (
                                        <label key={n.id} className="flex items-center gap-3 p-2 rounded-lg bg-blue-50/50 dark:bg-blue-900/20 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors cursor-pointer cursor-allowed text-sm border border-blue-100 dark:border-blue-800/50">
                                            <input
                                                type="checkbox"
                                                name="nurses"
                                                value={n.id}
                                                checked={true}
                                                onChange={(e) => toggleNurs(n.id, e.target.checked)}
                                                className="w-4 h-4 text-[var(--color-hospital-blue)] rounded border-zinc-300 focus:ring-[var(--color-hospital-blue)] dark:border-zinc-600 dark:bg-zinc-700"
                                            />
                                            <span className="font-semibold text-[var(--color-hospital-blue)] dark:text-blue-400">{n.name} {n.lastname}</span>
                                            <span className="text-zinc-700 dark:text-zinc-300 text-xs flex-1 truncate font-medium">{n.professionName}</span>
                                        </label>
                                    ))}
                                    {filteredUnselectedNurs.map((n) => (
                                        <label key={n.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700/50 transition-colors cursor-pointer cursor-allowed disabled:opacity-50 text-sm">
                                            <input
                                                type="checkbox"
                                                name="nurses"
                                                value={n.id}
                                                checked={false}
                                                disabled={!canSchedule}
                                                onChange={(e) => toggleNurs(n.id, e.target.checked)}
                                                className="w-4 h-4 text-[var(--color-hospital-blue)] rounded border-zinc-300 focus:ring-[var(--color-hospital-blue)] dark:border-zinc-600 dark:bg-zinc-700"
                                            />
                                            <span className="font-semibold text-zinc-700 dark:text-zinc-200">{n.name} {n.lastname}</span>
                                            <span className="text-zinc-500 dark:text-zinc-400 text-xs flex-1 truncate">{n.professionName}</span>
                                        </label>
                                    ))}
                                    {filteredUnselectedNurs.length === 0 && selectedNursList.length === 0 && (
                                        <p className="text-sm text-zinc-500 p-4 text-center">No se encontraron enfermeros.</p>
                                    )}
                                </div>
                            </div>

                            <div className="pt-2 flex justify-end">
                                <button type="button" onClick={() => toggleSection('schedule')} className="text-sm font-semibold text-[var(--color-hospital-blue)] bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 px-4 py-2 rounded-xl transition-colors">Siguiente Paso &rarr;</button>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* --- SECCIÓN 4: AGENDA Y SALA --- */}
                <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-white dark:bg-zinc-900 shadow-sm transition-all duration-300">
                    <button
                        type="button"
                        onClick={() => toggleSection('schedule')}
                        className={`w-full flex items-center justify-between p-4 text-left font-semibold ${openSection === 'schedule' ? 'bg-blue-50/50 dark:bg-zinc-800/50 text-[var(--color-hospital-blue)] dark:text-blue-400' : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'}`}
                    >
                        <div className="flex items-center gap-3">
                            <CalendarDays size={18} className={openSection === 'schedule' ? "text-[var(--color-hospital-blue)] dark:text-blue-400" : "text-zinc-400"} />
                            <span>4. Sala y Horarios</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <ChevronDown size={16} className={`transition-transform duration-300 ${openSection === 'schedule' ? 'rotate-180' : ''}`} />
                        </div>
                    </button>

                    <motion.div
                        initial={false}
                        animate={{ height: openSection === 'schedule' ? 'auto' : 0, opacity: openSection === 'schedule' ? 1 : 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                    >
                        <div className="p-4 pt-2 space-y-4 border-t border-zinc-100 dark:border-zinc-800/60">
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Sala Quirúrgica</label>
                                <select name="operating_room_id" disabled={!canSchedule} className={selectClasses}>
                                    <option value="">-- Por definir internamente --</option>
                                    {salas.filter(s => s.status === 'available').map(sala => (
                                        <option key={sala.id} value={sala.id}>{sala.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Fecha</label>
                                    <input type="date" name="scheduled_date" required disabled={!canSchedule} className={inputClasses} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Hora</label>
                                    <input type="time" name="scheduled_time" required disabled={!canSchedule} className={inputClasses} />
                                </div>
                                <div className="col-span-2 space-y-2 mt-1">
                                    <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Duración Estimada</label>
                                    <select name="estimated_duration" required disabled={!canSchedule} defaultValue={clonedData?.surgery?.estimatedDuration || ""} className={`${inputClasses} px-2`}>
                                        <option value="">- Lapso -</option>
                                        <option value="30 minutos">30 min (Exp.)</option>
                                        <option value="1 hora">1 hora o menos</option>
                                        <option value="2 horas">Hasta 2 horas</option>
                                        <option value="3 horas">Hasta 3 horas</option>
                                        <option value="4+ horas">4 horas a más</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2 pt-2">
                                <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Notas Internas</label>
                                <textarea
                                    name="notes"
                                    disabled={!canSchedule}
                                    defaultValue={clonedData?.surgery?.notes || ""}
                                    className={`${inputClasses} resize-none h-20`}
                                    placeholder="Procedimiento, insumos especiales o materiales médicos (Opcional)..."
                                ></textarea>
                            </div>

                        </div>
                    </motion.div>
                </div>

                <button
                    type="submit"
                    disabled={!canSchedule || submitting}
                    className="group relative w-full flex justify-center py-4 px-4 rounded-xl shadow-[0_4px_14px_0_rgb(13,71,161,0.39)] text-sm font-bold text-white bg-[var(--color-hospital-blue)] hover:bg-[#09357a] hover:shadow-[0_6px_20px_rgba(13,71,161,0.23)] hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none transition-all duration-200 mt-6 overflow-hidden"
                >
                    <div className="absolute inset-0 w-full h-full -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
                    <span className="relative">{submitting ? 'Aprobando Agenda...' : 'Confirmar Cirugía'}</span>
                </button>
            </form>

            {typeof document !== "undefined" && createPortal(
                <AnimatePresence>
                    {isErrorModalOpen && (
                        <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                                onClick={() => setIsErrorModalOpen(false)}
                            />
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-800 p-6 z-10 max-w-sm w-full relative whitespace-pre-wrap text-left"
                            >
                                <button
                                    onClick={() => setIsErrorModalOpen(false)}
                                    className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                                >
                                    <X size={20} />
                                </button>

                                <div className="flex flex-col items-center text-center">
                                    <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center mb-4 text-red-600 dark:text-red-400">
                                        <AlertTriangle size={24} />
                                    </div>
                                    <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">
                                        Cruce de Horarios Detectado
                                    </h3>
                                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6 text-left w-full mt-2">
                                        {errorModalMsg}
                                    </p>

                                    <button
                                        onClick={() => setIsErrorModalOpen(false)}
                                        className="w-full py-2.5 px-4 rounded-xl font-semibold text-zinc-700 bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 shadow-sm transition-colors"
                                    >
                                        Corregir Datos
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </div>
    );
}
