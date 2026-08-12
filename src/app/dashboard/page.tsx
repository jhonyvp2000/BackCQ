import { checkSession } from "@/lib/auth-helpers";
import { getDashboardStats } from "@/app/actions/dashboard";
import { db } from "@/db";
import { staffProfiles, professions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { 
    Activity, Clock, Plus, Users, Calendar, ArrowRight, ActivitySquare, 
    LayoutDashboard, CalendarDays, CheckCircle, XCircle, AlertTriangle, 
    FileText, Award, ShieldAlert, Heart, ClipboardCheck, ArrowUpRight, Tv 
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
    const session = await checkSession();
    const user = session.user as any;

    let userPrefix = ""; // Por defecto sin prefijo si no está en la tabla
    let userProf = "";
    if (user?.id) {
        try {
            const staff = await db.select({
                prof: professions.name
            })
            .from(staffProfiles)
            .innerJoin(professions, eq(staffProfiles.professionId, professions.id))
            .where(eq(staffProfiles.userId, user.id))
            .limit(1);

            if (staff.length > 0) {
                userProf = staff[0].prof;
                const prof = staff[0].prof.toUpperCase();
                if (prof.includes("MEDICO CIRUJANO") || prof.includes("MÉDICO CIRUJANO")) {
                    userPrefix = "Dr. ";
                } else if (prof.includes("ANESTESIOLOGO") || prof.includes("ANESTESIÓLOGO") || prof.includes("ENFERMER")) {
                    userPrefix = "Lic. ";
                } else if (prof.includes("TECNICO") || prof.includes("TÉCNICO") || prof.includes("ASISTENCIAL") || prof.includes("OTROS")) {
                    userPrefix = "Tec. ";
                } else {
                    userPrefix = "Dr. "; // Fallback si tiene profesion pero no entra en las categorías
                }
            }
        } catch (e) {
            console.error("Error fetching user profession prefix", e);
        }
    }

    // Fallbacks in case stats fail
    const data = await getDashboardStats(user?.id).catch(() => ({
        stats: { 
            salasAvailable: 0, 
            scheduledToday: 0, 
            inProgressToday: 0, 
            completedToday: 0, 
            cancelledToday: 0, 
            completedThisMonth: 0, 
            totalPacientes: 0,
            suspensionRate: 0,
            totalThisMonth: 0,
            electiveToday: 0,
            emergencyToday: 0
        },
        activeSurgeries: [],
        latestPatients: [],
        roomStatusList: [],
        pendingReports: [],
        alerts: [],
        todaySurgeries: []
    }));

    const { stats, activeSurgeries, latestPatients, roomStatusList, pendingReports, alerts, todaySurgeries } = data;

    const profUpper = userProf.toUpperCase();
    const isCirujano = profUpper.includes("CIRUJANO") || profUpper.includes("MÉDICO CIRUJANO");
    const isAsistencial = profUpper.includes("ENFERMER") || profUpper.includes("ANESTESI");
    const isManagement = !isCirujano && !isAsistencial;

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'scheduled':
                return <span className="bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 px-2 py-0.5 rounded-md text-[10px] font-bold border border-blue-200 dark:border-blue-800 uppercase tracking-wider">Programada</span>;
            case 'in_progress':
                return <span className="bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 px-2 py-0.5 rounded-md text-[10px] font-bold border border-amber-200 dark:border-amber-800 uppercase tracking-wider flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></div> Operando</span>;
            case 'anesthesia_start':
                return <span className="bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400 px-2 py-0.5 rounded-md text-[10px] font-bold border border-purple-200 dark:border-purple-800 uppercase tracking-wider flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse"></div> Anestesia</span>;
            case 'pre_incision':
                return <span className="bg-fuchsia-50 text-fuchsia-700 dark:bg-fuchsia-950/40 dark:text-fuchsia-400 px-2 py-0.5 rounded-md text-[10px] font-bold border border-fuchsia-200 dark:border-fuchsia-800 uppercase tracking-wider flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-fuchsia-500 animate-pulse"></div> Pre-Incisión</span>;
            case 'surgery_end':
                return <span className="bg-cyan-50 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-400 px-2 py-0.5 rounded-md text-[10px] font-bold border border-cyan-200 dark:border-cyan-800 uppercase tracking-wider flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-cyan-500"></div> Fin Cirugía</span>;
            case 'patient_exit':
                return <span className="bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400 px-2 py-0.5 rounded-md text-[10px] font-bold border border-orange-200 dark:border-orange-800 uppercase tracking-wider flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-orange-500"></div> Salida Sala</span>;
            case 'urpa_exit':
                return <span className="bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400 px-2 py-0.5 rounded-md text-[10px] font-bold border border-indigo-200 dark:border-indigo-800 uppercase tracking-wider flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div> URPA</span>;
            case 'completed':
                return <span className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 px-2 py-0.5 rounded-md text-[10px] font-bold border border-emerald-200 dark:border-emerald-800 uppercase tracking-wider">Completada</span>;
            case 'cancelled':
                return <span className="bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400 px-2 py-0.5 rounded-md text-[10px] font-bold border border-red-200 dark:border-red-800 uppercase tracking-wider">Suspendida</span>;
            default:
                return <span className="bg-gray-50 text-gray-700 dark:bg-gray-950/40 dark:text-gray-400 px-2 py-0.5 rounded-md text-[10px] font-bold border border-gray-200 dark:border-gray-800 uppercase tracking-wider">{status}</span>;
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-12">

            {/* Header Profiling & Quick Action Buttons */}
            <div className="bg-gradient-to-br from-white to-blue-50/50 dark:from-zinc-900 dark:to-blue-900/10 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 lg:p-8 shadow-sm relative overflow-hidden flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 dark:bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

                <div className="relative z-10 lg:w-3/5">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[var(--color-hospital-blue)]/10 text-[var(--color-hospital-blue)] dark:text-blue-400 rounded-full text-xs font-bold uppercase tracking-widest mb-3 border border-[var(--color-hospital-blue)]/20 shadow-sm backdrop-blur-sm">
                        <LayoutDashboard size={14} /> Panel Principal
                    </div>
                    <h2 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white leading-tight">
                        Bienvenido, {userPrefix}{user?.lastname}
                    </h2>
                    <p className="mt-2 text-zinc-500 dark:text-zinc-400 text-sm font-medium leading-relaxed max-w-md">
                        Comando central del Centro Quirúrgico. Vistazo en tiempo real del flujo de las salas y los pacientes agendados.
                    </p>
                </div>

                {/* Quick Actions Panel */}
                <div className="relative z-10 flex flex-wrap gap-3 lg:w-2/5 lg:justify-end">
                    <Link
                        href="/dashboard/programaciones"
                        className="flex items-center gap-2 bg-[var(--color-hospital-blue)] hover:bg-[var(--color-hospital-blue)]/90 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-sm hover:shadow transition-all"
                    >
                        <Plus size={16} /> Programar Cirugía
                    </Link>
                    <Link
                        href="/dashboard/programaciones/tv"
                        className="flex items-center gap-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-750 text-zinc-700 dark:text-zinc-200 font-bold text-xs px-4 py-2.5 rounded-xl shadow-sm hover:shadow transition-all"
                    >
                        <Tv size={16} /> Monitor TV Quirófanos
                    </Link>
                </div>
            </div>

            {/* Fila 2: Alertas Críticas de Seguridad Clínica */}
            {alerts && alerts.length > 0 && (
                <div className="bg-red-500/5 dark:bg-red-500/10 border border-red-200 dark:border-red-900/50 rounded-3xl p-6">
                    <div className="flex items-center gap-2.5 mb-4 text-red-800 dark:text-red-400">
                        <ShieldAlert size={22} className="shrink-0" />
                        <h4 className="font-extrabold text-base tracking-tight">Alertas Críticas de Seguridad Clínica ({alerts.length})</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {alerts.map((alert: any) => (
                            <div 
                                key={alert.id} 
                                className={`flex items-start gap-3 p-3.5 rounded-2xl border text-xs font-semibold leading-relaxed shadow-sm transition-all ${
                                    alert.type === 'critical' 
                                        ? 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900 text-red-800 dark:text-red-300' 
                                        : 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-300'
                                }`}
                            >
                                <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                                <div>{alert.message}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Fila 3: Tarjetas de Métricas (KPIs) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Ocupación de Salas */}
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-5 shadow-sm hover:shadow-md transition-all">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Quirófanos Activos</span>
                        <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                            <Activity size={18} />
                        </div>
                    </div>
                    <div className="flex items-baseline gap-1">
                        <h3 className="text-3xl font-black text-zinc-900 dark:text-white">{stats.inProgressToday}</h3>
                        <span className="text-sm font-semibold text-zinc-400">/ {roomStatusList.length || 4} activos</span>
                    </div>
                    <div className="mt-3 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Monitoreo en tiempo real</span>
                    </div>
                </div>

                {/* Tasa de Suspensión Quirúrgica */}
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-5 shadow-sm hover:shadow-md transition-all">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Tasa de Suspensión (Mes)</span>
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${stats.suspensionRate > 10 ? 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400' : 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'}`}>
                            <XCircle size={18} />
                        </div>
                    </div>
                    <div className="flex items-baseline gap-1">
                        <h3 className={`text-3xl font-black ${stats.suspensionRate > 10 ? 'text-red-600 dark:text-red-400' : 'text-zinc-900 dark:text-white'}`}>{stats.suspensionRate}%</h3>
                        <span className="text-xs font-bold text-zinc-400 uppercase">meta &lt; 10%</span>
                    </div>
                    <div className="mt-3">
                        <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-1.5">
                            <div 
                                className={`h-1.5 rounded-full ${stats.suspensionRate > 10 ? 'bg-red-500' : 'bg-emerald-500'}`} 
                                style={{ width: `${Math.min(100, stats.suspensionRate * 4)}%` }}
                            ></div>
                        </div>
                    </div>
                </div>

                {/* Emergencias de Hoy */}
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-5 shadow-sm hover:shadow-md transition-all">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Emergencias (Hoy)</span>
                        <div className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 flex items-center justify-center">
                            <ShieldAlert size={18} />
                        </div>
                    </div>
                    <h3 className="text-3xl font-black text-zinc-900 dark:text-white">{stats.emergencyToday}</h3>
                    <div className="mt-3 flex items-center gap-1 text-[10px] font-bold text-red-600 dark:text-red-400 uppercase tracking-wider">
                        <Activity size={12} className="animate-pulse" />
                        {stats.emergencyToday > 0 ? "Atención inmediata requerida" : "Sin emergencias hoy"}
                    </div>
                </div>

                {/* Rol-based dynamic metric (Surgical Reports or Total Patients) */}
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-5 shadow-sm hover:shadow-md transition-all">
                    {isCirujano ? (
                        <>
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Reportes Pendientes</span>
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${pendingReports.length > 0 ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400' : 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'}`}>
                                    <FileText size={18} />
                                </div>
                            </div>
                            <h3 className="text-3xl font-black text-zinc-900 dark:text-white">{pendingReports.length}</h3>
                            <div className="mt-3 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                                {pendingReports.length > 0 ? "Por registrar reporte quirúrgico" : "¡Todo al día!"}
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Pacientes Registrados</span>
                                <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                                    <Users size={18} />
                                </div>
                            </div>
                            <h3 className="text-3xl font-black text-zinc-900 dark:text-white">{stats.totalPacientes}</h3>
                            <div className="mt-3 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                                Registros en la base de datos
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Fila 4: Quirófanos en Tiempo Real (Monitor Quirúrgico) */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="font-extrabold text-lg text-zinc-800 dark:text-white flex items-center gap-2">
                        <Activity className="text-blue-500 shrink-0" size={20} /> Monitor de Quirófanos en Tiempo Real
                    </h3>
                    <span className="flex items-center gap-1.5 text-xs text-zinc-400 font-bold uppercase">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span> Actualizado en vivo
                    </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {roomStatusList && roomStatusList.length > 0 ? (
                        roomStatusList.map((room: any) => (
                            <div 
                                key={room.roomId} 
                                className={`border rounded-2xl p-4 shadow-sm flex flex-col justify-between min-h-[190px] transition-all relative overflow-hidden group hover:shadow-md ${
                                    room.roomStatus === 'occupied' 
                                        ? 'bg-gradient-to-b from-white to-amber-50/20 dark:from-zinc-900 dark:to-amber-950/10 border-amber-200 dark:border-amber-900/50' 
                                        : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800'
                                }`}
                            >
                                <div className="relative z-10">
                                    {/* Cabecera de la Sala */}
                                    <div className="flex justify-between items-center mb-3">
                                        <span className="font-black text-xs text-zinc-800 dark:text-zinc-200 uppercase tracking-widest">{room.roomName}</span>
                                        {room.roomStatus === 'occupied' ? (
                                            <span className="bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider flex items-center gap-1">
                                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                                                {room.status === 'in_progress' ? 'OPERANDO' : 'PREPARACIÓN'}
                                            </span>
                                        ) : (
                                            <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider">
                                                DISPONIBLE
                                            </span>
                                        )}
                                    </div>

                                    {/* Contenido según estado de la sala */}
                                    {room.roomStatus === 'occupied' ? (
                                        <div className="space-y-2">
                                            <div className="text-sm font-extrabold text-zinc-900 dark:text-white line-clamp-1">
                                                {room.patientName}
                                            </div>
                                            <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                                                {room.specialty}
                                            </div>
                                            <div className="text-xs text-zinc-500 font-semibold leading-relaxed line-clamp-2" title={room.diagnosis}>
                                                Dx: {room.diagnosis}
                                            </div>
                                            <div className="text-[10px] font-bold text-zinc-500">
                                                Cirujano: <span className="text-zinc-700 dark:text-zinc-300 font-extrabold">{room.surgeonName}</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-3 py-2">
                                            {room.nextSurgery ? (
                                                <div className="bg-zinc-50 dark:bg-zinc-800/40 p-2.5 rounded-xl border border-zinc-100 dark:border-zinc-800/50">
                                                    <div className="text-[9px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-1">
                                                        Próxima: {room.nextSurgery.time} hs
                                                    </div>
                                                    <div className="text-xs font-bold text-zinc-800 dark:text-zinc-200 truncate">
                                                        {room.nextSurgery.patientName}
                                                    </div>
                                                    <div className="text-[9px] text-zinc-400 font-bold uppercase truncate">
                                                        {room.nextSurgery.specialty}
                                                    </div>
                                                </div>
                                            ) : (
                                                <p className="text-xs font-semibold text-zinc-400 italic">
                                                    Disponible para cirugías de emergencia.
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Pie de Quirófano (Barra de progreso / información de tiempos) */}
                                {room.roomStatus === 'occupied' && (
                                    <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800/50 relative z-10">
                                        <div className="flex justify-between items-center text-[9px] font-bold text-zinc-400 uppercase mb-1">
                                            <span>Transcurrido</span>
                                            <span>{room.elapsedMins}m / {room.durationMins}m</span>
                                        </div>
                                        <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-1.5">
                                            <div 
                                                className="h-1.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500" 
                                                style={{ width: `${room.progressPercent}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))
                    ) : (
                        <div className="col-span-full py-8 text-center text-zinc-400 text-sm font-semibold italic">
                            No se encontraron quirófanos configurados.
                        </div>
                    )}
                </div>
            </div>

            {/* Fila 5: Sección Adaptativa por Rol & Tracker de Cirugías Próximas */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Columna Izquierda: Vista Dinámica del Rol del Usuario */}
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-sm overflow-hidden flex flex-col justify-between">
                    <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
                        {isCirujano && (
                            <h3 className="font-extrabold text-base text-zinc-800 dark:text-white flex items-center gap-2">
                                <FileText className="text-amber-500 shrink-0" size={18} /> Bandeja de Reportes Pendientes
                            </h3>
                        )}
                        {isAsistencial && (
                            <h3 className="font-extrabold text-base text-zinc-800 dark:text-white flex items-center gap-2">
                                <ClipboardCheck className="text-emerald-500 shrink-0" size={18} /> Checklist Clínico de Hoy
                            </h3>
                        )}
                        {isManagement && (
                            <h3 className="font-extrabold text-base text-zinc-800 dark:text-white flex items-center gap-2">
                                <ActivitySquare className="text-indigo-500 shrink-0" size={18} /> Carga Quirúrgica Hoy
                            </h3>
                        )}
                    </div>

                    <div className="p-6 flex-1 min-h-[300px]">
                        {/* 1. Vista de Cirujano */}
                        {isCirujano && (
                            pendingReports.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center p-6">
                                    <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3">
                                        <Award size={32} />
                                    </div>
                                    <h4 className="font-extrabold text-zinc-800 dark:text-zinc-200">¡Gran trabajo, doctor!</h4>
                                    <p className="text-xs text-zinc-400 font-semibold mt-1">No tiene reportes quirúrgicos pendientes por registrar en el sistema.</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {pendingReports.map((report: any) => (
                                        <div 
                                            key={report.id}
                                            className="flex items-center justify-between p-3 border border-zinc-100 dark:border-zinc-800 rounded-2xl hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors"
                                        >
                                            <div className="min-w-0 pr-4">
                                                <div className="text-sm font-extrabold text-zinc-800 dark:text-zinc-200 truncate">
                                                    {report.patient.apellidos}, {report.patient.nombres}
                                                </div>
                                                <div className="text-[10px] text-zinc-400 font-bold uppercase mt-1">
                                                    HC: {report.patient.historiaClinica || 'N/A'} • {format(new Date(report.scheduledDate), 'dd/MM/yyyy HH:mm')}
                                                </div>
                                                <div className="text-xs text-zinc-500 font-medium truncate mt-0.5">
                                                    Dx: {report.diagnosis || 'Sin especificar'}
                                                </div>
                                            </div>
                                            <Link 
                                                href={`/dashboard/programaciones/${report.id}/reporte`}
                                                className="shrink-0 bg-blue-50 hover:bg-blue-100 text-blue-600 dark:bg-blue-950/30 dark:hover:bg-blue-900/30 dark:text-blue-400 text-xs font-bold px-3 py-2 rounded-xl border border-blue-100 dark:border-blue-900 transition-colors flex items-center gap-1"
                                            >
                                                Redactar <ArrowUpRight size={12} />
                                            </Link>
                                        </div>
                                    ))}
                                </div>
                            )
                        )}

                        {/* 2. Vista Asistencial */}
                        {isAsistencial && (
                            todaySurgeries.filter(s => s.surgery.status !== 'completed' && s.surgery.status !== 'cancelled').length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center p-6">
                                    <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3">
                                        <CheckCircle size={32} />
                                    </div>
                                    <h4 className="font-extrabold text-zinc-800 dark:text-zinc-200">Preparación completa</h4>
                                    <p className="text-xs text-zinc-400 font-semibold mt-1">No hay cirugías pendientes para preparar hoy.</p>
                                </div>
                            ) : (
                                <div className="space-y-3.5">
                                    {todaySurgeries
                                        .filter(s => s.surgery.status !== 'completed' && s.surgery.status !== 'cancelled')
                                        .slice(0, 4)
                                        .map((s: any) => (
                                            <div 
                                                key={s.surgery.id}
                                                className="p-3 border border-zinc-100 dark:border-zinc-800 rounded-2xl hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-all"
                                            >
                                                <div className="flex justify-between items-start mb-2">
                                                    <div>
                                                        <div className="text-xs font-extrabold text-zinc-900 dark:text-white">
                                                            {s.patientPii?.apellidos}, {s.patientPii?.nombres}
                                                        </div>
                                                        <div className="text-[9px] text-zinc-400 font-bold uppercase">
                                                            Prog: {format(new Date(s.surgery.scheduledDate), 'HH:mm')} hs • HC: {s.patientPii?.historiaClinica || 'N/A'}
                                                        </div>
                                                    </div>
                                                    {getStatusBadge(s.surgery.status)}
                                                </div>

                                                <div className="flex flex-wrap gap-1.5 mt-2">
                                                    {/* Grupo Sanguíneo */}
                                                    {s.patientPii?.bloodGroupRh ? (
                                                        <span className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 px-2 py-0.5 rounded-lg text-[9px] font-bold border border-emerald-100 dark:border-emerald-900/50">🩸 GFS: {s.patientPii.bloodGroupRh}</span>
                                                    ) : (
                                                        <span className="bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400 px-2 py-0.5 rounded-lg text-[9px] font-bold border border-red-100 dark:border-red-900/50">🩸 GFS: Faltante</span>
                                                    )}

                                                    {/* Cama */}
                                                    {s.surgery.bedNumber ? (
                                                        <span className="bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 px-2 py-0.5 rounded-lg text-[9px] font-bold border border-blue-100 dark:border-blue-900/50">🛏️ Cama {s.surgery.bedNumber}</span>
                                                    ) : (
                                                        <span className="bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 px-2 py-0.5 rounded-lg text-[9px] font-bold border border-amber-100 dark:border-amber-900/50">🛏️ Cama: S/N</span>
                                                    )}

                                                    {/* Seguro */}
                                                    {s.surgery.insuranceType ? (
                                                        <span className="bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400 px-2 py-0.5 rounded-lg text-[9px] font-bold border border-purple-100 dark:border-purple-900/50">🛡️ {s.surgery.insuranceType}</span>
                                                    ) : (
                                                        <span className="bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 px-2 py-0.5 rounded-lg text-[9px] font-bold border border-amber-100 dark:border-amber-900/50">🛡️ Seguro: S/N</span>
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    }
                                </div>
                            )
                        )}

                        {/* 3. Vista de Jefatura / Administración */}
                        {isManagement && (
                            <div className="space-y-6">
                                {/* Electivas vs Emergencias */}
                                <div>
                                    <div className="flex justify-between items-center text-xs font-bold text-zinc-500 uppercase mb-2">
                                        <span>Proporción de Cirugías Hoy</span>
                                        <span>Electivas {stats.electiveToday} vs Emergencias {stats.emergencyToday}</span>
                                    </div>
                                    <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-3 flex overflow-hidden">
                                        {stats.electiveToday + stats.emergencyToday > 0 ? (
                                            <>
                                                <div 
                                                    className="bg-blue-600 h-full" 
                                                    style={{ width: `${(stats.electiveToday / (stats.electiveToday + stats.emergencyToday)) * 100}%` }}
                                                    title="Electivas"
                                                ></div>
                                                <div 
                                                    className="bg-red-600 h-full" 
                                                    style={{ width: `${(stats.emergencyToday / (stats.electiveToday + stats.emergencyToday)) * 100}%` }}
                                                    title="Emergencias"
                                                ></div>
                                            </>
                                        ) : (
                                            <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-full rounded-full"></div>
                                        )}
                                    </div>
                                    <div className="flex gap-4 mt-2.5 text-[9px] font-bold text-zinc-400 uppercase">
                                        <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-blue-600"></span> Electivas</div>
                                        <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-red-600"></span> Emergencias</div>
                                    </div>
                                </div>

                                {/* Últimos Pacientes Empadronados */}
                                <div className="border-t border-zinc-100 dark:border-zinc-800 pt-4">
                                    <div className="text-xs font-black text-zinc-800 dark:text-zinc-200 uppercase tracking-widest mb-3 flex items-center justify-between">
                                        <span>Últimos Pacientes Empadronados</span>
                                        <Link href="/dashboard/pacientes" className="text-[10px] text-blue-600 dark:text-blue-400 font-bold hover:underline">Ver todos</Link>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        {latestPatients && latestPatients.length > 0 ? (
                                            latestPatients.map((p: any) => (
                                                <div key={p.id} className="p-2 border border-zinc-100 dark:border-zinc-800 rounded-xl bg-zinc-55/30 text-[10px] leading-tight">
                                                    <div className="font-extrabold text-zinc-800 dark:text-zinc-200 truncate">{p.apellidos}, {p.nombres.split(' ')[0]}</div>
                                                    <div className="text-zinc-400 mt-0.5">DNI: {p.dni || 'N/A'} • HC: {p.hc || 'N/A'}</div>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="col-span-full text-[10px] text-zinc-400 italic">No hay pacientes empadronados.</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Columna Derecha: Tracker de Cirugías Próximas (Hoy) */}
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-sm overflow-hidden flex flex-col">
                    <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center bg-zinc-50/50 dark:bg-zinc-900/50">
                        <h3 className="font-extrabold text-base text-zinc-800 dark:text-white flex items-center gap-2">
                            <Clock className="text-blue-500" size={18} /> Tracker de Cirugías Próximas (Hoy)
                        </h3>
                        <Link href="/dashboard/programaciones" className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center transition-colors">
                            Ver Agenda Completa <ArrowRight size={14} className="ml-1" />
                        </Link>
                    </div>

                    <div className="p-0 overflow-x-auto flex-1">
                        {activeSurgeries.length === 0 ? (
                            <div className="p-12 text-center text-zinc-500 flex flex-col items-center h-full justify-center min-h-[300px]">
                                <div className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-4">
                                    <ActivitySquare size={32} className="text-zinc-400" />
                                </div>
                                <h3 className="text-sm font-extrabold text-zinc-800 dark:text-zinc-200">No hay cirugías activas para hoy</h3>
                                <p className="text-[11px] font-semibold mt-1 max-w-xs text-zinc-400 leading-relaxed">El bloque quirúrgico se encuentra sin pacientes programados pendientes para el resto del día.</p>
                            </div>
                        ) : (
                            <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800 text-xs">
                                <thead className="bg-zinc-50/80 dark:bg-zinc-800/30">
                                    <tr>
                                        <th scope="col" className="px-5 py-3 text-left text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Hora Estimada</th>
                                        <th scope="col" className="px-5 py-3 text-left text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Paciente</th>
                                        <th scope="col" className="px-5 py-3 text-left text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Sala / Diagnóstico</th>
                                        <th scope="col" className="px-5 py-3 text-left text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Estado Actual</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-zinc-900 divide-y divide-zinc-100 dark:divide-zinc-800/50">
                                    {activeSurgeries.map((s: any) => (
                                        <tr key={s.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                                            <td className="px-5 py-3.5 whitespace-nowrap">
                                                <div className="font-extrabold text-zinc-800 dark:text-zinc-200 flex items-center gap-1">
                                                    <Clock size={12} className="text-zinc-400" />
                                                    {format(new Date(s.scheduledDate), 'HH:mm')}
                                                </div>
                                                 {s.urgencyType && (
                                                     <div className="mt-1 block">
                                                         <span className={`text-[9px] inline-block px-1.5 py-0.5 rounded border font-bold uppercase text-center ${s.urgencyType === 'EMERGENCIA' ? 'bg-red-50 text-red-600 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-800/50' : 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/50'}`}>
                                                             {s.urgencyType}
                                                         </span>
                                                     </div>
                                                 )}
                                            </td>
                                            <td className="px-5 py-3.5 whitespace-nowrap">
                                                <div className="font-extrabold text-zinc-800 dark:text-white">
                                                    {s.patient?.pii?.apellidos}, {s.patient?.pii?.nombres.split(' ')[0]}
                                                </div>
                                                <div className="text-[10px] font-semibold text-zinc-400 mt-0.5">
                                                    HC: {s.patient?.pii?.historiaClinica || "N/A"}
                                                </div>
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <div className="flex items-center gap-1 mb-1">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                                                    <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-wider">{s.operatingRoom?.name || 'Por Asignar'}</span>
                                                </div>
                                                <div className="text-[11px] text-zinc-500 font-medium line-clamp-1" title={s.diagnosis}>
                                                    {s.diagnosis || "Sin diagnóstico registrado"}
                                                </div>
                                            </td>
                                            <td className="px-5 py-3.5 whitespace-nowrap">
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
