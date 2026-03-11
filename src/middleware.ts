import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server"; // Use correct path

export default withAuth(
    function middleware(req) {
        const isAuth = !!req.nextauth.token;
        const isAuthPage = req.nextUrl.pathname === '/login';

        // Redirect unauthenticated off /dashboard
        if (req.nextUrl.pathname.startsWith('/dashboard') && !isAuth) {
            return NextResponse.redirect(new URL('/login', req.url));
        }

        // Redirect root to dashboard
        if (req.nextUrl.pathname === '/') {
            return NextResponse.redirect(new URL('/dashboard', req.url));
        }

        // Redirect authenticated users away from /login
        if (isAuthPage && isAuth) {
            return NextResponse.redirect(new URL('/dashboard', req.url));
        }
    },
    {
        callbacks: {
            authorized: () => true, // Run middleware on all matched routes to handle redirects manually
        },
    }
);

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
