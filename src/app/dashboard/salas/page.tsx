import { getOperatingRooms, createOperatingRoom } from "@/app/actions/salas";
import { Plus, Play, Wrench, ShieldAlert } from "lucide-react";
import { DeleteRoomButton } from "./delete-button";
import { EditRoomButton } from "./edit-room-button";

export default async function SalasPage() {
    const salas = await getOperatingRooms();

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'available':
                return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200"><Play size={12} /> Disponible</span>;
            case 'occupied':
                return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200"><ShieldAlert size={12} /> Ocupada</span>;
            case 'maintenance':
                return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200"><Wrench size={12} /> Mantenimiento</span>;
            default:
                return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-zinc-50 text-zinc-700 border border-zinc-200">{status}</span>;
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
                        Salas de Operaciones
                    </h2>
                    <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                        Administración del bloque quirúrgico e infraestructura
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Formulario de Creación */}
                <div className="lg:col-span-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm h-fit sticky top-24">
                    <h3 className="font-semibold text-lg text-zinc-900 dark:text-white mb-4 flex items-center">
                        <Plus className="mr-2 text-[var(--color-hospital-blue)]" /> Agregar Sala
                    </h3>
                    <form action={createOperatingRoom} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                                Nombre del Quirófano
                            </label>
                            <input
                                type="text"
                                name="name"
                                required
                                className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-700 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-2 focus:ring-[var(--color-hospital-light)] outline-none transition-all"
                                placeholder="Ej. Sala 1"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                                Estado Inicial
                            </label>
                            <select
                                name="status"
                                className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-700 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-2 focus:ring-[var(--color-hospital-light)] outline-none transition-all"
                            >
                                <option value="available">Disponible</option>
                                <option value="maintenance">Mantenimiento</option>
                            </select>
                        </div>
                        <button
                            type="submit"
                            className="w-full mt-4 flex justify-center py-2.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-[var(--color-hospital-blue)] hover:bg-[#09357a] transition-colors"
                        >
                            Guardar Registro
                        </button>
                    </form>
                </div>

                {/* Tabla Lista */}
                <div className="lg:col-span-2">
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
                        {salas.length === 0 ? (
                            <div className="p-8 text-center text-zinc-500">
                                No hay salas de operaciones registradas aún.
                            </div>
                        ) : (
                            <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800">
                                <thead className="bg-zinc-50 dark:bg-zinc-800/50">
                                    <tr>
                                        <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                                            Sala / Infraestructura
                                        </th>
                                        <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                                            Estado
                                        </th>
                                        <th scope="col" className="px-6 py-4 pl-4 text-right text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                                            Acciones
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-zinc-900 divide-y divide-zinc-200 dark:divide-zinc-800">
                                    {salas.map((sala) => (
                                        <tr key={sala.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="flex-shrink-0 h-10 w-10 bg-[var(--color-hospital-light)]/10 text-[var(--color-hospital-blue)] rounded-xl flex items-center justify-center font-bold">
                                                        {sala.name.charAt(0)}
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="text-sm font-semibold text-zinc-900 dark:text-white">{sala.name}</div>
                                                        <div className="text-xs text-zinc-400">ID: {sala.id.split('-')[0]}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {getStatusBadge(sala.status)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="flex justify-end gap-2">
                                                    <EditRoomButton sala={sala} />

                                                    {/* Botón de Eliminación Rápida con validación Client-side */}
                                                    <DeleteRoomButton id={sala.id} />
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
