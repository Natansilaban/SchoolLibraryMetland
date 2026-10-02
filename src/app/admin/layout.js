import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import AdminSidebar from '@/components/layout/AdminSidebar';
import { SidebarProvider } from '@/components/layout/AdminSidebarContext';
import Footer from '@/components/layout/Footer';

export default async function AdminLayout({ children }) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login?error=unauthorized');
  }

  if (session.user?.role !== 'ADMIN') {
    redirect('/siswa/dashboard');
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-[#FBFBF9] dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col lg:flex-row transition-colors duration-200">
        <AdminSidebar />
        <div className="flex-1 flex flex-col min-w-0 lg:ml-64 min-h-screen justify-between">
          <div className="flex-1">
            {children}
          </div>
          <Footer />
        </div>
      </div>
    </SidebarProvider>
  );
}

