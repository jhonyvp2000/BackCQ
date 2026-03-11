import { getSurgeriesByDateDesc, updateSurgeryStatus, getActiveDiagnoses, getActiveProcedures } from "@/app/actions/cirugias";
import { getOperatingRooms } from "@/app/actions/salas";
import { getSpecialties } from "@/app/actions/especialidades";
import { getMedicalStaffByProfession } from "@/app/actions/personal";
import { Plus, Calendar, Clock, User, CheckCircle2, XCircle, AlertCircle, FileText, Activity, Hourglass, ArrowUp, ArrowDown, LayoutGrid, List } from "lucide-react";
import Link from "next/link";
import { SurgeryViewToggle } from "./surgery-view-toggle";
import { DeleteSurgeryButton } from "./delete-button";
import { SurgerySchedulerForm } from "./surgery-form";
import { StartSurgeryButton } from "./start-surgery-button";

export default async function ProgramacionesPage({ searchParams }: { searchParams: Promise<{ sort?: string }> }) {
    const sortParams = await searchParams;
    const currentSort = sortParams?.sort === 'asc' ? 'asc' : 'desc';
    const surgeriesData = await getSurgeriesByDateDesc(currentSort);
    const salas = await getOperatingRooms();
    const specialties = await getSpecialties();
    const diagnoses = await getActiveDiagnoses();
    const procedures = await getActiveProcedures();

    const surgeons = await getMedicalStaffByProfession('MEDICO CIRUJANO');
    const anesthesiologists = await getMedicalStaffByProfession('ANESTESIOLOGO');
    const nurses = await getMedicalStaffByProfession(['ENFERMERO INSTRUMENTISTA', 'ENFERMERO CIRCULANTE']);
    const staff = { surgeons, anesthesiologists, nurses };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'scheduled':
                return <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-50/80 text-blue-700 border border-blue-200/50 shadow-sm"><Calendar size={13} /> Programada</span>;
            case 'in_progress':
                return <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-500/10 text-amber-700 border border-amber-500/20 shadow-sm"><Activity size={13} className="animate-pulse" /> En Operación</span>;
            case 'completed':
                return <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 shadow-sm"><CheckCircle2 size={13} /> Finalizada</span>;
            case 'cancelled':
                return <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-red-500/10 text-red-700 border border-red-500/20 shadow-sm"><XCircle size={13} /> Suspendida</span>;
            default:
                return <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-zinc-100 text-zinc-700 border border-zinc-200 shadow-sm">{status}</span>;
        }
    };

    const getFormattedDate = (date: Date) => {
        return new Intl.DateTimeFormat('es-PE', {
            year: 'numeric', month: 'short', day: '2-digit',
            hour: '2-digit', minute: '2-digit'
        }).format(date);
    };

    // Allow scheduling even if no rooms exist so they can be "Sin asignar"
    const canSchedule = true;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
                        Programación Quirúrgica
                    </h2>
                    <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                        Agenda central de intervenciones y asignación de quirófanos
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
                {/* Formulario de Agendamiento Cliente */}
                <div className="xl:col-span-1">
                    <SurgerySchedulerForm salas={salas} specialties={specialties} staff={staff} canSchedule={canSchedule} diagnoses={diagnoses} procedures={procedures} />
                </div>

                {/* Lista / Timeline de Agenda (Envuelto en Client Component) */}
                <div className="xl:col-span-3">
                    <SurgeryViewToggle surgeriesData={surgeriesData} salas={salas} sortParams={sortParams} specialties={specialties} staff={staff} />
                </div>
            </div>
        </div>
    );
}
