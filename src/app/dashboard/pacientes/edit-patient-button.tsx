"use client";

import { useState } from "react";
import { Edit2, Save, X, Loader2 } from "lucide-react";
import { updatePaciente, lookupPatientByDni } from "@/app/actions/pacientes";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { UbigeoSelector } from "./ubigeo-selector";
import { format } from "date-fns";
import { useRouter } from "next/navigation";

export function EditPatientButton({ patient }: { patient: any }) {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const [currentPatient, setCurrentPatient] = useState(patient);

    const handleOpen = async () => {
        setIsOpen(true);
        const nameUpper = (currentPatient.pii?.nombres || "").toUpperCase();
        const lastnameUpper = (currentPatient.pii?.apellidos || "").toUpperCase();
        const dni = currentPatient.pii?.dni;

        if ((nameUpper.includes("NO IDENTIFICADO") || lastnameUpper.includes("NO IDENTIFICADO")) && dni) {
            setIsSyncing(true);
            try {
                const res = await lookupPatientByDni(dni);
                if (res && res.found && res.apiData) {
                    const data = JSON.parse(res.apiData);
                    setCurrentPatient((prev: any) => ({
                        ...prev,
                        fechaNacimiento: data.fechaNacimiento,
                        sexo: data.sexo,
                        ubigeo: data.ubigeo,
                        pii: {
                            ...prev.pii,
                            nombres: data.nombres,
                            apellidos: data.apellidos,
                            historiaClinica: data.historiaClinica,
                            direccion: data.direccion
                        }
                    }));
                    router.refresh();
                }
            } catch (err) {
                console.error("Error al auto-sincronizar desde modal de edición:", err);
            } finally {
                setIsSyncing(false);
            }
        }
    };

    const handleClose = () => {
        setIsOpen(false);
        setErrorMsg("");
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSaving(true);
        setErrorMsg("");

        try {
            const formData = new FormData(e.currentTarget);
            const result = await updatePaciente(patient.id, formData);
            if (!result.success) {
                setErrorMsg(result.message || "Error al actualizar");
            } else {
                handleClose();
            }
        } catch (error: any) {
            console.error("Error al guardar:", error);
            setErrorMsg(error.message || "Error general de sistema.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <>
            <button
                onClick={handleOpen}
                className="p-2 text-zinc-400 hover:text-[var(--color-hospital-blue)] hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors tooltip"
                title="Editar Paciente"
            >
                <Edit2 size={16} />
            </button>

            {isOpen && createPortal(
                <AnimatePresence>
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-0">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
                            onClick={handleClose}
                        />

                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            className="bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl w-full max-w-lg relative z-10 border border-zinc-200/50 dark:border-zinc-800"
                        >
                            <div className="bg-gradient-to-r from-[var(--color-hospital-blue)] to-[var(--color-hospital-light)] px-6 py-4 rounded-t-3xl flex items-center justify-between">
                                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                    <Edit2 size={18} className="text-blue-100" />
                                    Actualizar Datos del Paciente
                                </h3>
                                <button onClick={handleClose} className="text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-1.5 rounded-full transition-colors">
                                    <X size={18} strokeWidth={2.5} />
                                </button>
                            </div>
                             <form onSubmit={handleSubmit} className="p-6 relative">
                                {isSyncing && (
                                    <div className="absolute inset-0 bg-white/80 dark:bg-zinc-900/80 z-20 flex flex-col items-center justify-center rounded-b-3xl">
                                        <Loader2 className="animate-spin text-[var(--color-hospital-blue)] mb-3" size={32} />
                                        <p className="text-sm font-bold text-zinc-700 dark:text-zinc-300 animate-pulse">
                                            Sincronizando datos oficiales con NETHOS...
                                        </p>
                                    </div>
                                )}

                                {errorMsg && (
                                    <div className="mb-6 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm rounded-xl font-medium animate-in fade-in zoom-in-95 duration-200">
                                        {errorMsg}
                                    </div>
                                )}

                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Nombres</label>
                                            <input
                                                type="text"
                                                name="nombres"
                                                defaultValue={currentPatient.pii?.nombres}
                                                required
                                                className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-700 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-2 focus:ring-[var(--color-hospital-light)] outline-none transition-all font-medium placeholder-zinc-400"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Apellidos</label>
                                            <input
                                                type="text"
                                                name="apellidos"
                                                defaultValue={currentPatient.pii?.apellidos}
                                                required
                                                className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-700 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-2 focus:ring-[var(--color-hospital-light)] outline-none transition-all font-medium placeholder-zinc-400"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">DNI (Opcional)</label>
                                            <input
                                                type="text"
                                                name="dni"
                                                defaultValue={currentPatient.pii?.dni || ""}
                                                maxLength={8}
                                                className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-700 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-2 focus:ring-[var(--color-hospital-light)] outline-none transition-all font-medium placeholder-zinc-400"
                                                placeholder="8 dígitos"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">C. Extranjería</label>
                                            <input
                                                type="text"
                                                name="carnetExtranjeria"
                                                defaultValue={currentPatient.pii?.carnetExtranjeria || ""}
                                                maxLength={20}
                                                className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-700 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-2 focus:ring-[var(--color-hospital-light)] outline-none transition-all font-medium placeholder-zinc-400"
                                                placeholder="Opcional"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Pasaporte / Otro</label>
                                            <input
                                                type="text"
                                                name="pasaporte"
                                                defaultValue={currentPatient.pii?.pasaporte || ""}
                                                maxLength={20}
                                                className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-700 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-2 focus:ring-[var(--color-hospital-light)] outline-none transition-all font-medium placeholder-zinc-400"
                                                placeholder="Opcional"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Historia Clínica</label>
                                            <input
                                                type="text"
                                                name="historiaClinica"
                                                defaultValue={currentPatient.pii?.historiaClinica || ""}
                                                className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-700 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-2 focus:ring-[var(--color-hospital-light)] outline-none transition-all font-medium placeholder-zinc-400"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Sexo</label>
                                            <select
                                                name="sexo"
                                                defaultValue={currentPatient.sexo || ""}
                                                className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-700 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-2 focus:ring-[var(--color-hospital-light)] outline-none transition-all font-medium"
                                            >
                                                <option value="">-- Seleccionar --</option>
                                                <option value="Masculino">Masculino</option>
                                                <option value="Femenino">Femenino</option>
                                            </select>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">F. Nacimiento</label>
                                            <input
                                                type="date"
                                                name="fechaNacimiento"
                                                defaultValue={currentPatient.fechaNacimiento ? format(new Date(currentPatient.fechaNacimiento), 'yyyy-MM-dd') : ""}
                                                className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-700 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-2 focus:ring-[var(--color-hospital-light)] outline-none transition-all font-medium [color-scheme:light] dark:[color-scheme:dark]"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Ubigeo (INEI)</label>
                                        <UbigeoSelector name="ubigeo" defaultValue={currentPatient.ubigeo || ""} />
                                    </div>
                                </div>

                                <div className="mt-8 flex gap-3 justify-end">
                                    <button
                                        type="button"
                                        onClick={handleClose}
                                        className="px-5 py-2.5 rounded-xl font-bold text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSaving}
                                        className={`px-5 py-2.5 rounded-xl font-bold text-white transition-all flex items-center gap-2 shadow-sm ${isSaving ? 'bg-blue-400 cursor-not-allowed' : 'bg-[var(--color-hospital-blue)] hover:bg-[#09357a] hover:shadow-md'}`}
                                    >
                                        {isSaving ? <Save size={18} className="animate-spin" /> : <Save size={18} />}
                                        {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                </AnimatePresence>,
                document.body
            )}
        </>
    );
}
