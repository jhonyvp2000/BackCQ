import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { DocumentosClient } from "./documentos-client";
import { Files } from "lucide-react";

export default async function DocumentosPage() {
    const session = await getServerSession(authOptions);
    if (!session) redirect("/login");

    return (
        <div className="max-w-2xl mx-auto">
            {/* Page header */}
            <div className="mb-6">
                <div className="flex items-center gap-3 mb-1">
                    <div className="w-9 h-9 rounded-lg bg-[#0D47A1]/10 flex items-center justify-center">
                        <Files size={18} className="text-[#0D47A1]" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-zinc-900 dark:text-white tracking-tight">Centro de Documentos</h1>
                        <p className="text-sm text-zinc-500">Genera notas, conformidades y oficios institucionales de forma automática.</p>
                    </div>
                </div>
            </div>

            <DocumentosClient />
        </div>
    );
}
