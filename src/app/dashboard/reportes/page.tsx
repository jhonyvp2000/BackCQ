import { Metadata } from 'next';
import { ReportClientTable } from './report-client-table';
import { IndicatorsReportTable } from './indicators-report-table';

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

                <div className="space-y-12">
                    <section>
                        <h2 className="text-lg font-bold text-zinc-800 dark:text-zinc-200 mb-4 flex items-center gap-2">
                            <span className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center text-sm">01</span>
                            Grilla Detallada de Programaciones
                        </h2>
                        <ReportClientTable />
                    </section>

                    <div className="h-px bg-zinc-200 dark:bg-zinc-800 w-full" />

                    <section id="indicadores">
                        <h2 className="text-lg font-bold text-zinc-800 dark:text-zinc-200 mb-4 flex items-center gap-2">
                            <span className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 flex items-center justify-center text-sm">02</span>
                            Indicadores de Gestión (Estadística)
                        </h2>
                        <IndicatorsReportTable />
                    </section>
                </div>
            </div>
        </div>
    );
}
