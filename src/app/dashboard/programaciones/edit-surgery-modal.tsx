"use client";

import { SurgerySchedulerForm } from "./surgery-form";

export function EditSurgeryModal({ isOpen, onClose, initialData, salas, specialties, staff, diagnoses, procedures, interventions, patients }: {
    isOpen: boolean;
    onClose: () => void;
    initialData: any;
    salas: any[];
    specialties: any[];
    staff: any;
    diagnoses: any[];
    procedures: any[];
    interventions: any[];
    patients: any[];
}) {
    // Si no hay data inicial o no esta abierto, retornamos null o el propio form (el form gestiona su opacidad)
    if (!isOpen || !initialData) return null;

    return (
        <SurgerySchedulerForm 
            salas={salas}
            specialties={specialties}
            staff={staff}
            canSchedule={true}
            diagnoses={diagnoses}
            procedures={procedures}
            interventions={interventions}
            patients={patients}
            editMode={true}
            editData={initialData}
            isOpenOverride={isOpen}
            onCloseOverride={onClose}
        />
    );
}
