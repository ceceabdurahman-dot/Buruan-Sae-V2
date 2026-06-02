import NextAuth, { DefaultSession, DefaultUser } from 'next-auth';
import { JWT, DefaultJWT } from 'next-auth/jwt';

// ============================================================
// NextAuth Type Augmentation — Buruan Sae 2.0 Web Admin
// Extends default types so TypeScript knows about custom fields
// ============================================================

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      peran: 'ADMIN_DINAS' | 'SUPER_ADMIN';
      accessToken: string;
    } & DefaultSession['user'];
  }

  interface User extends DefaultUser {
    peran: 'ADMIN_DINAS' | 'SUPER_ADMIN';
    accessToken: string;
    refreshToken: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    id: string;
    peran: 'ADMIN_DINAS' | 'SUPER_ADMIN';
    accessToken: string;
    refreshToken: string;
  }
}
