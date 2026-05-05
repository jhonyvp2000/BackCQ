"use client";

import { useState, useEffect } from "react";
import { LayoutGrid, List as ListIcon, Calendar, ArrowUp, ArrowDown, User, Clock, Hourglass, CheckCircle2, XCircle, FileText, Activity, AlertCircle, Pencil, CopyPlus, AlertTriangle, X, Filter, Search } from "lucide-react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { StartSurgeryButton } from "./start-surgery-button";
import { DeleteSurgeryButton } from "./delete-button";
import { updateSurgeryStatus } from "@/app/actions/cirugias";
import { SurgeryTimeline } from "@/components/ui/surgery-timeline";
import { AnimatePresence, motion } from "framer-motion";
import { EditSurgeryModal } from "./edit-surgery-modal";
import { PhaseTransitionModal } from "./phase-transition-modal";

function getFormattedDate(dateValue: Date | string | null | undefined, isTimeDefined: boolean = true): React.ReactNode {
    if (!dateValue) return 'Fecha no definida';
    const date = typeof dateValue === 'string' ? new Date(dateValue) : dateValue;
    if (isNaN(date.getTime())) return 'Fecha inválida';

    if (isTimeDefined === false) {
        const datePart = new Intl.DateTimeFormat('es-PE', {
            timeZone: 'America/Lima',
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        }).format(date);
        return (
            <span className="flex items-center gap-1.5">
                {datePart}
                <span className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase shadow-sm">Por definir</span>
            </span>
        );
    }

    return new Intl.DateTimeFormat('es-PE', {
        timeZone: 'America/Lima',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(date);
}

function formatDateOnly(dateValue: Date | string | null | undefined): string {
    if (!dateValue) return 'N/A';
    const date = typeof dateValue === 'string' ? new Date(dateValue) : dateValue;
    if (isNaN(date.getTime())) return 'Inválida';
    return new Intl.DateTimeFormat('es-PE', { timeZone: 'America/Lima', day: '2-digit', month: 'short', year: 'numeric' }).format(date);
}

function formatTimeOnly(dateValue: Date | string | null | undefined): string {
    if (!dateValue) return 'N/A';
    const date = typeof dateValue === 'string' ? new Date(dateValue) : dateValue;
    if (isNaN(date.getTime())) return 'Inválida';
    return new Intl.DateTimeFormat('es-PE', { timeZone: 'America/Lima', hour: '2-digit', minute: '2-digit' }).format(date);
}

function formatForDateTimeLocal(dateValue: Date | string | null | undefined): string {
    if (!dateValue) return '';
    const date = typeof dateValue === 'string' ? new Date(dateValue) : dateValue;
    if (isNaN(date.getTime())) return '';
    
    // Adjust to Lima timezone for consistency
    const limaDate = new Date(date.toLocaleString('en-US', { timeZone: 'America/Lima' }));
    
    const year = limaDate.getFullYear();
    const month = String(limaDate.getMonth() + 1).padStart(2, '0');
    const day = String(limaDate.getDate()).padStart(2, '0');
    const hours = String(limaDate.getHours()).padStart(2, '0');
    const minutes = String(limaDate.getMinutes()).padStart(2, '0');

    return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export const formatPatientDemographics = (patientPii: any, patient: any) => {
    const fullName = `${patientPii?.nombres || ''} ${patientPii?.apellidos || ''}`.trim();
    if (!fullName || fullName === 'Desconocido') return 'Desconocido';

    let sexStr = '?';
    if (patient?.sexo) {
        if (patient.sexo.toUpperCase().startsWith('F')) sexStr = 'F';
        else if (patient.sexo.toUpperCase().startsWith('M')) sexStr = 'M';
        else sexStr = patient.sexo.substring(0, 1).toUpperCase();
    }

    let ageStr = '?';
    if (patient?.fechaNacimiento) {
        const diff_ms = Date.now() - new Date(patient.fechaNacimiento).getTime();
        const age = Math.abs(new Date(diff_ms).getUTCFullYear() - 1970);
        ageStr = String(age).padStart(2, '0');
    }

    const hcStr = patientPii?.historiaClinica || '?';
    const combined = `${fullName} (${sexStr} ${ageStr} HC: ${hcStr})`;

    return combined.length > 70 ? combined.substring(0, 70) + '...' : combined;
};

export function SurgeryViewToggle({ surgeriesData, salas, sortParams, specialties, staff, permissions = [], diagnoses = [], procedures = [], interventions = [], patients = [] }: { surgeriesData: any[], salas: any[], sortParams: any, specialties?: any[], staff?: any, permissions?: string[], diagnoses?: any[], procedures?: any[], interventions?: any[], patients?: any[] }) {
    const canEdit = permissions.includes('editar:programacion');
    const canCancel = permissions.includes('cancelar:programacion');
    const canAdvancePhase = permissions.includes('avanzar_fase:programacion');
    const canDuplicate = permissions.includes('duplicar:programacion');
    const canDelete = permissions.includes('eliminar:programacion');
    const canViewReport = permissions.includes('ver:reporte_operatorio');
    const router = useRouter();
    const [viewMode, setViewMode] = useState<'list' | 'timeline'>('list');
    const [editingSurgery, setEditingSurgery] = useState<any>(null);
    const [cancellingSurgery, setCancellingSurgery] = useState<any>(null);
    const [cancelConfirmText, setCancelConfirmText] = useState<string>("");
    const [errorModalMsg, setErrorModalMsg] = useState<string>("");
    const [transitionModal, setTransitionModal] = useState<{ isOpen: boolean, surgeryId: string, targetPhase: string, patientName: string, initialTime?: string, urgencyType?: string }>({ isOpen: false, surgeryId: '', targetPhase: '', patientName: '' });
    const currentSort = sortParams?.sort === 'asc' ? 'asc' : 'desc';

    // Auto-Refresh Polling Effect (Realtime UX)
    // Refreshes the server-injected props every 60 seconds to detect updates made by other users,
    // ensuring the Timeline Canvas and List are always up to date automatically.
    // Local modifications already trigger instant refreshes via `revalidatePath` in Server Actions.
    useEffect(() => {
        const interval = setInterval(() => {
            router.refresh();
        }, 60000);
        return () => clearInterval(interval);
    }, [router]);

    // Estados para Filtros de Lista
    const [filterDate, setFilterDate] = useState<string>("");
    const [filterPatient, setFilterPatient] = useState<string>("");
    const [filterRoom, setFilterRoom] = useState<string[]>([]);
    const [filterStatus, setFilterStatus] = useState<string[]>([]);
    const [isFilterOpen, setIsFilterOpen] = useState<boolean>(false);

    // Filtros Universales (Paciente y Estado)
    const baseFilteredSurgeries = surgeriesData.filter(s => {
        if (filterPatient.trim() !== "") {
            const searchTerms = filterPatient.toLowerCase();
            const fullName = `${s.patient?.name || ''} ${s.patientPii?.nombres || ''} ${s.patientPii?.apellidos || ''}`.toLowerCase();
            const dni = `${s.patientPii?.dni || ''}`.toLowerCase();
            if (!fullName.includes(searchTerms) && !dni.includes(searchTerms)) return false;
        }

        if (filterStatus.length > 0) {
            let statusMatches = false;
            
            for (const fs of filterStatus) {
                const isMissingData = (s: any) => {
                    return (
                        !s.surgery.patientId ||
                        !s.diagnoses || s.diagnoses.length === 0 ||
                        !s.interventions || s.interventions.length === 0 ||
                        !s.surgery.surgeryType || s.surgery.surgeryType.trim() === '' ||
                        !s.surgery.urgencyType || s.surgery.urgencyType.trim() === '' ||
                        !s.surgery.specialtyId ||
                        !s.surgery.origin || s.surgery.origin.trim() === '' ||
                        !s.surgery.requestDate ||
                        !s.surgery.scheduledDate ||
                        !s.surgery.operatingRoomId ||
                        !s.surgery.estimatedDuration || s.surgery.estimatedDuration.trim() === '' ||
                        !s.team ||
                        !s.team.some((t: any) => t.role === 'ANESTESIOLOGO') ||
                        !s.team.some((t: any) => t.role === 'ENFERMERO') ||
                        !s.surgery.anesthesiaType || s.surgery.anesthesiaType.trim() === ''
                    );
                };

                if (fs === 'completed_incomplete') {
                    if (s.surgery.status === 'completed' && isMissingData(s)) {
                        statusMatches = true;
                        break;
                    }
                } else if (fs === 'completed') {
                    if (s.surgery.status === 'completed' && !isMissingData(s)) {
                        statusMatches = true;
                        break;
                    }
                } else {
                    if (s.surgery.status === fs) {
                        statusMatches = true;
                        break;
                    }
                }
            }

            if (!statusMatches) return false;
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

        if (filterRoom.length > 0 && (!s.operatingRoom?.id || !filterRoom.includes(s.operatingRoom.id))) {
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
        } else {
            router.refresh();
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
                        {(filterDate || filterPatient || filterRoom.length > 0 || filterStatus.length > 0) && (
                            <button
                                onClick={() => { setFilterDate(''); setFilterPatient(''); setFilterRoom([]); setFilterStatus([]); }}
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
                                <div className="flex items-center gap-2">
                                    <div className="relative group flex-1">
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
                                    <button
                                        type="button"
                                        onClick={() => setFilterDate('')}
                                        className="shrink-0 bg-zinc-100 dark:bg-zinc-800 hover:bg-red-100 hover:text-red-600 text-zinc-500 border border-zinc-200 dark:border-zinc-700 p-[9px] rounded-xl transition-colors shadow-sm"
                                        title="Limpiar fecha del filtro"
                                    >
                                        <X size={16} strokeWidth={2.5} />
                                    </button>
                                </div>

                                {/* Selector Múltiple de Quirófano */}
                                <div className="relative group/room-select z-50">
                                    <div className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm font-medium text-zinc-800 dark:text-zinc-200 cursor-pointer flex justify-between items-center transition-all bg-white dark:bg-zinc-900 group-hover/room-select:border-blue-500/50">
                                        <span className="truncate pr-2">
                                            {filterRoom.length === 0 
                                                ? "Todas las Salas" 
                                                : filterRoom.length === 1
                                                    ? (salas.find(s => s.id === filterRoom[0])?.name || filterRoom[0])
                                                    : `${filterRoom.length} Salas Seleccionadas`}
                                        </span>
                                        <svg className="w-4 h-4 text-zinc-400 group-hover/room-select:text-[var(--color-hospital-blue)] transition-colors flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                    </div>
                                    <div className="absolute top-[calc(100%-8px)] left-0 w-full pt-3 opacity-0 invisible group-hover/room-select:opacity-100 group-hover/room-select:visible transition-all duration-200 z-50">
                                        <div className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-xl flex flex-col overflow-hidden ring-1 ring-black/5 dark:ring-white/10">
                                            <div className="p-2 border-b border-zinc-100 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/80">
                                                <div className="flex items-center justify-between px-1">
                                                    <button type="button" onClick={() => setFilterRoom(salas.map(s => s.id))} className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline mb-0.5 mt-0.5">SEL. TODAS</button>
                                                    <button type="button" onClick={() => setFilterRoom([])} className="text-[11px] font-bold text-zinc-500 hover:text-red-500 hover:underline mb-0.5 mt-0.5">NINGUNA</button>
                                                </div>
                                            </div>
                                            <div className="overflow-y-auto p-1.5 flex flex-col custom-scrollbar max-h-[250px]">
                                                {salas.map(s => (
                                                    <label key={s.id} className="flex items-center gap-3 px-2 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-700/50 rounded-lg cursor-pointer transition-colors group/label border-b border-zinc-100/50 last:border-0 dark:border-zinc-700/30">
                                                        <input 
                                                            type="checkbox" 
                                                            className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-600 text-[var(--color-hospital-blue)] focus:ring-[var(--color-hospital-blue)] bg-white dark:bg-zinc-900 cursor-pointer"
                                                            checked={filterRoom.includes(s.id)}
                                                            onChange={(e) => {
                                                                if (e.target.checked) {
                                                                    setFilterRoom([...filterRoom, s.id]);
                                                                } else {
                                                                    setFilterRoom(filterRoom.filter(id => id !== s.id));
                                                                }
                                                            }}
                                                        />
                                                        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300 group-hover/label:text-zinc-900 dark:group-hover/label:text-white select-none whitespace-normal leading-tight">{s.name}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Selector Múltiple de Estado */}
                                <div className="relative group/status-select z-40">
                                    <div className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm font-medium text-zinc-800 dark:text-zinc-200 cursor-pointer flex justify-between items-center transition-all bg-white dark:bg-zinc-900 group-hover/status-select:border-blue-500/50">
                                        <span className="truncate pr-2">
                                            {filterStatus.length === 0 
                                                ? "Cualquier Estado" 
                                                : filterStatus.length === 1
                                                    ? [
                                                        { id: 'scheduled', name: 'Programadas' },
                                                        { id: 'in_progress', name: 'En Quirófano' },
                                                        { id: 'anesthesia_start', name: 'Anestesia Iniciada' },
                                                        { id: 'pre_incision', name: 'Pre-Incisión' },
                                                        { id: 'surgery_end', name: 'Término Cirugía' },
                                                        { id: 'patient_exit', name: 'Salida Paciente' },
                                                        { id: 'urpa_exit', name: 'Salida URPA' },
                                                        { id: 'completed', name: 'Finalizadas' },
                                                        { id: 'completed_incomplete', name: 'Finalizadas (Incompletas)' },
                                                        { id: 'cancelled', name: 'Suspendidas' }
                                                      ].find(s => s.id === filterStatus[0])?.name || filterStatus[0]
                                                    : `${filterStatus.length} Estados Selecc.`}
                                        </span>
                                        <svg className="w-4 h-4 text-zinc-400 group-hover/status-select:text-[var(--color-hospital-blue)] transition-colors flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                    </div>
                                    <div className="absolute top-[calc(100%-8px)] left-0 w-full pt-3 opacity-0 invisible group-hover/status-select:opacity-100 group-hover/status-select:visible transition-all duration-200 z-50">
                                        <div className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-xl flex flex-col overflow-hidden ring-1 ring-black/5 dark:ring-white/10">
                                            <div className="p-2 border-b border-zinc-100 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/80">
                                                <div className="flex items-center justify-between px-1">
                                                    <button type="button" onClick={() => setFilterStatus(['scheduled','in_progress','anesthesia_start','pre_incision','surgery_end','patient_exit','urpa_exit','completed','completed_incomplete','cancelled'])} className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline mb-0.5 mt-0.5">SEL. TODOS</button>
                                                    <button type="button" onClick={() => setFilterStatus([])} className="text-[11px] font-bold text-zinc-500 hover:text-red-500 hover:underline mb-0.5 mt-0.5">NINGUNO</button>
                                                </div>
                                            </div>
                                            <div className="overflow-y-auto p-1.5 flex flex-col custom-scrollbar max-h-[250px]">
                                                {[
                                                    { id: 'scheduled', name: 'Programadas' },
                                                    { id: 'in_progress', name: 'En Quirófano' },
                                                    { id: 'anesthesia_start', name: 'Anestesia Iniciada' },
                                                    { id: 'pre_incision', name: 'Pre-Incisión' },
                                                    { id: 'surgery_end', name: 'Término Cirugía' },
                                                    { id: 'patient_exit', name: 'Salida Paciente' },
                                                    { id: 'urpa_exit', name: 'Salida URPA' },
                                                    { id: 'completed', name: 'Finalizadas' },
                                                    { id: 'completed_incomplete', name: 'Finalizadas (Datos Incompletos)' },
                                                    { id: 'cancelled', name: 'Suspendidas' }
                                                ].map(s => (
                                                    <label key={s.id} className="flex items-center gap-3 px-2 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-700/50 rounded-lg cursor-pointer transition-colors group/label border-b border-zinc-100/50 last:border-0 dark:border-zinc-700/30">
                                                        <input 
                                                            type="checkbox" 
                                                            className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-600 text-[var(--color-hospital-blue)] focus:ring-[var(--color-hospital-blue)] bg-white dark:bg-zinc-900 cursor-pointer"
                                                            checked={filterStatus.includes(s.id)}
                                                            onChange={(e) => {
                                                                if (e.target.checked) {
                                                                    setFilterStatus([...filterStatus, s.id]);
                                                                } else {
                                                                    setFilterStatus(filterStatus.filter(id => id !== s.id));
                                                                }
                                                            }}
                                                        />
                                                        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300 group-hover/label:text-zinc-900 dark:group-hover/label:text-white select-none whitespace-normal leading-tight">{s.name}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
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
                            <SurgeryTimeline surgeriesData={baseFilteredSurgeries} salas={filterRoom.length === 0 ? salas : salas.filter(s => filterRoom.includes(s.id))} displayDate={filterDate} setDisplayDate={setFilterDate} diagnoses={diagnoses} procedures={procedures} interventions={interventions} />
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
                                                <th scope="col" className="px-3 py-4 text-xs font-bold text-zinc-500 uppercase tracking-widest min-w-[40px]">N°</th>
                                                <th scope="col" className="px-3 py-4 text-xs font-bold text-zinc-500 uppercase tracking-widest min-w-[180px]">
                                                    Paciente
                                                    <Link href={`?sort=${currentSort === 'asc' ? 'desc' : 'asc'}`} className="inline-flex items-center ml-2 p-1 rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors tooltip" title={`Ordenar cronológicamente (${currentSort === 'asc' ? 'Z-A' : 'A-Z'})`}>
                                                        {currentSort === 'asc' ? <ArrowUp size={12} className="text-[var(--color-hospital-blue)]" /> : <ArrowDown size={12} className="text-[var(--color-hospital-blue)]" />}
                                                    </Link>
                                                </th>
                                                <th scope="col" className="px-3 py-4 text-xs font-bold text-zinc-500 uppercase tracking-widest min-w-[100px]">Especialidad</th>
                                                <th scope="col" className="px-3 py-4 text-xs font-bold text-zinc-500 uppercase tracking-widest min-w-[180px]">Diagnóstico / Intervención</th>
                                                <th scope="col" className="px-3 py-4 text-xs font-bold text-zinc-500 uppercase tracking-widest min-w-[90px]">F. Solicitud</th>
                                                <th scope="col" className="px-3 py-4 text-xs font-bold text-zinc-500 uppercase tracking-widest min-w-[90px]">F. Prog.</th>
                                                <th scope="col" className="px-3 py-4 text-xs font-bold text-zinc-500 uppercase tracking-widest min-w-[70px]">Hora</th>
                                                <th scope="col" className="px-3 py-4 text-xs font-bold text-zinc-500 uppercase tracking-widest min-w-[70px]">Duración</th>
                                                <th scope="col" className="px-3 py-4 text-xs font-bold text-zinc-500 uppercase tracking-widest min-w-[100px]">Quirófano</th>
                                                <th scope="col" className="px-3 py-4 text-xs font-bold text-zinc-500 uppercase tracking-widest min-w-[100px]">Tipo / Urg.</th>
                                                <th scope="col" className="px-3 py-4 text-xs font-bold text-zinc-500 uppercase tracking-widest min-w-[70px]">Seguro</th>
                                                <th scope="col" className="px-3 py-4 text-xs font-bold text-zinc-500 uppercase tracking-widest min-w-[100px]">Equipo</th>
                                                <th scope="col" className="px-3 py-4 text-xs font-bold text-zinc-500 uppercase tracking-widest min-w-[100px]">Estado</th>
                                                <th scope="col" className="px-3 py-4 pl-4 text-right text-xs font-bold text-zinc-500 uppercase tracking-widest min-w-[100px]">Gestión</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white dark:bg-zinc-900 divide-y divide-zinc-100 dark:divide-zinc-800/50">
                                            {filteredSurgeries.map((row, index) => (
                                                <tr key={row.surgery.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/50 transition-all duration-300 group text-sm">
                                                    <td className="px-3 py-3 whitespace-nowrap text-zinc-500 font-medium align-middle">
                                                        {index + 1}
                                                    </td>
                                                    <td className="px-3 py-3 align-middle">
                                                        <div className="font-bold text-zinc-900 dark:text-white truncate max-w-[180px]" title={row.patientPii?.nombres ? `${row.patientPii.nombres} ${row.patientPii.apellidos}` : 'Desconocido'}>
                                                            {row.patientPii?.nombres && row.patientPii.nombres !== 'Desconocido' ? `${row.patientPii?.apellidos?.split(' ')[0]}, ${row.patientPii?.nombres?.split(' ')[0]}` : 'Desconocido'}
                                                        </div>
                                                        <div className="text-xs text-zinc-500 font-mono tracking-tight mt-0.5">
                                                            {row.patientPii?.dni || row.patientPii?.carnetExtranjeria || row.patientPii?.pasaporte || 'S/Doc'}
                                                        </div>
                                                    </td>
                                                    <td className="px-3 py-3 align-middle">
                                                        <div className="text-xs text-zinc-600 dark:text-zinc-400 font-medium truncate max-w-[100px]" title={row.specialty?.name || ''}>
                                                            {row.specialty?.name || '-'}
                                                        </div>
                                                    </td>
                                                    <td className="px-3 py-3 align-middle min-w-[180px]">
                                                        <div className="flex flex-col gap-1 max-w-[180px]">
                                                            {row.diagnoses && row.diagnoses.length > 0 && typeof diagnoses !== 'undefined' ? (
                                                                <div className="text-[11px] text-blue-700 dark:text-blue-400 font-semibold truncate" title={diagnoses.find(dx => dx.id === row.diagnoses[0])?.name}>
                                                                    <span className="opacity-80">Dx:</span> {diagnoses.find(dx => dx.id === row.diagnoses[0])?.code || row.diagnoses[0]} {row.diagnoses.length > 1 ? `(+${row.diagnoses.length - 1})` : ''}
                                                                </div>
                                                            ) : row.surgery.diagnosis ? (
                                                                <div className="text-[11px] text-blue-700 dark:text-blue-400 font-semibold truncate" title={row.surgery.diagnosis}>
                                                                    <span className="opacity-80">Dx:</span> {row.surgery.diagnosis}
                                                                </div>
                                                            ) : null}
                                                            {row.interventions && row.interventions.length > 0 && typeof interventions !== 'undefined' && (
                                                                <div className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium truncate" title={interventions.find(int => int.id === row.interventions[0])?.name}>
                                                                    <span className="opacity-80 font-bold">In:</span> {interventions.find(int => int.id === row.interventions[0])?.name || row.interventions[0]} {row.interventions.length > 1 ? `(+${row.interventions.length - 1})` : ''}
                                                                </div>
                                                            )}
                                                            {row.surgery.notes && (
                                                                <div className="text-[10px] text-zinc-400 truncate max-w-[180px] font-medium" title={row.surgery.notes}>
                                                                    <span className="text-zinc-300 mr-1">↳</span> {row.surgery.notes}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-3 py-3 whitespace-nowrap align-middle">
                                                        <div className="text-[11px] text-zinc-600 dark:text-zinc-400 font-medium tracking-tight">
                                                            {formatDateOnly(row.surgery.requestDate)}
                                                        </div>
                                                    </td>
                                                    <td className="px-3 py-3 whitespace-nowrap align-middle">
                                                        <div className="text-[11px] text-blue-700 dark:text-blue-400 font-semibold tracking-tight">
                                                            {formatDateOnly(row.surgery.scheduledDate)}
                                                        </div>
                                                    </td>
                                                    <td className="px-3 py-3 whitespace-nowrap align-middle">
                                                        <div className="text-[11px] font-bold text-amber-700 dark:text-amber-400">
                                                            {row.surgery.isTimeDefined ? formatTimeOnly(row.surgery.scheduledDate) : 'TBD'}
                                                        </div>
                                                    </td>
                                                    <td className="px-3 py-3 whitespace-nowrap align-middle">
                                                        <div className="text-[11px] text-zinc-600 dark:text-zinc-400">
                                                            {row.surgery.estimatedDuration || '-'}
                                                        </div>
                                                    </td>
                                                    <td className="px-3 py-3 whitespace-nowrap align-middle">
                                                        <div className="inline-flex items-center text-xs font-semibold">
                                                            <div className={`w-1.5 h-1.5 rounded-full mr-1.5 ${row.operatingRoom?.name ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                                                            <span className="truncate max-w-[100px]" title={row.operatingRoom?.name || 'S/A'}>
                                                                {row.operatingRoom?.name || 'S/A'}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-3 py-3 whitespace-nowrap align-middle">
                                                        <div className="flex flex-col gap-1 items-start">
                                                            {row.surgery.surgeryType && (
                                                                <div className={`text-[9px] inline-block px-1.5 py-0.5 rounded border font-bold uppercase text-center ${row.surgery.surgeryType === 'Cirugía Mayor' ? 'bg-red-50 text-red-600 border-red-200' : 'bg-emerald-50 text-emerald-600 border-emerald-200'}`}>
                                                                    {row.surgery.surgeryType.replace('Cirugía ', 'C. ')}
                                                                </div>
                                                            )}
                                                            {row.surgery.urgencyType && (
                                                                <div className={`text-[9px] inline-block px-1.5 py-0.5 rounded border font-bold uppercase text-center ${row.surgery.urgencyType === 'EMERGENCIA' ? 'bg-rose-50 text-rose-600 border-rose-200 animate-pulse' : 'bg-blue-50 text-blue-600 border-blue-200'}`}>
                                                                    {row.surgery.urgencyType}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-3 py-3 whitespace-nowrap align-middle">
                                                        {row.surgery.insuranceType && (
                                                            <div className="text-[9px] inline-block px-1.5 py-0.5 rounded border font-bold uppercase bg-purple-50 text-purple-700 border-purple-200 text-center">
                                                                {row.surgery.insuranceType}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-3 py-3 align-middle">
                                                        {row.team && row.team.length > 0 ? (
                                                            <div className="flex flex-col gap-0.5 text-[10px] leading-tight">
                                                                {row.team.slice(0,2).map((t: any) => (
                                                                    <div key={`${row.surgery.id}-${t.staff.id}`} className="truncate max-w-[120px]" title={`${t.role}: ${t.staff.name} ${t.staff.lastname}`}>
                                                                        <span className={`font-bold mr-1 ${t.role === 'CIRUJANO' ? 'text-blue-700 dark:text-blue-400' : t.role === 'ANESTESIOLOGO' ? 'text-emerald-700 dark:text-emerald-400' : 'text-sky-700 dark:text-sky-400'}`}>
                                                                            {t.role === 'CIRUJANO' ? 'Cx:' : t.role === 'ANESTESIOLOGO' ? 'An:' : 'CI:'}
                                                                        </span>
                                                                        <span className="text-zinc-700 dark:text-zinc-300">
                                                                            {t.staff.name?.split(' ')[0]} {t.staff.lastname?.split(' ')[0]}
                                                                        </span>
                                                                    </div>
                                                                ))}
                                                                {row.team.length > 2 && <div className="text-zinc-400 italic text-[9px] mt-0.5">+{row.team.length - 2} más</div>}
                                                            </div>
                                                        ) : <span className="text-xs text-zinc-400">-</span>}
                                                    </td>
                                                    <td className="px-3 py-3 whitespace-nowrap align-middle">
                                                        <div className="scale-90 origin-left">
                                                            {getStatusBadge(row.surgery.status)}
                                                        </div>
                                                    </td>
                                                    <td className="px-3 py-3 whitespace-nowrap text-right align-middle">
                                                        <div className="flex justify-end gap-2 items-center opacity-70 group-hover:opacity-100 transition-opacity duration-300">
                                                            {/* Flujo de Estados con Modal de Tiempo */}
                                                            {row.surgery.status === 'scheduled' && canAdvancePhase && (
                                                                <button
                                                                    onClick={() => {
                                                                        setTransitionModal({
                                                                            isOpen: true,
                                                                            surgeryId: row.surgery.id,
                                                                            targetPhase: 'in_progress',
                                                                            patientName: `${row.patientPii?.nombres || ''} ${row.patientPii?.apellidos || ''}`.trim() || 'Desconocido',
                                                                            urgencyType: row.surgery.urgencyType || 'ELECTIVO'
                                                                        });
                                                                    }}
                                                                    className="text-amber-700 hover:text-white hover:bg-amber-600 bg-amber-50 dark:bg-amber-900/20 px-4 py-2 rounded-xl transition-all duration-300 border border-amber-200 hover:scale-[1.02] text-xs font-bold shadow-sm"
                                                                >
                                                                    Ingreso a Quirófano
                                                                </button>
                                                            )}

                                                            {row.surgery.status === 'in_progress' && canAdvancePhase && (
                                                                <button
                                                                    onClick={() => setTransitionModal({ 
                                                                        isOpen: true, 
                                                                        surgeryId: row.surgery.id, 
                                                                        targetPhase: 'anesthesia_start', 
                                                                        patientName: `${row.patientPii?.nombres || ''} ${row.patientPii?.apellidos || ''}`,
                                                                        initialTime: formatForDateTimeLocal(row.surgery.actualStartTime),
                                                                        urgencyType: row.surgery.urgencyType || 'ELECTIVO'
                                                                    })}
                                                                    className="text-purple-700 hover:text-white hover:bg-purple-600 bg-purple-50 dark:bg-purple-900/20 px-3 py-1.5 rounded-lg transition-all text-xs font-bold shadow-sm whitespace-nowrap border border-purple-200/50"
                                                                >
                                                                    Inic. Anestesia &rarr;
                                                                </button>
                                                            )}

                                                            {row.surgery.status === 'anesthesia_start' && canAdvancePhase && (
                                                                <button
                                                                    onClick={() => setTransitionModal({ 
                                                                        isOpen: true, 
                                                                        surgeryId: row.surgery.id, 
                                                                        targetPhase: 'pre_incision', 
                                                                        patientName: `${row.patientPii?.nombres || ''} ${row.patientPii?.apellidos || ''}`,
                                                                        initialTime: formatForDateTimeLocal(row.surgery.anesthesiaStartTime),
                                                                        urgencyType: row.surgery.urgencyType || 'ELECTIVO'
                                                                    })}
                                                                    className="text-rose-700 hover:text-white hover:bg-rose-600 bg-rose-50 dark:bg-rose-900/20 px-3 py-1.5 rounded-lg transition-all text-xs font-bold shadow-sm whitespace-nowrap border border-rose-200/50"
                                                                >
                                                                    Antes Incisión &rarr;
                                                                </button>
                                                            )}

                                                            {row.surgery.status === 'pre_incision' && canAdvancePhase && (
                                                                <button
                                                                    onClick={() => setTransitionModal({ 
                                                                        isOpen: true, 
                                                                        surgeryId: row.surgery.id, 
                                                                        targetPhase: 'surgery_end', 
                                                                        patientName: `${row.patientPii?.nombres || ''} ${row.patientPii?.apellidos || ''}`,
                                                                        initialTime: formatForDateTimeLocal(row.surgery.preIncisionTime),
                                                                        urgencyType: row.surgery.urgencyType || 'ELECTIVO'
                                                                    })}
                                                                    className="text-cyan-700 hover:text-white hover:bg-cyan-600 bg-cyan-50 dark:bg-cyan-900/20 px-3 py-1.5 rounded-lg transition-all text-xs font-bold shadow-sm whitespace-nowrap border border-cyan-200/50"
                                                                >
                                                                    Término Cirugía &rarr;
                                                                </button>
                                                            )}

                                                            {row.surgery.status === 'surgery_end' && canAdvancePhase && (
                                                                <button
                                                                    onClick={() => setTransitionModal({ 
                                                                        isOpen: true, 
                                                                        surgeryId: row.surgery.id, 
                                                                        targetPhase: 'patient_exit', 
                                                                        patientName: `${row.patientPii?.nombres || ''} ${row.patientPii?.apellidos || ''}`,
                                                                        initialTime: formatForDateTimeLocal(row.surgery.surgeryEndTime),
                                                                        urgencyType: row.surgery.urgencyType || 'ELECTIVO'
                                                                    })}
                                                                    className="text-orange-700 hover:text-white hover:bg-orange-600 bg-orange-50 dark:bg-orange-900/20 px-3 py-1.5 rounded-lg transition-all text-xs font-bold shadow-sm whitespace-nowrap border border-orange-200/50"
                                                                >
                                                                    Salida Paciente &rarr;
                                                                </button>
                                                            )}

                                                            {row.surgery.status === 'patient_exit' && canAdvancePhase && (
                                                                <div className="flex gap-1.5 items-center">
                                                                    <button
                                                                        onClick={() => setTransitionModal({ 
                                                                            isOpen: true, 
                                                                            surgeryId: row.surgery.id, 
                                                                            targetPhase: 'urpa_exit', 
                                                                            patientName: `${row.patientPii?.nombres || ''} ${row.patientPii?.apellidos || ''}`,
                                                                            initialTime: formatForDateTimeLocal(row.surgery.patientExitTime),
                                                                            urgencyType: row.surgery.urgencyType || 'ELECTIVO'
                                                                        })}
                                                                        className="text-indigo-700 hover:text-white hover:bg-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 px-2.5 py-1.5 rounded-lg transition-all text-[11px] font-bold shadow-sm whitespace-nowrap border border-indigo-200/50"
                                                                    >
                                                                        Pase URPA &rarr;
                                                                    </button>
                                                                    <button
                                                                        onClick={() => setTransitionModal({ 
                                                                            isOpen: true, 
                                                                            surgeryId: row.surgery.id, 
                                                                            targetPhase: 'completed', 
                                                                            patientName: `${row.patientPii?.nombres || ''} ${row.patientPii?.apellidos || ''}`,
                                                                            initialTime: formatForDateTimeLocal(row.surgery.patientExitTime),
                                                                            urgencyType: row.surgery.urgencyType || 'ELECTIVO'
                                                                        })}
                                                                        className="text-emerald-700 hover:text-white hover:bg-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1.5 rounded-lg transition-all text-xs font-bold shadow-sm whitespace-nowrap flex items-center gap-1 border border-emerald-200/50"
                                                                    >
                                                                        <CheckCircle2 size={13} /> Alta
                                                                    </button>
                                                                </div>
                                                            )}

                                                            {row.surgery.status === 'urpa_exit' && canAdvancePhase && (
                                                                <button
                                                                    onClick={() => setTransitionModal({ 
                                                                        isOpen: true, 
                                                                        surgeryId: row.surgery.id, 
                                                                        targetPhase: 'completed', 
                                                                        patientName: `${row.patientPii?.nombres || ''} ${row.patientPii?.apellidos || ''}`,
                                                                        initialTime: formatForDateTimeLocal(row.surgery.urpaExitTime),
                                                                        urgencyType: row.surgery.urgencyType || 'ELECTIVO'
                                                                    })}
                                                                    className="text-emerald-700 hover:text-white hover:bg-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-4 py-2 rounded-xl transition-all duration-300 border border-emerald-200 hover:scale-[1.02] text-xs font-bold shadow-sm flex items-center gap-1.5 whitespace-nowrap"
                                                                >
                                                                    <CheckCircle2 size={14} /> Finalizar
                                                                </button>
                                                            )}

                                                            {row.surgery.status === 'scheduled' && canCancel && (
                                                                <button type="button" onClick={() => { setCancellingSurgery(row); setCancelConfirmText(""); }} className="text-zinc-400 hover:text-amber-600 hover:bg-amber-50 p-2.5 rounded-xl transition-all" title="Suspender Evento">
                                                                    <XCircle size={18} />
                                                                </button>
                                                            )}

                                                            {specialties && staff && canEdit && (
                                                                <button onClick={() => setEditingSurgery(row)} className="text-zinc-400 hover:text-blue-600 hover:bg-blue-50 p-2.5 rounded-xl transition-all" title="Editar Programación">
                                                                    <Pencil size={18} />
                                                                </button>
                                                            )}

                                                            {row.surgery.status === 'cancelled' && canDuplicate && (
                                                                <button onClick={() => window.dispatchEvent(new CustomEvent('CLONE_SURGERY', { detail: row }))} className="text-zinc-400 hover:text-[var(--color-hospital-blue)] hover:bg-blue-50 p-2.5 rounded-xl transition-all inline-block ml-1" title="Duplicar / Re-Agendar Cirugía">
                                                                    <CopyPlus size={18} />
                                                                </button>
                                                            )}

                                                            {row.surgery.status === 'completed' && canViewReport && (
                                                                <Link href={`/dashboard/programaciones/${row.surgery.id}/reporte`} className="inline-flex items-center text-zinc-500 hover:text-[var(--color-hospital-blue)] hover:bg-blue-50 p-2.5 rounded-xl transition-all tooltip bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700" title="Ver Reporte Operatorio">
                                                                    <FileText size={18} />
                                                                </Link>
                                                            )}

                                                            {/* Modal Seguro de Eliminación */}
                                                            {['scheduled'].includes(row.surgery.status) && canDelete && (
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
                    initialData={editingSurgery}
                    salas={salas}
                    specialties={specialties || []}
                    staff={staff}
                    diagnoses={diagnoses}
                    procedures={procedures}
                    interventions={interventions}
                    patients={patients}
                />
            )}

            <PhaseTransitionModal
                isOpen={transitionModal.isOpen}
                onClose={() => setTransitionModal({ ...transitionModal, isOpen: false })}
                surgeryId={transitionModal.surgeryId}
                targetPhase={transitionModal.targetPhase}
                patientName={transitionModal.patientName}
                initialTime={transitionModal.initialTime}
                urgencyType={transitionModal.urgencyType}
                onSuccess={(nextPhase) => {
                    if (!nextPhase) {
                        setTransitionModal({ ...transitionModal, isOpen: false });
                    }
                    router.refresh();
                }}
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
                                <div className="absolute top-0 left-0 w-full h-1.5 bg-amber-500"></div>
                                <div className="p-6 pt-8 text-center sm:text-left flex flex-col sm:flex-row gap-5 items-center sm:items-start">
                                    <div className="w-12 h-12 rounded-full bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center shrink-0">
                                        <AlertTriangle size={24} className="text-amber-500" />
                                    </div>
                                    <div className="flex-1 mt-1">
                                        <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-2">
                                            Aviso de Validación
                                        </h3>
                                        <p className="text-[13px] text-zinc-600 dark:text-zinc-400 font-medium whitespace-pre-wrap leading-relaxed">
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
