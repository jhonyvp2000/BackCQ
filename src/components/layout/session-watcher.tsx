"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { getSession, signOut } from "next-auth/react";

export function SessionWatcher() {
    const pathname = usePathname();

    useEffect(() => {
        if (pathname?.startsWith("/dashboard")) {
            getSession().then((session) => {
                if (!session || !session.user || (session as any).error === "SessionExpired") {
                    console.log("SessionWatcher: Session invalid, redirecting...");
                    signOut({ redirect: false }).then(() => {
                        window.location.href = window.location.origin + "/login?error=SessionExpired";
                    });
                }
            });
        }
    }, [pathname]);

    return null;
}
