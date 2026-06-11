"use client";

import { useState, useTransition } from "react";
import { fetchInterventionIndicatorsReport } from "@/app/actions/indicadores";
import { Search, Loader2, FileSpreadsheet, AlertCircle } from "lucide-react";

export function InterventionIndicatorsReportTable() {
    const now = new Date();
    const [month, setMonth] = useState(now.getMonth() + 1);
    const [year, setYear] = useState(now.getFullYear());
    const [data, setData] = useState<any[]>([]);
    const [isPending, startTransition] = useTransition();
    const [hasLoaded, setHasLoaded] = useState(false);

    const months = [
        "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
        "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];

    function handleSearch() {
        startTransition(async () => {
            const results = await fetchInterventionIndicatorsReport(month, year);
            setData(results);
            setHasLoaded(true);
        });
    }

    async function handleExport() {
        if (data.length === 0) return;
        const ExcelJS = (await import('exceljs')).default;
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('Indicadores');

        // Header Title
        const titleCell = sheet.mergeCells('A1:L1');
        sheet.getCell('A1').value = `HOSPITAL TARAPOTO II - 2\nINDICADORES DEL CENTRO QUIRÚRGICO\nINTERVENCIONES QUIRÚRGICAS POR TIPO DE INTERVENCIÓN\n${months[month-1]} - ${year}`;
        sheet.getCell('A1').alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
        sheet.getCell('A1').font = { bold: true, size: 12 };
        sheet.getRow(1).height = 80;

        // Headers
        const headers = ['Tipos de Intervención', 'PROG.', 'SUSP.', 'EMG.', 'MUERTE EMER', 'LU PROG.', 'LU EMERG.', 'AMEU PROG.', 'AMEU EMERG.', 'TOTAL EFECTIVAS', 'TOTAL'];
        const headerRow = sheet.addRow(headers);
        headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 9 };
        headerRow.height = 35;
        headerRow.eachCell((cell, colNumber) => {
            let bgColor = 'FF602D8B'; // Púrpura base
            
            // Si el header contiene EMER o EMG o MUERTE, pintar de ROJO
            const headerText = cell.value?.toString().toUpperCase() || '';
            if (headerText.includes('EMERG') || headerText.includes('EMG') || headerText.includes('MUERTE')) {
                bgColor = 'FFFF0000';
            } else if (colNumber === 10) {
                bgColor = 'FF3D85C6'; // Total Efectivas (Azul)
            }
            
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
            cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
            cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
        });

        // Data
        data.forEach(item => {
            const row = sheet.addRow([
                item.tipoIntervencion, 
                item.prog || '', 
                item.susp || '', 
                item.emg || '', 
                item.muerteEmer || '', 
                item.luProg || '', 
                item.luEmer || '', 
                item.ameuProg || '', 
                item.ameuEmer || '', 
                item.totalEfectivas || '', 
                item.total || ''
            ]);
            row.font = { size: 9 };
            row.eachCell((cell, colNumber) => {
                cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
                cell.alignment = { horizontal: 'center', vertical: 'middle' };
                if (colNumber === 1) {
                    cell.alignment = { horizontal: 'left', vertical: 'middle' };
                }
            });
        });

        // Totals
        const totalProg = data.reduce((sum, i) => sum + i.prog, 0);
        const totalSusp = data.reduce((sum, i) => sum + i.susp, 0);
        const totalEmg = data.reduce((sum, i) => sum + i.emg, 0);
        const totalMuerte = data.reduce((sum, i) => sum + i.muerteEmer, 0);
        const totalLuProg = data.reduce((sum, i) => sum + i.luProg, 0);
        const totalLuEmer = data.reduce((sum, i) => sum + i.luEmer, 0);
        const totalAmeuProg = data.reduce((sum, i) => sum + i.ameuProg, 0);
        const totalAmeuEmer = data.reduce((sum, i) => sum + i.ameuEmer, 0);
        const totalEfectivas = data.reduce((sum, i) => sum + i.totalEfectivas, 0);
        const totalGral = data.reduce((sum, i) => sum + i.total, 0);

        const footerRow = sheet.addRow(['TOTAL', totalProg, totalSusp, totalEmg, totalMuerte, totalLuProg, totalLuEmer, totalAmeuProg, totalAmeuEmer, totalEfectivas, totalGral]);
        footerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 };
        footerRow.height = 25;
        footerRow.eachCell((cell, colNumber) => {
            let bgColor = 'FF602D8B'; // Púrpura base
            
            if ([4, 5, 7, 9].includes(colNumber)) { // EMG, MUERTE EMER, LU EMER, AMEU EMER
                bgColor = 'FFFF0000';
            } else if (colNumber === 10) {
                bgColor = 'FF3D85C6'; // Total Efectivas
            }
            
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
            cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
        });

        sheet.getColumn(1).width = 50; // Widen first column for intervention names
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `Indicadores_CQ_${months[month-1]}_${year}.xlsx`;
        link.click();
    }

    return (
        <div className="space-y-6">
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800">
                <div className="flex flex-wrap gap-4 items-end">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Mes</label>
                        <select 
                            value={month} 
                            onChange={(e) => setMonth(Number(e.target.value))}
                            className="w-40 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 p-2 rounded-lg text-sm text-zinc-900 dark:text-zinc-100"
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
                            className="w-24 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 p-2 rounded-lg text-sm text-zinc-900 dark:text-zinc-100"
                        />
                    </div>
                    <button 
                        onClick={handleSearch} 
                        disabled={isPending}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg text-sm flex items-center gap-2 disabled:opacity-50 transition-colors"
                    >
                        {isPending ? <Loader2 className="animate-spin w-4 h-4" /> : <Search className="w-4 h-4" />}
                        Generar Reporte
                    </button>
                    {data.length > 0 && (
                        <button 
                            onClick={handleExport}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-6 rounded-lg text-sm flex items-center gap-2 transition-colors"
                        >
                            <FileSpreadsheet className="w-4 h-4" />
                            Exportar Excel
                        </button>
                    )}
                </div>
            </div>

            {hasLoaded && data.length === 0 && (
                <div className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 p-8 rounded-2xl text-center text-zinc-500 dark:text-zinc-400 font-medium flex items-center justify-center gap-2">
                    <AlertCircle className="w-5 h-5 text-zinc-400" />
                    No se registraron intervenciones quirúrgicas en el periodo seleccionado.
                </div>
            )}

            {hasLoaded && data.length > 0 && (
                <div className="bg-white dark:bg-zinc-900 shadow-xl border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden overflow-x-auto">
                    <div className="p-6 bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-700 text-center">
                        <h2 className="text-lg font-black uppercase tracking-widest text-zinc-800 dark:text-white">Hospital Tarapoto II - 2</h2>
                        <h3 className="text-md font-bold text-blue-600 dark:text-blue-400 uppercase">Indicadores del Centro Quirúrgico</h3>
                        <p className="text-xs font-bold text-zinc-500 mt-1 uppercase">Intervenciones Quirúrgicas por Tipo de Intervención - {months[month-1]} {year}</p>
                    </div>
                    <table className="w-full text-xs text-center border-collapse">
                        <thead>
                            <tr className="bg-[#4B2C20] text-white">
                                <th className="px-4 py-3 text-left border border-zinc-300/30">TIPOS DE INTERVENCIÓN</th>
                                <th className="px-2 py-3 bg-[#5B2C6F] border border-zinc-300/30">PROG.</th>
                                <th className="px-2 py-3 bg-[#5B2C6F] border border-zinc-300/30">SUSP.</th>
                                <th className="px-2 py-3 bg-red-600 border border-zinc-300/30">EMG.</th>
                                <th className="px-2 py-3 bg-red-600 border border-zinc-300/30">MUERTE EMER</th>
                                <th className="px-2 py-3 bg-[#5B2C6F] border border-zinc-300/30">LU PROG.</th>
                                <th className="px-2 py-3 bg-red-600 border border-zinc-300/30">LU EMERG.</th>
                                <th className="px-2 py-3 bg-[#5B2C6F] border border-zinc-300/30">AMEU PROG.</th>
                                <th className="px-2 py-3 bg-red-600 border border-zinc-300/30">AMEU EMERG.</th>
                                <th className="px-2 py-3 bg-indigo-900 border border-zinc-300/30">TOTAL EFECTIVAS</th>
                                <th className="px-2 py-3 bg-[#5B2C6F] border border-zinc-300/30">TOTAL</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                            {data.map((item, idx) => (
                                <tr key={idx} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors font-medium">
                                    <td className="px-4 py-2 text-left bg-yellow-400/20 dark:bg-yellow-400/5 border border-zinc-200 dark:border-zinc-800 font-bold truncate max-w-[300px]" title={item.tipoIntervencion}>
                                        {item.tipoIntervencion}
                                    </td>
                                    <td className="px-2 py-2 border border-zinc-200 dark:border-zinc-800">{item.prog || '00'}</td>
                                    <td className="px-2 py-2 border border-zinc-200 dark:border-zinc-800">{item.susp || '00'}</td>
                                    <td className="px-2 py-2 border border-zinc-200 dark:border-zinc-800">{item.emg || '00'}</td>
                                    <td className="px-2 py-2 border border-zinc-200 dark:border-zinc-800">{item.muerteEmer || '00'}</td>
                                    <td className="px-2 py-2 border border-zinc-200 dark:border-zinc-800">{item.luProg || '00'}</td>
                                    <td className="px-2 py-2 border border-zinc-200 dark:border-zinc-800">{item.luEmer || '00'}</td>
                                    <td className="px-2 py-2 border border-zinc-200 dark:border-zinc-800">{item.ameuProg || '00'}</td>
                                    <td className="px-2 py-2 border border-zinc-200 dark:border-zinc-800">{item.ameuEmer || '00'}</td>
                                    <td className="px-2 py-2 border border-zinc-200 dark:border-zinc-800 font-bold bg-indigo-50 dark:bg-indigo-900/10">{item.totalEfectivas || '00'}</td>
                                    <td className="px-2 py-2 border border-zinc-200 dark:border-zinc-800 font-bold bg-zinc-100 dark:bg-zinc-800">{item.total || '00'}</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr className="bg-[#5B2C6F] text-white font-black text-sm">
                                <td className="px-4 py-3 text-left">TOTAL</td>
                                <td className="px-2 py-3">{data.reduce((s, i) => s + i.prog, 0)}</td>
                                <td className="px-2 py-3">{data.reduce((s, i) => s + i.susp, 0)}</td>
                                <td className="px-2 py-3 bg-red-600">{data.reduce((s, i) => s + i.emg, 0)}</td>
                                <td className="px-2 py-3 bg-red-600">{data.reduce((s, i) => s + i.muerteEmer, 0)}</td>
                                <td className="px-2 py-3">{data.reduce((s, i) => s + i.luProg, 0)}</td>
                                <td className="px-2 py-3 bg-red-600">{data.reduce((s, i) => s + i.luEmer, 0)}</td>
                                <td className="px-2 py-3">{data.reduce((s, i) => s + i.ameuProg, 0)}</td>
                                <td className="px-2 py-3 bg-red-600">{data.reduce((s, i) => s + i.ameuEmer, 0)}</td>
                                <td className="px-2 py-3">{data.reduce((s, i) => s + i.totalEfectivas, 0)}</td>
                                <td className="px-2 py-3">{data.reduce((s, i) => s + i.total, 0)}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            )}
        </div>
    );
}
