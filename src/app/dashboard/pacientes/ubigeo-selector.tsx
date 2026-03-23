"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import { Check, ChevronsUpDown, Loader2, MapPin } from "lucide-react";
import { getUbigeos } from "@/app/actions/ubigeo";

export function UbigeoSelector({
    name,
    defaultValue = "",
    defaultLabel = ""
}: {
    name: string,
    defaultValue?: string,
    defaultLabel?: string
}) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [value, setValue] = useState(defaultValue || "");
    const [label, setLabel] = useState(defaultLabel);

    const [options, setOptions] = useState<any[]>([]);
    const [isPending, startTransition] = useTransition();

    const containerRef = useRef<HTMLDivElement>(null);

    // Initial load generic options or just let user type
    useEffect(() => {
        if (!open) return;

        const timeoutId = setTimeout(() => {
            startTransition(async () => {
                const results = await getUbigeos(1, 20, search);
                setOptions(results);
            });
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [search, open]);

    // Handle click outside to close dropdown
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Also populate defaultLabel if only defaultValue is provided
    useEffect(() => {
        if (defaultValue && !defaultLabel) {
            // we could fetch the specific ubigeo to show its label.
            // Since we might not have a getUbigeoByCode action, we can just show the code as label initially
            setLabel(`[${defaultValue}]`);
            getUbigeos(1, 1, defaultValue).then(res => {
                const match = res.find(u => u.code === defaultValue);
                if (match) {
                    setLabel(`${match.distrito}, ${match.provincia} - ${match.departamento} [${match.code}]`);
                }
            });
        }
    }, [defaultValue, defaultLabel]);

    return (
        <div className="relative w-full" ref={containerRef}>
            <input type="hidden" name={name} value={value} />

            <button
                type="button"
                onClick={() => setOpen(!open)}
                className="w-full flex items-center justify-between px-4 py-2.5 border border-zinc-200 dark:border-zinc-700 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 text-zinc-900 dark:text-white focus:ring-2 focus:ring-[var(--color-hospital-light)] focus:border-transparent outline-none transition-all font-medium text-left"
            >
                <div className="flex items-center gap-2 truncate text-sm">
                    {value ? (
                        <span className="truncate">{label}</span>
                    ) : (
                        <span className="text-zinc-400">Seleccionar Ubigeo...</span>
                    )}
                </div>
                <ChevronsUpDown className="h-4 w-4 opacity-50 shrink-0" />
            </button>

            {open && (
                <div className="absolute bottom-full mb-2 z-50 w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in slide-in-from-bottom-2 duration-200 origin-bottom">
                    <div className="p-2 border-b border-zinc-100 dark:border-zinc-800 flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-zinc-400 ml-2 shrink-0" />
                        <input
                            type="text"
                            className="w-full bg-transparent border-none outline-none text-sm p-1 placeholder:text-zinc-400 dark:text-white"
                            placeholder="Ej. Lima sjl..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            autoFocus
                        />
                        {isPending && <Loader2 className="h-4 w-4 animate-spin text-zinc-400 mr-2 shrink-0" />}
                    </div>

                    <div className="max-h-[280px] overflow-y-auto p-1">
                        {options.length === 0 && !isPending && (
                            <div className="p-4 text-center text-sm text-zinc-500">
                                No se encontraron ubigeos.
                            </div>
                        )}

                        {options.map((u) => (
                            <button
                                key={u.code}
                                type="button"
                                onClick={() => {
                                    setValue(u.code);
                                    setLabel(`${u.distrito}, ${u.provincia} - ${u.departamento} [${u.code}]`);
                                    setOpen(false);
                                    setSearch(""); // reset search for next open
                                }}
                                className={`w-full text-left flex items-start px-3 py-2.5 rounded-lg transition-colors ${value === u.code
                                    ? "bg-blue-50 dark:bg-blue-900/20 text-[var(--color-hospital-blue)] dark:text-blue-400"
                                    : "hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                                    }`}
                            >
                                <div className="flex-1 overflow-hidden">
                                    <div className="text-sm font-bold truncate">
                                        {u.distrito}
                                    </div>
                                    <div className="text-[11px] text-zinc-500 dark:text-zinc-400 uppercase tracking-wider truncate">
                                        {u.provincia} • {u.departamento}
                                    </div>
                                </div>
                                <div className="ml-2 flex flex-col items-end shrink-0">
                                    <span className="text-xs font-mono bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-500">
                                        {u.code}
                                    </span>
                                    {value === u.code && (
                                        <Check className="h-4 w-4 mt-1" />
                                    )}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
