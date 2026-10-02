import './globals.css';
import { Plus_Jakarta_Sans, Newsreader } from 'next/font/google';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import AuthProvider from '@/components/providers/AuthProvider';
import ToastContainer from '@/components/ui/Toast';
import ConfirmModalContainer from '@/components/ui/ConfirmModal';

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800'],
});

const newsreader = Newsreader({
  subsets: ['latin'],
  variable: '--font-serif',
  display: 'swap',
  style: ['normal', 'italic'],
  weight: ['400', '500', '600', '700'],
});

export const metadata = {
  title: {
    default: 'Perpustakaan Metland School',
    template: '%s | Perpustakaan Metland School',
  },
  description: 'Sistem Informasi Perpustakaan Metland School: kelola buku, anggota, dan peminjaman secara digital.',
  keywords: ['perpustakaan', 'metland school', 'library', 'buku', 'peminjaman'],
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
};

export default async function RootLayout({ children }) {
  const session = await getServerSession(authOptions);

  return (
    <html
      lang="id"
      className={`${plusJakartaSans.variable} ${newsreader.variable}`}
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('dark')}else{document.documentElement.classList.remove('dark')}}catch(e){}})()`,
          }}
        />
      </head>
      <body suppressHydrationWarning className="font-sans antialiased bg-[#FBFBF9] dark:bg-slate-950 text-slate-900 dark:text-slate-100 selection:bg-blue-100 selection:text-blue-900">
        <AuthProvider session={session}>
          <ToastContainer />
          <ConfirmModalContainer />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
