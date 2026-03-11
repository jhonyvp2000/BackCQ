"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { deletePaciente } from "@/app/actions/pacientes";

export function DeletePatientButton({ id }: { id: string }) {
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
        if (!confirm("¿Estás seguro de que deseas eliminar este paciente? (Esta acción eliminará su registro PI también)")) {
            return;
        }

        setIsDeleting(true);
        try {
            const result = await deletePaciente(id);
            if (!result.success) {
                alert(result.message);
            }
        } catch (error) {
            console.error("Error al eliminar", error);
            alert("Error general al intentar eliminar el paciente.");
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <button
            onClick={handleDelete}
            disabled={isDeleting}
            className={`p-2 rounded-lg transition-colors tooltip \${isDeleting ? 'bg-zinc-100 text-zinc-400 cursor-not-allowed' : 'text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'}`}
            title="Eliminar Paciente"
        >
            <Trash2 size={16} className={isDeleting ? 'animate-pulse' : ''} />
        </button>
    );
}
