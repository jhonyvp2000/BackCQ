"use client";

import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";

export function LogoutButton() {
    const handleLogout = async () => {
        // Evitamos que NextAuth use NEXTAUTH_URL del .env para redirigir
        await signOut({ 
            redirect: false 
        });
        
        // Redirigimos manualmente usando la URL del navegador actual
        window.location.href = window.location.origin + "/login";
    };

    return (
        <button 
            onClick={handleLogout}
            className="flex items-center text-sm font-medium text-zinc-500 hover:text-red-500 transition-colors bg-transparent border-none cursor-pointer"
        >
            <LogOut className="mr-2 h-4 w-4" />
            Cerrar sesión
        </button>
    );
}
