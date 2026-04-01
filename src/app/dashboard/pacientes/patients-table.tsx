"use client";

import { useState } from "react";
import { User, CalendarDays, Search } from "lucide-react";
import { DeletePatientButton } from "./delete-patient-button";
import { EditPatientButton } from "./edit-patient-button";

export function PatientsTable({ pacientes }: { pacientes: any[] }) {
    const [searchTerm, setSearchTerm] = useState("");

    const calculateAge = (dob: Date | null | string) => {
        if (!dob) return "N/D";
        const diff = Date.now() - new Date(dob).getTime();
        const age = new Date(diff).getUTCFullYear() - 1970;
        return age + " años";
    };

    const removeDiacritics = (str: string) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    const filteredPacientes = pacientes.filter(p => {
        if (!searchTerm) return true;
        // Motor de búsqueda multivariable (OR)
        const terms = removeDiacritics(searchTerm.toLowerCase()).split(" ").filter(Boolean);
        
        const fullString = removeDiacritics(`
            ${p.pii?.nombres || ""} 
            ${p.pii?.apellidos || ""} 
            ${p.pii?.dni || ""} 
            ${p.pii?.carnetExtranjeria || ""} 
            ${p.pii?.pasaporte || ""} 
            ${p.pii?.historiaClinica || ""}
        `.toLowerCase());

        // Debe coincidir con TODOS los términos que escriba (para que si escribe "Juan Perez", bsuque "Juan" AND "Perez" dentro de todo el OR pool)
        return terms.every(term => fullString.includes(term));
    });

    return (
        <div className="lg:col-span-2">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
                
                {/* CAJA DE FILTRO INTELIGENTE */}
                <div className="p-4 border-b border-zinc-200 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-800/20 backdrop-blur-sm">
                    <div className="relative">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-hospital-blue)] w-5 h-5 opacity-70" />
                        <input 
                            type="text"
                            placeholder="Buscar paciente por DNI, Nombres, Apellidos, Pasaporte, C.Extranjería o HC..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700/80 rounded-xl focus:ring-2 focus:ring-[var(--color-hospital-blue)] focus:border-transparent outline-none transition-all shadow-[0_2px_8px_rgba(0,0,0,0.04)] text-sm font-medium text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400"
                        />
                        {searchTerm && (
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md">
                                {filteredPacientes.length} result{filteredPacientes.length !== 1 ? 's':''}
                            </div>
                        )}
                    </div>
                </div>

                {pacientes.length === 0 ? (
                    <div className="p-16 text-center text-zinc-500 flex flex-col items-center">
                        <div className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-4">
                            <User size={32} className="text-zinc-400" />
                        </div>
                        <h3 className="text-lg font-bold text-zinc-800 dark:text-zinc-200">No hay pacientes</h3>
                        <p className="text-sm font-medium">Comienza empadronando pacientes desde el panel lateral izquierdo.</p>
                    </div>
                ) : filteredPacientes.length === 0 ? (
                    <div className="p-16 text-center text-zinc-500 flex flex-col items-center">
                        <div className="w-16 h-16 rounded-full bg-blue-50 dark:bg-blue-900/10 flex items-center justify-center mb-4">
                            <Search size={32} className="text-[var(--color-hospital-blue)] opacity-50" />
                        </div>
                        <h3 className="text-lg font-bold text-zinc-800 dark:text-zinc-200">Sin coincidencias</h3>
                        <p className="text-sm font-medium">No se encontró ningún paciente con "{searchTerm}".</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto max-h-[700px] overflow-y-auto">
                        <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800/60 relative">
                            <thead className="bg-zinc-50/95 dark:bg-zinc-800/90 backdrop-blur-md sticky top-0 z-10 shadow-sm border-b border-zinc-200 dark:border-zinc-800/60">
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
                                {filteredPacientes.map((p) => (
                                    <tr key={p.id} className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition-all duration-200 group">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 h-10 w-10 bg-blue-50 dark:bg-blue-900/20 text-[var(--color-hospital-blue)] rounded-full flex items-center justify-center font-bold border border-blue-100 dark:border-blue-800/50">
                                                    <User size={18} />
                                                </div>
                                                <div className="ml-4 truncate max-w-[200px]">
                                                    <div className="text-sm font-bold text-zinc-900 dark:text-white truncate">
                                                        {p.pii?.apellidos}, {p.pii?.nombres}
                                                    </div>
                                                    <div className="text-[11px] font-semibold text-zinc-400 flex items-center gap-1 mt-0.5">
                                                        <CalendarDays size={12} /> Creado el {new Intl.DateTimeFormat('es-PE', { timeZone: 'America/Lima', dateStyle: 'short' }).format(new Date(p.createdAt))}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex flex-col gap-1.5">
                                                {p.pii?.dni && (
                                                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-bold bg-white text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 shadow-sm w-max">
                                                        DNI: <span className="text-[var(--color-hospital-blue)] dark:text-blue-400">{p.pii.dni}</span>
                                                    </span>
                                                )}
                                                {p.pii?.carnetExtranjeria && (
                                                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-bold bg-white text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 shadow-sm w-max">
                                                        CEXT: <span className="text-indigo-600 dark:text-indigo-400">{p.pii.carnetExtranjeria}</span>
                                                    </span>
                                                )}
                                                {p.pii?.pasaporte && (
                                                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-bold bg-white text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 shadow-sm w-max">
                                                        PASAP: <span className="text-emerald-600 dark:text-emerald-400">{p.pii.pasaporte}</span>
                                                    </span>
                                                )}
                                                {!p.pii?.dni && !p.pii?.carnetExtranjeria && !p.pii?.pasaporte && (
                                                    <span className="text-[11px] text-zinc-400 italic font-medium px-1">Sin ID Oficial</span>
                                                )}
                                                {p.pii?.historiaClinica && (
                                                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-bold bg-orange-50 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400 border border-orange-200 dark:border-orange-500/20 w-max shadow-sm mt-0.5">
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
                                                    <span className="text-[11px] font-semibold text-zinc-400 mt-1">
                                                        Ubigeo: {p.ubigeo}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
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
        </div>
    );
}
