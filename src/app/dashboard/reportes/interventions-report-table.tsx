"use client";

import { useState, useTransition, Fragment } from "react";
import { fetchInterventionsReport } from "@/app/actions/indicadores";
import { Search, Loader2, FileSpreadsheet, AlertCircle } from "lucide-react";

export function InterventionsReportTable() {
    const now = new Date();
    const [month, setMonth] = useState(now.getMonth() + 1);
    const [year, setYear] = useState(now.getFullYear());
    const [data, setData] = useState<{
        groupedBySpecialty: Record<string, { interventionName: string, count: number }[]>;
        summary?: {
            totalProgramadas: number;
            suspensiones: { reason: string; count: number }[];
            totalRealizadas: number;
        };
    }>({ groupedBySpecialty: {} });
    const [isPending, startTransition] = useTransition();
    const [hasLoaded, setHasLoaded] = useState(false);

    const months = [
        "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
        "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];

    function handleSearch() {
        startTransition(async () => {
            const results = await fetchInterventionsReport(month, year);
            setData(results);
            setHasLoaded(true);
        });
    }

    // Helper to get Excel column letter from 1-based index
    function getColumnLetter(colIndex: number): string {
        let temp = colIndex;
        let letter = '';
        while (temp > 0) {
            let modulo = (temp - 1) % 26;
            letter = String.fromCharCode(65 + modulo) + letter;
            temp = Math.floor((temp - modulo) / 26);
        }
        return letter;
    }

    function cleanSpecialtyName(name: string): string {
        const upper = name.toUpperCase();
        if (upper === 'GINECOLOGIA Y OBSTETRICIA') return 'GINECOLOGÍA';
        if (upper === 'TRAUMATOLOGIA Y ORTOPEDIA') return 'TRAUMATOLOGÍA';
        if (upper === 'CIRUGIA GENERAL') return 'CIRUGÍA GENERAL';
        if (upper === 'CIRUGIA PEDIATRICA') return 'CIRUGÍA PEDIÁTRICA';
        if (upper === 'CIRUGIA DE CABEZA, CUELLO Y MAXILOFACIAL') return 'CIRUGÍA CABEZA Y CUELLO';
        if (upper === 'CIRUGIA ONCOLOGICA') return 'CIRUGÍA ONCOLÓGICA';
        if (upper === 'UROLOGIA') return 'UROLOGÍA';
        
        return name.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase());
    }

    async function handleExport() {
        const specialties = Object.keys(data.groupedBySpecialty).sort();
        if (specialties.length === 0) return;

        const maxRows = Math.max(...specialties.map(spec => data.groupedBySpecialty[spec].length), 0);
        const totalCols = specialties.length * 2;
        const lastColLetter = getColumnLetter(totalCols);

        const ExcelJS = (await import('exceljs')).default;
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('Intervenciones');

        // Enable grid lines explicitly
        sheet.views = [{ showGridLines: true }];

        // Header Title
        sheet.mergeCells(`A1:${lastColLetter}1`);
        sheet.getCell('A1').value = 'HOSPITAL TARAPOTO II - 2';
        sheet.getCell('A1').alignment = { vertical: 'middle', horizontal: 'center' };
        sheet.getCell('A1').font = { bold: true, size: 13, color: { argb: 'FF1E293B' } };

        sheet.mergeCells(`A2:${lastColLetter}2`);
        sheet.getCell('A2').value = 'CUADRO DE INTERVENCIONES QUIRÚRGICAS POR ESPECIALIDAD';
        sheet.getCell('A2').alignment = { vertical: 'middle', horizontal: 'center' };
        sheet.getCell('A2').font = { bold: true, size: 11, color: { argb: 'FF475569' } };

        sheet.mergeCells(`A3:${lastColLetter}3`);
        sheet.getCell('A3').value = `${months[month-1].toUpperCase()} ${year}`;
        sheet.getCell('A3').alignment = { vertical: 'middle', horizontal: 'center' };
        sheet.getCell('A3').font = { bold: true, size: 10, color: { argb: 'FF64748B' } };

        sheet.getRow(1).height = 25;
        sheet.getRow(2).height = 20;
        sheet.getRow(3).height = 20;
        sheet.getRow(4).height = 10; // Empty spacer row

        // Row 5: Specialty Headers
        const headerRow5 = sheet.getRow(5);
        headerRow5.height = 28;

        specialties.forEach((spec, sIdx) => {
            const startCol = sIdx * 2 + 1;
            const endCol = sIdx * 2 + 2;
            const startLetter = getColumnLetter(startCol);
            const endLetter = getColumnLetter(endCol);
            
            sheet.mergeCells(`${startLetter}5:${endLetter}5`);
            const cell = sheet.getCell(`${startLetter}5`);
            cell.value = cleanSpecialtyName(spec).toUpperCase();
            cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 9 };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF312E81' } }; // Dark Indigo
            cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
            cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
            };
            
            // Border for the second cell in merged group since ExcelJS requires applying borders on both
            const secondCell = sheet.getCell(`${endLetter}5`);
            secondCell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
            };
        });

        // Row 6: Sub-headers (INTERVENCIÓN, CANT.)
        const headerRow6 = sheet.getRow(6);
        headerRow6.height = 22;

        specialties.forEach((_, sIdx) => {
            const startCol = sIdx * 2 + 1;
            const endCol = sIdx * 2 + 2;
            const colLetter1 = getColumnLetter(startCol);
            const colLetter2 = getColumnLetter(endCol);

            const cell1 = sheet.getCell(`${colLetter1}6`);
            cell1.value = 'INTERVENCIÓN';
            cell1.font = { bold: true, size: 8, color: { argb: 'FFFFFFFF' } };
            cell1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F46E5' } }; // Indigo-600
            cell1.alignment = { horizontal: 'center', vertical: 'middle' };
            cell1.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
            };

            const cell2 = sheet.getCell(`${colLetter2}6`);
            cell2.value = 'CANT.';
            cell2.font = { bold: true, size: 8, color: { argb: 'FFFFFFFF' } };
            cell2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F46E5' } };
            cell2.alignment = { horizontal: 'center', vertical: 'middle' };
            cell2.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
            };
        });

        // Data Rows starting from Row 7
        for (let rIdx = 0; rIdx < maxRows; rIdx++) {
            const dataRow = sheet.getRow(7 + rIdx);
            dataRow.height = 20;

            specialties.forEach((spec, sIdx) => {
                const startCol = sIdx * 2 + 1;
                const endCol = sIdx * 2 + 2;
                const colLetter1 = getColumnLetter(startCol);
                const colLetter2 = getColumnLetter(endCol);

                const item = data.groupedBySpecialty[spec][rIdx];
                const cell1 = sheet.getCell(`${colLetter1}${7 + rIdx}`);
                const cell2 = sheet.getCell(`${colLetter2}${7 + rIdx}`);

                cell1.value = item ? item.interventionName : '';
                cell1.font = { size: 9 };
                cell1.alignment = { horizontal: 'left', vertical: 'middle' };
                cell1.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' }
                };

                cell2.value = item ? item.count : '';
                cell2.font = { size: 9, bold: item ? true : false };
                cell2.alignment = { horizontal: 'center', vertical: 'middle' };
                cell2.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' }
                };
            });
        }

        // Totals Row at the bottom of data
        const totalRowIdx = 7 + maxRows;
        const totalRow = sheet.getRow(totalRowIdx);
        totalRow.height = 22;

        specialties.forEach((spec, sIdx) => {
            const startCol = sIdx * 2 + 1;
            const endCol = sIdx * 2 + 2;
            const colLetter1 = getColumnLetter(startCol);
            const colLetter2 = getColumnLetter(endCol);

            const specTotal = data.groupedBySpecialty[spec].reduce((sum, item) => sum + item.count, 0);

            const cell1 = sheet.getCell(`${colLetter1}${totalRowIdx}`);
            cell1.value = 'TOTAL';
            cell1.font = { bold: true, size: 9, color: { argb: 'FF1E293B' } };
            cell1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } }; // slate-100
            cell1.alignment = { horizontal: 'right', vertical: 'middle' };
            cell1.border = {
                top: { style: 'medium' },
                left: { style: 'thin' },
                bottom: { style: 'medium' },
                right: { style: 'thin' }
            };

            const cell2 = sheet.getCell(`${colLetter2}${totalRowIdx}`);
            cell2.value = specTotal;
            cell2.font = { bold: true, size: 9, color: { argb: 'FF1D4ED8' } }; // blue-700
            cell2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } }; // slate-200
            cell2.alignment = { horizontal: 'center', vertical: 'middle' };
            cell2.border = {
                top: { style: 'medium' },
                left: { style: 'thin' },
                bottom: { style: 'medium' },
                right: { style: 'thin' }
            };
        });

        // 5. Write Summary of Surgical Activity Block in columns A & B
        if (data.summary) {
            const summaryStartRow = totalRowIdx + 2;
            
            // Row TOTAL INTERVENCIONES PROGRAMADAS
            const rProg = sheet.getRow(summaryStartRow);
            rProg.height = 20;
            const cellProgLabel = sheet.getCell(`A${summaryStartRow}`);
            const cellProgVal = sheet.getCell(`B${summaryStartRow}`);
            
            cellProgLabel.value = 'TOTAL INTERVENCIONES PROGRAMADAS';
            cellProgLabel.font = { bold: true, size: 9, color: { argb: 'FF1E293B' } };
            cellProgLabel.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } }; // slate-100
            cellProgLabel.alignment = { horizontal: 'left', vertical: 'middle' };
            cellProgLabel.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
            
            cellProgVal.value = data.summary.totalProgramadas;
            cellProgVal.font = { bold: true, size: 9 };
            cellProgVal.alignment = { horizontal: 'center', vertical: 'middle' };
            cellProgVal.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };

            // Row INTERVENCIONES SUSPENDIDAS (Merged A:B)
            const rSuspHeaderIdx = summaryStartRow + 1;
            sheet.mergeCells(`A${rSuspHeaderIdx}:B${rSuspHeaderIdx}`);
            const cellSuspHeader = sheet.getCell(`A${rSuspHeaderIdx}`);
            cellSuspHeader.value = 'INTERVENCIONES SUSPENDIDAS';
            cellSuspHeader.font = { bold: true, size: 8, color: { argb: 'FF475569' } };
            cellSuspHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } }; // slate-200
            cellSuspHeader.alignment = { horizontal: 'left', vertical: 'middle' };
            cellSuspHeader.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
            
            const cellSuspHeaderB = sheet.getCell(`B${rSuspHeaderIdx}`);
            cellSuspHeaderB.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };

            let currentIdx = rSuspHeaderIdx + 1;
            
            // Suspension Reasons (Alineados con sangría)
            data.summary.suspensiones.forEach((susp) => {
                const rSusp = sheet.getRow(currentIdx);
                rSusp.height = 18;
                
                const cellLabel = sheet.getCell(`A${currentIdx}`);
                const cellVal = sheet.getCell(`B${currentIdx}`);
                
                cellLabel.value = `  ${susp.reason.toUpperCase()}`;
                cellLabel.font = { size: 9 };
                cellLabel.alignment = { horizontal: 'left', vertical: 'middle' };
                cellLabel.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
                
                cellVal.value = susp.count;
                cellVal.font = { size: 9, bold: true };
                cellVal.alignment = { horizontal: 'center', vertical: 'middle' };
                cellVal.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
                
                currentIdx++;
            });

            if (data.summary.suspensiones.length === 0) {
                const rEmpty = sheet.getRow(currentIdx);
                rEmpty.height = 18;
                sheet.mergeCells(`A${currentIdx}:B${currentIdx}`);
                const cellEmpty = sheet.getCell(`A${currentIdx}`);
                cellEmpty.value = '  No se registraron suspensiones';
                cellEmpty.font = { italic: true, size: 9, color: { argb: 'FF94A3B8' } };
                cellEmpty.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
                
                const cellEmptyB = sheet.getCell(`B${currentIdx}`);
                cellEmptyB.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
                currentIdx++;
            }

            // Small spacer row before total realized (no content, just borderless empty)
            const rSpacer = sheet.getRow(currentIdx);
            rSpacer.height = 10;
            currentIdx++;

            // Row TOTAL INTERVENCIONES REALIZADAS
            const rRealizadas = sheet.getRow(currentIdx);
            rRealizadas.height = 20;
            const cellRealLabel = sheet.getCell(`A${currentIdx}`);
            const cellRealVal = sheet.getCell(`B${currentIdx}`);
            
            cellRealLabel.value = 'TOTAL INTERVENCIONES REALIZADAS';
            cellRealLabel.font = { bold: true, size: 9, color: { argb: 'FF1D4ED8' } }; // blue-700
            cellRealLabel.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEFF6FF' } }; // blue-50
            cellRealLabel.alignment = { horizontal: 'left', vertical: 'middle' };
            cellRealLabel.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
            
            cellRealVal.value = data.summary.totalRealizadas;
            cellRealVal.font = { bold: true, size: 9, color: { argb: 'FF1D4ED8' } };
            cellRealVal.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDBEAFE' } }; // blue-100
            cellRealVal.alignment = { horizontal: 'center', vertical: 'middle' };
            cellRealVal.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
        }

        // Configure Column Widths (dynamic based on content, but minimum limits)
        specialties.forEach((_, sIdx) => {
            const startCol = sIdx * 2 + 1;
            const endCol = sIdx * 2 + 2;
            
            sheet.getColumn(startCol).width = 38; // Intervention name column (wide)
            sheet.getColumn(endCol).width = 8;    // Count column (narrow)
        });

        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `Cuadro_Intervenciones_CQ_${months[month-1]}_${year}.xlsx`;
        link.click();
    }

    const specialties = Object.keys(data.groupedBySpecialty).sort();
    const maxRows = specialties.length > 0 ? Math.max(...specialties.map(spec => data.groupedBySpecialty[spec].length), 0) : 0;

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
                    {specialties.length > 0 && (
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

            {hasLoaded && specialties.length === 0 && (
                <div className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 p-8 rounded-2xl text-center text-zinc-500 dark:text-zinc-400 font-medium flex items-center justify-center gap-2">
                    <AlertCircle className="w-5 h-5 text-zinc-400" />
                    No se registraron intervenciones quirúrgicas efectivas para el periodo seleccionado.
                </div>
            )}

            {hasLoaded && specialties.length > 0 && data.summary && (
                <div className="flex flex-col gap-8">
                    <div className="bg-white dark:bg-zinc-900 shadow-xl border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden">
                        <div className="p-6 bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-700 text-center">
                            <h2 className="text-lg font-black uppercase tracking-widest text-zinc-800 dark:text-white">Hospital Tarapoto II - 2</h2>
                            <h3 className="text-md font-bold text-blue-600 dark:text-blue-400 uppercase">Cuadro de Intervenciones Quirúrgicas por Especialidad</h3>
                            <p className="text-xs font-bold text-zinc-500 mt-1 uppercase">{months[month-1]} {year}</p>
                        </div>

                        <div className="overflow-x-auto w-full">
                            <table className="w-full text-xs text-center border-collapse table-fixed">
                                <thead>
                                    {/* Specialty header row */}
                                    <tr className="bg-zinc-800 dark:bg-zinc-950 text-white font-bold border-b border-zinc-700">
                                        {specialties.map((spec, idx) => (
                                            <th key={idx} colSpan={2} className="px-3 py-3 border border-zinc-700/50 truncate w-[320px]" title={spec}>
                                                {cleanSpecialtyName(spec).toUpperCase()}
                                            </th>
                                        ))}
                                    </tr>
                                    {/* Sub-headers row */}
                                    <tr className="bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 font-bold border-b border-zinc-200 dark:border-zinc-800 text-[10px]">
                                        {specialties.map((_, idx) => (
                                            <Fragment key={`sub-${idx}`}>
                                                <th className="px-3 py-2 text-left border border-zinc-200 dark:border-zinc-800/50 w-[260px]">INTERVENCIÓN</th>
                                                <th className="px-1 py-2 border border-zinc-200 dark:border-zinc-800/50 w-[60px]">CANT.</th>
                                            </Fragment>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                                    {Array.from({ length: maxRows }).map((_, rIdx) => (
                                        <tr key={rIdx} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors font-medium">
                                            {specialties.map((spec, sIdx) => {
                                                const item = data.groupedBySpecialty[spec][rIdx];
                                                return (
                                                    <Fragment key={`cell-${sIdx}`}>
                                                        <td className="px-3 py-2 text-left border border-zinc-200 dark:border-zinc-800 truncate" title={item?.interventionName || ""}>
                                                            {item ? item.interventionName : ""}
                                                        </td>
                                                        <td className="px-2 py-2 border border-zinc-200 dark:border-zinc-800 font-bold bg-zinc-50/50 dark:bg-zinc-800/20">
                                                            {item ? item.count : ""}
                                                        </td>
                                                    </Fragment>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr className="bg-zinc-100 dark:bg-zinc-800/80 font-black text-sm border-t-2 border-zinc-300 dark:border-zinc-700">
                                        {specialties.map((spec, idx) => {
                                            const specTotal = data.groupedBySpecialty[spec].reduce((sum, item) => sum + item.count, 0);
                                            return (
                                                <Fragment key={`foot-${idx}`}>
                                                    <td className="px-3 py-2 text-right border border-zinc-200 dark:border-zinc-800">TOTAL</td>
                                                    <td className="px-2 py-2 border border-zinc-200 dark:border-zinc-800 font-black text-blue-600 dark:text-blue-400 bg-blue-50/30 dark:bg-blue-900/10">
                                                        {specTotal}
                                                    </td>
                                                </Fragment>
                                            );
                                        })}
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>

                    {/* Summary Block */}
                    <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 max-w-xl">
                        <h4 className="text-sm font-black text-zinc-800 dark:text-zinc-200 mb-4 uppercase tracking-wider">Resumen de Actividad Quirúrgica</h4>
                        <div className="border border-zinc-250 dark:border-zinc-800 rounded-xl overflow-hidden text-xs shadow-sm">
                            <table className="w-full text-left border-collapse">
                                <tbody>
                                    <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-850 font-bold">
                                        <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300 uppercase">TOTAL INTERVENCIONES PROGRAMADAS</td>
                                        <td className="px-4 py-3 text-center text-zinc-950 dark:text-white font-black w-24 border-l border-zinc-200 dark:border-zinc-800 text-sm bg-zinc-100/50 dark:bg-zinc-800/50">
                                            {data.summary.totalProgramadas}
                                        </td>
                                    </tr>
                                    <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-100/50 dark:bg-zinc-900/50 font-bold text-[10px] text-zinc-500 dark:text-zinc-400">
                                        <td colSpan={2} className="px-4 py-2 uppercase">INTERVENCIONES SUSPENDIDAS</td>
                                    </tr>
                                    {data.summary.suspensiones.map((susp, sIdx) => (
                                        <tr key={sIdx} className="border-b border-zinc-200 dark:border-zinc-850 text-zinc-650 dark:text-zinc-350">
                                            <td className="px-6 py-2.5 text-zinc-600 dark:text-zinc-400 pl-8 font-medium">{susp.reason.toUpperCase()}</td>
                                            <td className="px-4 py-2.5 text-center font-bold w-24 border-l border-zinc-200 dark:border-zinc-800">
                                                {susp.count}
                                            </td>
                                        </tr>
                                    ))}
                                    {data.summary.suspensiones.length === 0 && (
                                        <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 italic">
                                            <td colSpan={2} className="px-8 py-2.5 text-center">No se registraron suspensiones</td>
                                        </tr>
                                    )}
                                    <tr className="font-bold text-blue-600 dark:text-blue-400 bg-blue-50/10 dark:bg-blue-900/5">
                                        <td className="px-4 py-3 uppercase">TOTAL INTERVENCIONES REALIZADAS</td>
                                        <td className="px-4 py-3 text-center font-black w-24 border-l border-zinc-200 dark:border-zinc-800 bg-blue-50/20 dark:bg-blue-900/10 text-sm">
                                            {data.summary.totalRealizadas}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
