"use client";

import { useState, useTransition } from "react";
import { fetchHospitalIndicatorsReport } from "@/app/actions/indicadores";
import { Search, Loader2, FileSpreadsheet, AlertCircle, TrendingUp, Users, Activity, HelpCircle } from "lucide-react";

export function HospitalIndicatorsReportTable() {
    const now = new Date();
    const [month, setMonth] = useState(now.getMonth() + 1);
    const [year, setYear] = useState(now.getFullYear());
    const [reportData, setReportData] = useState<any>(null);
    const [isPending, startTransition] = useTransition();
    const [hasLoaded, setHasLoaded] = useState(false);

    const months = [
        "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
        "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];

    function handleSearch() {
        startTransition(async () => {
            const results = await fetchHospitalIndicatorsReport(month, year);
            setReportData(results);
            setHasLoaded(true);
        });
    }

    async function handleExport() {
        if (!reportData || reportData.indicadores.length === 0) return;
        const ExcelJS = (await import('exceljs')).default;
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('Indicadores Hospitalarios');

        // Header Title
        const titleCell = sheet.mergeCells('A1:G1');
        sheet.getCell('A1').value = `HOSPITAL TARAPOTO II - 2\nINDICADORES DE RENDIMIENTO Y CALIDAD DEL CENTRO QUIRÚRGICO\n${months[month-1]} - ${year}`;
        sheet.getCell('A1').alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
        sheet.getCell('A1').font = { bold: true, size: 12 };
        sheet.getRow(1).height = 70;

        // Headers
        const headers = ['N°', 'INDICADOR', 'FÓRMULA / DEFINICIÓN', 'NUMERADOR', 'DENOMINADOR', 'RESULTADO', 'UNIDAD'];
        const headerRow = sheet.addRow(headers);
        headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 9 };
        headerRow.height = 30;
        headerRow.eachCell((cell, colNumber) => {
            let bgColor = 'FF4F2D7F'; // Púrpura oscuro
            if (colNumber === 6) bgColor = 'FF1F4E79'; // Azul para resultado
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
            cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
            cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
        });

        // Data Rows
        reportData.indicadores.forEach((ind: any) => {
            const row = sheet.addRow([
                ind.id,
                ind.nombre,
                ind.formula,
                ind.numerador,
                ind.denominador,
                ind.valor,
                ind.unidad
            ]);
            row.font = { size: 9 };
            row.height = 24;
            row.eachCell((cell, colNumber) => {
                cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
                if (colNumber === 2 || colNumber === 3) {
                    cell.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
                } else {
                    cell.alignment = { horizontal: 'center', vertical: 'middle' };
                }
                if (colNumber === 6) {
                    cell.font = { bold: true, size: 10 };
                }
            });
        });

        // Set column widths
        sheet.getColumn(1).width = 5;   // N°
        sheet.getColumn(2).width = 45;  // Indicador
        sheet.getColumn(3).width = 45;  // Fórmula
        sheet.getColumn(4).width = 12;  // Numerador
        sheet.getColumn(5).width = 12;  // Denominador
        sheet.getColumn(6).width = 12;  // Resultado
        sheet.getColumn(7).width = 12;  // Unidad

        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `Indicadores_Hospitalarios_CQ_${months[month-1]}_${year}.xlsx`;
        link.click();
    }

    const getStatusBadge = (ind: any) => {
        let status = "good";
        let text = "Óptimo";

        if (ind.nombre.includes("suspendidas")) {
            if (ind.valor > 10) { status = "danger"; text = "Crítico"; }
            else if (ind.valor > 5) { status = "warning"; text = "Desviado"; }
        } else if (ind.nombre.includes("mortalidad")) {
            if (ind.valor > 0) { status = "danger"; text = "Crítico"; }
        } else if (ind.nombre.includes("reintervenidos")) {
            if (ind.valor > 5) { status = "danger"; text = "Crítico"; }
            else if (ind.valor > 2) { status = "warning"; text = "Desviado"; }
        } else if (ind.nombre.includes("permanencia") || ind.nombre.includes("efectivas")) {
            if (ind.valor < 60) { status = "warning"; text = "Bajo"; }
            else if (ind.valor > 100) { status = "warning"; text = "Sobresaturación"; }
        }

        const styles: Record<string, string> = {
            good: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
            warning: "bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 border-amber-200 dark:border-amber-800",
            danger: "bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400 border-rose-200 dark:border-rose-800"
        };

        return (
            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border uppercase tracking-wider ${styles[status]}`}>
                {text}
            </span>
        );
    };

    return (
        <div className="space-y-6">
            {/* Search Filter Form */}
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800">
                <div className="flex flex-wrap gap-4 items-end">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Mes</label>
                        <select 
                            value={month} 
                            onChange={(e) => setMonth(Number(e.target.value))}
                            className="w-40 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm font-medium"
                        >
                            {months.map((m, i) => <option key={i} value={i+1}>{m}</option>)}
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Año</label>
                        <input 
                            type="number" 
                            value={year} 
                            onChange={(e) => setYear(Number(e.target.value))}
                            className="w-24 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm font-medium"
                        />
                    </div>
                    <button 
                        onClick={handleSearch} 
                        disabled={isPending}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg flex items-center gap-2 disabled:opacity-50 transition-colors shadow-sm text-sm"
                    >
                        {isPending ? <Loader2 className="animate-spin w-4 h-4" /> : <Search className="w-4 h-4" />}
                        Calcular Indicadores
                    </button>
                    {reportData && (
                        <button 
                            onClick={handleExport}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-6 rounded-lg flex items-center gap-2 transition-colors shadow-sm text-sm"
                        >
                            <FileSpreadsheet className="w-4 h-4" />
                            Exportar Excel
                        </button>
                    )}
                </div>
            </div>

            {/* KPI Overview Grid */}
            {hasLoaded && reportData && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-gradient-to-br from-blue-50 to-white dark:from-zinc-900 dark:to-zinc-800/20 p-5 rounded-2xl border border-blue-100 dark:border-zinc-800 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                            <Activity size={24} />
                        </div>
                        <div>
                            <span className="text-[10px] uppercase tracking-wider font-bold text-zinc-500">Cirugías Realizadas</span>
                            <h4 className="text-2xl font-black text-zinc-850 dark:text-white mt-1">{reportData.totalEjecutadas}</h4>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-rose-50 to-white dark:from-zinc-900 dark:to-zinc-800/20 p-5 rounded-2xl border border-rose-100 dark:border-zinc-800 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                            <AlertCircle size={24} />
                        </div>
                        <div>
                            <span className="text-[10px] uppercase tracking-wider font-bold text-zinc-500">Suspensiones</span>
                            <h4 className="text-2xl font-black text-zinc-850 dark:text-white mt-1">{reportData.totalCanceladas}</h4>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-purple-50 to-white dark:from-zinc-900 dark:to-zinc-800/20 p-5 rounded-2xl border border-purple-100 dark:border-zinc-800 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                            <Users size={24} />
                        </div>
                        <div>
                            <span className="text-[10px] uppercase tracking-wider font-bold text-zinc-500">Pacientes Únicos</span>
                            <h4 className="text-2xl font-black text-zinc-850 dark:text-white mt-1">{reportData.pacientesUnicos}</h4>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-indigo-50 to-white dark:from-zinc-900 dark:to-zinc-800/20 p-5 rounded-2xl border border-indigo-100 dark:border-zinc-800 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                            <TrendingUp size={24} />
                        </div>
                        <div>
                            <span className="text-[10px] uppercase tracking-wider font-bold text-zinc-500">Ingresos a URPA</span>
                            <h4 className="text-2xl font-black text-zinc-850 dark:text-white mt-1">{reportData.pacientesUrpa}</h4>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Indicators Table */}
            {hasLoaded && reportData && (
                <div className="bg-white dark:bg-zinc-900 shadow-xl border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden">
                    <div className="p-6 bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h2 className="text-lg font-black uppercase tracking-widest text-zinc-800 dark:text-white">Hospital Tarapoto II - 2</h2>
                            <h3 className="text-sm font-bold text-blue-600 dark:text-blue-400 uppercase mt-0.5">Indicadores del Centro Quirúrgico</h3>
                        </div>
                        <span className="bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-300 font-bold px-3 py-1.5 rounded-lg text-xs border border-zinc-300/40 uppercase tracking-widest">
                            {months[month-1]} {year}
                        </span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-xs border-collapse">
                            <thead>
                                <tr className="bg-zinc-800 text-white dark:bg-zinc-950 uppercase tracking-wider text-[10px]">
                                    <th className="px-4 py-3 text-center border-b border-zinc-700 w-10">N°</th>
                                    <th className="px-4 py-3 text-left border-b border-zinc-700">Indicador</th>
                                    <th className="px-4 py-3 text-left border-b border-zinc-700 hidden lg:table-cell">Fórmula de Cálculo</th>
                                    <th className="px-4 py-3 text-center border-b border-zinc-700">Numerador</th>
                                    <th className="px-4 py-3 text-center border-b border-zinc-700">Denominador</th>
                                    <th className="px-4 py-3 text-center border-b border-zinc-700 w-28">Resultado</th>
                                    <th className="px-4 py-3 text-center border-b border-zinc-700 w-24">Estado</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                                {reportData.indicadores.map((ind: any) => (
                                    <tr key={ind.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors font-medium">
                                        <td className="px-4 py-3 text-center font-bold text-zinc-400 border-r border-zinc-100 dark:border-zinc-800/40">{ind.id}</td>
                                        <td className="px-4 py-3 text-left font-bold text-zinc-850 dark:text-zinc-150">
                                            {ind.nombre}
                                        </td>
                                        <td className="px-4 py-3 text-left text-zinc-500 font-mono hidden lg:table-cell">
                                            <span className="flex items-center gap-1.5">
                                                <HelpCircle size={12} className="shrink-0 text-zinc-400" />
                                                {ind.formula}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-center font-semibold text-zinc-600 dark:text-zinc-400">{ind.numerador}</td>
                                        <td className="px-4 py-3 text-center font-semibold text-zinc-600 dark:text-zinc-400">{ind.denominador}</td>
                                        <td className="px-4 py-3 text-center font-black text-sm text-blue-700 dark:text-blue-400 bg-blue-50/20 dark:bg-blue-900/5">
                                            {ind.valor} <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{ind.unidad}</span>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            {getStatusBadge(ind)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
