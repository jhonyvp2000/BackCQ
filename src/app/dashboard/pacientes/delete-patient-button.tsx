"use client";

import { useState } from "react";
import { Trash2, AlertTriangle, X, Loader2 } from "lucide-react";
import { deletePaciente } from "@/app/actions/pacientes";

export function DeletePatientButton({ id }: { id: string }) {
    const [isDeleting, setIsDeleting] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const handleDelete = async () => {
        setIsDeleting(true);
        setErrorMsg(null);
        try {
            const result = await deletePaciente(id);
            if (!result.success) {
                setErrorMsg(result.message || "No se pudo eliminar al paciente.");
                setIsDeleting(false);
            } else {
                setIsModalOpen(false);
                setIsDeleting(false);
            }
        } catch (error) {
            console.error("Error al eliminar", error);
            setErrorMsg("Error interno al intentar eliminar al paciente.");
            setIsDeleting(false);
        }
    };

    return (
        <>
            <button
                onClick={() => setIsModalOpen(true)}
                disabled={isDeleting}
                className={`p-2 rounded-lg transition-colors tooltip ${isDeleting || isModalOpen ? 'text-zinc-400 bg-zinc-100 dark:bg-zinc-800/80 cursor-not-allowed' : 'text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'}`}
                title="Eliminar Paciente"
            >
                <Trash2 size={16} />
            </button>

            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in zoom-in-95 duration-200">
                    <div 
                        className="fixed inset-0 bg-black/40 dark:bg-black/70 backdrop-blur-sm transition-opacity" 
                        onClick={() => !isDeleting && setIsModalOpen(false)}
                    />
                    
                    <div className="relative w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] overflow-hidden border border-zinc-200/50 dark:border-zinc-800/50">
                        {/* Header */}
                        <div className="relative p-6 px-8 pb-4">
                            <button 
                                onClick={() => !isDeleting && setIsModalOpen(false)}
                                disabled={isDeleting}
                                className="absolute right-6 top-6 text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-800/50 dark:hover:bg-zinc-800 p-2 rounded-full z-10"
                            >
                                <X size={18} strokeWidth={2.5}/>
                            </button>
                            
                            <div className="flex flex-col items-center text-center">
                                <div className="flex-shrink-0 w-14 h-14 rounded-full bg-red-50 dark:bg-red-500/10 flex items-center justify-center text-red-600 dark:text-red-400 border border-red-100 dark:border-red-500/20 shadow-sm mb-4">
                                    <AlertTriangle size={28} />
                                </div>
                                
                                <h3 className="text-xl font-bold text-zinc-900 dark:text-white tracking-tight">
                                    Eliminar Paciente
                                </h3>
                                <p className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 mt-1.5">
                                    Acción irreversible requerida
                                </p>
                            </div>
                        </div>

                        {/* Body */}
                        <div className="px-6 sm:px-10 pb-8 pt-2 text-center whitespace-normal">
                            <p className="text-[15px] text-zinc-600 dark:text-zinc-300 leading-relaxed font-medium">
                                ¿Estás seguro de continuar con la eliminación? 
                            </p>
                            
                            <p className="text-[15px] text-zinc-600 dark:text-zinc-300 leading-relaxed font-medium mt-4">
                                <span className="font-bold text-red-600 dark:text-red-400">Peligro:</span> Esta acción borrará permanentemente todo su historial, información de identidad (PII) y los desvinculará del ecosistema BackCQ.
                            </p>

                            {errorMsg && (
                                <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-xl text-[13px] text-red-600 dark:text-red-400 font-bold flex items-start gap-3 shadow-sm text-left w-full overflow-hidden">
                                    <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
                                    <p className="leading-snug flex-1 whitespace-pre-wrap">{errorMsg}</p>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="bg-zinc-50/80 dark:bg-zinc-900/80 px-6 sm:px-8 py-5 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 border-t border-zinc-100 dark:border-zinc-800 backdrop-blur-md whitespace-normal">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                disabled={isDeleting}
                                className="w-full sm:w-auto px-6 py-2.5 rounded-xl text-sm font-bold text-zinc-600 dark:text-zinc-300 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-all shadow-sm hover:shadow disabled:opacity-50 flex-1 justify-center"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={isDeleting}
                                className="w-full sm:w-auto px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-red-600 hover:bg-red-700 border border-transparent transition-all shadow-[0_4px_12px_rgba(220,38,38,0.25)] dark:shadow-[0_4px_12px_rgba(220,38,38,0.15)] flex items-center justify-center gap-2.5 disabled:opacity-80 disabled:cursor-not-allowed group active:scale-95 duration-200 flex-[1.5]"
                            >
                                {isDeleting ? (
                                    <>
                                        <Loader2 size={16} strokeWidth={3} className="animate-spin" />
                                        <span>Procesando...</span>
                                    </>
                                ) : (
                                    <span>Sí, Eliminar Permanente</span>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
