"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Stethoscope, Lock, User, AlertCircle } from "lucide-react";

export default function LoginPage() {
    const router = useRouter();
    const [dni, setDni] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const res = await signIn("credentials", {
                redirect: false,
                dni,
                password,
            });

            if (res?.error) {
                setError("Credenciales inválidas o sin acceso al ecosistema Centro Quirúrgico.");
            } else {
                router.push("/dashboard");
            }
        } catch (err) {
            setError("Error de red. Inténtalo de nuevo.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--color-hospital-bg)] relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-[var(--color-hospital-light)] rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
            <div className="absolute bottom-[-10%] left-[-5%] w-[30rem] h-[30rem] bg-[var(--color-hospital-blue)] rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>

            <div className="relative z-10 w-full max-w-md p-8 bg-white dark:bg-zinc-900 rounded-3xl shadow-xl border border-zinc-100 dark:border-zinc-800">
                <div className="flex flex-col items-center mb-8">
                    <div className="w-16 h-16 bg-[#0D47A1] text-white rounded-2xl flex items-center justify-center mb-4 shadow-lg border-2 border-white">
                        <Stethoscope size={32} />
                    </div>
                    <h1 className="text-2xl font-bold text-zinc-900 dark:text-white text-center">
                        BackCQ
                    </h1>
                    <p className="text-zinc-500 text-sm mt-1 text-center">
                        Centro Quirúrgico - Ingreso Institucional OGESS
                    </p>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 text-red-700 dark:text-red-400 text-sm flex items-start rounded-r-md">
                        <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0" />
                        <p>{error}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                            DNI Institucional
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <User className="h-5 w-5 text-zinc-400" />
                            </div>
                            <input
                                type="text"
                                value={dni}
                                onChange={(e) => setDni(e.target.value)}
                                className="block w-full pl-10 pr-3 py-3 border border-zinc-200 dark:border-zinc-700 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-2 focus:ring-[var(--color-hospital-light)] focus:border-transparent transition-all outline-none"
                                placeholder="Ingresar N° Documento"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                            Contraseña
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Lock className="h-5 w-5 text-zinc-400" />
                            </div>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="block w-full pl-10 pr-3 py-3 border border-zinc-200 dark:border-zinc-700 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-2 focus:ring-[var(--color-hospital-light)] focus:border-transparent transition-all outline-none"
                                placeholder="••••••••"
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-[var(--color-hospital-blue)] hover:bg-[#09357a] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--color-hospital-blue)] disabled:opacity-70 disabled:cursor-not-allowed transition-all"
                    >
                        {loading ? (
                            <span className="flex items-center">
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Validando...
                            </span>
                        ) : (
                            "Ingresar al Sistema"
                        )}
                    </button>
                </form>

                <div className="mt-8 pt-6 border-t border-zinc-100 dark:border-zinc-800 text-center">
                    <p className="text-xs text-zinc-400">
                        En caso de olvido de credenciales, contactar a soporte informático a través de mesa de ayuda (BackAdmin).
                    </p>
                </div>
            </div>
        </div>
    );
}
