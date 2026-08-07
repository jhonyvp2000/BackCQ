"use client";

import { useState } from "react";
import { RefreshCw, CheckCircle2, X, DatabaseZap, Users, FileText } from "lucide-react";
import { syncUnidentifiedPatientsAction } from "@/app/actions/pacientes";
import { useRouter } from "next/navigation";

export function SyncNethosButton({ unidentifiedCount = 0 }: { unidentifiedCount?: number }) {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<{
        success: boolean;
        message: string;
        processedCount: number;
        updatedCount: number;
        failedCount: number;
        updatedPatients: Array<{ dni: string; oldName: string; newName: string; hc: string }>;
    } | null>(null);

    const router = useRouter();

    const handleSync = async () => {
        setIsLoading(true);
        setResult(null);
        setIsOpen(true);

        try {
            const res = await syncUnidentifiedPatientsAction(50);
            setResult(res);
            if (res.success && res.updatedCount > 0) {
                router.refresh();
            }
        } catch (error) {
            console.error("Error al sincronizar con NETHOS:", error);
            setResult({
                success: false,
                message: "Ocurrió un error inesperado durante la sincronización.",
                processedCount: 0,
                updatedCount: 0,
                failedCount: 0,
                updatedPatients: [],
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        setIsOpen(false);
        setResult(null);
        router.refresh();
    };

    return (
        <>
            <button
                type="button"
                onClick={handleSync}
                disabled={isLoading}
                className="relative inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl text-blue-700 bg-blue-50 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-all shadow-sm active:scale-95 disabled:opacity-50"
            >
                <RefreshCw size={14} className={isLoading ? "animate-spin text-blue-600" : "text-blue-600"} />
                <span>Sincronizar NETHOS</span>
                {unidentifiedCount > 0 && (
                    <span className="ml-1 px-1.5 py-0.5 text-[10px] font-extrabold rounded-full bg-amber-500 text-white animate-pulse">
                        {unidentifiedCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]">
                        {/* Modal Header */}
                        <div className="p-5 border-b border-zinc-100 dark:border-zinc-800 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-md">
                                    <DatabaseZap size={20} />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                                        Sincronizador Masivo NETHOS
                                    </h3>
                                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                        Consulta automática a la base de datos central de salud
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={handleClose}
                                disabled={isLoading}
                                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
                            {isLoading ? (
                                <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
                                    <div className="relative">
                                        <div className="w-16 h-16 rounded-full border-4 border-blue-200 dark:border-blue-900 border-t-blue-600 animate-spin"></div>
                                        <DatabaseZap className="absolute inset-0 m-auto text-blue-600 animate-pulse" size={24} />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
                                            Sincronizando datos maestras con NETHOS...
                                        </h4>
                                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-sm">
                                            Buscando pacientes "NO IDENTIFICADO" y verificando nombres oficiales mediante API.
                                        </p>
                                    </div>
                                </div>
                            ) : result ? (
                                <div className="space-y-5">
                                    {/* Metrics Summary Cards */}
                                    <div className="grid grid-cols-3 gap-3">
                                        <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/60 dark:border-zinc-700/60 text-center">
                                            <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium block">Revisados</span>
                                            <span className="text-xl font-black text-zinc-800 dark:text-zinc-100">{result.processedCount}</span>
                                        </div>
                                        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/60 text-center">
                                            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium block">Corregidos</span>
                                            <span className="text-xl font-black text-emerald-700 dark:text-emerald-300">{result.updatedCount}</span>
                                        </div>
                                        <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-800/60 text-center">
                                            <span className="text-xs text-amber-600 dark:text-amber-400 font-medium block">Sin Cambios</span>
                                            <span className="text-xl font-black text-amber-700 dark:text-amber-300">{result.processedCount - result.updatedCount}</span>
                                        </div>
                                    </div>

                                    {/* Status Message */}
                                    <div className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center gap-2.5 ${result.updatedCount > 0 ? "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800/60" : "bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-800/60"}`}>
                                        {result.updatedCount > 0 ? <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0" /> : <Users size={16} className="text-blue-600 flex-shrink-0" />}
                                        <span>{result.message}</span>
                                    </div>

                                    {/* Detailed Table of Updated Patients */}
                                    {result.updatedPatients && result.updatedPatients.length > 0 && (
                                        <div className="space-y-2">
                                            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                                                <FileText size={14} /> Detalle de Pacientes Auto-corregidos ({result.updatedPatients.length})
                                            </h4>
                                            <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm max-h-60 overflow-y-auto custom-scrollbar">
                                                <table className="w-full text-left text-xs">
                                                    <thead className="bg-zinc-100 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-400 font-bold border-b border-zinc-200 dark:border-zinc-700">
                                                        <tr>
                                                            <th className="p-2.5 pl-3">DNI / HC</th>
                                                            <th className="p-2.5">Anterior</th>
                                                            <th className="p-2.5 pr-3">Nuevo Nombre (NETHOS)</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                                                        {result.updatedPatients.map((p, i) => (
                                                            <tr key={i} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40">
                                                                <td className="p-2.5 pl-3 font-mono font-bold text-zinc-700 dark:text-zinc-300">
                                                                    <div>{p.dni}</div>
                                                                    <div className="text-[10px] font-normal text-zinc-400">HC: {p.hc}</div>
                                                                </td>
                                                                <td className="p-2.5 text-red-500 dark:text-red-400 line-through text-[11px]">
                                                                    {p.oldName}
                                                                </td>
                                                                <td className="p-2.5 pr-3 font-bold text-emerald-700 dark:text-emerald-400 text-[11px]">
                                                                    {p.newName}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : null}
                        </div>

                        {/* Modal Footer */}
                        <div className="p-4 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 flex justify-end">
                            <button
                                type="button"
                                onClick={handleClose}
                                disabled={isLoading}
                                className="px-4 py-2 text-xs font-bold rounded-xl text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50"
                            >
                                Entendido y Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
