'use client';

import { useSession } from 'next-auth/react';
import { useSidebar } from '@/components/layout/AdminSidebarContext';
import { Menu } from 'lucide-react';

export default function TopBar({ title, subtitle }) {
  const { data: session } = useSession();
  const { toggle } = useSidebar();

  return (
    <header className="glass-topbar sticky top-0 z-30 w-full flex items-center justify-between px-4 sm:px-6 py-3 border-b border-slate-200 bg-white/80 backdrop-blur-md">
      <div className="flex items-center gap-3 min-w-0">
        {/* Hamburger Menu Toggle for Mobile & Tablet */}
        <button
          onClick={toggle}
          className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 lg:hidden flex-shrink-0"
          aria-label="Buka Menu"
        >
          <Menu size={22} />
        </button>

        <div className="min-w-0">
          <h1 className="text-base sm:text-lg font-bold text-slate-900 truncate">{title}</h1>
          {subtitle && (
            <p className="text-xs text-slate-500 font-medium truncate hidden sm:block">{subtitle}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2.5 sm:gap-3.5 flex-shrink-0">
        {/* Live Demo Pill Badge */}
        <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200/80 shadow-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-ping" />
          <span>Demo Mode</span>
        </div>

        {/* User Avatar */}
        <div className="flex items-center gap-2.5 sm:gap-3" aria-label="Informasi pengguna aktif">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold shadow-sm flex-shrink-0"
            style={{
              background: 'linear-gradient(135deg, rgba(37,99,235,0.15), rgba(37,99,235,0.05))',
              border: '1px solid rgba(37,99,235,0.2)',
              color: '#1d4ed8',
            }}
          >
            {session?.user?.name?.[0]?.toUpperCase() || 'A'}
          </div>
          <div className="hidden md:block">
            <div className="text-sm font-bold text-slate-800 leading-tight">
              {session?.user?.name || 'Admin'}
            </div>
            <div className="text-xs text-slate-500 font-medium">
              {session?.user?.role === 'ADMIN' ? 'Administrator (Demo)' : 'Siswa (Demo)'}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
