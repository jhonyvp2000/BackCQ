"use client";

import { useState } from "react";
import { Search, Zap, Wand2, Merge, ChevronRight, AlertCircle, RefreshCw, UserCircle2 } from "lucide-react";
import { syncOrphan, mergeOrphan } from "@/app/actions/pacientes";

export default function OrphanInbox({ orphansList }: { orphansList: any[] }) {
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [isSyncing, setIsSyncing] = useState(false);
    const [isMerging, setIsMerging] = useState(false);
    const [mergeDni, setMergeDni] = useState("");
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    const activeOrphan = orphansList.find(o => o.id === selectedId);

    const handleSync = async () => {
        if (!activeOrphan) return;
        setIsSyncing(true);
        setFeedback(null);
        try {
            const res = await syncOrphan(activeOrphan.pii.dni || "");
            setFeedback({
                type: res.success ? 'success' : 'error',
                message: res.message
            });
            if (res.success) {
                setTimeout(() => setSelectedId(null), 2000);
            }
        } catch (e) {
            setFeedback({ type: 'error', message: "Falló la sincronización." });
        } finally {
            setIsSyncing(false);
        }
    };

    const handleMerge = async () => {
        if (!activeOrphan || !mergeDni.trim()) return;
        setIsMerging(true);
        setFeedback(null);
        try {
            const res = await mergeOrphan(activeOrphan.id, mergeDni.trim());
            setFeedback({
                type: res.success ? 'success' : 'error',
                message: res.message
            });
            if (res.success) {
                setMergeDni("");
                setTimeout(() => setSelectedId(null), 2000);
            }
        } catch (e) {
            setFeedback({ type: 'error', message: "Falló la fusión de identidades." });
        } finally {
            setIsMerging(false);
        }
    };

    return (
        <div className="flex h-full w-full bg-zinc-50 dark:bg-black">
            {/* Lista Maestra Izquierda */}
            <div className="w-1/3 border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex flex-col h-full overflow-hidden">
                <div className="p-4 border-b border-zinc-100 dark:border-zinc-900 bg-zinc-50 dark:bg-black">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
                        <input
                            type="text"
                            placeholder="Buscar huérfanos..."
                            className="w-full pl-10 pr-4 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:outline-none focus:ring-2 focus:ring-amber-500/50 text-sm font-medium transition-all"
                        />
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                    {orphansList.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-40 text-zinc-400">
                            <span className="text-sm font-medium mt-2">No hay identidades pendientes</span>
                        </div>
                    ) : (
                        orphansList.map((orphan) => (
                            <button
                                key={orphan.id}
                                onClick={() => setSelectedId(orphan.id)}
                                className={`w-full flex items-center p-4 rounded-2xl transition-all border text-left group ${
                                    selectedId === orphan.id
                                        ? 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30 shadow-sm'
                                        : 'bg-white dark:bg-zinc-950 border-zinc-200/50 dark:border-zinc-800/50 hover:bg-zinc-50 dark:hover:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700'
                                }`}
                            >
                                <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                                    selectedId === orphan.id ? 'bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-500' : 'bg-red-50 text-red-500 dark:bg-red-900/20 dark:text-red-400'
                                }`}>
                                   F
                                </div>
                                <div className="ml-4 flex-1">
                                    <h3 className={`text-sm font-bold ${selectedId === orphan.id ? 'text-amber-900 dark:text-amber-50' : 'text-zinc-900 dark:text-zinc-100'}`}>
                                        Fantasma {orphan.pii.dni ? `(${orphan.pii.dni})` : ''}
                                    </h3>
                                    <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-1">
                                        Detectado por Cirugía
                                    </p>
                                </div>
                                <ChevronRight className={`flex-shrink-0 ${selectedId === orphan.id ? 'text-amber-500' : 'text-zinc-300 dark:text-zinc-700'}`} size={18} />
                            </button>
                        ))
                    )}
                </div>
            </div>

            {/* Vista de Detalles Derecha */}
            <div className="flex-1 flex flex-col bg-zinc-50/50 dark:bg-[#0a0a0a]">
                {!activeOrphan ? (
                    <div className="flex-1 flex items-center justify-center text-zinc-400">
                        <div className="text-center">
                            <UserCircle2 size={48} className="mx-auto text-zinc-200 dark:text-zinc-800 mb-4" />
                            <p className="text-sm font-medium">Selecciona una identidad huérfana de la lista</p>
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 p-8 overflow-y-auto">
                        <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            
                            {/* Alerta */}
                            <div className="bg-amber-100/50 dark:bg-amber-950/30 border border-amber-200/50 dark:border-amber-900/50 rounded-2xl p-5 flex items-start gap-4 backdrop-blur-sm">
                                <AlertCircle className="text-amber-600 dark:text-amber-500 mt-0.5" size={20} />
                                <div>
                                    <h2 className="text-sm font-bold text-amber-900 dark:text-amber-300">
                                        Identidad Pendiente de Resolución
                                    </h2>
                                    <p className="text-sm text-amber-700 dark:text-amber-500/80 mt-1 h-relaxed">
                                        El paciente con DNI/Documento <b>{activeOrphan.pii.dni}</b> tuvo que ser generado bajo perfil de contingencia ("NO IDENTIFICADO") debido a un error de conexión con la API en la creación. Contiene cirugías enlazadas.
                                    </p>
                                </div>
                            </div>

                            {feedback && (
                                <div className={`p-4 rounded-xl border flex items-center gap-3 text-sm font-bold ${
                                    feedback.type === 'success' ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20' : 'bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20'
                                }`}>
                                    {feedback.message}
                                </div>
                            )}

                            {/* Opcion 1: Sync Magica */}
                            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-500">
                                            <Wand2 size={20} />
                                        </div>
                                        <h3 className="text-lg font-bold text-zinc-900 dark:text-white tracking-tight">
                                            Solución Rápida
                                        </h3>
                                    </div>
                                    <span className="text-xs font-bold px-2.5 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 rounded-lg">Recomendado</span>
                                </div>
                                <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 leading-relaxed mb-6">
                                    Intenta consultar otra vez en vivo la base de datos de ApiNetHos usando el Identificador <b>{activeOrphan.pii.dni}</b>. Si ahora la API está disponible, la bóveda se actualizará sola devolviendo sus verdaderos Nombres y Apellidos.
                                </p>
                                <button
                                    onClick={handleSync}
                                    disabled={isSyncing || feedback?.type === 'success'}
                                    className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-zinc-900 hover:bg-black text-white dark:bg-white dark:hover:bg-zinc-100 dark:text-black font-bold text-sm transition-all hover:shadow-[0_8px_30px_rgba(0,0,0,0.12)] dark:hover:shadow-[0_8px_30px_rgba(255,255,255,0.1)] active:scale-[0.98] disabled:opacity-50"
                                >
                                    {isSyncing ? <RefreshCw className="animate-spin" size={18} /> : <Zap size={18} />}
                                    Sincronización Mágica
                                </button>
                            </div>

                            <div className="relative py-2">
                                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-zinc-200 dark:border-zinc-800"></div></div>
                                <div className="relative flex justify-center text-xs font-bold"><span className="bg-zinc-50 dark:bg-[#0a0a0a] px-4 text-zinc-400 uppercase tracking-widest">O</span></div>
                            </div>

                            {/* Opcion 2: Merge */}
                            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-500">
                                        <Merge size={20} />
                                    </div>
                                    <h3 className="text-lg font-bold text-zinc-900 dark:text-white tracking-tight">
                                        Fusión Visual
                                    </h3>
                                </div>
                                <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 leading-relaxed mb-6">
                                    ¿El DNI ingresado fue <b>{activeOrphan.pii.dni}</b> que fue un error de tipeo?. Ingresa debajo el DNI del paciente correcto donde se debió asignar desde el inicio las cirugías, para fusionarlos y limpiar la base de datos.
                                </p>
                                
                                <div className="flex gap-3">
                                    <input 
                                        type="text" 
                                        placeholder="DNI del paciente real"
                                        value={mergeDni}
                                        onChange={(e) => setMergeDni(e.target.value)}
                                        className="flex-1 px-4 py-3 rounded-2xl bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-sm font-medium transition-all"
                                    />
                                    <button
                                        onClick={handleMerge}
                                        disabled={isMerging || !mergeDni || feedback?.type === 'success'}
                                        className="flex items-center justify-center gap-2 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm transition-all shadow-[0_4px_14px_rgba(79,70,229,0.3)] active:scale-[0.98] disabled:opacity-50 disabled:shadow-none"
                                    >
                                        {isMerging ? <RefreshCw className="animate-spin" size={18} /> : 'Transferir & Fusionar'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
