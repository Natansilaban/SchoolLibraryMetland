'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { LayoutDashboard, BookMarked, BookCopy, User, LogOut, Library } from 'lucide-react';
import MobileFloatingNav from '@/components/layout/MobileFloatingNav';

import ThemeToggle from '@/components/ui/ThemeToggle';

const navItems = [
  { href: '/siswa/dashboard', label: 'Beranda', icon: LayoutDashboard },
  { href: '/siswa/buku', label: 'Katalog Buku', icon: BookMarked },
  { href: '/siswa/peminjaman', label: 'Peminjaman', icon: BookCopy },
  { href: '/siswa/profil', label: 'Profil Saya', icon: User },
];

export default function SiswaNav() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const userInitial = session?.user?.name?.[0]?.toUpperCase() || 'S';

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-xs transition-colors">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          <Link
            href="/siswa/dashboard"
            className="flex items-center gap-2.5 flex-shrink-0 rounded-lg focus-visible:outline-2 focus-visible:outline-blue-600"
            aria-label="Beranda Siswa Perpustakaan Metland"
          >
            <div className="w-9 h-9 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center p-1 shadow-xs flex-shrink-0 overflow-hidden">
              <img src="/logo.png" alt="Logo Metland School" width={36} height={36} decoding="async" className="w-full h-full object-contain" />
            </div>
            <div>
              <span className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white tracking-tight block leading-tight">
                Perpustakaan
              </span>
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block leading-tight">
                Metland School
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1 p-1 rounded-xl bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 shadow-xs" aria-label="Navigasi Utama Siswa">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== '/siswa/dashboard' && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 min-h-[34px] ${
                    isActive
                      ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-400 font-bold shadow-xs border border-slate-200/80 dark:border-slate-700'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-700/50'
                  }`}
                >
                  <Icon size={15} className={isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-1.5 sm:gap-2.5 flex-shrink-0">
            {}
            <ThemeToggle />

            <Link
              href="/siswa/profil"
              className="flex items-center gap-2.5 p-1 sm:p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Buka profil siswa"
            >
              <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 flex items-center justify-center text-xs font-bold flex-shrink-0">
                {userInitial}
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-tight truncate max-w-[120px]">
                  {session?.user?.name || 'Siswa'}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  Anggota Perpustakaan
                </div>
              </div>
            </Link>

            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="p-2 sm:px-3 sm:py-2 rounded-lg text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40 flex items-center gap-1.5 transition-colors border border-transparent hover:border-rose-200 dark:hover:border-rose-800 min-h-[36px]"
              title="Keluar dari akun"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">Keluar</span>
            </button>
          </div>
        </div>
      </header>

      {}
      <MobileFloatingNav />
    </>
  );
}
