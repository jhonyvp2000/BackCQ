import { getSurgeriesByDateDesc, getActiveDiagnoses, getActiveProcedures, getActiveInterventions } from "@/app/actions/cirugias";
import { getOperatingRooms } from "@/app/actions/salas";
import { getSpecialties } from "@/app/actions/especialidades";
import { getMedicalStaffByProfession } from "@/app/actions/personal";
import { getPacientes } from "@/app/actions/pacientes";
import { SurgeryTvTable } from "./surgery-tv-table";

export default async function ProgramacionesTVPage({ searchParams }: { searchParams: Promise<{ sort?: string, date?: string }> }) {
    const sortParams = await searchParams;
    const currentSort = sortParams?.sort === 'asc' ? 'asc' : 'desc';
    
    // Default to today in Lima timezone if no date provided, but allow "all" to fetch everything
    let currentDate: string | undefined = sortParams?.date;
    if (currentDate === 'all') {
        currentDate = undefined;
    } else if (!currentDate) {
        currentDate = new Date().toLocaleString("sv-SE", { timeZone: "America/Lima" }).split(' ')[0];
    }

    const surgeriesData = await getSurgeriesByDateDesc(currentSort, currentDate);
    const salas = await getOperatingRooms();
    const specialties = await getSpecialties();
    const diagnoses = await getActiveDiagnoses();
    const procedures = await getActiveProcedures();
    const interventions = await getActiveInterventions();
    const patients = await getPacientes();

    const surgeons = await getMedicalStaffByProfession('MEDICO CIRUJANO');
    const anesthesiologists = await getMedicalStaffByProfession('ANESTESIOLOGO');
    const nurses = await getMedicalStaffByProfession(['ENFERMERO', 'ENFERMERO INSTRUMENTISTA', 'ENFERMERO CIRCULANTE', 'TECNICO INSTRUMENTISTA', 'TECNICO CIRCULANTE']);
    const staff = { surgeons, anesthesiologists, nurses };

    return (
        <div className="w-full h-full min-h-screen">
            <SurgeryTvTable 
                surgeriesData={surgeriesData} 
                salas={salas} 
                sortParams={sortParams} 
                specialties={specialties} 
                staff={staff} 
                permissions={[]} 
                diagnoses={diagnoses} 
                procedures={procedures} 
                interventions={interventions} 
                patients={patients} 
                initialDate={currentDate || ""} 
                forceTvMode={true}
            />
        </div>
    );
}
