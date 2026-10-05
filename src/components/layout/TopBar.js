'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useSidebar } from '@/components/layout/AdminSidebarContext';
import { Menu, ShieldCheck, Calendar, ExternalLink } from 'lucide-react';
import ThemeToggle from '@/components/ui/ThemeToggle';

export default function TopBar({ title, subtitle }) {
  const { data: session } = useSession();
  const { toggle } = useSidebar();
  const [currentDate, setCurrentDate] = useState('');

  useEffect(() => {
    const now = new Date();
    setCurrentDate(
      now.toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    );
  }, []);

  const userInitial = session?.user?.name?.[0]?.toUpperCase() || 'A';
  const roleLabel = session?.user?.role === 'ADMIN' ? 'Petugas Perpustakaan' : 'Siswa';

  return (
    <header className="sticky top-0 z-30 w-full min-h-[82px] py-4 sm:py-5 px-5 sm:px-8 lg:px-10 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-stone-200/90 dark:border-slate-800 flex items-center justify-between gap-4 transition-colors shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
      {}
      <div className="flex items-center gap-3.5 flex-1 min-w-0">
        <button
          onClick={toggle}
          className="p-2.5 -ml-1 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 lg:hidden shrink-0 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700 min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label="Buka Menu Navigasi"
        >
          <Menu size={22} />
        </button>

        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <h1 className="text-xl sm:text-2xl lg:text-[25px] font-black text-slate-900 dark:text-white tracking-tight leading-tight max-sm:truncate">
            {title}
          </h1>

          {subtitle && (
            <p className="mt-0.5 text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed hidden sm:block">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {}
      <div className="flex items-center gap-2.5 sm:gap-3.5 shrink-0">
        {}
        {currentDate && (
          <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 text-xs font-medium text-slate-600 dark:text-slate-300">
            <Calendar size={14} className="text-slate-400 dark:text-slate-500" />
            <span>{currentDate}</span>
          </div>
        )}

        {}
        <Link
          href="/siswa/dashboard"
          target="_blank"
          className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-blue-700 dark:hover:text-blue-400 bg-slate-50 dark:bg-slate-800/60 hover:bg-blue-50 dark:hover:bg-blue-950/40 border border-slate-200/80 dark:border-slate-700 hover:border-blue-200 dark:hover:border-blue-800 transition-all duration-150"
          title="Buka Pratinjau Portal Siswa di Tab Baru"
        >
          <span>Katalog Siswa</span>
          <ExternalLink size={13} className="opacity-70" />
        </Link>

        {}
        <ThemeToggle className="rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80" />

        {}
        <div
          className="flex items-center gap-3 pl-2 sm:pl-3 border-l border-slate-200 dark:border-slate-800"
          aria-label="Informasi pengguna aktif"
        >
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-linear-to-br from-blue-700 to-indigo-800 text-white flex items-center justify-center text-sm font-bold shadow-sm shadow-blue-900/10 border border-blue-600/30 shrink-0">
              {userInitial}
            </div>
            <span
              className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900 flex items-center justify-center text-white"
              title="Terverifikasi & Aktif"
            >
              <ShieldCheck size={9} className="stroke-3" />
            </span>
          </div>

          <div className="hidden lg:block text-left min-w-0">
            <div className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 leading-tight truncate max-w-[140px] xl:max-w-[180px]">
              {session?.user?.name || 'Administrator'}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate max-w-[140px] xl:max-w-[180px]">
              {roleLabel}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

