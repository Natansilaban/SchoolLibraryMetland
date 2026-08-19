'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { LayoutDashboard, BookMarked, BookCopy, User, LogOut } from 'lucide-react';

const navItems = [
  { href: '/siswa/dashboard', label: 'Beranda', icon: LayoutDashboard },
  { href: '/siswa/buku', label: 'Katalog', icon: BookMarked },
  { href: '/siswa/peminjaman', label: 'Pinjaman', icon: BookCopy },
  { href: '/siswa/profil', label: 'Profil', icon: User },
];

export default function SiswaNav() {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <>
      {/* Top Header Navbar */}
      <header
        className="sticky top-0 z-40 w-full"
        style={{
          background: 'rgba(255, 255, 255, 0.92)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(226, 232, 240, 0.8)',
          boxShadow: '0 2px 12px rgba(0, 0, 0, 0.02)',
        }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          {/* Logo & Title */}
          <Link href="/siswa/dashboard" className="flex items-center gap-2.5 flex-shrink-0">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center p-1 flex-shrink-0"
              style={{
                background: 'linear-gradient(135deg, rgba(37,99,235,0.12), rgba(37,99,235,0.04))',
                border: '1px solid rgba(37,99,235,0.2)',
              }}
            >
              <img src="/logo.png" alt="Metland Logo" className="w-full h-full object-contain" />
            </div>
            <span className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight">
              Metland Library
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== '/siswa/dashboard' && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 ${
                    isActive ? 'text-blue-600' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                  style={isActive ? { background: 'rgba(37, 99, 235, 0.08)', border: '1px solid rgba(37, 99, 235, 0.15)' } : {}}
                >
                  <Icon size={16} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* User Profile & Logout */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <Link
              href="/siswa/profil"
              className="flex items-center gap-2.5 p-1 sm:p-1.5 rounded-xl hover:bg-slate-100/80 transition-colors"
            >
              <div
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center text-xs sm:text-sm font-bold text-blue-600 flex-shrink-0"
                style={{
                  background: 'linear-gradient(135deg, rgba(37,99,235,0.15), rgba(37,99,235,0.05))',
                  border: '1px solid rgba(37,99,235,0.2)',
                }}
              >
                {session?.user?.name?.[0]?.toUpperCase() || 'S'}
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-xs font-bold text-slate-800 leading-tight truncate max-w-[110px]">
                  {session?.user?.name || 'Siswa'}
                </div>
                <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                  Siswa
                </div>
              </div>
            </Link>

            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="p-2 sm:px-3 sm:py-2 rounded-xl text-xs font-bold transition-all duration-200 text-rose-600 hover:text-rose-700 hover:bg-rose-50 flex items-center gap-1.5 border border-transparent hover:border-rose-200"
              title="Keluar dari akun"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">Keluar</span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Floating App Navigation */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-xl border-t border-slate-200/90 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] px-2 py-1.5"
      >
        <div className="grid grid-cols-4 items-center max-w-md mx-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '/siswa/dashboard' && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all duration-200 relative ${
                  isActive ? 'text-blue-600 font-extrabold' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {isActive && (
                  <span className="absolute -top-1.5 w-8 h-1 bg-blue-600 rounded-full shadow-sm" />
                )}
                <Icon size={20} className={isActive ? 'scale-110 transition-transform' : ''} />
                <span className="text-[11px] mt-1 font-bold leading-none tracking-tight">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
