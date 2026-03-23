import { getAllMedicalStaff, getAsistencialProfessions } from "@/app/actions/personal";
import { Plus, Users, LayoutList } from "lucide-react";
import { CreateStaffForm } from "./create-staff-form";
import { StaffTable } from "./staff-table";

export default async function PersonalAsistencialPage() {
    // 1. Fetch current staff profiles & professions
    const staff = await getAllMedicalStaff();
    const professions = await getAsistencialProfessions();

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white flex items-center gap-2">
                        <Users className="text-[var(--color-hospital-blue)]" />
                        Directorio de Personal Asistencial
                    </h2>
                    <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400 max-w-2xl">
                        Gestiona el staff médico, cirujanos, anestesiólogos y enfermeros disponibles para los quirófanos.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Formulario de Creación Rápida */}
                <div className="lg:col-span-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm h-fit sticky top-24">
                    <h3 className="font-bold text-lg text-zinc-900 dark:text-white mb-4 flex items-center">
                        <Plus size={20} className="mr-2 text-[var(--color-hospital-blue)]" /> Nuevo Personal
                    </h3>
                    
                    <CreateStaffForm professions={professions} />
                </div>

                {/* Lista Completa del Personal */}
                <div className="lg:col-span-3">
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden flex flex-col h-[calc(100vh-140px)]">
                        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center bg-zinc-50/50 dark:bg-zinc-800/20">
                            <h3 className="font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
                                <LayoutList size={18} className="text-zinc-400" />
                                Staff Registrado
                            </h3>
                            <div className="text-xs font-medium px-3 py-1 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-full">
                                {staff.length} Registros Activos
                            </div>
                        </div>

                        {/* Interactive Table Client Component */}
                        <div className="flex-1 overflow-auto">
                            <StaffTable staff={staff} professions={professions} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
