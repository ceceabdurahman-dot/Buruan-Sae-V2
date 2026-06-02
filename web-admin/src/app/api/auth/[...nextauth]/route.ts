import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth-options';

// ============================================================
// NextAuth Configuration — Buruan Sae 2.0 Web Admin
// ============================================================

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
