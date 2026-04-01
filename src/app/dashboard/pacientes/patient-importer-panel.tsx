"use client";

import { useState, useEffect } from "react";
import { Search, Loader2, CheckCircle, Verified, Users, Plus, AlertTriangle } from "lucide-react";
import { lookupPatientsInApi, importMultiplePatients } from "@/app/actions/pacientes";

const removeDiacritics = (str: string) => {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
};

export function PatientImporterPanel({ initialLocalPatients = [] }: { initialLocalPatients: any[] }) {
    const [localPatients, setLocalPatients] = useState<any[]>(initialLocalPatients);
    const [patSearchTerm, setPatSearchTerm] = useState("");
    const [isSearching, setIsSearching] = useState(false);
    const [selectedPatIds, setSelectedPatIds] = useState<Set<string>>(new Set());
    const [isImporting, setIsImporting] = useState(false);
    const [importMsg, setImportMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [apiDown, setApiDown] = useState(false);

    // Filter Logic
    const patSearchTermsArr = patSearchTerm.toLowerCase().trim().split(/\s+/).filter(Boolean);
    
    // Auto-update `localPatients` when `initialLocalPatients` change from server via revalidate
    useEffect(() => {
        setLocalPatients(prev => {
            // Merge to keep API ones that aren't saved yet
            const missing = prev.filter(p => typeof p.id === "string" && p.id.startsWith("__api") && !initialLocalPatients.find(ip => ip.pii?.dni === p.pii?.dni));
            return [...missing, ...initialLocalPatients];
        });
    }, [initialLocalPatients]);

    // External Search inside the panel
    useEffect(() => {
        if (patSearchTerm.trim().length >= 3) {
            setIsSearching(true);
            const timeoutId = setTimeout(async () => {
                const resArray = await lookupPatientsInApi(patSearchTerm.trim());
                if (resArray && Array.isArray(resArray) && resArray.length > 0) {
                    if (resArray[0]?.__apiError) {
                        setApiDown(true);
                        resArray.shift();
                    } else {
                        setApiDown(false);
                    }
                    if (resArray.length > 0) {
                        setLocalPatients(prev => {
                            const newPats = resArray.filter(
                                (apiPat: any) => !prev.find(p => p.pii?.dni === apiPat.pii?.dni)
                            );
                            return [...newPats, ...prev];
                        });
                    }
                } else {
                    setApiDown(false);
                }
                setIsSearching(false);
            }, 1000);
            return () => clearTimeout(timeoutId);
        } else {
            setIsSearching(false);
        }
    }, [patSearchTerm]);

    const togglePat = (id: string, checked: boolean) => {
        const next = new Set(selectedPatIds);
        if (checked) next.add(id);
        else next.delete(id);
        setSelectedPatIds(next);
        setImportMsg(null);
    };

    // Prepare lists
    let filteredPatList = localPatients.filter(pat => {
        if (patSearchTermsArr.length === 0) return true;
        const fullTextRaw = `${pat.pii?.nombres} ${pat.pii?.apellidos} ${pat.pii?.dni}`;
        const fullText = removeDiacritics(fullTextRaw).toLowerCase();
        return patSearchTermsArr.every(term => fullText.includes(removeDiacritics(term)));
    });

    const selectedList = filteredPatList.filter(p => selectedPatIds.has(p.id));
    const unselectedList = filteredPatList.filter(p => !selectedPatIds.has(p.id));

    // Get count of selected API patients
    const apiPatsToImport = localPatients
        .filter(p => selectedPatIds.has(p.id) && typeof p.id === "string" && p.id.startsWith("__api"))
        .map(p => p.apiData)
        .filter(Boolean);

    const handleImport = async () => {
        if (apiPatsToImport.length === 0) {
            setImportMsg({ type: 'success', text: "No hay pacientes externos por registrar o ya están guardados." });
            return;
        }
        setIsImporting(true);
        setImportMsg(null);
        try {
            const res = await importMultiplePatients(apiPatsToImport);
            if (res.success) {
                setImportMsg({ type: 'success', text: `¡Se insertaron ${res.count} pacientes nuevos desde MINSA!` });
                // Limpiar seleccion
                setSelectedPatIds(new Set());
            } else {
                setImportMsg({ type: 'error', text: res.error || "Hubo un error en la importación." });
            }
        } catch (e: any) {
            setImportMsg({ type: 'error', text: e.message || "Error desconocido" });
        } finally {
            setIsImporting(false);
        }
    };

    return (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm h-fit sticky top-24 flex flex-col h-[75vh]">
            <h3 className="font-bold text-lg text-zinc-900 dark:text-white mb-2 flex items-center gap-2">
                <Users size={20} className="text-[#10b981]" /> Búsqueda Nethos / PIDE
            </h3>
            
            <p className="text-xs text-zinc-500 font-medium mb-4 leading-relaxed">
                Escribe DNI o Fragmentos de Nombres. Los perfiles con insignia <span className="text-emerald-500 font-bold uppercase tracking-wider mx-1">MINSA</span> pueden ser importados en lote marcando sus casillas.
            </p>

            {/* Input Multivariable */}
            <div className="relative group mb-4 shrink-0">
                <input
                    type="text"
                    value={patSearchTerm}
                    onChange={(e) => setPatSearchTerm(e.target.value)}
                    className="w-full px-4 py-3 placeholder:text-zinc-400 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-[#10b981]/50 focus:border-[#10b981] transition-all"
                    placeholder="Filtrar variables (DNI, Apellidos...)"
                />
                <div className="absolute right-4 top-3.5 flex items-center">
                    {isSearching ? <Loader2 className="h-4 w-4 animate-spin text-[#10b981]" /> : <Search className="h-4 w-4 text-zinc-400" />}
                </div>
                {apiDown && (
                    <div className="mt-2 px-3 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-[11px] rounded-lg border border-red-200 dark:border-red-800/30 flex items-center gap-2 font-bold uppercase tracking-wider overflow-hidden">
                        <AlertTriangle size={14} className="shrink-0" />
                        <span>Servidor API no accesible. Solo se realizó búsqueda en base de datos local.</span>
                    </div>
                )}
            </div>

            {/* Lista con Checkboxes */}
            <div className="flex-1 overflow-hidden flex flex-col border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900 shadow-sm transition-all">
                <div className="bg-zinc-50 dark:bg-zinc-800/50 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-zinc-500 border-b border-zinc-200 dark:border-zinc-800 flex justify-between shrink-0">
                    <span>Motor PIDE - Resultados</span>
                    <span className="text-[#10b981]">{selectedPatIds.size} Seleccionado(s)</span>
                </div>

                <div className="flex-1 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800/50 custom-scrollbar">
                    {[...selectedList, ...unselectedList].map((pat) => {
                        const isApi = pat.id && pat.id.startsWith('__api');
                        return (
                            <label key={pat.id} className="flex items-start gap-3 p-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 cursor-pointer transition-colors group">
                                <input 
                                    type="checkbox" 
                                    checked={selectedPatIds.has(pat.id)}
                                    onChange={(e) => togglePat(pat.id, e.target.checked)}
                                    className="mt-0.5 rounded border-zinc-300 text-[#10b981] focus:ring-[#10b981]"
                                />
                                <div className="flex-1 min-w-0">
                                    <div className="text-xs font-semibold text-zinc-900 dark:text-white leading-relaxed">
                                        {pat.pii?.nombres} {pat.pii?.apellidos}
                                    </div>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-[10px] font-bold font-mono px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded border border-zinc-200 dark:border-zinc-700">{pat.pii?.dni || 'S/DNI'}</span>
                                        {isApi ? (
                                            <span className="flex items-center text-[10px] uppercase font-bold text-emerald-600 gap-0.5"><Verified size={10} /> MINSA PIDE</span>
                                        ) : (
                                            <span className="flex items-center text-[10px] uppercase font-bold text-blue-500 gap-0.5"><CheckCircle size={10} /> REGISTRADO</span>
                                        )}
                                    </div>
                                </div>
                            </label>
                        );
                    })}
                    
                    {patSearchTerm && filteredPatList.length === 0 && !isSearching && (
                        <div className="p-8 text-center text-xs text-zinc-500 font-medium flex flex-col items-center">
                            <Users size={32} className="text-zinc-300 mb-3" />
                            Ningún paciente coincide con "{patSearchTerm}"
                        </div>
                    )}
                </div>
            </div>

            {/* Panel de Botón Importar Dinámico */}
            <div className="shrink-0 pt-4 mt-auto">
                {importMsg && (
                    <div className={`mb-3 p-3 text-xs font-bold rounded-lg border ${importMsg.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20' : 'bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20'}`}>
                        {importMsg.text}
                    </div>
                )}
                
                <button
                    onClick={handleImport}
                    disabled={isImporting || apiPatsToImport.length === 0}
                    className="w-full flex items-center justify-center py-3 px-4 rounded-xl shadow-[0_2px_8px_rgba(16,185,129,0.25)] text-sm font-bold text-white bg-[#10b981] hover:bg-[#059669] hover:shadow-[0_4px_12px_rgba(16,185,129,0.35)] transition-all disabled:opacity-50 disabled:hover:bg-[#10b981] disabled:hover:shadow-none uppercase tracking-wider gap-2"
                >
                    {isImporting ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                    {apiPatsToImport.length > 0 ? `Registrar ${apiPatsToImport.length} Seleccionado(s)` : 'Registrar Modalidad Masiva'}
                </button>
            </div>
        </div>
    );
}

