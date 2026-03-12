"use client";

import { useState } from "react";
import { LayoutGrid, List as ListIcon, Calendar, ArrowUp, ArrowDown, User, Clock, Hourglass, CheckCircle2, XCircle, FileText, Activity, AlertCircle, Pencil, CopyPlus, AlertTriangle, X, Filter, Search } from "lucide-react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { StartSurgeryButton } from "./start-surgery-button";
import { DeleteSurgeryButton } from "./delete-button";
import { updateSurgeryStatus } from "@/app/actions/cirugias";
import { SurgeryTimeline } from "@/components/ui/surgery-timeline";
import { AnimatePresence, motion } from "framer-motion";
import { EditSurgeryModal } from "./edit-surgery-modal";
import { PhaseTransitionModal } from "./phase-transition-modal";

function getFormattedDate(dateValue: Date | string | null | undefined): string {
    if (!dateValue) return 'Fecha no definida';
    const date = typeof dateValue === 'string' ? new Date(dateValue) : dateValue;
    if (isNaN(date.getTime())) return 'Fecha inválida';
    return new Intl.DateTimeFormat('es-PE', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(date);
}

export function SurgeryViewToggle({ surgeriesData, salas, sortParams, specialties, staff }: { surgeriesData: any[], salas: any[], sortParams: any, specialties?: any[], staff?: any }) {
    const [viewMode, setViewMode] = useState<'list' | 'timeline'>('list');
    const [editingSurgery, setEditingSurgery] = useState<any>(null);
    const [cancellingSurgery, setCancellingSurgery] = useState<any>(null);
    const [cancelConfirmText, setCancelConfirmText] = useState<string>("");
    const [errorModalMsg, setErrorModalMsg] = useState<string>("");
    const [transitionModal, setTransitionModal] = useState<{ isOpen: boolean, surgeryId: string, targetPhase: string, patientName: string }>({ isOpen: false, surgeryId: '', targetPhase: '', patientName: '' });
    const currentSort = sortParams?.sort === 'asc' ? 'asc' : 'desc';

    // Estados para Filtros de Lista
    const [filterDate, setFilterDate] = useState<string>("");
    const [filterPatient, setFilterPatient] = useState<string>("");
    const [filterRoom, setFilterRoom] = useState<string>("ALL");
    const [filterStatus, setFilterStatus] = useState<string>("ALL");
    const [isFilterOpen, setIsFilterOpen] = useState<boolean>(false);

    // Filtros Universales (Paciente y Estado)
    const baseFilteredSurgeries = surgeriesData.filter(s => {
        if (filterPatient.trim() !== "") {
            const searchTerms = filterPatient.toLowerCase();
            const fullName = `${s.patient?.name || ''} ${s.patientPii?.nombres || ''} ${s.patientPii?.apellidos || ''}`.toLowerCase();
            const dni = `${s.patientPii?.dni || ''}`.toLowerCase();
            if (!fullName.includes(searchTerms) && !dni.includes(searchTerms)) return false;
        }

        if (filterStatus !== "ALL" && s.surgery.status !== filterStatus) {
            return false;
        }

        return true;
    });

    // Filtros Locales de Lista (Fecha y Quirófano)
    const filteredSurgeries = baseFilteredSurgeries.filter(s => {
        if (filterDate) {
            const surgeryDate = new Date(s.surgery.scheduledDate);
            const selectedDate = new Date(filterDate + "T12:00:00");
            if (surgeryDate.getFullYear() !== selectedDate.getFullYear() ||
                surgeryDate.getMonth() !== selectedDate.getMonth() ||
                surgeryDate.getDate() !== selectedDate.getDate()) {
                return false;
            }
        }

        if (filterRoom !== "ALL" && s.operatingRoom?.id !== filterRoom) {
            return false;
        }

        return true;
    });

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'scheduled':
                return <span className="bg-blue-50 text-[var(--color-hospital-blue)] px-3 py-1.5 rounded-full text-xs font-bold border border-blue-200/50 flex flex-nowrap items-center gap-1.5 w-max shadow-sm"><div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div> Programada</span>;
            case 'in_progress':
                return <span className="bg-amber-50 text-amber-700 px-3 py-1.5 rounded-full text-xs font-bold border border-amber-200/50 flex flex-nowrap items-center gap-1.5 w-max shadow-sm"><div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></div> En Quirófano</span>;
            case 'anesthesia_start':
                return <span className="bg-purple-50 text-purple-700 px-3 py-1.5 rounded-full text-xs font-bold border border-purple-200/50 flex flex-nowrap items-center gap-1.5 w-max shadow-sm"><div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse"></div> Anestesia Inducida</span>;
            case 'pre_incision':
                return <span className="bg-fuchsia-50 text-fuchsia-700 px-3 py-1.5 rounded-full text-xs font-bold border border-fuchsia-200/50 flex flex-nowrap items-center gap-1.5 w-max shadow-sm"><div className="w-1.5 h-1.5 rounded-full bg-fuchsia-500 animate-pulse"></div> Antes de Incisión</span>;
            case 'surgery_end':
                return <span className="bg-cyan-50 text-cyan-700 px-3 py-1.5 rounded-full text-xs font-bold border border-cyan-200/50 flex flex-nowrap items-center gap-1.5 w-max shadow-sm"><div className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse"></div> Término de Cirugía</span>;
            case 'patient_exit':
                return <span className="bg-orange-50 text-orange-700 px-3 py-1.5 rounded-full text-xs font-bold border border-orange-200/50 flex flex-nowrap items-center gap-1.5 w-max shadow-sm"><div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></div> Salida Paciente</span>;
            case 'urpa_exit':
                return <span className="bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-full text-xs font-bold border border-indigo-200/50 flex flex-nowrap items-center gap-1.5 w-max shadow-sm"><div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></div> Salida URPA</span>;
            case 'completed':
                return <span className="bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-full text-xs font-bold border border-emerald-200/50 flex flex-nowrap items-center gap-1.5 w-max shadow-sm"><CheckCircle2 size={12} className="text-emerald-500" /> Finalizada</span>;
            case 'cancelled':
                return <span className="bg-red-50 text-red-700 px-3 py-1.5 rounded-full text-xs font-bold border border-red-200/50 flex flex-nowrap items-center gap-1.5 w-max shadow-sm"><XCircle size={12} className="text-red-500" /> Suspendida</span>;
            default:
                return <span className="bg-zinc-100 text-zinc-600 px-3 py-1.5 rounded-full text-xs font-bold border border-zinc-200 flex flex-nowrap items-center gap-1.5 w-max shadow-sm"><AlertCircle size={12} /> Desconocido</span>;
        }
    };

    const handleStatusUpdate = async (formData: FormData) => {
        const res = await updateSurgeryStatus(formData);
        if (res?.error) {
            setErrorModalMsg(res.error);
        }
    };

    return (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm flex flex-col h-full ring-1 ring-zinc-100 dark:ring-zinc-800/50">
            {/* Header de Configuración y Toggles */}
            <div className="px-6 py-5 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center bg-zinc-50/50 dark:bg-zinc-900/20">
                <div>
                    <h3 className="font-bold text-lg text-zinc-900 dark:text-white flex items-center tracking-tight">
                        <Activity size={20} className="mr-2 text-[var(--color-hospital-blue)]" />
                        Agenda Central Intervenciones
                    </h3>
                    <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1 font-medium">Panel de control de operaciones programadas y en curso</p>
                </div>
                <div className="flex items-center gap-4">
                    <span className="bg-emerald-50 dark:bg-emerald-900/10 text-emerald-700 dark:text-emerald-400 px-3 py-1.5 rounded-xl text-xs font-bold border border-emerald-200/50 dark:border-emerald-800/50 shadow-sm hidden sm:block">
                        {surgeriesData.filter(s => s.surgery.status !== 'cancelled').length} Activas
                    </span>
                    <div className="bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl flex items-center border border-zinc-200 dark:border-zinc-700 shadow-inner">
                        <button
                            onClick={() => setViewMode('list')}
                            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-semibold transition-all duration-300 ${viewMode === 'list' ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm ring-1 ring-zinc-200 dark:ring-zinc-600' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
                        >
                            <ListIcon size={16} /> Lista
                        </button>
                        <button
                            onClick={() => setViewMode('timeline')}
                            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-semibold transition-all duration-300 ${viewMode === 'timeline' ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm ring-1 ring-zinc-200 dark:ring-zinc-600' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
                        >
                            <LayoutGrid size={16} /> Timeline
                        </button>
                    </div>
                </div>
            </div>

            {/* Control Panel de Filtros - Diseño Premium */}
            <div className="bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800 p-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-3">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setIsFilterOpen(!isFilterOpen)}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold transition-all ${isFilterOpen ? 'bg-blue-50 text-[var(--color-hospital-blue)] dark:bg-blue-900/20' : 'bg-zinc-100/80 hover:bg-zinc-200/80 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300'}`}
                        >
                            <Filter size={16} />
                            Filtros Dinámicos
                        </button>
                        {(filterDate || filterPatient || filterRoom !== 'ALL' || filterStatus !== 'ALL') && (
                            <button
                                onClick={() => { setFilterDate(''); setFilterPatient(''); setFilterRoom('ALL'); setFilterStatus('ALL'); }}
                                className="text-xs font-semibold text-zinc-500 hover:text-red-500 hover:underline px-2 transition-colors"
                            >
                                Limpiar Filtros
                            </button>
                        )}
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="flex items-center flex-wrap gap-x-3 gap-y-1 text-[9px] font-bold text-zinc-500 max-w-[600px] justify-end uppercase tracking-widest hidden lg:flex">
                            <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div> Programada</span>
                            <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div> Ingreso Qx</span>
                            <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-purple-500"></div> Anestesia</span>
                            <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-fuchsia-500"></div> Antes Incisión</span>
                            <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-cyan-500"></div> Tér. Cirugía</span>
                            <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-orange-500"></div> Salida Pac.</span>
                            <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div> URPA</span>
                            <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> Finalizada</span>
                            <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-red-500"></div> Suspendida</span>
                        </div>
                        <div className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800/50 px-3 py-1.5 rounded-lg border border-zinc-100 dark:border-zinc-800 shrink-0">
                            Mostrando <span className="text-zinc-900 dark:text-zinc-100 font-bold">{filteredSurgeries.length}</span> registros
                        </div>
                    </div>
                </div>

                <AnimatePresence>
                    {isFilterOpen && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                        >
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2 pb-2">
                                {/* Buscador de Paciente */}
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Search size={14} className="text-zinc-400 group-focus-within:text-[var(--color-hospital-blue)] transition-colors" />
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Buscar paciente o DNI..."
                                        value={filterPatient}
                                        onChange={(e) => setFilterPatient(e.target.value)}
                                        className="w-full pl-9 pr-3 py-2 bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all text-zinc-800 dark:text-zinc-200 placeholder-zinc-400"
                                    />
                                </div>

                                {/* Selector de Fecha */}
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Calendar size={14} className="text-zinc-400 group-focus-within:text-[var(--color-hospital-blue)] transition-colors" />
                                    </div>
                                    <input
                                        type="date"
                                        value={filterDate}
                                        onChange={(e) => setFilterDate(e.target.value)}
                                        className="w-full pl-9 pr-3 py-2 bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all text-zinc-800 dark:text-zinc-200 [color-scheme:light] dark:[color-scheme:dark]"
                                    />
                                </div>

                                {/* Selector de Quirófano */}
                                <select
                                    value={filterRoom}
                                    onChange={(e) => setFilterRoom(e.target.value)}
                                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all text-zinc-800 dark:text-zinc-200"
                                >
                                    <option value="ALL">Todas las Salas</option>
                                    <option value="None" disabled>-- Quirófanos --</option>
                                    {salas.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>

                                {/* Selector de Estado */}
                                <select
                                    value={filterStatus}
                                    onChange={(e) => setFilterStatus(e.target.value)}
                                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all text-zinc-800 dark:text-zinc-200"
                                >
                                    <option value="ALL">Cualquier Estado</option>
                                    <option value="scheduled">Programadas</option>
                                    <option value="in_progress">En Quirófano</option>
                                    <option value="anesthesia_start">Anestesia Iniciada</option>
                                    <option value="pre_incision">Pre-Incisión</option>
                                    <option value="surgery_end">Término Cirugía</option>
                                    <option value="patient_exit">Salida Paciente</option>
                                    <option value="urpa_exit">Salida URPA</option>
                                    <option value="completed">Finalizadas</option>
                                    <option value="cancelled">Suspendidas</option>
                                </select>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Content Area */}
            <div className="flex-grow">
                <AnimatePresence mode="wait">
                    {viewMode === 'timeline' ? (
                        <motion.div
                            key="timeline"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.98 }}
                            transition={{ duration: 0.2 }}
                            className="p-6 bg-zinc-50/50 dark:bg-zinc-900 h-full"
                        >
                            <SurgeryTimeline surgeriesData={baseFilteredSurgeries} salas={filterRoom === "ALL" ? salas : salas.filter(s => s.id === filterRoom)} displayDate={filterDate} setDisplayDate={setFilterDate} />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="list"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.98 }}
                            transition={{ duration: 0.2 }}
                            className="flex flex-col h-full"
                        >
                            {/* Listado de Cirugías Mejorado */}
                            {filteredSurgeries.length === 0 ? (
                                <div className="p-12 text-center flex flex-col items-center justify-center flex-grow bg-zinc-50/30 dark:bg-zinc-900/10">
                                    <div className="w-20 h-20 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-6 shadow-inner">
                                        <Calendar size={32} className="text-zinc-400 dark:text-zinc-500" />
                                    </div>
                                    <h3 className="text-xl font-bold text-zinc-800 dark:text-zinc-200 mb-2">Pizarra en blanco</h3>
                                    <p className="text-zinc-500 dark:text-zinc-400 max-w-sm font-medium">No hay intervenciones programadas para este filtro. Utiliza el panel lateral para agendar la primera cirugía del día.</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto flex-grow">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-800/30 backdrop-blur-sm">
                                                <th scope="col" className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-widest w-[40%]">
                                                    Paciente / Agenda
                                                    <Link href={`?sort=${currentSort === 'asc' ? 'desc' : 'asc'}`} className="inline-flex items-center ml-2 p-1 rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors tooltip" title={`Ordenar cronológicamente (${currentSort === 'asc' ? 'Z-A' : 'A-Z'})`}>
                                                        {currentSort === 'asc' ? <ArrowUp size={14} className="text-[var(--color-hospital-blue)]" /> : <ArrowDown size={14} className="text-[var(--color-hospital-blue)]" />}
                                                    </Link>
                                                </th>
                                                <th scope="col" className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-widest w-[20%]">
                                                    Quirófano Asignado
                                                </th>
                                                <th scope="col" className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-widest w-[20%]">
                                                    Estado Acto Médico
                                                </th>
                                                <th scope="col" className="px-6 py-4 pl-4 text-right text-xs font-bold text-zinc-500 uppercase tracking-widest">
                                                    Gestión Rápida
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white dark:bg-zinc-900 divide-y divide-zinc-100 dark:divide-zinc-800/50">
                                            {filteredSurgeries.map((row) => (
                                                <tr key={row.surgery.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/50 transition-all duration-300 group">
                                                    <td className="px-6 py-5 whitespace-nowrap">
                                                        <div className="flex items-start">
                                                            <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-[var(--color-hospital-blue)] mr-4 flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                                                                <User size={18} />
                                                            </div>
                                                            <div className="ml-0">
                                                                <div className="text-sm font-bold text-zinc-900 dark:text-white mb-1 tracking-tight">
                                                                    DNI: {row.patientPii?.dni || 'Desconocido'}
                                                                </div>
                                                                {row.patientPii?.nombres && row.patientPii.nombres !== 'Desconocido' && (
                                                                    <div className="text-xs text-zinc-500 font-medium mb-1 truncate max-w-[200px]" title={`${row.patientPii.nombres} ${row.patientPii.apellidos}`}>
                                                                        {row.patientPii.nombres} {row.patientPii.apellidos}
                                                                    </div>
                                                                )}
                                                                {row.surgery.diagnosis && (
                                                                    <div className="text-xs text-blue-800 dark:text-blue-300 font-semibold mb-1 truncate max-w-[300px]" title={row.surgery.diagnosis}>
                                                                        Dx: {row.surgery.diagnosis}
                                                                    </div>
                                                                )}
                                                                {row.specialty && (
                                                                    <div className="text-xs text-zinc-500 mt-1.5 font-medium truncate max-w-[150px]" title={row.specialty.name}>
                                                                        {row.specialty.name}
                                                                    </div>
                                                                )}
                                                                <div className="flex gap-2 flex-wrap mt-1.5 mb-2">
                                                                    {row.surgery.surgeryType && (
                                                                        <div className={`text-[10px] inline-block px-2 py-0.5 rounded border font-bold uppercase ${row.surgery.surgeryType === 'Cirugía Mayor' ? 'bg-red-50 text-red-600 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800/50' : 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800/50'}`}>
                                                                            {row.surgery.surgeryType}
                                                                        </div>
                                                                    )}
                                                                    {row.surgery.urgencyType && (
                                                                        <div className={`text-[10px] inline-block px-2 py-0.5 rounded border font-bold uppercase ${row.surgery.urgencyType === 'EMERGENCIA' ? 'bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-800/50 animate-pulse' : 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800/50'}`}>
                                                                            {row.surgery.urgencyType}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <div className="flex items-center gap-2 flex-wrap">
                                                                    <div className="text-xs text-zinc-600 dark:text-zinc-400 font-medium bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 rounded-lg inline-flex items-center border border-zinc-200/50 dark:border-zinc-700 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                                                                        <Clock size={12} className="mr-1.5 text-zinc-400" />
                                                                        {getFormattedDate(row.surgery.scheduledDate)}
                                                                    </div>
                                                                    {row.surgery.estimatedDuration && (
                                                                        <div className="text-xs text-zinc-600 dark:text-zinc-400 font-medium bg-amber-50 dark:bg-amber-900/10 text-amber-700 dark:text-amber-400 px-2.5 py-1 rounded-lg inline-flex items-center border border-amber-200/50 dark:border-amber-800/50 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                                                                            <Hourglass size={12} className="mr-1.5" />
                                                                            {row.surgery.estimatedDuration}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                {row.surgery.notes && (
                                                                    <div className="text-xs text-zinc-400 mt-2 mb-2 truncate max-w-[250px] font-medium" title={row.surgery.notes}>
                                                                        <span className="text-zinc-300 mr-1">↳</span> {row.surgery.notes}
                                                                    </div>
                                                                )}
                                                                {row.team && row.team.length > 0 && (
                                                                    <div className="mt-2.5 pt-2.5 border-t border-zinc-100 dark:border-zinc-800/50 flex flex-wrap gap-1.5">
                                                                        {row.team.map((t: any) => (
                                                                            <div key={`${row.surgery.id}-${t.staff.id}`} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-zinc-50 dark:bg-zinc-800/80 text-[10px] text-zinc-500 font-medium border border-zinc-200/50 dark:border-zinc-700" title={`${t.role}: ${t.staff.name} ${t.staff.lastname}`}>
                                                                                <span className="font-bold text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-900 rounded px-1 shadow-sm">
                                                                                    {t.role === 'CIRUJANO' ? 'Cx' : t.role === 'ANESTESIOLOGO' ? 'An' : 'En'}
                                                                                </span>
                                                                                <span className="truncate max-w-[100px]">{t.staff.name.split(' ')[0]} {t.staff.lastname.split(' ')[0]}</span>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-5 whitespace-nowrap align-middle">
                                                        <div className="inline-flex items-center">
                                                            <div className={`w-2 h-2 rounded-full mr-2 ${row.operatingRoom?.name ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                                                            <span className="text-sm text-zinc-900 dark:text-zinc-100 font-semibold tracking-tight">
                                                                {row.operatingRoom?.name || 'Sala Desasignada'}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-5 whitespace-nowrap align-middle">
                                                        {getStatusBadge(row.surgery.status)}
                                                    </td>
                                                    <td className="px-6 py-5 whitespace-nowrap text-right text-sm font-medium align-middle">
                                                        <div className="flex justify-end gap-2 items-center opacity-70 group-hover:opacity-100 transition-opacity duration-300">
                                                            {/* Flujo de Estados con Modal de Tiempo */}
                                                            {row.surgery.status === 'scheduled' && (
                                                                <button
                                                                    onClick={() => {
                                                                        if (!row.operatingRoom?.id) {
                                                                            setErrorModalMsg("No es posible ingresar a quirófano un procedimiento que aún no tiene una sala física asignada. Por favor, edita o asigna una sala previamente.");
                                                                            return;
                                                                        }
                                                                        setTransitionModal({
                                                                            isOpen: true,
                                                                            surgeryId: row.surgery.id,
                                                                            targetPhase: 'in_progress',
                                                                            patientName: `${row.patientPii?.nombres || ''} ${row.patientPii?.apellidos || ''}`.trim() || 'Desconocido'
                                                                        });
                                                                    }}
                                                                    className="text-amber-700 hover:text-white hover:bg-amber-600 bg-amber-50 dark:bg-amber-900/20 px-4 py-2 rounded-xl transition-all duration-300 border border-amber-200 hover:scale-[1.02] text-xs font-bold shadow-sm"
                                                                >
                                                                    Ingreso a Quirófano
                                                                </button>
                                                            )}

                                                            {row.surgery.status === 'in_progress' && (
                                                                <button
                                                                    onClick={() => setTransitionModal({ isOpen: true, surgeryId: row.surgery.id, targetPhase: 'anesthesia_start', patientName: `${row.patientPii?.nombres || ''} ${row.patientPii?.apellidos || ''}` })}
                                                                    className="text-purple-700 hover:text-white hover:bg-purple-600 bg-purple-50 dark:bg-purple-900/20 px-3 py-1.5 rounded-lg transition-all text-xs font-bold shadow-sm whitespace-nowrap border border-purple-200/50"
                                                                >
                                                                    Inic. Anestesia &rarr;
                                                                </button>
                                                            )}

                                                            {row.surgery.status === 'anesthesia_start' && (
                                                                <button
                                                                    onClick={() => setTransitionModal({ isOpen: true, surgeryId: row.surgery.id, targetPhase: 'pre_incision', patientName: `${row.patientPii?.nombres || ''} ${row.patientPii?.apellidos || ''}` })}
                                                                    className="text-rose-700 hover:text-white hover:bg-rose-600 bg-rose-50 dark:bg-rose-900/20 px-3 py-1.5 rounded-lg transition-all text-xs font-bold shadow-sm whitespace-nowrap border border-rose-200/50"
                                                                >
                                                                    Antes Incisión &rarr;
                                                                </button>
                                                            )}

                                                            {row.surgery.status === 'pre_incision' && (
                                                                <button
                                                                    onClick={() => setTransitionModal({ isOpen: true, surgeryId: row.surgery.id, targetPhase: 'surgery_end', patientName: `${row.patientPii?.nombres || ''} ${row.patientPii?.apellidos || ''}` })}
                                                                    className="text-cyan-700 hover:text-white hover:bg-cyan-600 bg-cyan-50 dark:bg-cyan-900/20 px-3 py-1.5 rounded-lg transition-all text-xs font-bold shadow-sm whitespace-nowrap border border-cyan-200/50"
                                                                >
                                                                    Término Cirugía &rarr;
                                                                </button>
                                                            )}

                                                            {row.surgery.status === 'surgery_end' && (
                                                                <button
                                                                    onClick={() => setTransitionModal({ isOpen: true, surgeryId: row.surgery.id, targetPhase: 'patient_exit', patientName: `${row.patientPii?.nombres || ''} ${row.patientPii?.apellidos || ''}` })}
                                                                    className="text-orange-700 hover:text-white hover:bg-orange-600 bg-orange-50 dark:bg-orange-900/20 px-3 py-1.5 rounded-lg transition-all text-xs font-bold shadow-sm whitespace-nowrap border border-orange-200/50"
                                                                >
                                                                    Salida Paciente &rarr;
                                                                </button>
                                                            )}

                                                            {row.surgery.status === 'patient_exit' && (
                                                                <div className="flex gap-1.5 items-center">
                                                                    <button
                                                                        onClick={() => setTransitionModal({ isOpen: true, surgeryId: row.surgery.id, targetPhase: 'urpa_exit', patientName: `${row.patientPii?.nombres || ''} ${row.patientPii?.apellidos || ''}` })}
                                                                        className="text-indigo-700 hover:text-white hover:bg-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 px-2.5 py-1.5 rounded-lg transition-all text-[11px] font-bold shadow-sm whitespace-nowrap border border-indigo-200/50"
                                                                    >
                                                                        Pase URPA &rarr;
                                                                    </button>
                                                                    <button
                                                                        onClick={() => setTransitionModal({ isOpen: true, surgeryId: row.surgery.id, targetPhase: 'completed', patientName: `${row.patientPii?.nombres || ''} ${row.patientPii?.apellidos || ''}` })}
                                                                        className="text-emerald-700 hover:text-white hover:bg-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1.5 rounded-lg transition-all text-xs font-bold shadow-sm whitespace-nowrap flex items-center gap-1 border border-emerald-200/50"
                                                                    >
                                                                        <CheckCircle2 size={13} /> Alta
                                                                    </button>
                                                                </div>
                                                            )}

                                                            {row.surgery.status === 'urpa_exit' && (
                                                                <button
                                                                    onClick={() => setTransitionModal({ isOpen: true, surgeryId: row.surgery.id, targetPhase: 'completed', patientName: `${row.patientPii?.nombres || ''} ${row.patientPii?.apellidos || ''}` })}
                                                                    className="text-emerald-700 hover:text-white hover:bg-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-4 py-2 rounded-xl transition-all duration-300 border border-emerald-200 hover:scale-[1.02] text-xs font-bold shadow-sm flex items-center gap-1.5 whitespace-nowrap"
                                                                >
                                                                    <CheckCircle2 size={14} /> Finalizar
                                                                </button>
                                                            )}

                                                            {row.surgery.status === 'scheduled' && (
                                                                <button type="button" onClick={() => { setCancellingSurgery(row); setCancelConfirmText(""); }} className="text-zinc-400 hover:text-amber-600 hover:bg-amber-50 p-2.5 rounded-xl transition-all" title="Suspender Evento">
                                                                    <XCircle size={18} />
                                                                </button>
                                                            )}

                                                            {(row.surgery.status === 'scheduled') && specialties && staff && (
                                                                <button onClick={() => setEditingSurgery(row)} className="text-zinc-400 hover:text-blue-600 hover:bg-blue-50 p-2.5 rounded-xl transition-all" title="Editar Programación">
                                                                    <Pencil size={18} />
                                                                </button>
                                                            )}

                                                            {row.surgery.status === 'cancelled' && (
                                                                <button onClick={() => window.dispatchEvent(new CustomEvent('CLONE_SURGERY', { detail: row }))} className="text-zinc-400 hover:text-[var(--color-hospital-blue)] hover:bg-blue-50 p-2.5 rounded-xl transition-all inline-block ml-1" title="Duplicar / Re-Agendar Cirugía">
                                                                    <CopyPlus size={18} />
                                                                </button>
                                                            )}

                                                            {row.surgery.status === 'completed' && (
                                                                <Link href={`/dashboard/programaciones/${row.surgery.id}/reporte`} className="inline-flex items-center text-zinc-500 hover:text-[var(--color-hospital-blue)] hover:bg-blue-50 p-2.5 rounded-xl transition-all tooltip bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700" title="Ver Reporte Operatorio">
                                                                    <FileText size={18} />
                                                                </Link>
                                                            )}

                                                            {/* Modal Seguro de Eliminación */}
                                                            {['scheduled', 'cancelled'].includes(row.surgery.status) && (
                                                                <div className="inline-block ml-1 border-l border-zinc-200 dark:border-zinc-700 pl-1">
                                                                    <DeleteSurgeryButton id={row.surgery.id} />
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {editingSurgery && specialties && staff && (
                <EditSurgeryModal
                    isOpen={!!editingSurgery}
                    onClose={() => setEditingSurgery(null)}
                    surgeryData={editingSurgery}
                    salas={salas}
                    specialties={specialties}
                    staff={staff}
                />
            )}

            <PhaseTransitionModal
                isOpen={transitionModal.isOpen}
                onClose={() => setTransitionModal({ ...transitionModal, isOpen: false })}
                surgeryId={transitionModal.surgeryId}
                targetPhase={transitionModal.targetPhase}
                patientName={transitionModal.patientName}
                onSuccess={() => setTransitionModal({ ...transitionModal, isOpen: false })}
            />

            {typeof document !== "undefined" && createPortal(
                <AnimatePresence>
                    {errorModalMsg && (
                        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setErrorModalMsg("")}
                                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                            />
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                className="bg-white dark:bg-zinc-900 rounded-3xl shadow-xl border border-zinc-200/50 dark:border-zinc-800 z-10 w-full max-w-md overflow-hidden relative"
                            >
                                <div className="absolute top-0 left-0 w-full h-1.5 bg-red-500"></div>
                                <div className="p-6 pt-8 text-center sm:text-left flex flex-col sm:flex-row gap-5 items-center sm:items-start">
                                    <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-500/10 flex items-center justify-center shrink-0">
                                        <AlertTriangle size={24} className="text-red-500" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mt-1 mb-2">
                                            Reactivación Fallida
                                        </h3>
                                        <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium whitespace-pre-wrap">
                                            {errorModalMsg}
                                        </p>
                                    </div>
                                </div>
                                <div className="px-6 py-4 bg-zinc-50/50 dark:bg-zinc-900/50 border-t border-zinc-100 dark:border-zinc-800 flex justify-end">
                                    <button
                                        onClick={() => setErrorModalMsg("")}
                                        className="px-6 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-zinc-900 font-bold rounded-xl transition-all w-full sm:w-auto shadow-sm"
                                    >
                                        Entendido
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>,
                document.body
            )}

            {typeof document !== "undefined" && createPortal(
                <AnimatePresence>
                    {cancellingSurgery && (
                        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setCancellingSurgery(null)}
                                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                            />
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                className="bg-white dark:bg-zinc-900 rounded-3xl shadow-xl border border-zinc-200/50 dark:border-zinc-800 z-10 w-full max-w-md overflow-hidden relative"
                            >
                                <div className="absolute top-0 left-0 w-full h-1.5 bg-amber-500"></div>
                                <div className="p-6 pt-8 text-center sm:text-left">
                                    <div className="w-12 h-12 rounded-full bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center mx-auto sm:mx-0 shrink-0 mb-4">
                                        <XCircle size={24} className="text-amber-500" />
                                    </div>
                                    <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
                                        ¿Suspender Cirugía?
                                    </h3>
                                    <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium whitespace-pre-wrap mb-4">
                                        Esta acción cambiará la programación de <strong className="text-zinc-700 dark:text-zinc-300">{cancellingSurgery.patient?.name || 'este paciente'}</strong> a un estado suspendida. No podrá volver a editarla, solo eliminarla o clonarla para crear un nuevo registro.
                                    </p>
                                    <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-xl border border-zinc-200 dark:border-zinc-700/50 mb-5">
                                        <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest block mb-2">
                                            Para confirmar, escriba <strong className="text-amber-600 dark:text-amber-400 select-all">{cancellingSurgery.patientPii?.dni || 'SUSPENDER'}</strong>
                                        </label>
                                        <input
                                            type="text"
                                            value={cancelConfirmText}
                                            onChange={(e) => setCancelConfirmText(e.target.value)}
                                            placeholder="Escribir confirmación aquí..."
                                            className="w-full px-4 py-2 border border-zinc-200 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all text-sm font-medium"
                                        />
                                    </div>
                                </div>
                                <div className="px-6 py-4 bg-zinc-50/50 dark:bg-zinc-900/50 border-t border-zinc-100 dark:border-zinc-800 flex justify-end gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setCancellingSurgery(null)}
                                        className="px-5 py-2.5 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white font-semibold transition-colors text-sm"
                                    >
                                        Cancelar
                                    </button>
                                    <form action={handleStatusUpdate} onSubmit={() => setCancellingSurgery(null)}>
                                        <input type="hidden" name="id" value={cancellingSurgery.surgery.id} />
                                        <input type="hidden" name="status" value="cancelled" />
                                        <button
                                            type="submit"
                                            disabled={cancelConfirmText !== (cancellingSurgery.patientPii?.dni || 'SUSPENDER')}
                                            className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:hover:bg-amber-500 text-white font-bold rounded-xl transition-all shadow-sm text-sm flex items-center gap-2"
                                        >
                                            Confirmar Suspensión
                                        </button>
                                    </form>
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
