import { Metadata } from 'next';
import { ReportClientTable } from './report-client-table';

export const metadata: Metadata = {
    title: 'Reportes y Exportación | BackCQ',
    description: 'Generación de reportes quirúrgicos exportables y estadísticos.',
};

export default function ReportesPage() {
    return (
        <div className="flex-1 w-full flex flex-col items-center">
            <div className="w-full max-w-7xl mx-auto px-6 py-8">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">Reportes Quirúrgicos</h1>
                        <p className="text-sm text-zinc-500 font-medium">Filtra, previsualiza y exporta la información requerida a un formato estándar de Excel (CSV).</p>
                    </div>
                </div>

                <ReportClientTable />
            </div>
        </div>
    );
}
