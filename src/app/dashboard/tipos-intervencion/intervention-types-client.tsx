"use client";

import { useState } from "react";
import { Plus, Search, Edit2, Trash2, SplitSquareHorizontal, ShieldAlert, CheckCircle, X, ChevronUp, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { InterventionTypeForm } from "./intervention-type-form";
import { DeleteInterventionModal } from "./delete-intervention-modal";

type InterventionType = {
    id: string;
    code: string | null;
    name: string;
    isActive: boolean;
    createdAt: Date;
};

export function InterventionTypesClient({ initialData }: { initialData: InterventionType[] }) {
    const [searchTerm, setSearchTerm] = useState("");
    const [data, setData] = useState<InterventionType[]>(initialData);
    
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedIntervention, setSelectedIntervention] = useState<InterventionType | null>(null);
    const [sortConfig, setSortConfig] = useState<{ key: 'name', direction: 'asc' | 'desc' }>({ key: 'name', direction: 'asc' });

    // Refresh data triggers next.js server action revalidatePath, but we can also manually mutate if needed.
    // In this case, revalidatePath will refresh the server component, but since it's initialData we might need to rely on Next.js hydration or just let the page reload. To be smooth, we'll let Next.js refresh it via Server Actions or we can use the router.
    
    const removeDiacritics = (str: string) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    const searchTerms = removeDiacritics(searchTerm.toLowerCase())
        .split(/\s+/)
        .filter(Boolean);

    let filteredData = data.filter(item => {
        if (searchTerms.length === 0) return true;
        const fullText = removeDiacritics(`${item.code || ""} ${item.name}`.toLowerCase());
        return searchTerms.every(term => fullText.includes(term));
    });

    if (sortConfig !== null) {
        filteredData.sort((a, b) => {
            if (a.name < b.name) {
                return sortConfig.direction === 'asc' ? -1 : 1;
            }
            if (a.name > b.name) {
                return sortConfig.direction === 'asc' ? 1 : -1;
            }
            return 0;
        });
    }

    const requestSort = () => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key: 'name', direction });
    };

    const handleCreateClick = () => {
        setSelectedIntervention(null);
        setIsFormModalOpen(true);
    };

    const handleEditClick = (item: InterventionType) => {
        setSelectedIntervention(item);
        setIsFormModalOpen(true);
    };

    const handleDeleteClick = (item: InterventionType) => {
        setSelectedIntervention(item);
        setIsDeleteModalOpen(true);
    };

    const onSuccessfulMutation = () => {
        setIsFormModalOpen(false);
        setIsDeleteModalOpen(false);
        // Page reload will fetch fresh data from the server due to revalidatePath
        window.location.reload(); 
    };

    return (
        <div className="animate-in fade-in duration-500 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white flex items-center gap-2">
                        <SplitSquareHorizontal className="text-[var(--color-hospital-blue)]" />
                        Tipos de Intervención Estructurales
                    </h2>
                    <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400 max-w-2xl">
                        Mantenimiento del catálogo maestro utilizado para clasificar la índole de las cirugías.
                    </p>
                </div>

                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleCreateClick}
                    className="flex items-center gap-2 bg-gradient-to-r from-teal-600 to-emerald-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-teal-500/20 hover:shadow-teal-500/40 transition-all border border-teal-500/50"
                >
                    <Plus size={18} />
                    <span>Nuevo Registro</span>
                </motion.button>
            </div>

            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden flex flex-col h-[calc(100vh-200px)]">
                {/* Herramientas e Inputs superiores */}
                <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/20 flex flex-col sm:flex-row gap-4 justify-between items-center">
                    <div className="relative w-full sm:max-w-md">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                        <input
                            type="text"
                            placeholder="Motor de Búsqueda multivariable..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-zinc-200 bg-white dark:bg-zinc-950 dark:border-zinc-800 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all shadow-sm text-zinc-900 dark:text-white font-medium"
                        />
                    </div>
                    <div className="text-xs font-bold text-zinc-500 uppercase tracking-wider bg-white dark:bg-zinc-800 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 shadow-sm">
                        {filteredData.length} Registros Activos
                    </div>
                </div>

                {/* Grilla Principal */}
                <div className="flex-1 overflow-auto bg-white dark:bg-[#0c0c0e]">
                    <table className="w-full text-sm text-left relative">
                        <thead className="text-xs uppercase bg-zinc-50 dark:bg-zinc-900/80 text-zinc-500 dark:text-zinc-400 sticky top-0 z-10 font-bold tracking-wider backdrop-blur-md border-b-[1.5px] border-zinc-200 dark:border-zinc-800">
                            <tr>
                                <th scope="col" className="px-6 py-4 w-24 text-center">Código</th>
                                <th 
                                    scope="col" 
                                    className="px-6 py-4 cursor-pointer hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors group select-none"
                                    onClick={requestSort}
                                >
                                    <div className="flex items-center gap-2">
                                        Nombre de la Intervención
                                        <span className="flex flex-col text-zinc-300 dark:text-zinc-700 group-hover:text-teal-500 transition-colors">
                                            <ChevronUp size={10} className={`-mb-1 ${sortConfig.direction === 'asc' ? 'text-teal-600 dark:text-teal-400' : ''}`} />
                                            <ChevronDown size={10} className={sortConfig.direction === 'desc' ? 'text-teal-600 dark:text-teal-400' : ''} />
                                        </span>
                                    </div>
                                </th>
                                <th scope="col" className="px-6 py-4 w-32 text-center">Estado</th>
                                <th scope="col" className="px-6 py-4 w-40 text-center">Operaciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/60">
                            {filteredData.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-zinc-500 font-medium">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <Search size={32} className="text-zinc-300 dark:text-zinc-700" />
                                            <span>No se encontraron registros que coincidan con la búsqueda.</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredData.map((item) => (
                                    <tr key={item.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors group">
                                        <td className="px-6 py-3">
                                            <div className="text-xs font-mono font-bold bg-zinc-100 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-300 px-2 py-1 rounded inline-block text-center mx-auto border border-zinc-200 dark:border-zinc-700">
                                                {item.code || 'S/C'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-3 font-semibold text-zinc-900 dark:text-zinc-100">
                                            {item.name}
                                        </td>
                                        <td className="px-6 py-3 text-center">
                                            {item.isActive ? (
                                                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                                                    <CheckCircle size={10} />
                                                    ACTIVO
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800">
                                                    <ShieldAlert size={10} />
                                                    INACTIVO
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-3">
                                            <div className="flex items-center justify-center gap-2">
                                                <button 
                                                    onClick={() => handleEditClick(item)}
                                                    className="p-1.5 text-blue-600 hover:bg-blue-50 hover:text-blue-700 dark:text-blue-400 dark:hover:bg-blue-900/30 rounded-lg transition-colors border border-transparent hover:border-blue-200 dark:hover:border-blue-800"
                                                    title="Editar Registro"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button 
                                                    onClick={() => handleDeleteClick(item)}
                                                    className="p-1.5 text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:text-rose-400 dark:hover:bg-rose-900/30 rounded-lg transition-colors border border-transparent hover:border-rose-200 dark:hover:border-rose-800"
                                                    title="Destruir Registro"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal para Crear / Editar */}
            <AnimatePresence>
                {isFormModalOpen && (
                    <>
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsFormModalOpen(false)}
                            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity" 
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white dark:bg-zinc-900 z-50 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden"
                        >
                            <div className="flex justify-between items-center p-5 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900">
                                <h3 className="font-bold text-lg text-zinc-900 dark:text-white flex items-center gap-2">
                                    <SplitSquareHorizontal className="text-teal-600" />
                                    {selectedIntervention ? 'Actualizar Intervención' : 'Registrar Nuevo Molde'}
                                </h3>
                                <button 
                                    onClick={() => setIsFormModalOpen(false)}
                                    className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="p-5">
                                <InterventionTypeForm 
                                    initialData={selectedIntervention} 
                                    onSuccess={onSuccessfulMutation} 
                                />
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Modal de Eliminación */}
            <AnimatePresence>
                {isDeleteModalOpen && selectedIntervention && (
                    <>
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsDeleteModalOpen(false)}
                            className="fixed inset-0 bg-red-950/40 backdrop-blur-sm z-40 transition-opacity" 
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white dark:bg-zinc-900 z-50 rounded-2xl shadow-2xl border border-red-200 dark:border-red-900/50 overflow-hidden"
                        >
                            <div className="p-6">
                                <DeleteInterventionModal 
                                    initialData={selectedIntervention}
                                    onSuccess={onSuccessfulMutation}
                                    onCancel={() => setIsDeleteModalOpen(false)}
                                />
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
