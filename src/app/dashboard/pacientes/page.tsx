import { getPacientes } from "@/app/actions/pacientes";
import { PatientsTable } from "./patients-table";
import { CreatePatientModal } from "./create-patient-modal";
import { PatientImporterPanel } from "./patient-importer-panel";

export default async function PacientesPage() {
    const pacientes = await getPacientes();

    const calculateAge = (dob: Date | null) => {
        if (!dob) return "N/D";
        const diff = Date.now() - new Date(dob).getTime();
        const age = new Date(diff).getUTCFullYear() - 1970;
        return age + " años";
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
                        Directorio de Pacientes
                    </h2>
                    <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                        Base de datos maestra de pacientes quirúrgicos y empadronamiento
                    </p>
                </div>
                <div>
                    <CreatePatientModal />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Panel Importador PIDE Masivo (Reemplaza Formulario Estático) */}
                <div className="lg:col-span-1">
                    <PatientImporterPanel initialLocalPatients={pacientes} />
                </div>

                {/* Tabla Integrada con Filtro Multivariable Inteligente */}
                <PatientsTable pacientes={pacientes} />
            </div >
        </div >
    );
}
