import './globals.css';
import { Plus_Jakarta_Sans, Inter } from 'next/font/google';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import AuthProvider from '@/components/providers/AuthProvider';
import ToastContainer from '@/components/ui/Toast';

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-plus-jakarta',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800'],
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  weight: ['300', '400', '500', '600', '700'],
});

export const metadata = {
  title: {
    default: 'Perpustakaan Metland School',
    template: '%s | Perpustakaan Metland School',
  },
  description: 'Sistem Informasi Perpustakaan Metland School — kelola buku, anggota, dan peminjaman secara digital.',
  keywords: ['perpustakaan', 'metland school', 'library', 'buku', 'peminjaman'],
};

export default async function RootLayout({ children }) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="id" className={`${plusJakartaSans.variable} ${inter.variable}`} data-scroll-behavior="smooth" suppressHydrationWarning>
      <body suppressHydrationWarning className="font-sans antialiased">
        <AuthProvider session={session}>
          <ToastContainer />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
