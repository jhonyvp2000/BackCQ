"use client";

import { AlertTriangle, X } from "lucide-react";
import { updateSurgeryStatus } from "@/app/actions/cirugias";
import { useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";

export function StartSurgeryButton({ id, hasRoom }: { id: string, hasRoom: boolean }) {
    const [isOpen, setIsOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        if (!hasRoom) {
            e.preventDefault();
            setIsOpen(true);
        }
    };

    return (
        <>
            <form action={updateSurgeryStatus} className="inline-block" onSubmit={() => setIsSubmitting(true)}>
                <input type="hidden" name="id" value={id} />
                <input type="hidden" name="status" value="in_progress" />
                <button
                    type="submit"
                    onClick={handleClick}
                    disabled={isSubmitting}
                    className="text-[var(--color-hospital-blue)] hover:text-white hover:bg-[var(--color-hospital-blue)] bg-blue-50 dark:bg-blue-900/20 px-4 py-2 rounded-xl transition-all duration-300 border border-[var(--color-hospital-blue)]/20 hover:scale-[1.02] text-xs font-bold shadow-sm"
                >
                    {isSubmitting ? 'Procediendo...' : 'Ingresar a Quirófano'}
                </button>
            </form>

            {typeof document !== "undefined" && createPortal(
                <AnimatePresence>
                    {isOpen && (
                        <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                                onClick={() => setIsOpen(false)}
                            />
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-800 p-6 z-10 max-w-sm w-full relative whitespace-normal"
                            >
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                                >
                                    <X size={20} />
                                </button>

                                <div className="flex flex-col items-center text-center">
                                    <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center mb-4">
                                        <AlertTriangle className="text-amber-600 dark:text-amber-400" size={24} />
                                    </div>
                                    <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">
                                        Sala No Asignada
                                    </h3>
                                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6 px-2">
                                        No es posible ingresar a quirófano un procedimiento que aún no tiene una sala física asignada. Por favor, edita o asigna una sala previamente.
                                    </p>

                                    <button
                                        onClick={() => setIsOpen(false)}
                                        className="w-full py-2.5 px-4 rounded-xl font-semibold text-white bg-[var(--color-hospital-blue)] hover:bg-[#09357a] shadow-sm transition-colors"
                                    >
                                        Entendido
                                    </button>
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
