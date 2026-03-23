"use client";

import { useState, useEffect } from "react";
import { Loader2, PlusCircle, AlertCircle, CheckCircle, Search, Verified, SplitSquareHorizontal } from "lucide-react";
import { importProceduresFromApi } from "@/app/actions/procedures";
import { lookupProcedureInApi } from "@/app/actions/cirugias";
import { motion, AnimatePresence } from "framer-motion";

export function CreateProcedureForm({ initialProcedures = [] }: { initialProcedures?: any[] }) {
    const [searchTerm, setSearchTerm] = useState("");
    const [isSearching, setIsSearching] = useState(false);
    const [localProcedures, setLocalProcedures] = useState<any[]>(initialProcedures);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [actionMsg, setActionMsg] = useState<{type: 'error' | 'success', text: string} | null>(null);

    // Debounce the Procedure search against ApiNetHos
    useEffect(() => {
        if (searchTerm.trim().length >= 3) {
            setIsSearching(true);
            const timeoutId = setTimeout(async () => {
                try {
                    const resArray = await lookupProcedureInApi(searchTerm.trim());
                    if (resArray && Array.isArray(resArray) && resArray.length > 0) {
                        setLocalProcedures(prev => {
                            const newProcedures = resArray.filter(
                                (apiPx: any) => !prev.find(p => p.code === apiPx.code)
                            );
                            return [...newProcedures, ...prev];
                        });
                    }
                } catch (e) {
                    console.error(e);
                } finally {
                    setIsSearching(false);
                }
            }, 1000);
            return () => clearTimeout(timeoutId);
        } else {
            setIsSearching(false);
        }
    }, [searchTerm]);

    const removeDiacritics = (str: string) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    const searchTerms = removeDiacritics(searchTerm.toLowerCase())
        .split(/\s+/)
        .filter(Boolean);

    // Filter using Multivariable AND operator
    const filteredUnselectedPx = localProcedures
        .filter(px => !selectedIds.has(px.id))
        .filter(px => {
            if (searchTerms.length === 0) return true;
            const fullText = removeDiacritics(`${px.code || ""} ${px.name}`.toLowerCase());
            return searchTerms.every(term => fullText.includes(term));
        })
        .slice(0, 30); // Limiting results

    const selectedPxList = localProcedures.filter(px => selectedIds.has(px.id));

    const togglePx = (id: string, checked: boolean) => {
        const next = new Set(selectedIds);
        if (checked) next.add(id);
        else next.delete(id);
        setSelectedIds(next);
    };

    const handleCreate = async () => {
        if (selectedIds.size === 0) {
            setActionMsg({ type: 'error', text: 'No has seleccionado ningún acto médico/procedimiento.' });
            return;
        }

        setIsSubmitting(true);
        setActionMsg(null);
        try {
            const payload = selectedPxList.map(px => ({
                id: px.id,
                name: px.name,
                code: px.code
            }));

            const res = await importProceduresFromApi(payload);
            
            if (res.error) {
                setActionMsg({ type: 'error', text: res.error });
            } else {
                setActionMsg({ type: 'success', text: `${res.count} Nuevos procedimientos operativos empaquetados.` });
                setSelectedIds(new Set());
                setSearchTerm("");
                setTimeout(() => setActionMsg(null), 6000);
            }
        } catch (error) {
            setActionMsg({ type: 'error', text: "Ocurrió una anomalía de red imprevista." });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-5">
            <AnimatePresence>
                {actionMsg && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className={`p-3 rounded-xl border text-sm font-medium flex gap-2 shadow-sm ${actionMsg.type === 'error' ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:border-red-900/50' : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-900/50'}`}
                    >
                        {actionMsg.type === 'error' ? <AlertCircle size={16} className="shrink-0 mt-0.5" /> : <CheckCircle size={16} className="shrink-0 mt-0.5" />}
                        <span>{actionMsg.text}</span>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center justify-between">
                    Motor PIDE - MINSA
                    {isSearching && <Loader2 size={12} className="animate-spin text-teal-600" />}
                </label>
                <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Buscar variables AND (Ej. excisión 11400)"
                        className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-zinc-200 bg-white dark:bg-zinc-950 dark:border-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all shadow-sm"
                    />
                </div>
            </div>

            <div className={`mt-2 border rounded-xl overflow-hidden bg-white dark:bg-zinc-900 shadow-sm transition-all ${
                selectedIds.size > 0 ? "border-teal-500 ring-2 ring-teal-500/20" : "border-zinc-200 dark:border-zinc-800"
            }`}>
                <div className="bg-zinc-50 dark:bg-zinc-800/50 px-3 py-2 text-xs font-bold uppercase tracking-wider text-zinc-500 border-b border-zinc-200 dark:border-zinc-800 flex justify-between">
                    <span>Resultados Multivariables</span>
                    {selectedIds.size > 0 && <span className="text-teal-600">{selectedIds.size} Marcados</span>}
                </div>
                
                <div className="max-h-80 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800/50">
                    {/* Render Selected Items First */}
                    {selectedPxList.map((px) => (
                        <label key={px.id} className="flex items-start gap-3 p-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 cursor-pointer transition-colors group">
                            <input 
                                type="checkbox" 
                                checked={selectedIds.has(px.id)}
                                onChange={(e) => togglePx(px.id, e.target.checked)}
                                className="mt-0.5 rounded border-zinc-300 text-teal-500 focus:ring-teal-500"
                            />
                            <div className="flex-1 min-w-0">
                                <div className="text-xs font-semibold text-zinc-900 dark:text-white leading-relaxed">{px.name}</div>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-[10px] font-bold font-mono px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded border border-zinc-200 dark:border-zinc-700">{px.code || 'S/C'}</span>
                                    {px.id?.startsWith('__api') ? (
                                        <span className="flex items-center text-[10px] uppercase font-bold text-emerald-600 gap-0.5"><Verified size={10} /> MINSA PIDE</span>
                                    ) : (
                                        <span className="flex items-center text-[10px] uppercase font-bold text-blue-600 gap-0.5"><CheckCircle size={10} /> EN BASE LOCAL</span>
                                    )}
                                </div>
                            </div>
                        </label>
                    ))}

                    {/* Render Search Results */}
                    {filteredUnselectedPx.map((px) => (
                        <label key={px.id} className="flex items-start gap-3 p-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 cursor-pointer transition-colors group">
                            <input 
                                type="checkbox" 
                                checked={selectedIds.has(px.id)}
                                onChange={(e) => togglePx(px.id, e.target.checked)}
                                className="mt-0.5 rounded border-zinc-300 text-teal-500 focus:ring-teal-500"
                            />
                            <div className="flex-1 min-w-0">
                                <div className="text-xs font-semibold text-zinc-900 dark:text-white leading-relaxed">{px.name}</div>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-[10px] font-bold font-mono px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded border border-zinc-200 dark:border-zinc-700">{px.code || 'S/C'}</span>
                                    {px.id?.startsWith('__api') ? (
                                        <span className="flex items-center text-[10px] uppercase font-bold text-emerald-600 gap-0.5"><Verified size={10} /> MINSA PIDE</span>
                                    ) : (
                                        <span className="flex items-center text-[10px] uppercase font-bold text-blue-600 gap-0.5"><CheckCircle size={10} /> REGISTRADO</span>
                                    )}
                                </div>
                            </div>
                        </label>
                    ))}

                    {searchTerm && filteredUnselectedPx.length === 0 && selectedPxList.length === 0 && !isSearching && (
                        <div className="p-4 text-center text-xs text-zinc-500 font-medium flex flex-col items-center">
                            <SplitSquareHorizontal size={24} className="text-zinc-300 mb-2" />
                            Ningún índice coincide con "{searchTerm}"
                        </div>
                    )}
                    {!searchTerm && selectedPxList.length === 0 && (
                        <div className="p-4 text-center text-xs text-zinc-500 font-medium">
                            Usa la barra para rastrear en la nube operativa...
                        </div>
                    )}
                </div>
            </div>

            <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800">
                <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={isSubmitting || selectedIds.size === 0}
                    onClick={handleCreate}
                    className="w-full relative flex items-center justify-center gap-2 rounded-xl bg-gradient-to-tr from-teal-600 to-emerald-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-teal-500/10 transition-all hover:shadow-teal-500/30 active:scale-95 disabled:opacity-70 disabled:pointer-events-none group overflow-hidden"
                >
                    <div className="absolute inset-0 w-full h-full -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
                    {isSubmitting ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        <PlusCircle className="w-5 h-5" />
                    )}
                    <span className="relative z-10">{isSubmitting ? 'Inyectando CPT...' : 'Compilar Procedimientos'}</span>
                </motion.button>
            </div>
        </div>
    );
}
