"use client";

import { useState, useTransition } from "react";
import { fetchSurgeryReportData } from "@/app/actions/reportes";
import { Download, Search, Loader2, Calendar as CalendarIcon, FileSpreadsheet } from "lucide-react";
import { format, subDays, startOfMonth, endOfMonth, startOfYear } from "date-fns";

type ReportData = {
    correlativo: number;
    especialidad: string;
    sala: string;
    horaProgramada: string;
    fechaSolicitud: string;
    edad: string;
    sexo: string;
    historiaClinica: string;
    nombresApellidos: string;
    diagnostico: string;
    tipoDiagnostico: string;
    tipoIntervencion: string;
    cirujano: string;
    anestesiologo: string;
    enfermeria: string;
    tipoSeguro: string;
    procedencia: string;
    tipoAnestesia: string;
    horaIngresoPaciente: string;
    horaInicioAnestesia: string;
    horaAntesIncision: string;
    horaTerminoCirugia: string;
    horaSalidaPaciente: string;
    horaSalidaUrpa: string;
    fechaIntervencionQuirurgica: string;
    fechaRealIntervencion: string;
    horaRealIntervencion: string;
    tipoPrioridad: string;
    mesIntervencion: string;
    estadoAlerta: string;
    turno: string;
};

export function ReportClientTable() {
    const defaultStart = format(startOfMonth(new Date()), "yyyy-MM-dd");
    const defaultEnd = format(endOfMonth(new Date()), "yyyy-MM-dd");

    const [startDate, setStartDate] = useState(defaultStart);
    const [endDate, setEndDate] = useState(defaultEnd);
    const [data, setData] = useState<ReportData[]>([]);
    const [isPending, startTransition] = useTransition();
    const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

    function handleSearch() {
        startTransition(async () => {
            const results = await fetchSurgeryReportData(startDate, endDate);
            setData(results);
            setHasLoadedOnce(true);
        });
    }

    function getRowColorClasses(item: ReportData) {
        const status = item.estadoAlerta;
        if (status === 'completed' && (!item.tipoAnestesia || item.tipoAnestesia.trim() === '' || item.tipoAnestesia === '-')) return 'bg-zinc-200 hover:bg-zinc-300 text-zinc-800 border-zinc-400'; // Falta completar datos
        if (status === 'cancelled') return 'bg-red-50 hover:bg-red-100 text-red-900'; // Suspendido
        if (status === 'completed') return 'bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border-emerald-200'; // Terminado
        if (['in_progress', 'anesthesia_start', 'pre_incision', 'surgery_end', 'patient_exit', 'urpa_exit'].includes(status)) return 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-200'; // En progreso
        if (status === 'scheduled') return 'bg-blue-50 hover:bg-blue-100 text-blue-900 border-blue-200'; // Programado
        return 'bg-white hover:bg-zinc-50 dark:bg-zinc-900 dark:hover:bg-zinc-800/80';
    }

    function translateStatus(status: string) {
        if (status === 'scheduled') return 'Programado';
        if (status === 'completed') return 'Finalizadas';
        if (status === 'cancelled') return 'Cancelado/Suspendido';
        if (['in_progress', 'anesthesia_start', 'pre_incision', 'surgery_end', 'patient_exit', 'urpa_exit'].includes(status)) return 'En proceso (Qx)';
        return status.replace('_', ' ');
    }

    async function generateExcel() {
        if (data.length === 0) return;
        
        // Dynamic import to keep initial bundle size smaller
        const ExcelJS = (await import('exceljs')).default;
        
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('Reporte Quirúrgico');

        // Formatear fechas de yyyy-MM-dd a dd/MM/yyyy
        const startParts = startDate.split('-'); 
        const formattedStart = `${startParts[2]}/${startParts[1]}/${startParts[0]}`;
        const endParts = endDate.split('-'); 
        const formattedEnd = `${endParts[2]}/${endParts[1]}/${endParts[0]}`;

        // Obtener fecha y hora de impresión en zona local
        const printDateObj = new Date();
        const printDate = new Intl.DateTimeFormat('es-PE', { timeZone: 'America/Lima', day: '2-digit', month: '2-digit', year: 'numeric' }).format(printDateObj);
        const printTime = new Intl.DateTimeFormat('es-PE', { timeZone: 'America/Lima', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).format(printDateObj);

        // --- ROW 1: Título ---
        const titleRow = sheet.addRow(['PROGRAMACIÓN DE INTERVENCIONES ELECTIVAS / EMERGENCIAS DE SALA DE OPERACIONES']);
        titleRow.font = { name: 'Arial', size: 16, bold: true };
        
        // --- ROW 2: Leyenda ---
        const legendRow = sheet.addRow(['Programado', 'Finalizadas', 'Suspendido', 'En proceso', 'Finalizadas (Datos Incompletos)']);
        legendRow.font = { name: 'Arial', size: 10, color: { argb: 'FF000000' } };
        
        // Apply colors to the legend cells
        legendRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF00B0F0' } };
        legendRow.getCell(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF00B050' } };
        legendRow.getCell(3).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFF6666' } };
        legendRow.getCell(4).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF00' } };
        legendRow.getCell(5).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9D9D9' } };
        
        // --- ROW 3: Rango de fechas y metadata ---
        const subtitleRow = sheet.addRow([`Reporte de programaciones quirurgicas del ${formattedStart} al ${formattedEnd}    Fecha de impresion: ${printDate} hora: ${printTime}`]);
        subtitleRow.font = { name: 'Arial', size: 10 };

        // --- ROW 4: Línea en blanco ---
        sheet.addRow([]);

        // --- ROW 5: Headers ---
        const headers = [
            "N° CORRELATIVO", "ESPECIALIDAD", "SALA PROGRAMADA", "FECHA DE SOLICITUD", "FECHA PROGRAMADA", "HORA PROGRAMADA", "FECHA DE INTERVENCION QUIRURGICA", "HORA DE INTERVENCION QUIRURGICA",
            "EDAD", "SEXO (M/F)", "HISTORIA CLINICA", "NOMBRES Y APELLIDOS DEL PACIENTE", "DIAGNOSTICO", 
            "TIPO DIAGNOSTICO", "TIPO DE INTERVENCIÓN", "CIRUJANO", 
            "ANESTESIOLOGO", "CIRCULANTE/INSTRUMENTISTA", "TIPO SEGURO", "PROCEDENCIA", "TIPO ANESTECIA", 
            "HORA INGRESO PACIENTE", "HORA INICIO ANESTECIA", "HORA ANTES DE LA INCISIÓN", 
            "HORA TERMINO CIRUGIA", "HORA SALIDA PACIENTE", "HORA SALIDA DE URPA", 
            "PRIORIDAD", "MES DE INTERVENCION", "TURNO", "INCOMPLETO"
        ];
        const headerRow = sheet.addRow(headers);
        headerRow.font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FFFFFFFF' } }; // White text
        headerRow.eachCell(cell => {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F4F4F' } }; // Dark grey bg
            cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
            cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
        });

        // --- Agregar Datos ---
        data.forEach(item => {
            const rowData = [
                item.correlativo, item.especialidad, item.sala, item.fechaSolicitud, item.fechaIntervencionQuirurgica, item.horaProgramada, item.fechaRealIntervencion, item.horaRealIntervencion,
                item.edad, item.sexo, item.historiaClinica, item.nombresApellidos, item.diagnostico, 
                item.tipoDiagnostico, item.tipoIntervencion, item.cirujano, item.anestesiologo, item.enfermeria, 
                item.tipoSeguro, item.procedencia, item.tipoAnestesia, item.horaIngresoPaciente, 
                item.horaInicioAnestesia, item.horaAntesIncision, item.horaTerminoCirugia, 
                item.horaSalidaPaciente, item.horaSalidaUrpa, 
                item.tipoPrioridad, item.mesIntervencion, item.turno,
                (item.estadoAlerta === 'completed' && (!item.tipoAnestesia || item.tipoAnestesia.trim() === '' || item.tipoAnestesia === '-')) ? 'X' : ''
            ];
            const dataRow = sheet.addRow(rowData);
            dataRow.font = { name: 'Arial', size: 9 };
            dataRow.alignment = { vertical: 'middle' };
            
            // Asignar color de fila según el estado
            let bgColor = 'FFFFFFFF'; // Default blanco
            const status = item.estadoAlerta;
            if (status === 'completed' && (!item.tipoAnestesia || item.tipoAnestesia.trim() === '' || item.tipoAnestesia === '-')) bgColor = 'FFD9D9D9'; // Gris (Falta completar)
            else if (status === 'cancelled') bgColor = 'FFFF6666'; // Suspendido (Rojo claro)
            else if (status === 'completed') bgColor = 'FF00B050'; // Terminado (Verde)
            else if (['in_progress', 'anesthesia_start', 'pre_incision', 'surgery_end', 'patient_exit', 'urpa_exit'].includes(status)) bgColor = 'FFFFFF00'; // En proceso (Amarillo)
            else bgColor = 'FF00B0F0'; // Programado (Azul claro)
            
            dataRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
                cell.border = { top: { style: 'thin', color: { argb: 'FFCCCCCC' } }, left: { style: 'thin', color: { argb: 'FFCCCCCC' } }, bottom: { style: 'thin', color: { argb: 'FFCCCCCC' } }, right: { style: 'thin', color: { argb: 'FFCCCCCC' } } };
            });
        });

        // Configuración de anchos de columna base y congelamiento de páneles
        sheet.columns.forEach(column => { column.width = 15; });
        sheet.getColumn(1).width = 5;  // N°
        sheet.getColumn(2).width = 24.38; // Especialidad
        sheet.getColumn(7).width = 15; // Fecha IQ
        sheet.getColumn(8).width = 15; // Hora IQ
        sheet.getColumn(9).width = 8;  // Edad
        sheet.getColumn(10).width = 10; // Sexo (M/F)
        sheet.getColumn(11).width = 12; // HC
        sheet.getColumn(12).width = 35; // Nombres
        sheet.getColumn(13).width = 30; // Diagnóstico
        sheet.getColumn(14).width = 17.5; // Tipo Diagnóstico
        sheet.getColumn(15).width = 35; // Tipo Intervención
        sheet.getColumn(16).width = 25; // Cirujano
        sheet.getColumn(17).width = 25; // Anestesiólogo
        sheet.getColumn(18).width = 25; // Circulante/Instrumentista
        sheet.getRow(5).height = 30; // Altura del header (ahora es fila 5)
        sheet.views = [{ state: 'frozen', xSplit: 0, ySplit: 5 }]; // Congelar 5 primeras filas

        // Exportar a Blob y descargar
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `Reporte_Programaciones_CQ_${startDate}_al_${endDate}.xlsx`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    return (
        <div className="space-y-6">
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800">
                <div className="flex flex-col md:flex-row gap-4 items-end justify-between">
                    <div className="flex flex-wrap gap-4 items-end w-full md:w-auto">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Fecha Inicial</label>
                            <div className="relative">
                                <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 w-4 h-4" />
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="pl-10 pr-4 py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg w-full focus:ring-2 focus:ring-blue-500 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Fecha Final (incluída)</label>
                            <div className="relative">
                                <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 w-4 h-4" />
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="pl-10 pr-4 py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg w-full focus:ring-2 focus:ring-blue-500 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white"
                                />
                            </div>
                        </div>
                        <button
                            onClick={handleSearch}
                            disabled={isPending}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                            {isPending ? "Procesando..." : "Generar Grilla"}
                        </button>
                    </div>

                    {data.length > 0 && (
                        <button
                            onClick={generateExcel}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 px-6 rounded-lg transition shadow-sm flex items-center justify-center gap-2"
                        >
                            <FileSpreadsheet className="w-5 h-5" />
                            Exportar a Excel (.xlsx)
                        </button>
                    )}
                </div>

                {data.length > 0 && (
                    <div className="mt-6 flex flex-wrap gap-4 text-xs font-semibold px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-100 dark:border-zinc-800">
                        <span className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-blue-100 border border-blue-300"></div> Programado</span>
                        <span className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-amber-400 border border-amber-500"></div> En proceso (Qx)</span>
                        <span className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-400 border border-emerald-500"></div> Finalizadas</span>
                        <span className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-400 border border-red-500"></div> Suspendido / Cancelada</span>
                        <span className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-zinc-400 border border-zinc-500"></div> Finalizadas (Datos Incompletos)</span>
                        <span className="ml-auto text-zinc-500">Total resultados: {data.length} cirugías</span>
                    </div>
                )}
            </div>

            {!hasLoadedOnce ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white/50 dark:bg-zinc-900/50 rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-700">
                    <FileSpreadsheet className="w-16 h-16 text-zinc-300 animate-pulse mb-4" />
                    <p className="text-zinc-500 font-medium">Selecciona un rango de fechas y genera la grilla de reporte.</p>
                </div>
            ) : data.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white/50 dark:bg-zinc-900/50 rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-700">
                    <p className="text-zinc-500 font-medium">No se encontraron programaciones quirúrgicas en el rango especificado.</p>
                </div>
            ) : (
                <div className="bg-white dark:bg-zinc-900 shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden overflow-x-auto rounded-xl">
                    <table className="min-w-max w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 font-bold uppercase text-[10px] tracking-wider border-b border-zinc-200 dark:border-zinc-700">
                            <tr>
                                <th className="px-3 py-3">N°</th>
                                <th className="px-3 py-3">Paciente</th>
                                <th className="px-3 py-3">Sala</th>
                                <th className="px-3 py-3">Diagnóstico</th>
                                <th className="px-3 py-3">Cirujano(s)</th>
                                <th className="px-3 py-3">F. Solicitud</th>
                                <th className="px-3 py-3">F. Intervención</th>
                                <th className="px-3 py-3">Estado</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-200/50 dark:divide-zinc-800 border-b border-zinc-200 dark:border-zinc-800">
                            {data.map((row) => (
                                <tr key={row.correlativo} className={`transition-colors border-l-4 ${getRowColorClasses(row)}`}>
                                    <td className="px-3 py-2.5 font-medium">{row.correlativo}</td>
                                    <td className="px-3 py-2.5 max-w-[200px] truncate" title={row.nombresApellidos}>{row.nombresApellidos}</td>
                                    <td className="px-3 py-2.5">{row.sala}</td>
                                    <td className="px-3 py-2.5 max-w-[250px] truncate" title={row.diagnostico}>{row.diagnostico}</td>
                                    <td className="px-3 py-2.5 max-w-[200px] truncate" title={row.cirujano}>{row.cirujano}</td>
                                    <td className="px-3 py-2.5 font-semibold font-mono text-xs">{row.fechaSolicitud}</td>
                                    <td className="px-3 py-2.5 font-semibold font-mono text-xs">{row.fechaIntervencionQuirurgica}</td>
                                    <td className="px-3 py-2.5 uppercase text-[10px] font-bold">
                                        {translateStatus(row.estadoAlerta)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
