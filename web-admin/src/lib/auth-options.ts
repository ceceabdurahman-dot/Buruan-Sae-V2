import type { AuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import axios from 'axios';

const API_BASE = process.env.API_BASE_URL ?? 'http://localhost:3001';
const ADMIN_ROLES = ['ADMIN_DINAS', 'SUPER_ADMIN'] as const;

function decodeJwtPayload(token: string): Record<string, unknown> {
  const [, payload] = token.split('.');
  if (!payload) return {};

  try {
    return JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
  } catch {
    return {};
  }
}

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        identifier: { label: 'Email / Nomor WA', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.identifier || !credentials?.password) return null;

        try {
          const res = await axios.post(`${API_BASE}/auth/login`, {
            identifier: credentials.identifier,
            password: credentials.password,
          });

          const data = res.data?.data ?? res.data;
          const accessToken = data.access_token as string | undefined;
          const refreshToken = data.refresh_token as string | undefined;
          const tokenPayload = accessToken ? decodeJwtPayload(accessToken) : {};
          const pengguna = data.pengguna ?? {};
          const peran = pengguna.peran ?? data.peran ?? tokenPayload.peran;

          if (!accessToken || !refreshToken || !ADMIN_ROLES.includes(peran)) {
            throw new Error('Akses ditolak. Hanya admin yang diizinkan.');
          }

          return {
            id: pengguna.id ?? tokenPayload.sub ?? credentials.identifier,
            name: pengguna.nama ?? pengguna.nama_lengkap ?? tokenPayload.email ?? 'Admin',
            email: pengguna.email ?? tokenPayload.email ?? pengguna.nomor_wa,
            peran,
            accessToken,
            refreshToken,
          };
        } catch (error: any) {
          const msg =
            error.response?.data?.message ??
            error.message ??
            'Login gagal';
          throw new Error(msg);
        }
      },
    }),
  ],

  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60,
  },

  jwt: {
    maxAge: 24 * 60 * 60,
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.peran = (user as any).peran;
        token.accessToken = (user as any).accessToken;
        token.refreshToken = (user as any).refreshToken;
      }
      return token;
    },

    async session({ session, token }) {
      session.user = {
        ...session.user,
        id: token.id as string,
        peran: token.peran as any,
        accessToken: token.accessToken as string,
      };
      return session;
    },
  },

  pages: {
    signIn: '/auth/login',
    error: '/auth/login',
  },

  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
};
