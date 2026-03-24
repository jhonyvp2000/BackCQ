"use client";

import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";

export function LogoutButton() {
    const handleLogout = async () => {
        // Obtenemos dinámicamente el origen (localhost o IP de red)
        const callbackUrl = window.location.origin + "/login";
        
        await signOut({ 
            callbackUrl 
        });
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
