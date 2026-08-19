'use client';

import AdminSidebar from '@/components/layout/AdminSidebar';
import { SidebarProvider } from '@/components/layout/AdminSidebarContext';

export default function AdminLayout({ children }) {
  return (
    <SidebarProvider>
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col lg:flex-row">
        <AdminSidebar />
        <div className="flex-1 flex flex-col min-w-0 lg:ml-64 min-h-screen">
          {children}
        </div>
      </div>
    </SidebarProvider>
  );
}
