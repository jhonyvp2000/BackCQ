"use client";

import { useState, useTransition, useEffect } from "react";
import { fetchSurgeryReportData } from "@/app/actions/reportes";
import { Download, Search, Loader2, Calendar as CalendarIcon, FileSpreadsheet, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { format, subDays, startOfMonth, endOfMonth, startOfYear } from "date-fns";

type ReportData = {
    correlativo: number;
    especialidad: string;
    sala: string;
    horaProgramada: string;
    fechaSolicitud: string;
    edad: string;
    sexo: string;
    documento: string;
    historiaClinica: string;
    nombresApellidos: string;
    diagnostico: string;
    diagnosticoPost: string;
    tipoDiagnostico: string;
    tipoIntervencion: string;
    cirujano: string;
    anestesiologo: string;
    instrumentista: string;
    circulante: string;
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
    direccion: string;
    distrito: string;
    provincia: string;
    departamento: string;
};

export function ReportClientTable() {
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    useEffect(() => {
        setStartDate(format(startOfMonth(new Date()), "yyyy-MM-dd"));
        setEndDate(format(endOfMonth(new Date()), "yyyy-MM-dd"));
    }, []);
    const [data, setData] = useState<ReportData[]>([]);
    const [isPending, startTransition] = useTransition();
    const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
    
    // Estados de paginación y filtrado local
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [filterText, setFilterText] = useState("");

    function handleSearch() {
        startTransition(async () => {
            const results = await fetchSurgeryReportData(startDate, endDate);
            setData(results);
            setHasLoadedOnce(true);
            setCurrentPage(1);
            setFilterText("");
        });
    }

    function getRowColorClasses(item: ReportData) {
        const status = item.estadoAlerta;
        if (status === 'completed' && (!item.tipoAnestesia || item.tipoAnestesia.trim() === '' || item.tipoAnestesia === '-')) return 'bg-zinc-200 hover:bg-zinc-300 text-zinc-800 border-zinc-400'; // Falta completar datos
        if (status === 'cancelled') return 'bg-red-50 hover:bg-red-100 text-red-900'; // Suspendido
        if (status === 'completed') return 'bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border-emerald-200'; // Finalizadas
        if (['in_progress', 'anesthesia_start', 'pre_incision', 'surgery_end', 'patient_exit', 'urpa_exit'].includes(status)) return 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-200'; // En proceso (Qx)
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
        legendRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFCDE7FB' } }; // Celeste claro
        legendRow.getCell(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2EFDA' } }; // Verde claro
        legendRow.getCell(3).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFC7CE' } }; // Rosado claro
        legendRow.getCell(4).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF2CC' } }; // Amarillo ultra claro
        legendRow.getCell(5).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9D9D9' } };
        
        // --- ROW 3: Rango de fechas y metadata ---
        const subtitleRow = sheet.addRow([`Reporte de programaciones quirurgicas del ${formattedStart} al ${formattedEnd}    Fecha de impresion: ${printDate} hora: ${printTime}`]);
        subtitleRow.font = { name: 'Arial', size: 10 };

        // --- ROW 4: Línea en blanco ---
        sheet.addRow([]);

        const getStatusText = (status: string) => {
            if (status === 'scheduled') return 'Programado';
            if (status === 'completed') return 'Finalizada';
            if (status === 'cancelled') return 'Suspendida';
            if (['in_progress', 'anesthesia_start', 'pre_incision', 'surgery_end', 'patient_exit', 'urpa_exit'].includes(status)) return 'En proceso (Qx)';
            return status.replace('_', ' ');
        };

        // --- ROW 5: Headers ---
        const headers = [
            "N° CORRELATIVO", "ESPECIALIDAD", "SALA PROGRAMADA", "FECHA DE SOLICITUD", "FECHA PROGRAMADA", "HORA PROGRAMADA", "FECHA DE INTERVENCION QUIRURGICA", "HORA DE INTERVENCION QUIRURGICA",
            "EDAD", "SEXO (M/F)", "N° DOCUMENTO", "HISTORIA CLINICA", "NOMBRES Y APELLIDOS DEL PACIENTE", "DIAGNOSTICO PRE", "DIAGNOSTICO POS",
            "TIPO DIAGNOSTICO", "TIPO DE INTERVENCIÓN", "CIRUJANO", 
            "ANESTESIOLOGO", "INSTRUMENTISTA", "CIRCULANTE", "TIPO SEGURO", "PROCEDENCIA", "TIPO ANESTECIA", 
            "HORA INGRESO PACIENTE", "HORA INICIO ANESTECIA", "HORA ANTES DE LA INCISIÓN", 
            "HORA TERMINO CIRUGIA", "HORA SALIDA PACIENTE", "HORA SALIDA DE URPA", 
            "PRIORIDAD", "MES DE INTERVENCION", "TURNO", "ESTADO", "DIRECCIÓN", "DISTRITO", "PROVINCIA", "DEPARTAMENTO", "INCOMPLETO"
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
                item.edad, item.sexo, item.documento, item.historiaClinica, item.nombresApellidos, item.diagnostico, item.diagnosticoPost || "",
                item.tipoDiagnostico, item.tipoIntervencion, item.cirujano, item.anestesiologo, 
                item.instrumentista, item.circulante, 
                item.tipoSeguro, item.procedencia, item.tipoAnestesia, item.horaIngresoPaciente, 
                item.horaInicioAnestesia, item.horaAntesIncision, item.horaTerminoCirugia, 
                item.horaSalidaPaciente, item.horaSalidaUrpa, 
                item.tipoPrioridad, item.mesIntervencion, item.turno, getStatusText(item.estadoAlerta),
                item.direccion || "", item.distrito || "", item.provincia || "", item.departamento || "",
                (item.estadoAlerta === 'completed' && (!item.tipoAnestesia || item.tipoAnestesia.trim() === '' || item.tipoAnestesia === '-')) ? 'X' : ''
            ];
            const dataRow = sheet.addRow(rowData);
            dataRow.font = { name: 'Arial', size: 9 };
            dataRow.alignment = { vertical: 'middle' };
            
            // Asignar color de fila según el estado
            let bgColor = 'FFFFFFFF'; // Default blanco
            const status = item.estadoAlerta;
            if (status === 'completed' && (!item.tipoAnestesia || item.tipoAnestesia.trim() === '' || item.tipoAnestesia === '-')) bgColor = 'FFD9D9D9'; // Gris (Finalizadas incompletas)
            else if (status === 'cancelled') bgColor = 'FFFFC7CE'; // Suspendido (Rosado claro)
            else if (status === 'completed') bgColor = 'FFE2EFDA'; // Finalizadas (Verde claro)
            else if (['in_progress', 'anesthesia_start', 'pre_incision', 'surgery_end', 'patient_exit', 'urpa_exit'].includes(status)) bgColor = 'FFFFF2CC'; // En proceso (Amarillo muy claro)
            else bgColor = 'FFCDE7FB'; // Programado (Celeste claro)
            
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
        sheet.getColumn(11).width = 15; // N° Documento
        sheet.getColumn(12).width = 12; // HC
        sheet.getColumn(13).width = 35; // Nombres
        sheet.getColumn(14).width = 30; // Diagnóstico Pre
        sheet.getColumn(15).width = 30; // Diagnóstico Pos
        sheet.getColumn(16).width = 17.5; // Tipo Diagnóstico
        sheet.getColumn(17).width = 35; // Tipo Intervención
        sheet.getColumn(18).width = 25; // Cirujano
        sheet.getColumn(19).width = 25; // Anestesiólogo
        sheet.getColumn(20).width = 25; // Instrumentista
        sheet.getColumn(21).width = 25; // Circulante
        sheet.getColumn(25).width = 18; // HORA INGRESO PACIENTE
        sheet.getColumn(26).width = 18; // HORA INICIO ANESTECIA
        sheet.getColumn(27).width = 18; // HORA ANTES DE LA INCISIÓN
        sheet.getColumn(28).width = 18; // HORA TERMINO CIRUGIA
        sheet.getColumn(29).width = 18; // HORA SALIDA PACIENTE
        sheet.getColumn(30).width = 18; // HORA SALIDA DE URPA
        sheet.getColumn(35).width = 30; // Dirección
        sheet.getColumn(36).width = 20; // Distrito
        sheet.getColumn(37).width = 20; // Provincia
        sheet.getColumn(38).width = 20; // Departamento
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

    // local search filtering and pagination calculation
    const filteredData = data.filter(item => {
        const query = filterText.toLowerCase();
        return (
            (item.nombresApellidos || "").toLowerCase().includes(query) ||
            (item.diagnostico || "").toLowerCase().includes(query) ||
            (item.cirujano || "").toLowerCase().includes(query) ||
            (item.sala || "").toLowerCase().includes(query) ||
            (item.especialidad || "").toLowerCase().includes(query) ||
            (item.documento || "").toLowerCase().includes(query) ||
            (item.historiaClinica || "").toLowerCase().includes(query)
        );
    });

    const totalItems = filteredData.length;
    const totalPages = Math.ceil(totalItems / pageSize) || 1;
    const safeCurrentPage = currentPage > totalPages ? totalPages : currentPage;
    const startIndex = (safeCurrentPage - 1) * pageSize;
    const paginatedData = filteredData.slice(startIndex, startIndex + pageSize);

    const handleFilterChange = (val: string) => {
        setFilterText(val);
        setCurrentPage(1);
    };

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
                            <span className="flex items-center gap-2">
                                {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                                <span>{isPending ? "Procesando..." : "Generar Grilla"}</span>
                            </span>
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

            {data.length > 0 && (
                <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-zinc-50 dark:bg-zinc-800/40 p-4 rounded-xl border border-zinc-200/50 dark:border-zinc-800/60">
                    <div className="relative w-full sm:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 w-4 h-4" />
                        <input
                            type="text"
                            value={filterText}
                            onChange={(e) => handleFilterChange(e.target.value)}
                            placeholder="Filtrar por paciente, médico, especialidad, DNI..."
                            className="pl-10 pr-4 py-2 text-sm border border-zinc-200 dark:border-zinc-700 rounded-lg w-full focus:ring-2 focus:ring-blue-500 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                        />
                    </div>
                    
                    <div className="flex items-center gap-2 text-xs font-semibold text-zinc-500 shrink-0">
                        <span>Mostrar</span>
                        <select
                            value={pageSize}
                            onChange={(e) => {
                                setPageSize(Number(e.target.value));
                                setCurrentPage(1);
                            }}
                            className="border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-1.5 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                        >
                            <option value={10}>10 filas</option>
                            <option value={25}>25 filas</option>
                            <option value={50}>50 filas</option>
                            <option value={100}>100 filas</option>
                        </select>
                    </div>
                </div>
            )}

            {!hasLoadedOnce ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white/50 dark:bg-zinc-900/50 rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-700">
                    <FileSpreadsheet className="w-16 h-16 text-zinc-300 animate-pulse mb-4" />
                    <p className="text-zinc-500 font-medium">Selecciona un rango de fechas y genera la grilla de reporte.</p>
                </div>
            ) : totalItems === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white/50 dark:bg-zinc-900/50 rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-700">
                    <p className="text-zinc-500 font-medium">No se encontraron programaciones quirúrgicas en el rango especificado.</p>
                </div>
            ) : (
                <div className="bg-white dark:bg-zinc-900 shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden rounded-xl">
                    <div className="overflow-x-auto w-full">
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
                                {paginatedData.map((row) => (
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
                    
                    {/* Pagination Footer */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 bg-zinc-50 dark:bg-zinc-850/30 border-t border-zinc-200 dark:border-zinc-800/80 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                        <div>
                            <span>
                                Mostrando <strong className="text-zinc-900 dark:text-white">{startIndex + 1}</strong> al{" "}
                                <strong className="text-zinc-900 dark:text-white">
                                    {Math.min(startIndex + pageSize, totalItems)}
                                </strong>{" "}
                                de <strong className="text-zinc-900 dark:text-white">{totalItems}</strong> resultados
                                {filterText && " (filtrados)"}
                            </span>
                        </div>

                        {totalPages > 1 && (
                            <div className="flex items-center gap-1.5">
                                <button
                                    onClick={() => setCurrentPage(1)}
                                    disabled={safeCurrentPage === 1}
                                    className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:hover:bg-transparent transition text-zinc-700 dark:text-zinc-300 cursor-pointer disabled:cursor-not-allowed"
                                    title="Primera página"
                                >
                                    <ChevronsLeft className="w-3.5 h-3.5" />
                                </button>
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    disabled={safeCurrentPage === 1}
                                    className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:hover:bg-transparent transition text-zinc-700 dark:text-zinc-300 cursor-pointer disabled:cursor-not-allowed"
                                    title="Página anterior"
                                >
                                    <ChevronLeft className="w-3.5 h-3.5" />
                                </button>
                                
                                <span className="px-3 py-1 bg-white dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-700 rounded-md text-zinc-900 dark:text-white">
                                    Página {safeCurrentPage} de {totalPages}
                                </span>

                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                    disabled={safeCurrentPage === totalPages}
                                    className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:hover:bg-transparent transition text-zinc-700 dark:text-zinc-300 cursor-pointer disabled:cursor-not-allowed"
                                    title="Siguiente página"
                                >
                                    <ChevronRight className="w-3.5 h-3.5" />
                                </button>
                                <button
                                    onClick={() => setCurrentPage(totalPages)}
                                    disabled={safeCurrentPage === totalPages}
                                    className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:hover:bg-transparent transition text-zinc-700 dark:text-zinc-300 cursor-pointer disabled:cursor-not-allowed"
                                    title="Última página"
                                >
                                    <ChevronsRight className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
