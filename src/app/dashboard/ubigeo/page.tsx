import { getUbigeos } from "@/app/actions/ubigeo";
import { MapPin, Database, Globe2 } from "lucide-react";
import { UbigeoSearch } from "./ubigeo-search";

export default async function UbigeoPage({ searchParams }: { searchParams: Promise<{ q?: string, page?: string }> }) {
    const params = await searchParams;
    const query = params?.q || "";
    const currentPage = parseInt(params?.page || "1");
    const ubigeos = await getUbigeos(currentPage, 50, query);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 relative overflow-hidden bg-gradient-to-r from-zinc-900 to-zinc-800 dark:from-black dark:to-zinc-900 p-8 rounded-3xl shadow-xl">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                    <Globe2 size={120} />
                </div>
                <div className="relative z-10 space-y-2">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold tracking-widest uppercase border border-blue-500/30">
                        <MapPin size={14} /> Catálogo INEI
                    </div>
                    <h2 className="text-3xl font-extrabold tracking-tight text-white drop-shadow-sm">
                        Directorio de Ubigeo
                    </h2>
                    <p className="text-sm font-medium text-zinc-300 max-w-xl">
                        Base de datos centralizada de ubicación geográfica del INEI (Instituto Nacional de Estadística e Informática), utilizada por MINSA para el empadronamiento de pacientes.
                    </p>
                </div>
            </div>

            {/* Smart Search Filter */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row gap-4 items-center">
                <UbigeoSearch defaultValue={query} />
                <div className="text-xs font-semibold text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-3 py-2 rounded-lg flex items-center gap-2 whitespace-nowrap">
                    <Database size={14} className="text-[var(--color-hospital-blue)]" />
                    Mostrando resultados estructurados
                </div>
            </div>

            {/* Premium Data Table */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
                {ubigeos.length === 0 ? (
                    <div className="p-16 text-center text-zinc-500 flex flex-col items-center">
                        <div className="w-16 h-16 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 flex items-center justify-center mb-4 border border-zinc-100 dark:border-zinc-800">
                            <MapPin size={32} className="text-zinc-400" />
                        </div>
                        <h3 className="text-lg font-bold text-zinc-800 dark:text-zinc-200">No se encontraron resultados</h3>
                        <p className="text-sm font-medium mt-1">Intenta con otro término de búsqueda.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800/60">
                            <thead className="bg-zinc-50/80 dark:bg-zinc-800/30 backdrop-blur-sm">
                                <tr>
                                    <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-zinc-500 uppercase tracking-widest whitespace-nowrap">
                                        Código INEI
                                    </th>
                                    <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-zinc-500 uppercase tracking-widest">
                                        Ubicación Política
                                    </th>
                                    <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-zinc-500 uppercase tracking-widest hidden md:table-cell">
                                        Superficie
                                    </th>
                                    <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-zinc-500 uppercase tracking-widest hidden lg:table-cell">
                                        Geolocalización
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-zinc-900 divide-y divide-zinc-100 dark:divide-zinc-800/40">
                                {ubigeos.map((u) => (
                                    <tr key={u.code} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors group">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/50">
                                                <span className="font-mono text-sm font-bold text-[var(--color-hospital-blue)] dark:text-blue-400 tracking-wider">
                                                    {u.code}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-0.5">
                                                <div className="text-sm font-bold text-zinc-900 dark:text-white group-hover:text-[var(--color-hospital-blue)] dark:group-hover:text-blue-400 transition-colors">
                                                    {u.distrito}
                                                </div>
                                                <div className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5 uppercase tracking-wide">
                                                    <span className="text-zinc-400 dark:text-zinc-500">Prov:</span> {u.provincia}
                                                    <span className="text-zinc-300 dark:text-zinc-600">•</span>
                                                    <span className="text-zinc-400 dark:text-zinc-500">Dpto:</span> {u.departamento}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap hidden md:table-cell">
                                            {u.superficie ? (
                                                <div className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                                                    {u.superficie} <span className="text-zinc-400">km²</span>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-zinc-400 italic">N/D</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap hidden lg:table-cell">
                                            <div className="flex flex-col gap-0.5">
                                                <span className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded inline-block w-max">
                                                    Lat: {u.latitud || 'N/D'}
                                                </span>
                                                <span className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded inline-block w-max">
                                                    Lng: {u.longitud || 'N/D'}
                                                </span>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <div className="text-center">
                <p className="text-xs text-zinc-400 font-medium tracking-wide">
                    FUENTE: PORTAL DE DATOS ABIERTOS NACIONALES (INEI)
                </p>
            </div>
        </div>
    );
}
