import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getDashboardStats } from "@/app/actions/dashboard";
import { Activity, Clock, Plus, Users, Calendar, ArrowRight, ActivitySquare, LayoutDashboard, CalendarDays } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default async function DashboardPage() {
    const session = await getServerSession(authOptions);
    const user = session?.user as any;

    // Fallbacks in case stats fail
    const data = await getDashboardStats().catch(() => ({
        stats: { salasAvailable: 0, scheduledToday: 0, inProgressToday: 0, completedThisMonth: 0, totalPacientes: 0 },
        activeSurgeries: [],
        latestPatients: []
    }));

    const { stats, activeSurgeries, latestPatients } = data;

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'scheduled':
                return <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md text-[10px] font-bold border border-blue-200 uppercase tracking-wider">Programada</span>;
            case 'in_progress':
                return <span className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded-md text-[10px] font-bold border border-amber-200 uppercase tracking-wider flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></div> Operando</span>;
            case 'anesthesia_start':
                return <span className="bg-purple-50 text-purple-700 px-2 py-0.5 rounded-md text-[10px] font-bold border border-purple-200 uppercase tracking-wider flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse"></div> Anestesia</span>;
            case 'pre_incision':
                return <span className="bg-rose-50 text-rose-700 px-2 py-0.5 rounded-md text-[10px] font-bold border border-rose-200 uppercase tracking-wider flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></div> Pre-Incisión</span>;
            case 'surgery_end':
                return <span className="bg-cyan-50 text-cyan-700 px-2 py-0.5 rounded-md text-[10px] font-bold border border-cyan-200 uppercase tracking-wider flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-cyan-500"></div> Fin Cirugía</span>;
            case 'patient_exit':
                return <span className="bg-orange-50 text-orange-700 px-2 py-0.5 rounded-md text-[10px] font-bold border border-orange-200 uppercase tracking-wider flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-orange-500"></div> Salida Sala</span>;
            case 'urpa_exit':
                return <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md text-[10px] font-bold border border-indigo-200 uppercase tracking-wider flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div> URPA</span>;
            case 'completed':
                return <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md text-[10px] font-bold border border-emerald-200 uppercase tracking-wider">Completada</span>;
            case 'cancelled':
                return <span className="bg-red-50 text-red-700 px-2 py-0.5 rounded-md text-[10px] font-bold border border-red-200 uppercase tracking-wider hover:line-through">Suspendida</span>;
            default:
                return <span className="bg-gray-50 text-gray-700 px-2 py-0.5 rounded-md text-[10px] font-bold border border-gray-200 uppercase tracking-wider">{status}</span>;
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-12">

            {/* Header Profiling */}
            <div className="bg-gradient-to-r from-white to-blue-50/30 dark:from-zinc-900 dark:to-blue-900/10 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 dark:bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                    <div>
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[var(--color-hospital-blue)]/10 text-[var(--color-hospital-blue)] dark:text-blue-400 rounded-full text-xs font-bold uppercase tracking-widest mb-3 border border-[var(--color-hospital-blue)]/20">
                            <LayoutDashboard size={14} /> Panel Principal Central
                        </div>
                        <h2 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
                            Bienvenido, Dr. {user?.lastname}
                        </h2>
                        <p className="mt-2 text-zinc-500 dark:text-zinc-400 max-w-xl text-sm font-medium">
                            Este es el comando central de operaciones del Centro Quirúrgico. Aquí tienes un vistazo en tiempo real de lo que acontece en las salas y los pacientes agendados.
                        </p>
                    </div>
                </div>
            </div>

            {/* Top Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4">
                    <div className="w-12 h-12 rounded-[14px] bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold shadow-inner">
                        <ActivitySquare size={24} />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-zinc-500 uppercase tracking-wider">Cirugías Hoy</p>
                        <h3 className="text-2xl font-black text-zinc-800 dark:text-white leading-none mt-1">{stats.scheduledToday} <span className="text-xs font-medium text-zinc-400">Agendadas</span></h3>
                    </div>
                </div>

                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4">
                    <div className="w-12 h-12 rounded-[14px] bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold shadow-inner relative overflow-hidden">
                        <div className="absolute inset-0 bg-amber-400/20 animate-pulse"></div>
                        <Activity size={24} className="relative z-10" />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-zinc-500 uppercase tracking-wider">En Operación</p>
                        <h3 className="text-2xl font-black text-zinc-800 dark:text-white leading-none mt-1">{stats.inProgressToday} <span className="text-xs font-medium text-zinc-400">Salas Activas</span></h3>
                    </div>
                </div>

                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4">
                    <div className="w-12 h-12 rounded-[14px] bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold shadow-inner">
                        <Calendar size={24} />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-zinc-500 uppercase tracking-wider">Quirófanos Libres</p>
                        <h3 className="text-2xl font-black text-zinc-800 dark:text-white leading-none mt-1">{stats.salasAvailable} <span className="text-xs font-medium text-zinc-400">Disponibles</span></h3>
                    </div>
                </div>

                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4">
                    <div className="w-12 h-12 rounded-[14px] bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold shadow-inner">
                        <Users size={24} />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-zinc-500 uppercase tracking-wider">Pacientes BD</p>
                        <h3 className="text-2xl font-black text-zinc-800 dark:text-white leading-none mt-1">{stats.totalPacientes} <span className="text-xs font-medium text-zinc-400">Empadronados</span></h3>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Active and Upcoming Surgeries List (Span 2) */}
                <div className="lg:col-span-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-sm overflow-hidden flex flex-col">
                    <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center bg-zinc-50/50 dark:bg-zinc-900/50">
                        <h3 className="font-bold text-lg text-zinc-800 dark:text-white flex items-center gap-2">
                            <Clock className="text-blue-500" size={20} /> Tracker de Cirugías Próximas (Hoy)
                        </h3>
                        <Link href="/dashboard/programaciones" className="text-sm font-bold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center transition-colors">
                            Ver Programación Completa <ArrowRight size={16} className="ml-1" />
                        </Link>
                    </div>

                    <div className="p-0 overflow-x-auto flex-1">
                        {activeSurgeries.length === 0 ? (
                            <div className="p-12 text-center text-zinc-500 flex flex-col items-center h-full justify-center">
                                <div className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-4">
                                    <ActivitySquare size={32} className="text-zinc-400" />
                                </div>
                                <h3 className="text-lg font-bold text-zinc-800 dark:text-zinc-200">No hay cirugías activas para hoy</h3>
                                <p className="text-sm font-medium mt-1">El bloque quirúrgico se encuentra sin pacientes programados pendientes para el resto del día.</p>
                            </div>
                        ) : (
                            <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800">
                                <thead className="bg-zinc-50/80 dark:bg-zinc-800/30">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-left text-[11px] font-bold text-zinc-500 uppercase tracking-widest">Hora Estimada</th>
                                        <th scope="col" className="px-6 py-3 text-left text-[11px] font-bold text-zinc-500 uppercase tracking-widest">Paciente</th>
                                        <th scope="col" className="px-6 py-3 text-left text-[11px] font-bold text-zinc-500 uppercase tracking-widest">Sala / Diagnóstico</th>
                                        <th scope="col" className="px-6 py-3 text-left text-[11px] font-bold text-zinc-500 uppercase tracking-widest">Estado Actual</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-zinc-900 divide-y divide-zinc-100 dark:divide-zinc-800/50">
                                    {activeSurgeries.map((s: any) => (
                                        <tr key={s.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                                                    <Clock size={14} className="text-zinc-400" />
                                                    {format(new Date(s.scheduledDate), 'HH:mm')}
                                                </div>
                                                <div className="text-[10px] text-zinc-400 font-bold uppercase mt-1">
                                                    {s.urgencyType}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-bold text-zinc-900 dark:text-white">
                                                    {s.patient?.pii?.apellidos}, {s.patient?.pii?.nombres.split(' ')[0]}
                                                </div>
                                                <div className="text-[11px] font-semibold text-zinc-500">
                                                    HC: {s.patient?.pii?.historiaClinica || "N/A"}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-1.5 mb-1">
                                                    <span className="w-2 h-2 rounded-full bg-[var(--color-hospital-light)] border border-[var(--color-hospital-blue)]"></span>
                                                    <span className="text-[11px] font-bold text-[var(--color-hospital-blue)] dark:text-blue-400 uppercase tracking-wider">{s.operatingRoom?.name || 'Por Asignar'}</span>
                                                </div>
                                                <div className="text-xs text-zinc-600 dark:text-zinc-400 font-medium line-clamp-1" title={s.diagnosis}>
                                                    {s.diagnosis || "Sin diagnóstico registrado"}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {getStatusBadge(s.status)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>

                {/* Latest Patients (Span 1) */}
                <div className="lg:col-span-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-sm overflow-hidden flex flex-col">
                    <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center bg-zinc-50/50 dark:bg-zinc-900/50">
                        <h3 className="font-bold text-lg text-zinc-800 dark:text-white flex items-center gap-2">
                            <Users className="text-emerald-500" size={20} /> Últimos Empadronados
                        </h3>
                    </div>

                    <div className="p-0 flex-1">
                        {latestPatients.length === 0 ? (
                            <div className="p-8 text-center text-zinc-500">No hay pacientes nuevos.</div>
                        ) : (
                            <ul className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
                                {latestPatients.map((p) => (
                                    <li key={p.id} className="p-5 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 flex items-center justify-center font-bold text-sm">
                                                    {p.nombres?.charAt(0)}{p.apellidos?.charAt(0)}
                                                </div>
                                                <div className="truncate pr-4">
                                                    <p className="text-sm font-bold text-zinc-900 dark:text-white truncate">
                                                        {p.nombres.split(' ')[0]} {p.apellidos.split(' ')[0]}
                                                    </p>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        {p.dni ? (
                                                            <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded-sm">
                                                                DNI: {p.dni}
                                                            </span>
                                                        ) : (
                                                            <span className="text-[10px] font-bold text-zinc-400 italic">S/DNI</span>
                                                        )}
                                                        <span className="text-[10px] font-semibold text-zinc-400">
                                                            {format(new Date(p.createdAt), "d MMM, yyyy", { locale: es })}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    <div className="p-4 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/30 dark:bg-zinc-900/30">
                        <Link href="/dashboard/pacientes" className="w-full flex justify-center py-2.5 px-4 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-sm text-sm font-bold text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors">
                            Ir a Directorio Master
                        </Link>
                    </div>
                </div>

            </div>
        </div>
    );
}
