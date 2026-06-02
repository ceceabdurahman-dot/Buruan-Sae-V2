import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// ============================================================
// Next.js Middleware — Proteksi route dashboard
// Halaman publik dan /auth/* dapat diakses tanpa login; dashboard tetap wajib login.
// ============================================================

export default withAuth(
  function middleware(req: NextRequest) {
    const token = (req as any).nextauth?.token;
    const { pathname } = req.nextUrl;

    // Sudah login tapi ke halaman auth → redirect ke dashboard
    if (pathname.startsWith('/auth/') && token) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    // Cek role ADMIN_DINAS / SUPER_ADMIN untuk halaman dashboard
    if (!pathname.startsWith('/auth/') && token) {
      const peran = token.peran as string | undefined;
      if (!peran || !['ADMIN_DINAS', 'SUPER_ADMIN'].includes(peran)) {
        return NextResponse.redirect(new URL('/auth/login?error=Unauthorized', req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      // Izinkan akses halaman publik root dan /auth/* tanpa login
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;
        if (pathname === '/') return true;
        if (pathname.startsWith('/auth/')) return true;
        // Semua route lain butuh token
        return !!token;
      },
    },
    pages: {
      signIn: '/auth/login',
      error: '/auth/login',
    },
  }
);

// Terapkan ke semua route kecuali asset statis dan API NextAuth
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/auth).*)',
  ],
};
