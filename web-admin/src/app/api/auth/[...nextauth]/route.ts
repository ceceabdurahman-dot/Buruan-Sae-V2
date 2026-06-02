import NextAuth, { AuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import axios from 'axios';

// ============================================================
// NextAuth Configuration — Buruan Sae 2.0 Web Admin
// ============================================================

const API_BASE = process.env.API_BASE_URL ?? 'http://localhost:3001';

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

          const { pengguna, access_token, refresh_token } = res.data.data;

          // Hanya izinkan role ADMIN / SUPER_ADMIN
          if (!['ADMIN', 'SUPER_ADMIN'].includes(pengguna.peran)) {
            throw new Error('Akses ditolak. Hanya admin yang diizinkan.');
          }

          return {
            id: pengguna.id,
            name: pengguna.nama_lengkap,
            email: pengguna.email ?? pengguna.nomor_wa,
            peran: pengguna.peran,
            accessToken: access_token,
            refreshToken: refresh_token,
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
    maxAge: 24 * 60 * 60, // 24 jam
  },

  jwt: {
    maxAge: 24 * 60 * 60,
  },

  callbacks: {
    async jwt({ token, user }) {
      // Saat login pertama, simpan token dari backend
      if (user) {
        token.id = user.id;
        token.peran = (user as any).peran;
        token.accessToken = (user as any).accessToken;
        token.refreshToken = (user as any).refreshToken;
      }
      return token;
    },

    async session({ session, token }) {
      // Expose ke client side
      session.user = {
        ...session.user,
        id: token.id as string,
        peran: token.peran as string,
        accessToken: token.accessToken as string,
      } as any;
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

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
