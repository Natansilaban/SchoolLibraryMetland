import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import SiswaNav from '@/components/layout/SiswaNav';
import Footer from '@/components/layout/Footer';

export default async function SiswaLayout({ children }) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  if (session.user?.role === 'ADMIN') {
    redirect('/admin/dashboard');
  }

  return (
    <div className="min-h-screen bg-[#FBFBF9] dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between transition-colors duration-200">
      <div className="flex-1">
        <SiswaNav />
        <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-4 sm:pt-6 pb-12">
          {children}
        </main>
      </div>
      <Footer className="mb-24 md:mb-0" />
    </div>
  );
}

