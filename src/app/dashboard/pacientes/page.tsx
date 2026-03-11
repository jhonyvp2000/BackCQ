import { getPacientes } from "@/app/actions/pacientes";
import { Plus, User, Activity, AlertCircle, Search, CalendarDays } from "lucide-react";
import { DeletePatientButton } from "./delete-patient-button";
import { EditPatientButton } from "./edit-patient-button";
import { createPaciente } from "@/app/actions/pacientes";
import { UbigeoSelector } from "./ubigeo-selector";

export default async function PacientesPage() {
    const pacientes = await getPacientes();

    const calculateAge = (dob: Date | null) => {
        if (!dob) return "N/D";
        const diff = Date.now() - new Date(dob).getTime();
        const age = new Date(diff).getUTCFullYear() - 1970;
        return age + " años";
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
                        Directorio de Pacientes
                    </h2>
                    <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                        Base de datos maestra de pacientes quirúrgicos y empadronamiento
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Formulario de Creación Rápida */}
                <div className="lg:col-span-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm h-fit sticky top-24">
                    <h3 className="font-bold text-lg text-zinc-900 dark:text-white mb-4 flex items-center">
                        <Plus size={20} className="mr-2 text-[var(--color-hospital-blue)]" /> Nuevo Empadronamiento
                    </h3>

                    <form action={createPaciente} className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Nombres Completos</label>
                            <input
                                type="text"
                                name="nombres"
                                required
                                className="w-full px-4 py-2.5 border border-zinc-200 dark:border-zinc-700 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 text-zinc-900 dark:text-white focus:ring-2 focus:ring-[var(--color-hospital-light)] focus:border-transparent outline-none transition-all font-medium placeholder-zinc-400"
                                placeholder="Ej. Juan Carlos"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Apellidos Completos</label>
                            <input
                                type="text"
                                name="apellidos"
                                required
                                className="w-full px-4 py-2.5 border border-zinc-200 dark:border-zinc-700 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 text-zinc-900 dark:text-white focus:ring-2 focus:ring-[var(--color-hospital-light)] focus:border-transparent outline-none transition-all font-medium placeholder-zinc-400"
                                placeholder="Ej. Pérez Gómez"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4 mt-2">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">DNI</label>
                                <input
                                    type="text"
                                    name="dni"
                                    maxLength={8}
                                    className="w-full px-4 py-2.5 border border-zinc-200 dark:border-zinc-700 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 text-zinc-900 dark:text-white focus:ring-2 focus:ring-[var(--color-hospital-light)] focus:border-transparent outline-none transition-all font-medium placeholder-zinc-400"
                                    placeholder="8 dígitos (Opcional)"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">C. Extranjería</label>
                                <input
                                    type="text"
                                    name="carnetExtranjeria"
                                    maxLength={20}
                                    className="w-full px-4 py-2.5 border border-zinc-200 dark:border-zinc-700 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 text-zinc-900 dark:text-white focus:ring-2 focus:ring-[var(--color-hospital-light)] focus:border-transparent outline-none transition-all font-medium placeholder-zinc-400"
                                    placeholder="Opcional"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mt-2">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Pasaporte / Otro</label>
                                <input
                                    type="text"
                                    name="pasaporte"
                                    maxLength={20}
                                    className="w-full px-4 py-2.5 border border-zinc-200 dark:border-zinc-700 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 text-zinc-900 dark:text-white focus:ring-2 focus:ring-[var(--color-hospital-light)] focus:border-transparent outline-none transition-all font-medium placeholder-zinc-400"
                                    placeholder="Opcional"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Historia Clínica</label>
                                <input
                                    type="text"
                                    name="historiaClinica"
                                    className="w-full px-4 py-2.5 border border-zinc-200 dark:border-zinc-700 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 text-zinc-900 dark:text-white focus:ring-2 focus:ring-[var(--color-hospital-light)] focus:border-transparent outline-none transition-all font-medium placeholder-zinc-400"
                                    placeholder="N° HC (Opcional)"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mt-2">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Sexo</label>
                                <select
                                    name="sexo"
                                    required
                                    className="w-full px-4 py-2.5 border border-zinc-200 dark:border-zinc-700 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 text-zinc-900 dark:text-white focus:ring-2 focus:ring-[var(--color-hospital-light)] focus:border-transparent outline-none transition-all font-medium appearance-none"
                                >
                                    <option value="">-- Sexo --</option>
                                    <option value="Masculino">Masculino</option>
                                    <option value="Femenino">Femenino</option>
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">F. Nacimiento</label>
                                <input
                                    type="date"
                                    name="fechaNacimiento"
                                    required
                                    className="w-full px-4 py-2.5 border border-zinc-200 dark:border-zinc-700 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 text-zinc-900 dark:text-white focus:ring-2 focus:ring-[var(--color-hospital-light)] focus:border-transparent outline-none transition-all font-medium [color-scheme:light] dark:[color-scheme:dark]"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5 mt-2">
                            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Ubigeo (INEI)</label>
                            <UbigeoSelector name="ubigeo" />
                        </div>

                        {/* Additional info but collapsed conceptually to save space in the form. They can use edit to fill the rest. */}
                        <div className="pt-2">
                            <button
                                type="submit"
                                className="w-full mt-2 flex justify-center py-3 px-4 rounded-xl shadow-[0_2px_8px_rgba(33,121,202,0.25)] text-sm font-bold text-white bg-[var(--color-hospital-blue)] hover:bg-[#09357a] hover:shadow-[0_4px_12px_rgba(33,121,202,0.35)] transition-all"
                            >
                                Registrar Paciente
                            </button>
                        </div>
                    </form>
                </div>

                {/* Tabla Lista de Pacientes */}
                <div className="lg:col-span-2">
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
                        {pacientes.length === 0 ? (
                            <div className="p-16 text-center text-zinc-500 flex flex-col items-center">
                                <div className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-4">
                                    <User size={32} className="text-zinc-400" />
                                </div>
                                <h3 className="text-lg font-bold text-zinc-800 dark:text-zinc-200">No hay pacientes</h3>
                                <p className="text-sm font-medium">Comienza empadronando pacientes desde el panel lateral izquierdo.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800/60">
                                    <thead className="bg-zinc-50/80 dark:bg-zinc-800/30 backdrop-blur-sm">
                                        <tr>
                                            <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-zinc-500 uppercase tracking-widest w-[45%]">
                                                Identidad del Paciente
                                            </th>
                                            <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-zinc-500 uppercase tracking-widest">
                                                Identificadores
                                            </th>
                                            <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-zinc-500 uppercase tracking-widest">
                                                Datos Demográficos
                                            </th>
                                            <th scope="col" className="px-6 py-4 pl-4 text-right text-xs font-bold text-zinc-500 uppercase tracking-widest">
                                                Gestión
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white dark:bg-zinc-900 divide-y divide-zinc-100 dark:divide-zinc-800/40">
                                        {pacientes.map((p) => (
                                            <tr key={p.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-all duration-200 group">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <div className="flex-shrink-0 h-10 w-10 bg-blue-50 dark:bg-blue-900/20 text-[var(--color-hospital-blue)] rounded-full flex items-center justify-center font-bold">
                                                            <User size={18} />
                                                        </div>
                                                        <div className="ml-4 truncate max-w-[200px]">
                                                            <div className="text-sm font-bold text-zinc-900 dark:text-white truncate">
                                                                {p.pii?.apellidos}, {p.pii?.nombres}
                                                            </div>
                                                            <div className="text-[11px] font-semibold text-zinc-400 flex items-center gap-1 mt-0.5">
                                                                <CalendarDays size={12} /> {new Date(p.createdAt).toLocaleDateString()}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex flex-col gap-1">
                                                        {p.pii?.dni && (
                                                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-bold bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 w-max">
                                                                DNI: <span className="text-[var(--color-hospital-blue)] dark:text-blue-400">{p.pii.dni}</span>
                                                            </span>
                                                        )}
                                                        {p.pii?.carnetExtranjeria && (
                                                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-bold bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 w-max">
                                                                CEXT: <span className="text-indigo-600 dark:text-indigo-400">{p.pii.carnetExtranjeria}</span>
                                                            </span>
                                                        )}
                                                        {p.pii?.pasaporte && (
                                                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-bold bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 w-max">
                                                                PASAP/OTRO: <span className="text-emerald-600 dark:text-emerald-400">{p.pii.pasaporte}</span>
                                                            </span>
                                                        )}
                                                        {!p.pii?.dni && !p.pii?.carnetExtranjeria && !p.pii?.pasaporte && (
                                                            <span className="text-xs text-zinc-400 italic">Sin identificador oficial</span>
                                                        )}
                                                        {p.pii?.historiaClinica && (
                                                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-bold bg-orange-50 text-orange-700 border border-orange-200 w-max">
                                                                HC: {p.pii.historiaClinica}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex flex-col gap-1">
                                                        <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                                                            {p.sexo || "Sexo N/D"}
                                                        </span>
                                                        <span className="text-[11px] font-semibold text-zinc-500">
                                                            Edad: {calculateAge(p.fechaNacimiento)}
                                                        </span>
                                                        {p.ubigeo && (
                                                            <span className="text-[11px] font-semibold text-zinc-400">
                                                                Ubigeo: {p.ubigeo}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <EditPatientButton patient={p} />
                                                        <DeletePatientButton id={p.id} />
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div >
            </div >
        </div >
    );
}
