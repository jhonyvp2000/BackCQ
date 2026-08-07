"use client";

import { createPortal } from "react-dom";
import { X, Printer, Download, FileSpreadsheet, Building2, Calendar, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface PrintDailyAgendaModalProps {
    isOpen: boolean;
    onClose: () => void;
    surgeriesData: any[];
    displayDate: string; // YYYY-MM-DD
}

export function PrintDailyAgendaModal({ isOpen, onClose, surgeriesData, displayDate }: PrintDailyAgendaModalProps) {
    if (!isOpen) return null;

    const parsedDate = new Date(`${displayDate}T00:00:00`);
    const formattedDate = format(parsedDate, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: es });

    // Filtrar cirugías activas (no canceladas)
    const activeSurgeries = surgeriesData.filter(s => s.surgery.status !== 'cancelled');

    // Agrupar por sala de operaciones
    const roomsMap = new Map<string, { roomName: string, items: any[] }>();

    activeSurgeries.forEach(s => {
        const roomName = s.operatingRoom?.name || "SALA UNIFICADA";
        if (!roomsMap.has(roomName)) {
            roomsMap.set(roomName, { roomName, items: [] });
        }
        roomsMap.get(roomName)!.items.push(s);
    });

    // Ordenar por hora programada dentro de cada sala
    roomsMap.forEach(group => {
        group.items.sort((a, b) => {
            const tA = a.surgery.scheduledDate ? new Date(a.surgery.scheduledDate).getTime() : 0;
            const tB = b.surgery.scheduledDate ? new Date(b.surgery.scheduledDate).getTime() : 0;
            return tA - tB;
        });
    });

    const handlePrint = () => {
        window.print();
    };

    const modalContent = (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/70 backdrop-blur-sm animate-in fade-in duration-200 print:p-0 print:bg-white print:static">
            
            {/* Modal Container */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-6xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden print:border-none print:shadow-none print:max-w-none print:max-h-none print:rounded-none print:w-full">
                
                {/* Header Acciones (Oculto en Impresión) */}
                <div className="p-4 px-6 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/70 dark:bg-zinc-800/40 print:hidden">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                            <Printer size={20} />
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-zinc-900 dark:text-white">
                                Agenda Quirúrgica Diaria Oficial
                            </h2>
                            <p className="text-xs text-zinc-500 font-medium capitalize">
                                {formattedDate}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={handlePrint}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md transition-all cursor-pointer"
                        >
                            <Printer size={15} />
                            <span>Imprimir / Guardar en PDF</span>
                        </button>

                        <button
                            onClick={onClose}
                            className="w-8 h-8 rounded-lg hover:bg-zinc-200/60 dark:hover:bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-zinc-600 transition-colors"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* Documento Imprimible */}
                <div className="p-8 overflow-y-auto flex-1 bg-white text-zinc-900 print:p-4 print:overflow-visible font-sans">
                    
                    {/* Encabezado Hospitalario Oficial */}
                    <div className="border-b-2 border-zinc-900 pb-4 mb-6 flex justify-between items-start">
                        <div>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 block">MINISTERIO DE SALUD — OGESS ALTO MAYO / SAN MARTÍN</span>
                            <h1 className="text-lg font-black text-zinc-900 tracking-tight uppercase">HOSPITAL III BANDA DE SHILCAYO</h1>
                            <h2 className="text-sm font-extrabold text-blue-800 uppercase tracking-wider mt-0.5">CENTRO QUIRÚRGICO — PROGRAMACIÓN DIARIA DE CIRUGÍAS</h2>
                        </div>
                        <div className="text-right">
                            <div className="inline-block border border-zinc-800 px-3 py-1.5 rounded text-right">
                                <span className="text-[9px] font-bold uppercase text-zinc-500 block">FECHA DE LA JORNADA</span>
                                <span className="text-xs font-black uppercase text-zinc-900 font-mono">{formattedDate}</span>
                            </div>
                        </div>
                    </div>

                    {/* Tabla de Cirugías por Sala */}
                    {roomsMap.size === 0 ? (
                        <div className="py-12 text-center text-zinc-400 text-xs font-semibold uppercase tracking-wider">
                            No existen cirugías programadas para la fecha seleccionada.
                        </div>
                    ) : (
                        Array.from(roomsMap.values()).map((group, groupIdx) => (
                            <div key={groupIdx} className="mb-6 page-break-inside-avoid">
                                <div className="bg-zinc-800 text-white px-3 py-1.5 rounded-t font-black text-xs uppercase tracking-wider flex justify-between items-center">
                                    <span>🏛️ {group.roomName}</span>
                                    <span className="text-[10px] font-normal opacity-80">{group.items.length} Cirugía(s) Programada(s)</span>
                                </div>

                                <table className="w-full border-collapse border border-zinc-800 text-[10px]">
                                    <thead>
                                        <tr className="bg-zinc-100 text-zinc-900 uppercase font-black tracking-wider text-left border-b border-zinc-800">
                                            <th className="p-1.5 border-r border-zinc-800 text-center w-8">N°</th>
                                            <th className="p-1.5 border-r border-zinc-800 text-center w-14">HORA</th>
                                            <th className="p-1.5 border-r border-zinc-800 w-44">PACIENTE (HC / DNI)</th>
                                            <th className="p-1.5 border-r border-zinc-800 w-48">DIAGNÓSTICO (CIE-10)</th>
                                            <th className="p-1.5 border-r border-zinc-800 w-48">INTERVENCIÓN / PROCEDIMIENTO</th>
                                            <th className="p-1.5 border-r border-zinc-800 text-center w-16">ANESTESIA</th>
                                            <th className="p-1.5 border-r border-zinc-800 text-center w-16">TIPO</th>
                                            <th className="p-1.5 border-r border-zinc-800 w-36">CIRUJANO(S)</th>
                                            <th className="p-1.5 border-r border-zinc-800 w-32">ANESTESIÓLOGO</th>
                                            <th className="p-1.5 w-32">ENFERMERÍA (INST/CIRC)</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-800">
                                        {group.items.map((s, idx) => {
                                            const timeStr = s.surgery.scheduledDate 
                                                ? format(new Date(s.surgery.scheduledDate), "HH:mm") 
                                                : "--:--";

                                            const patientName = s.patientPii 
                                                ? `${s.patientPii.nombres} ${s.patientPii.apellidos}` 
                                                : "PACIENTE NO IDENTIFICADO";
                                            
                                            const patientDoc = s.patientPii?.dni 
                                                ? `DNI: ${s.patientPii.dni}` 
                                                : (s.patientPii?.historiaClinica ? `HC: ${s.patientPii.historiaClinica}` : 'S/DOC');

                                            const surgeons = s.team
                                                ? s.team.filter((t: any) => t.role === 'CIRUJANO_PRINCIPAL' || t.role === 'CIRUJANO')
                                                    .map((t: any) => `Dr(a). ${t.staff?.lastname || ''} ${t.staff?.name || ''}`).join(', ')
                                                : '-';

                                            const anesthesiologists = s.team
                                                ? s.team.filter((t: any) => t.role === 'ANESTESIOLOGO')
                                                    .map((t: any) => `Dr(a). ${t.staff?.lastname || ''} ${t.staff?.name || ''}`).join(', ')
                                                : '-';

                                            const nurses = s.team
                                                ? s.team.filter((t: any) => t.role === 'ENFERMERO' || t.role === 'INSTRUMENTISTA' || t.role === 'CIRCULANTE')
                                                    .map((t: any) => `${t.staff?.lastname || ''} ${t.staff?.name || ''}`).join(', ')
                                                : '-';

                                            return (
                                                <tr key={s.surgery.id} className="hover:bg-zinc-50 align-top leading-tight">
                                                    <td className="p-1.5 border-r border-zinc-800 text-center font-bold font-mono">{idx + 1}</td>
                                                    <td className="p-1.5 border-r border-zinc-800 text-center font-bold font-mono text-blue-900">{timeStr}</td>
                                                    <td className="p-1.5 border-r border-zinc-800 font-bold">
                                                        <div className="uppercase">{patientName}</div>
                                                        <div className="text-[9px] font-mono text-zinc-500 font-normal">{patientDoc} {s.surgery.insuranceType ? `(${s.surgery.insuranceType})` : ''}</div>
                                                    </td>
                                                    <td className="p-1.5 border-r border-zinc-800">
                                                        {s.surgery.diagnosis || "Sin registro"}
                                                    </td>
                                                    <td className="p-1.5 border-r border-zinc-800 font-medium">
                                                        {s.interventionsList && s.interventionsList.length > 0
                                                            ? s.interventionsList.map((i: any) => i.name).join(', ')
                                                            : (s.proceduresList && s.proceduresList.length > 0 
                                                                ? s.proceduresList.map((p: any) => p.name).join(', ') 
                                                                : "Intervención Quirúrgica")}
                                                    </td>
                                                    <td className="p-1.5 border-r border-zinc-800 text-center font-bold uppercase font-mono">{s.surgery.anesthesiaType || '-'}</td>
                                                    <td className="p-1.5 border-r border-zinc-800 text-center font-bold uppercase">
                                                        <span className={s.surgery.urgencyType === 'EMERGENCIA' ? 'text-red-700' : 'text-zinc-700'}>
                                                            {s.surgery.urgencyType || 'ELECTIVO'}
                                                        </span>
                                                    </td>
                                                    <td className="p-1.5 border-r border-zinc-800 font-semibold">{surgeons || '-'}</td>
                                                    <td className="p-1.5 border-r border-zinc-800 font-semibold">{anesthesiologists || '-'}</td>
                                                    <td className="p-1.5 font-medium">{nurses || '-'}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        ))
                    )}

                    {/* Bloque Oficial de Firmas */}
                    <div className="mt-16 pt-8 border-t border-zinc-300 page-break-inside-avoid">
                        <div className="grid grid-cols-3 gap-8 text-center text-[10px] font-bold text-zinc-800">
                            <div className="space-y-1">
                                <div className="border-t border-zinc-900 w-48 mx-auto mb-1"></div>
                                <span className="block uppercase">JEFATURA DE CENTRO QUIRÚRGICO</span>
                                <span className="text-[9px] font-normal text-zinc-500 block">Firma y Sello Oficial</span>
                            </div>
                            <div className="space-y-1">
                                <div className="border-t border-zinc-900 w-48 mx-auto mb-1"></div>
                                <span className="block uppercase">JEFATURA DE ANESTESIOLOGÍA</span>
                                <span className="text-[9px] font-normal text-zinc-500 block">Firma y Sello Oficial</span>
                            </div>
                            <div className="space-y-1">
                                <div className="border-t border-zinc-900 w-48 mx-auto mb-1"></div>
                                <span className="block uppercase">ENFERMERÍA DE QUIRÓFANO</span>
                                <span className="text-[9px] font-normal text-zinc-500 block">Firma y Sello Oficial</span>
                            </div>
                        </div>
                    </div>

                </div>

                {/* Footer Modal Acciones (Oculto en Impresión) */}
                <div className="p-4 px-6 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 flex justify-end print:hidden">
                    <button
                        onClick={onClose}
                        className="px-5 py-2 rounded-xl text-xs font-bold text-zinc-700 dark:text-zinc-300 bg-zinc-200/60 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 transition-colors"
                    >
                        Cerrar Vista Previa
                    </button>
                </div>
            </div>
        </div>
    );

    if (typeof document === "undefined") return null;
    return createPortal(modalContent, document.body);
}
