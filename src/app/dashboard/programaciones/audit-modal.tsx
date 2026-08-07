"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Search, CheckCircle2, AlertTriangle, ShieldCheck, Clock, Users, FileText, Loader2, Calendar, Edit, ChevronRight } from "lucide-react";
import { getSurgeryAuditReportAction } from "@/app/actions/cirugias";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface SurgeryAuditModalProps {
    isOpen: boolean;
    onClose: () => void;
    onEditSurgery?: (surgeryId: string) => void;
}

export function SurgeryAuditModal({ isOpen, onClose, onEditSurgery }: SurgeryAuditModalProps) {
    const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
    const [auditData, setAuditData] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [filterOnlyIncomplete, setFilterOnlyIncomplete] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    const fetchAudit = async () => {
        setLoading(true);
        try {
            const data = await getSurgeryAuditReportAction(selectedMonth, selectedYear);
            setAuditData(data);
        } catch (e) {
            console.error("Error fetching audit data:", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchAudit();
        }
    }, [isOpen, selectedMonth, selectedYear]);

    if (!isOpen) return null;

    const surgeries = auditData?.surgeries || [];
    const filteredSurgeries = surgeries.filter((s: any) => {
        if (filterOnlyIncomplete && s.isComplete) return false;
        if (!searchTerm) return true;
        const text = `${s.patientFullName} ${s.patientDni} ${s.diagnosis} ${s.roomName}`.toLowerCase();
        return text.includes(searchTerm.toLowerCase());
    });

    const months = [
        { id: 1, name: "Enero" },
        { id: 2, name: "Febrero" },
        { id: 3, name: "Marzo" },
        { id: 4, name: "Abril" },
        { id: 5, name: "Mayo" },
        { id: 6, name: "Junio" },
        { id: 7, name: "Julio" },
        { id: 8, name: "Agosto" },
        { id: 9, name: "Septiembre" },
        { id: 10, name: "Octubre" },
        { id: 11, name: "Noviembre" },
        { id: 12, name: "Diciembre" },
    ];

    const modalContent = (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/70 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
                
                {/* Header */}
                <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-800/30">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 flex items-center justify-center font-bold">
                            <ShieldCheck size={22} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                                Auditoría & Control de Calidad MINSA
                                {auditData?.incompleteCount > 0 && (
                                    <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-red-500 text-white animate-pulse">
                                        {auditData.incompleteCount} Observadas
                                    </span>
                                )}
                            </h2>
                            <p className="text-xs text-zinc-500 font-medium">
                                Detección de omisiones de tiempos operatorios, médicos asignados y diagnósticos.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Selector de Mes/Año */}
                        <div className="flex items-center gap-1.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 p-1.5 rounded-xl text-xs">
                            <Calendar size={14} className="text-zinc-400 ml-1" />
                            <select
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                                className="bg-transparent font-bold text-zinc-800 dark:text-zinc-200 focus:outline-none cursor-pointer"
                            >
                                {months.map(m => (
                                    <option key={m.id} value={m.id} className="dark:bg-zinc-900">{m.name}</option>
                                ))}
                            </select>
                            <select
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(Number(e.target.value))}
                                className="bg-transparent font-bold text-zinc-800 dark:text-zinc-200 focus:outline-none cursor-pointer"
                            >
                                <option value={2026} className="dark:bg-zinc-900">2026</option>
                                <option value={2025} className="dark:bg-zinc-900">2025</option>
                            </select>
                        </div>

                        <button
                            onClick={onClose}
                            className="w-8 h-8 rounded-lg hover:bg-zinc-200/60 dark:hover:bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-zinc-600 transition-colors"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* Métricas Resumen */}
                <div className="p-6 pb-2 border-b border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div className="p-3.5 rounded-xl bg-blue-50/60 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/40">
                            <span className="text-[10px] font-bold uppercase text-blue-600 dark:text-blue-400 tracking-wider">Integridad Global</span>
                            <div className="text-2xl font-black text-blue-700 dark:text-blue-300 mt-1">
                                {auditData?.integrityPercentage || 100}%
                            </div>
                            <span className="text-[11px] text-zinc-500 font-medium">{auditData?.completeCount || 0} de {auditData?.totalAudited || 0} completas</span>
                        </div>

                        <div className="p-3.5 rounded-xl bg-amber-50/60 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/40">
                            <span className="text-[10px] font-bold uppercase text-amber-600 dark:text-amber-400 tracking-wider flex items-center gap-1">
                                <Clock size={12} /> Tiempos Faltantes
                            </span>
                            <div className="text-2xl font-black text-amber-700 dark:text-amber-300 mt-1">
                                {auditData?.missingTimesCount || 0}
                            </div>
                            <span className="text-[11px] text-zinc-500 font-medium">Hitos operatorios vacíos</span>
                        </div>

                        <div className="p-3.5 rounded-xl bg-rose-50/60 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800/40">
                            <span className="text-[10px] font-bold uppercase text-rose-600 dark:text-rose-400 tracking-wider flex items-center gap-1">
                                <Users size={12} /> Equipo Incompleto
                            </span>
                            <div className="text-2xl font-black text-rose-700 dark:text-rose-300 mt-1">
                                {auditData?.missingTeamCount || 0}
                            </div>
                            <span className="text-[11px] text-zinc-500 font-medium">Sin cirujano o anestesiólogo</span>
                        </div>

                        <div className="p-3.5 rounded-xl bg-purple-50/60 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800/40">
                            <span className="text-[10px] font-bold uppercase text-purple-600 dark:text-purple-400 tracking-wider flex items-center gap-1">
                                <FileText size={12} /> Dx Pendientes
                            </span>
                            <div className="text-2xl font-black text-purple-700 dark:text-purple-300 mt-1">
                                {auditData?.missingDxCount || 0}
                            </div>
                            <span className="text-[11px] text-zinc-500 font-medium">Dx Pre/Post sin registrar</span>
                        </div>
                    </div>

                    {/* Toolbar Filtros */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4">
                        <div className="relative w-full sm:w-80">
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Buscar paciente, DNI o sala..."
                                className="w-full pl-9 pr-4 py-2 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            />
                            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
                        </div>

                        <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-zinc-700 dark:text-zinc-300 select-none">
                            <input
                                type="checkbox"
                                checked={filterOnlyIncomplete}
                                onChange={(e) => setFilterOnlyIncomplete(e.target.checked)}
                                className="w-4 h-4 rounded text-red-600 focus:ring-red-500 border-zinc-300 dark:border-zinc-700"
                            />
                            <span>Mostrar únicamente cirugías observadas ({auditData?.incompleteCount || 0})</span>
                        </label>
                    </div>
                </div>

                {/* Contenido Tabla */}
                <div className="p-6 overflow-y-auto flex-1">
                    {loading ? (
                        <div className="py-20 text-center flex flex-col items-center justify-center">
                            <Loader2 size={28} className="animate-spin text-blue-600 mb-2" />
                            <p className="text-xs font-semibold text-zinc-500">Ejecutando motor de auditoría clínica MINSA...</p>
                        </div>
                    ) : filteredSurgeries.length === 0 ? (
                        <div className="py-16 text-center flex flex-col items-center justify-center">
                            <CheckCircle2 size={40} className="text-emerald-500 mb-2" />
                            <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
                                {filterOnlyIncomplete ? "¡Excelente! No hay cirugías observadas en este filtro." : "No se encontraron cirugías."}
                            </h3>
                            <p className="text-xs text-zinc-500 max-w-sm mt-1">
                                Todas las historias quirúrgicas cumplen con los estándares de integridad de la jefatura.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {filteredSurgeries.map((s: any) => (
                                <div
                                    key={s.id}
                                    className={`p-4 rounded-xl border transition-all duration-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                                        s.isComplete
                                            ? "bg-emerald-50/30 dark:bg-emerald-950/10 border-emerald-200/60 dark:border-emerald-800/30"
                                            : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-red-300 dark:hover:border-red-800/70 shadow-sm"
                                    }`}
                                >
                                    <div className="flex-1 min-w-0 space-y-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="text-xs font-bold font-mono px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded text-zinc-700 dark:text-zinc-300">
                                                {format(new Date(s.scheduledDate), "dd/MM/yyyy HH:mm", { locale: es })}
                                            </span>
                                            <span className="text-xs font-semibold px-2 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">
                                                {s.roomName || "Sin Sala"}
                                            </span>
                                            {s.isComplete ? (
                                                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 rounded-full flex items-center gap-1">
                                                    <CheckCircle2 size={10} /> Completa 100%
                                                </span>
                                            ) : (
                                                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300 rounded-full flex items-center gap-1 animate-pulse">
                                                    <AlertTriangle size={10} /> Observada
                                                </span>
                                            )}
                                        </div>

                                        <h4 className="text-sm font-bold text-zinc-900 dark:text-white truncate">
                                            {s.patientFullName} <span className="text-xs font-mono text-zinc-400 font-normal">(DNI: {s.patientDni || 'S/DNI'})</span>
                                        </h4>
                                        <p className="text-xs text-zinc-500 truncate">
                                            <strong>Dx:</strong> {s.diagnosis || "Sin diagnóstico registrado"}
                                        </p>

                                        {/* Badges de Faltantes */}
                                        {s.missingFields && s.missingFields.length > 0 && (
                                            <div className="flex flex-wrap gap-1.5 pt-1">
                                                {s.missingFields.map((msg: string, idx: number) => (
                                                    <span
                                                        key={idx}
                                                        className="text-[10px] font-bold px-2 py-0.5 bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300 rounded border border-red-200 dark:border-red-800/60"
                                                    >
                                                        ⚠️ {msg}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Botón de Saneamiento Rápido */}
                                    <button
                                        onClick={() => {
                                            onClose();
                                            if (onEditSurgery) onEditSurgery(s.id);
                                        }}
                                        className="px-3.5 py-2 rounded-xl text-xs font-bold bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/40 dark:text-blue-300 dark:hover:bg-blue-900/60 border border-blue-200 dark:border-blue-800/50 flex items-center gap-1.5 transition-all shrink-0 self-end sm:self-center"
                                    >
                                        <Edit size={13} />
                                        <span>Sanear / Completar</span>
                                        <ChevronRight size={13} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-5 py-2 rounded-xl text-xs font-bold text-zinc-700 dark:text-zinc-300 bg-zinc-200/60 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 transition-colors"
                    >
                        Cerrar Panel
                    </button>
                </div>
            </div>
        </div>
    );

    if (typeof document === "undefined") return null;
    return createPortal(modalContent, document.body);
}
