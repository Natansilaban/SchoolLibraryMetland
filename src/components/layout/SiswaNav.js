'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { LayoutDashboard, BookMarked, BookCopy, User, LogOut, Library } from 'lucide-react';

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
      <header className="sticky top-0 z-40 w-full bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          <Link
            href="/siswa/dashboard"
            className="flex items-center gap-2.5 flex-shrink-0 rounded-lg focus-visible:outline-2 focus-visible:outline-blue-600"
            aria-label="Beranda Siswa Perpustakaan Metland"
          >
            <div className="w-9 h-9 rounded-lg bg-white border border-slate-200 flex items-center justify-center p-1 shadow-xs flex-shrink-0 overflow-hidden">
              <img src="/logo.png" alt="Logo Metland School" className="w-full h-full object-contain" />
            </div>
            <div>
              <span className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight block leading-tight">
                Perpustakaan
              </span>
              <span className="text-[11px] font-medium text-slate-500 block leading-tight">
                Metland School
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1" aria-label="Navigasi Utama Siswa">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== '/siswa/dashboard' && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-colors min-h-[38px] ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 font-bold border border-blue-100'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon size={16} className={isActive ? 'text-blue-600' : 'text-slate-400'} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <Link
              href="/siswa/profil"
              className="flex items-center gap-2.5 p-1 sm:p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              aria-label="Buka profil siswa"
            >
              <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                {userInitial}
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-xs font-bold text-slate-800 leading-tight truncate max-w-[120px]">
                  {session?.user?.name || 'Siswa'}
                </div>
                <div className="text-[11px] text-slate-500 font-medium">
                  Anggota Perpustakaan
                </div>
              </div>
            </Link>

            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="p-2 sm:px-3 sm:py-2 rounded-lg text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 flex items-center gap-1.5 transition-colors border border-transparent hover:border-rose-200 min-h-[36px]"
              title="Keluar dari akun"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">Keluar</span>
            </button>
          </div>
        </div>
      </header>

      {/* Ergonomic Mobile Bottom Navigation with Safe-Area Inset */}
      <nav
        aria-label="Navigasi Mobile"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 shadow-lg px-2 pt-1 pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))]"
      >
        <div className="grid grid-cols-4 items-center max-w-md mx-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '/siswa/dashboard' && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg transition-colors min-h-[48px] ${
                  isActive ? 'text-blue-700 font-bold' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Icon size={19} className={isActive ? 'text-blue-600' : 'text-slate-400'} />
                <span className="text-[11px] mt-1 leading-none tracking-tight">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
