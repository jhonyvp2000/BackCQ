import { getOrphans } from "@/app/actions/pacientes";
import OrphanInbox from "./orphan-inbox";

export const metadata = {
    title: "Resolución de Identidades | BackCQ",
    description: "Auditoría y resolución de pacientes no identificados",
};

export default async function OrphanPatientsPage() {
    const orphans = await getOrphans();

    return (
        <div className="flex flex-col h-[calc(100vh-80px)] overflow-hidden">
            <div className="flex-shrink-0 px-8 py-5 border-b border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 flex items-center justify-center">
                        <div className="w-3 h-3 rounded-full bg-amber-500 animate-pulse" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-zinc-900 dark:text-white tracking-tight">
                            Bandeja de Anomalías
                        </h1>
                        <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                            Resolución de Identidades de Pacientes
                        </p>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-hidden">
                <OrphanInbox orphansList={orphans} />
            </div>
        </div>
    );
}
