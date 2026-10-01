'use client';

import { useSession } from 'next-auth/react';
import { useSidebar } from '@/components/layout/AdminSidebarContext';
import { Menu } from 'lucide-react';

export default function TopBar({ title, subtitle }) {
  const { data: session } = useSession();
  const { toggle } = useSidebar();

  const userInitial = session?.user?.name?.[0]?.toUpperCase() || 'A';
  const roleLabel = session?.user?.role === 'ADMIN' ? 'Petugas Perpustakaan' : 'Siswa';

  return (
    <header className="sticky top-0 z-30 w-full h-15 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-6">
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={toggle}
          className="p-2 -ml-1 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 lg:hidden flex-shrink-0 transition-colors"
          aria-label="Buka Menu Navigasi"
        >
          <Menu size={20} />
        </button>

        <div className="min-w-0">
          <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight truncate">{title}</h1>
          {subtitle && (
            <p className="text-xs text-slate-500 font-medium truncate hidden sm:block">{subtitle}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 flex-shrink-0">
        <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span>Sistem Aktif</span>
        </div>

        <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200" aria-label="Informasi pengguna aktif">
          <div
            className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center text-xs font-bold shadow-sm flex-shrink-0"
          >
            {userInitial}
          </div>
          <div className="hidden md:block text-left">
            <div className="text-xs font-bold text-slate-800 leading-tight">
              {session?.user?.name || 'Administrator'}
            </div>
            <div className="text-[11px] text-slate-500 font-medium">
              {roleLabel}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
