import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (credentials?.isDemo === 'true') {
          const isDemoEnabled =
            process.env.ENABLE_DEMO_LOGIN === 'true' ||
            process.env.NEXT_PUBLIC_ENABLE_DEMO_LOGIN === 'true';

          if (!isDemoEnabled) {
            return null;
          }

          const targetRole = credentials?.demoRole === 'ADMIN' ? 'ADMIN' : 'SISWA';
          const demoUser = await prisma.user.findFirst({
            where: { role: targetRole },
            include: { anggota: true },
            orderBy: { id: 'asc' },
          });

          if (!demoUser) return null;

          return {
            id: demoUser.id.toString(),
            email: demoUser.email,
            role: demoUser.role,
            name: demoUser.anggota?.nama || demoUser.email,
            anggotaId: demoUser.anggota?.id || null,
            nis: demoUser.anggota?.nis || null,
            kelas: demoUser.anggota?.kelas || null,
          };
        }
        if (!credentials?.email || !credentials?.password) return null;

        try {
          const user = await prisma.user.findUnique({
            where: { email: credentials.email.trim().toLowerCase() },
            include: { anggota: true },
          });

          if (!user) {
            return null;
          }

          const isValid = await bcrypt.compare(credentials.password, user.password);
          if (!isValid) {
            return null;
          }

          return {
            id: user.id.toString(),
            email: user.email,
            role: user.role,
            name: user.anggota?.nama || user.email,
            anggotaId: user.anggota?.id || null,
            nis: user.anggota?.nis || null,
            kelas: user.anggota?.kelas || null,
          };
        } catch (dbErr) {
          console.error('[AUTH] Database error during authentication');
          throw new Error('Koneksi database gagal. Silakan coba lagi.');
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
        token.anggotaId = user.anggotaId;
        token.nis = user.nis;
        token.kelas = user.kelas;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.role = token.role;
        session.user.id = token.id;
        session.user.anggotaId = token.anggotaId;
        session.user.nis = token.nis;
        session.user.kelas = token.kelas;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60,
  },
  trustHost: true,
  useSecureCookies: process.env.NODE_ENV === 'production',
  secret: (() => {
    const s = process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET || process.env.BETTER_AUTH_SECRET;
    if (!s || s.length < 32) throw new Error('NEXTAUTH_SECRET / AUTH_SECRET harus di-set (min 32 karakter). Generate: openssl rand -base64 32');
    return s;
  })(),
};
