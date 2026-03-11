"use client";

import { Trash2, AlertTriangle, X } from "lucide-react";
import { deleteSurgery } from "@/app/actions/cirugias";
import { useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";

export function DeleteSurgeryButton({ id }: { id: string }) {
    const [isOpen, setIsOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const handleDelete = async () => {
        setIsDeleting(true);
        setErrorMsg(null);
        const formData = new FormData();
        formData.append("id", id);

        const result = await deleteSurgery(formData);

        if (result && result.error) {
            setErrorMsg(result.error);
            setIsDeleting(false);
        } else {
            setIsOpen(false);
            setErrorMsg(null);
        }
    };

    return (
        <>
            <button
                type="button"
                onClick={() => {
                    setIsOpen(true);
                    setErrorMsg(null);
                }}
                className="text-zinc-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-lg transition-all border border-transparent hover:border-red-200 ml-1"
                title="Eliminar Programación"
            >
                <Trash2 size={16} />
            </button>

            {typeof document !== "undefined" && createPortal(
                <AnimatePresence>
                    {isOpen && (
                        <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                                onClick={() => !isDeleting && setIsOpen(false)}
                            />
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-800 p-6 z-10 max-w-sm w-full relative whitespace-normal"
                            >
                                <button
                                    onClick={() => setIsOpen(false)}
                                    disabled={isDeleting}
                                    className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 disabled:opacity-50"
                                >
                                    <X size={20} />
                                </button>

                                <div className="flex flex-col items-center text-center">
                                    <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center mb-4">
                                        <AlertTriangle className="text-red-600 dark:text-red-400" size={24} />
                                    </div>
                                    <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">
                                        Cancelar y Eliminar Turno
                                    </h3>
                                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6 px-2">
                                        ¿Estás seguro de que deseas eliminar permanentemente esta programación y liberar el quirófano? Esta acción no se puede deshacer.
                                    </p>

                                    {errorMsg && (
                                        <div className="w-full mb-6 p-4 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/50 rounded-xl flex items-start text-left text-sm text-red-700 dark:text-red-400 animate-in fade-in slide-in-from-top-2">
                                            <AlertTriangle size={16} className="mr-2 mt-0.5 flex-shrink-0" />
                                            <span>{errorMsg}</span>
                                        </div>
                                    )}

                                    <div className="flex gap-3 w-full">
                                        <button
                                            onClick={() => setIsOpen(false)}
                                            disabled={isDeleting}
                                            className="flex-1 py-2.5 px-4 rounded-xl border border-zinc-200 dark:border-zinc-700 font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50"
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            onClick={handleDelete}
                                            disabled={isDeleting}
                                            className="flex-1 py-2.5 px-4 rounded-xl font-semibold text-white bg-red-600 hover:bg-red-700 shadow-sm transition-colors disabled:opacity-50 flex items-center justify-center"
                                        >
                                            {isDeleting ? 'Borrando...' : 'Sí, Eliminar'}
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </>
    );
}
