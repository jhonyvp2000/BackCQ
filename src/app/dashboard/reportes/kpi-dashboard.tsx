"use client";

import { useState, useEffect, useTransition } from "react";
import { fetchHospitalIndicatorsReport } from "@/app/actions/indicadores";
import { 
    BarChart3, Activity, Clock, AlertTriangle, CheckCircle2, 
    Calendar, Loader2, Award, Zap, TrendingUp, Users, HeartPulse, RefreshCw
} from "lucide-react";

export function KpiDashboard() {
    const now = new Date();
    const [month, setMonth] = useState(now.getMonth() + 1);
    const [year, setYear] = useState(now.getFullYear());
    const [reportData, setReportData] = useState<any>(null);
    const [isPending, startTransition] = useTransition();

    const months = [
        "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
        "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];

    const loadData = (m: number, y: number) => {
        startTransition(async () => {
            const data = await fetchHospitalIndicatorsReport(m, y);
            setReportData(data);
        });
    };

    useEffect(() => {
        loadData(month, year);
    }, [month, year]);

    // Extraer métricas si existen
    const findIndicator = (id: number) => {
        if (!reportData || !reportData.indicadores) return null;
        return reportData.indicadores.find((i: any) => i.id === id);
    };

    const indRend24h = findIndicator(1);
    const indRendEmerg = findIndicator(2);
    const indRendElect = findIndicator(3);
    const indSuspension = findIndicator(4);
    const indHorasEmerg = findIndicator(5);
    const indHorasElect = findIndicator(6);
    const indHorasTotal = findIndicator(7);
    const indCumplimiento = findIndicator(12);
    const indUrpaComplic = findIndicator(14);

    const suspValue = indSuspension?.valor || 0;
    const cumpliValue = indCumplimiento?.valor || 0;
    const horasTotalValue = indHorasTotal?.valor || 0;
    const urpaComplicValue = indUrpaComplic?.valor || 0;

    // Colores de Semáforo
    const getSuspensionBadge = (val: number) => {
        if (val < 5) return { bg: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800", text: "Excelente (<5%)", icon: CheckCircle2 };
        if (val <= 10) return { bg: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-800", text: "Aceptable (5-10%)", icon: AlertTriangle };
        return { bg: "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300 border-red-200 dark:border-red-800", text: "Crítico (>10%)", icon: AlertTriangle };
    };

    const getCumplimientoBadge = (val: number) => {
        if (val >= 90) return { bg: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800", text: "Óptimo (≥90%)" };
        if (val >= 75) return { bg: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-800", text: "Regular (75-89%)" };
        return { bg: "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300 border-red-200 dark:border-red-800", text: "Bajo (<75%)" };
    };

    const suspStatus = getSuspensionBadge(suspValue);
    const cumpliStatus = getCumplimientoBadge(cumpliValue);

    return (
        <div className="space-y-8 animate-in fade-in duration-300">
            {/* Header & Filter Controls */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                <div>
                    <h2 className="text-lg font-black text-zinc-900 dark:text-white flex items-center gap-2">
                        <BarChart3 className="text-blue-600 dark:text-blue-400" size={22} />
                        Tablero Ejecutivo de KPIs Quirúrgicos
                    </h2>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 font-medium">
                        Monitoreo integral de puntualidad, uso eficiente de quirófanos y calidad hospitalaria
                    </p>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-800/80 p-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700">
                        <Calendar size={14} className="text-zinc-400 ml-1" />
                        <select
                            value={month}
                            onChange={(e) => setMonth(Number(e.target.value))}
                            className="bg-transparent text-xs font-bold text-zinc-800 dark:text-zinc-200 focus:outline-none cursor-pointer pr-1"
                        >
                            {months.map((m, idx) => (
                                <option key={idx} value={idx + 1} className="bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200">
                                    {m}
                                </option>
                            ))}
                        </select>
                        <select
                            value={year}
                            onChange={(e) => setYear(Number(e.target.value))}
                            className="bg-transparent text-xs font-bold text-zinc-800 dark:text-zinc-200 focus:outline-none cursor-pointer"
                        >
                            {[2024, 2025, 2026, 2027].map((y) => (
                                <option key={y} value={y} className="bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200">
                                    {y}
                                </option>
                            ))}
                        </select>
                    </div>

                    <button
                        onClick={() => loadData(month, year)}
                        disabled={isPending}
                        className="p-2.5 rounded-xl text-blue-600 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 transition-colors disabled:opacity-50"
                        title="Actualizar datos"
                    >
                        <RefreshCw size={16} className={isPending ? "animate-spin" : ""} />
                    </button>
                </div>
            </div>

            {isPending && !reportData ? (
                <div className="py-20 flex flex-col items-center justify-center space-y-3">
                    <Loader2 size={32} className="animate-spin text-blue-600" />
                    <p className="text-xs font-bold text-zinc-500">Calculando indicadores hospitalarios...</p>
                </div>
            ) : reportData ? (
                <>
                    {/* KPI Cards Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                        {/* 1. Total Cirugías Ejecutadas */}
                        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm relative overflow-hidden group">
                            <div className="flex justify-between items-start">
                                <div>
                                    <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">Cirugías Ejecutadas</span>
                                    <h3 className="text-3xl font-black text-zinc-900 dark:text-white mt-1">
                                        {reportData.totalEjecutadas}
                                    </h3>
                                </div>
                                <div className="p-3 bg-blue-50 dark:bg-blue-950/50 text-blue-600 rounded-xl">
                                    <Activity size={20} />
                                </div>
                            </div>
                            <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between text-xs text-zinc-500">
                                <span>Pacientes Únicos: <strong className="text-zinc-800 dark:text-zinc-200 font-bold">{reportData.pacientesUnicos}</strong></span>
                                <span className="text-emerald-600 dark:text-emerald-400 font-bold">100% Registro</span>
                            </div>
                        </div>

                        {/* 2. Tasa de Suspensión Quirúrgica */}
                        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm relative overflow-hidden group">
                            <div className="flex justify-between items-start">
                                <div>
                                    <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">Tasa de Suspensión</span>
                                    <h3 className="text-3xl font-black text-zinc-900 dark:text-white mt-1">
                                        {suspValue}%
                                    </h3>
                                </div>
                                <div className="p-3 bg-rose-50 dark:bg-rose-950/50 text-rose-600 rounded-xl">
                                    <AlertTriangle size={20} />
                                </div>
                            </div>
                            <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between text-xs">
                                <span className="text-zinc-500">Canceladas: <strong className="text-rose-600 font-bold">{reportData.totalCanceladas}</strong></span>
                                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${suspStatus.bg}`}>
                                    {suspStatus.text}
                                </span>
                            </div>
                        </div>

                        {/* 3. Grado de Cumplimiento de Programación */}
                        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm relative overflow-hidden group">
                            <div className="flex justify-between items-start">
                                <div>
                                    <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">Cumplimiento Electivas</span>
                                    <h3 className="text-3xl font-black text-zinc-900 dark:text-white mt-1">
                                        {cumpliValue}%
                                    </h3>
                                </div>
                                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 rounded-xl">
                                    <Award size={20} />
                                </div>
                            </div>
                            <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between text-xs">
                                <span className="text-zinc-500">Programadas: <strong className="text-zinc-800 dark:text-zinc-200 font-bold">{reportData.totalProgramadasElectivas}</strong></span>
                                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${cumpliStatus.bg}`}>
                                    {cumpliStatus.text}
                                </span>
                            </div>
                        </div>

                        {/* 4. Porcentaje de Horas Efectivas Quirúrgicas */}
                        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm relative overflow-hidden group">
                            <div className="flex justify-between items-start">
                                <div>
                                    <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">Uso Efectivo de Quirófanos</span>
                                    <h3 className="text-3xl font-black text-zinc-900 dark:text-white mt-1">
                                        {horasTotalValue}%
                                    </h3>
                                </div>
                                <div className="p-3 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 rounded-xl">
                                    <Clock size={20} />
                                </div>
                            </div>
                            <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between text-xs text-zinc-500">
                                <span>Salas Activas: <strong className="text-zinc-800 dark:text-zinc-200 font-bold">5 Quirófanos</strong></span>
                                <span className="text-indigo-600 dark:text-indigo-400 font-bold">{indHorasTotal?.numerador || 0}h Ocupadas</span>
                            </div>
                        </div>
                    </div>

                    {/* Interactive Progress & Distribution Charts */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Rendimiento por Sala */}
                        <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-5">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h3 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                                        <Zap size={16} className="text-amber-500" />
                                        Rendimiento Promedio por Quirófano (Operaciones / Sala)
                                    </h3>
                                    <p className="text-xs text-zinc-500 mt-0.5">Promedio mensual de operaciones por sala según tipo de atención</p>
                                </div>
                            </div>

                            <div className="space-y-4 pt-2">
                                {/* Rendimiento 24h Consolidado */}
                                <div>
                                    <div className="flex justify-between text-xs font-bold mb-1.5">
                                        <span className="text-zinc-700 dark:text-zinc-300">Todas las Salas (5 Quirófanos)</span>
                                        <span className="text-blue-600 dark:text-blue-400">{indRend24h?.valor || 0} op/sala</span>
                                    </div>
                                    <div className="w-full h-3 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-blue-600 rounded-full transition-all duration-500" 
                                            style={{ width: `${Math.min(100, ((indRend24h?.valor || 0) / 40) * 100)}%` }}
                                        ></div>
                                    </div>
                                </div>

                                {/* Rendimiento Electivo (3 salas) */}
                                <div>
                                    <div className="flex justify-between text-xs font-bold mb-1.5">
                                        <span className="text-zinc-700 dark:text-zinc-300">Salas Electivas (3 Quirófanos)</span>
                                        <span className="text-emerald-600 dark:text-emerald-400">{indRendElect?.valor || 0} op/sala</span>
                                    </div>
                                    <div className="w-full h-3 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-emerald-500 rounded-full transition-all duration-500" 
                                            style={{ width: `${Math.min(100, ((indRendElect?.valor || 0) / 40) * 100)}%` }}
                                        ></div>
                                    </div>
                                </div>

                                {/* Rendimiento Emergencia (2 salas) */}
                                <div>
                                    <div className="flex justify-between text-xs font-bold mb-1.5">
                                        <span className="text-zinc-700 dark:text-zinc-300">Salas de Emergencia (2 Quirófanos)</span>
                                        <span className="text-purple-600 dark:text-purple-400">{indRendEmerg?.valor || 0} op/sala</span>
                                    </div>
                                    <div className="w-full h-3 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-purple-500 rounded-full transition-all duration-500" 
                                            style={{ width: `${Math.min(100, ((indRendEmerg?.valor || 0) / 40) * 100)}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Ocupación de Horas Quirúrgicas Efectivas */}
                        <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-5">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h3 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                                        <Clock size={16} className="text-indigo-500" />
                                        Porcentaje de Horas Efectivas de Quirófano
                                    </h3>
                                    <p className="text-xs text-zinc-500 mt-0.5">Uso real del tiempo de quirófano sobre la disponibilidad total programada</p>
                                </div>
                            </div>

                            <div className="space-y-4 pt-2">
                                {/* Horas Efectivas Electivas */}
                                <div>
                                    <div className="flex justify-between text-xs font-bold mb-1.5">
                                        <span className="text-zinc-700 dark:text-zinc-300">Electivas ({indHorasElect?.numerador || 0}h / {indHorasElect?.denominador || 0}h)</span>
                                        <span className="text-indigo-600 dark:text-indigo-400">{indHorasElect?.valor || 0}%</span>
                                    </div>
                                    <div className="w-full h-3 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-indigo-600 rounded-full transition-all duration-500" 
                                            style={{ width: `${Math.min(100, indHorasElect?.valor || 0)}%` }}
                                        ></div>
                                    </div>
                                </div>

                                {/* Horas Efectivas Emergencias */}
                                <div>
                                    <div className="flex justify-between text-xs font-bold mb-1.5">
                                        <span className="text-zinc-700 dark:text-zinc-300">Emergencias ({indHorasEmerg?.numerador || 0}h / {indHorasEmerg?.denominador || 0}h)</span>
                                        <span className="text-rose-600 dark:text-rose-400">{indHorasEmerg?.valor || 0}%</span>
                                    </div>
                                    <div className="w-full h-3 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-rose-500 rounded-full transition-all duration-500" 
                                            style={{ width: `${Math.min(100, indHorasEmerg?.valor || 0)}%` }}
                                        ></div>
                                    </div>
                                </div>

                                {/* Consolidado Hospitalario */}
                                <div>
                                    <div className="flex justify-between text-xs font-bold mb-1.5">
                                        <span className="text-zinc-700 dark:text-zinc-300">Consolidado Total Centro Quirúrgico</span>
                                        <span className="text-emerald-600 dark:text-emerald-400">{horasTotalValue}%</span>
                                    </div>
                                    <div className="w-full h-3 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-emerald-500 rounded-full transition-all duration-500" 
                                            style={{ width: `${Math.min(100, horasTotalValue)}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Metas Hospitalarias y Estándares de Calidad MINSA Table */}
                    <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                                    <HeartPulse size={18} className="text-rose-600" />
                                    Evaluación de Estándares de Calidad Quirúrgica (Metas MINSA / Hospitalarias)
                                </h3>
                                <p className="text-xs text-zinc-500 mt-0.5">Indicadores clave evaluados contra los estándares oficiales de gestión en salud</p>
                            </div>
                        </div>

                        <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-zinc-100 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-300 font-bold border-b border-zinc-200 dark:border-zinc-700">
                                    <tr>
                                        <th className="p-3">Indicador de Rendimiento / Calidad</th>
                                        <th className="p-3 text-center">Meta Estándar</th>
                                        <th className="p-3 text-center">Resultado Obtenido</th>
                                        <th className="p-3 text-center">Estado de Calidad</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 font-medium">
                                    <tr className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40">
                                        <td className="p-3 font-bold text-zinc-800 dark:text-zinc-200">
                                            Porcentaje de Cirugías Canceladas / Suspendidas
                                        </td>
                                        <td className="p-3 text-center font-mono text-zinc-600 dark:text-zinc-400">&lt; 5.0%</td>
                                        <td className="p-3 text-center font-bold text-zinc-900 dark:text-white">{suspValue}%</td>
                                        <td className="p-3 text-center">
                                            <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${suspStatus.bg}`}>
                                                {suspStatus.text}
                                            </span>
                                        </td>
                                    </tr>
                                    <tr className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40">
                                        <td className="p-3 font-bold text-zinc-800 dark:text-zinc-200">
                                            Grado de Cumplimiento de Operaciones Programadas
                                        </td>
                                        <td className="p-3 text-center font-mono text-zinc-600 dark:text-zinc-400">&ge; 90.0%</td>
                                        <td className="p-3 text-center font-bold text-zinc-900 dark:text-white">{cumpliValue}%</td>
                                        <td className="p-3 text-center">
                                            <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${cumpliStatus.bg}`}>
                                                {cumpliStatus.text}
                                            </span>
                                        </td>
                                    </tr>
                                    <tr className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40">
                                        <td className="p-3 font-bold text-zinc-800 dark:text-zinc-200">
                                            Porcentaje de Complicaciones en Sala de Recuperación (URPA)
                                        </td>
                                        <td className="p-3 text-center font-mono text-zinc-600 dark:text-zinc-400">&lt; 2.0%</td>
                                        <td className="p-3 text-center font-bold text-zinc-900 dark:text-white">{urpaComplicValue}%</td>
                                        <td className="p-3 text-center">
                                            <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${urpaComplicValue < 2 ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800" : "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300 border-red-200 dark:border-red-800"}`}>
                                                {urpaComplicValue < 2 ? "Óptimo (<2%)" : "Atención Requerida"}
                                            </span>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            ) : null}
        </div>
    );
}
