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

            {/* Header Profiling & Quick Stats Integration */}
            <div className="bg-gradient-to-br from-white to-blue-50/50 dark:from-zinc-900 dark:to-blue-900/10 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 lg:p-8 shadow-sm relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-8">
                <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 dark:bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

                {/* Welcome Message Column */}
                <div className="relative z-10 md:w-1/2">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[var(--color-hospital-blue)]/10 text-[var(--color-hospital-blue)] dark:text-blue-400 rounded-full text-xs font-bold uppercase tracking-widest mb-3 border border-[var(--color-hospital-blue)]/20 shadow-sm backdrop-blur-sm">
                        <LayoutDashboard size={14} /> Panel Principal
                    </div>
                    <h2 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white leading-tight">
                        Bienvenido, Dr. {user?.lastname}
                    </h2>
                    <p className="mt-2 text-zinc-500 dark:text-zinc-400 text-sm font-medium leading-relaxed max-w-md">
                        Comando central de operaciones del Centro Quirúrgico. Vistazo en tiempo real del flujo de las salas y los pacientes agendados.
                    </p>
                </div>

                {/* Integrated Stats Row */}
                <div className="relative z-10 flex flex-wrap gap-4 md:w-1/2 md:justify-end">

                    {/* Stat 1: Cirugías Hoy */}
                    <div className="bg-white/80 dark:bg-zinc-800/80 backdrop-blur-md border border-zinc-200/50 dark:border-zinc-700/50 rounded-2xl p-4 shadow-sm flex items-center gap-4 flex-1 min-w-[140px] hover:shadow-md transition-all hover:-translate-y-0.5">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                            <ActivitySquare size={20} />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-0.5">Agendadas</p>
                            <h3 className="text-xl font-black text-zinc-800 dark:text-white leading-none">{stats.scheduledToday}</h3>
                        </div>
                    </div>

                    {/* Stat 2: En Operación */}
                    <div className="bg-white/80 dark:bg-zinc-800/80 backdrop-blur-md border border-amber-200/50 dark:border-amber-900/30 rounded-2xl p-4 shadow-sm flex items-center gap-4 flex-1 min-w-[140px] hover:shadow-md transition-all hover:-translate-y-0.5 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-amber-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-500 flex items-center justify-center font-bold relative">
                            <div className="absolute inset-0 bg-amber-400/20 rounded-xl animate-ping opacity-75"></div>
                            <Activity size={20} className="relative z-10" />
                        </div>
                        <div className="relative z-10">
                            <p className="text-[10px] font-bold text-amber-700 dark:text-amber-500 uppercase tracking-widest mb-0.5">En Operación</p>
                            <h3 className="text-xl font-black text-zinc-800 dark:text-white leading-none">{stats.inProgressToday}</h3>
                        </div>
                    </div>

                    {/* Stat 3: Quirófanos Libres */}
                    <div className="bg-white/80 dark:bg-zinc-800/80 backdrop-blur-md border border-zinc-200/50 dark:border-zinc-700/50 rounded-2xl p-4 shadow-sm flex items-center gap-4 flex-1 min-w-[140px] hover:shadow-md transition-all hover:-translate-y-0.5">
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                            <Calendar size={20} />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-0.5">Salas Libres</p>
                            <h3 className="text-xl font-black text-zinc-800 dark:text-white leading-none">{stats.salasAvailable}</h3>
                        </div>
                    </div>

                </div>
            </div>

            {/* Main Content Area */}
            <div className="grid grid-cols-1 gap-6">

                {/* Active and Upcoming Surgeries List */}
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-sm overflow-hidden flex flex-col">
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

            </div>
        </div>
    );
}
