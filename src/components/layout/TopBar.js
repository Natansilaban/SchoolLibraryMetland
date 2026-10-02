'use client';

import { useSession } from 'next-auth/react';
import { useSidebar } from '@/components/layout/AdminSidebarContext';
import { Menu } from 'lucide-react';
import ThemeToggle from '@/components/ui/ThemeToggle';

export default function TopBar({ title, subtitle }) {
  const { data: session } = useSession();
  const { toggle } = useSidebar();

  const userInitial = session?.user?.name?.[0]?.toUpperCase() || 'A';
  const roleLabel = session?.user?.role === 'ADMIN' ? 'Petugas Perpustakaan' : 'Siswa';

  return (
    <header className="sticky top-0 z-30 w-full h-15 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 sm:px-6 transition-colors">
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={toggle}
          className="p-2 -ml-1 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 lg:hidden flex-shrink-0 transition-colors"
          aria-label="Buka Menu Navigasi"
        >
          <Menu size={20} />
        </button>

        <div className="min-w-0">
          <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight truncate">{title}</h1>
          {subtitle && (
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate hidden sm:block">{subtitle}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
        {/* Theme Toggle Button */}
        <ThemeToggle />

        <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span>Sistem Aktif</span>
        </div>

        <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200 dark:border-slate-800" aria-label="Informasi pengguna aktif">
          <div
            className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 flex items-center justify-center text-xs font-bold shadow-sm flex-shrink-0"
          >
            {userInitial}
          </div>
          <div className="hidden md:block text-left">
            <div className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-tight">
              {session?.user?.name || 'Administrator'}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              {roleLabel}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

