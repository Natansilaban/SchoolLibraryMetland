import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

if (process.env.NEXTAUTH_SECRET?.length < 32) {
  throw new Error('NEXTAUTH_SECRET must be at least 32 characters long. Generate one with: openssl rand -base64 32');
}

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        try {
          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
            include: { anggota: true },
          });

          if (!user) return null;

          const isValid = await bcrypt.compare(credentials.password, user.password);
          if (!isValid) return null;

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
          console.error('[AUTH] Database error during authorization');
          throw new Error('Database connection error');
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
    maxAge: 8 * 60 * 60,
  },
  trustHost: true,
  useSecureCookies: process.env.NODE_ENV === 'production',
  secret: process.env.NEXTAUTH_SECRET,
};
