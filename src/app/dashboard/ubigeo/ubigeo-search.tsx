"use client";

import { Search, AlertCircle, Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

export function UbigeoSearch({ defaultValue }: { defaultValue: string }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [query, setQuery] = useState(defaultValue);
    const [isPending, startTransition] = useTransition();

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (query === (searchParams.get("q") || "")) return;

            startTransition(() => {
                const newParams = new URLSearchParams(searchParams.toString());
                if (query) {
                    newParams.set("q", query);
                    newParams.delete("page"); // reset page on new search
                } else {
                    newParams.delete("q");
                }
                router.replace(`/dashboard/ubigeo?${newParams.toString()}`);
            });
        }, 300); // 300ms debounce

        return () => clearTimeout(timeoutId);
    }, [query, router, searchParams]);

    return (
        <div className="relative w-full sm:max-w-md group">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                {isPending ? (
                    <Loader2 className="h-4 w-4 text-[var(--color-hospital-blue)] animate-spin" />
                ) : (
                    <Search className="h-4 w-4 text-zinc-400 group-focus-within:text-[var(--color-hospital-blue)] transition-colors" />
                )}
            </div>
            <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar por código, departamento, provincia o distrito..."
                className="block w-full pl-10 pr-10 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm focus:ring-2 focus:ring-[var(--color-hospital-light)] focus:border-transparent outline-none transition-all placeholder:text-zinc-400 text-zinc-900 dark:text-zinc-100 font-medium"
            />
            {query && (
                <div className="absolute inset-y-0 right-0 pr-2 flex items-center">
                    <button
                        onClick={() => setQuery("")}
                        className="p-1 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                        title="Limpiar búsqueda"
                    >
                        <AlertCircle size={14} />
                    </button>
                </div>
            )}
        </div>
    );
}
