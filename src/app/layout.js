import './globals.css';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import AuthProvider from '@/components/providers/AuthProvider';

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
    <html lang="id" data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body suppressHydrationWarning>
        <AuthProvider session={session}>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
