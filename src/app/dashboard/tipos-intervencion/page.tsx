import { fetchInterventionTypes } from "@/app/actions/intervention-types";
import { InterventionTypesClient } from "./intervention-types-client";

export const metadata = {
    title: "Tipos de Intervención | Centro Quirúrgico",
};

export default async function InterventionTypesPage() {
    const data = await fetchInterventionTypes();

    return (
        <div className="space-y-6">
            <InterventionTypesClient initialData={data} />
        </div>
    );
}
