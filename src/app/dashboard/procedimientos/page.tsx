import { getAllProcedures } from "@/app/actions/procedures";
import { Plus, SplitSquareHorizontal, LayoutList } from "lucide-react";
import { CreateProcedureForm } from "./create-procedure-form";
import { ProceduresTable } from "./procedures-table";

export default async function ProceduresPage() {
    const data = await getAllProcedures();

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white flex items-center gap-2">
                        <SplitSquareHorizontal className="text-[var(--color-hospital-blue)]" />
                        Catálogo de Procedimientos
                    </h2>
                    <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400 max-w-2xl">
                        Base operativa quirúrgica: Abarca estándares tabulares certificados (CPT/MINSA) y actos médicos personalizados.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Formulario de Registro */}
                <div className="lg:col-span-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm h-fit sticky top-24">
                    <h3 className="font-bold text-lg text-zinc-900 dark:text-white mb-4 flex items-center">
                        <Plus size={20} className="mr-2 text-[var(--color-hospital-blue)]" /> Nuevo Acto Médico
                    </h3>
                    
                    <CreateProcedureForm initialProcedures={data} />
                </div>

                {/* Lista Completa Interactiva */}
                <div className="lg:col-span-3">
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden flex flex-col h-[calc(100vh-140px)]">
                        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center bg-zinc-50/50 dark:bg-zinc-800/20">
                            <h3 className="font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
                                <LayoutList size={18} className="text-zinc-400" />
                                Base de Datos
                            </h3>
                            <div className="text-xs font-medium px-3 py-1 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-full">
                                {data.length} Intervenciones
                            </div>
                        </div>

                        {/* Motor de Búsqueda Multivariable Integrado */}
                        <div className="flex-1 overflow-auto">
                            <ProceduresTable records={data} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
