"use client";

import { useState } from "react";
import { ReportClientTable } from "./report-client-table";
import { IndicatorsReportTable } from "./indicators-report-table";
import { InterventionsReportTable } from "./interventions-report-table";
import { FileSpreadsheet, BarChart3, Activity } from "lucide-react";

type TabId = "detailed" | "indicators" | "interventions";

export function ReportTabsLayout() {
    const [activeTab, setActiveTab] = useState<TabId>("detailed");

    const tabs = [
        {
            id: "detailed" as TabId,
            label: "Grilla Detallada",
            description: "Programaciones detalladas",
            number: "01",
            icon: FileSpreadsheet,
            color: "text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400",
        },
        {
            id: "indicators" as TabId,
            label: "Indicadores de Gestión",
            description: "Estadísticas y rendimiento",
            number: "02",
            icon: BarChart3,
            color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400",
        },
        {
            id: "interventions" as TabId,
            label: "Cuadro de Intervenciones",
            description: "Cirugías por especialidad",
            number: "03",
            icon: Activity,
            color: "text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 dark:text-indigo-400",
        }
    ];

    return (
        <div className="w-full space-y-8">
            {/* Tabs Selector */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-zinc-100/70 dark:bg-zinc-800/40 p-2.5 rounded-2xl border border-zinc-200/50 dark:border-zinc-800/80">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-start gap-4 p-4 rounded-xl text-left transition-all duration-300 relative overflow-hidden group ${
                                isActive 
                                    ? "bg-white dark:bg-zinc-900 shadow-md ring-1 ring-zinc-200/50 dark:ring-zinc-800/50" 
                                    : "hover:bg-zinc-200/40 dark:hover:bg-zinc-800/30"
                            }`}
                        >
                            {/* Accent badge number */}
                            <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold font-mono transition-colors duration-300 shrink-0 ${tab.color}`}>
                                {tab.number}
                            </span>
                            
                            <div className="flex-1 min-w-0 z-10">
                                <h3 className={`font-bold text-sm tracking-tight transition-colors duration-300 ${
                                    isActive ? "text-zinc-900 dark:text-white" : "text-zinc-700 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-200"
                                }`}>
                                    {tab.label}
                                </h3>
                                <p className="text-xs text-zinc-500 font-medium truncate mt-0.5">
                                    {tab.description}
                                </p>
                            </div>

                            {/* Floating background watermark icon */}
                            <Icon className={`w-12 h-12 absolute -right-2 -bottom-2 transition-all duration-500 ${
                                isActive 
                                    ? "text-zinc-200/60 dark:text-zinc-800/40 scale-110 rotate-12" 
                                    : "text-zinc-200/20 dark:text-zinc-800/10 scale-100 group-hover:scale-105 group-hover:rotate-6"
                            }`} />
                        </button>
                    );
                })}
            </div>

            {/* Tab Content Display with subtle transitions */}
            <div className="transition-all duration-300 ease-in-out">
                {activeTab === "detailed" && (
                    <div className="animate-in fade-in duration-300 slide-in-from-bottom-2">
                        <ReportClientTable />
                    </div>
                )}
                {activeTab === "indicators" && (
                    <div className="animate-in fade-in duration-300 slide-in-from-bottom-2">
                        <IndicatorsReportTable />
                    </div>
                )}
                {activeTab === "interventions" && (
                    <div className="animate-in fade-in duration-300 slide-in-from-bottom-2">
                        <InterventionsReportTable />
                    </div>
                )}
            </div>
        </div>
    );
}
