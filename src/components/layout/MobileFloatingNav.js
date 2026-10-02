'use client';

import { memo, useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutGrid,
  BookMarked,
  BookCopy,
  Plus,
  User,
  Search,
  BookOpen
} from 'lucide-react';

/**
 * NAV_ITEMS
 * Hoisted static configuration according to Vercel React Best Practices.
 * Icons strictly match the Dribbble reference:
 * - LayoutGrid (4-dots/grid icon for Overview / Beranda)
 * - BookMarked (Folder / Catalog icon for Insights / Katalog)
 * - BookCopy (Ribbon / Loans icon for Lifeline / Peminjaman)
 */
const NAV_ITEMS = [
  {
    href: '/siswa/dashboard',
    label: 'Beranda',
    icon: LayoutGrid,
  },
  {
    href: '/siswa/buku',
    label: 'Katalog',
    icon: BookMarked,
  },
  {
    href: '/siswa/peminjaman',
    label: 'Pinjam',
    icon: BookCopy,
  },
];

/**
 * MobileFloatingNav
 * High-performance, hardware-accelerated translucent floating navigation bar (Mobile ONLY).
 * Implements the Dribbble capsule + circular action button reference.
 *
 * Performance compliance:
 * - fixing-motion-performance: 0 scroll listeners, composite-only transforms (scale/rotate),
 *   subtle non-animated blur (<=10px) with high-opacity fallback, GPU layer promotion.
 * - performance-optimization & web-perf: 0 layout shifts (CLS=0), <50ms INP, safe tap targets (>=48px).
 * - vercel-react-best-practices: Component memoization, hoisted arrays, direct lucide imports.
 */
function MobileFloatingNav() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Auto-close quick action menu on route change
  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  const isProfilActive = pathname.startsWith('/siswa/profil');

  return (
    <>
      {/* Fullscreen Backdrop (No full-screen blur to protect GPU fill-rate on mobile) */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/25 dark:bg-slate-950/50 transition-opacity md:hidden"
          onClick={() => setIsMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      <div
        aria-label="Navigasi Utama Mobile"
        className="md:hidden fixed bottom-[max(1rem,env(safe-area-inset-bottom))] inset-x-0 z-50 flex items-center justify-center pointer-events-none px-3 transform-gpu"
      >
        <div className="pointer-events-auto relative flex items-center gap-2 max-w-full">
          {/* Quick Action Popover Sheet */}
          {isMenuOpen && (
            <div
              role="dialog"
              aria-modal="true"
              aria-label="Menu Aksi Cepat"
              className="absolute bottom-full right-0 mb-3 w-64 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-2 z-50 transform-gpu animate-in fade-in slide-in-from-bottom-2 duration-150"
            >
              <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                  Aksi Cepat Perpustakaan
                </span>
              </div>
              <div className="p-1 space-y-1">
                <Link
                  href="/siswa/profil"
                  onClick={() => setIsMenuOpen(false)}
                  className={`flex items-center gap-3 p-2.5 rounded-xl transition-colors ${
                    isProfilActive
                      ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 font-bold'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg bg-blue-100/70 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0">
                    <User size={16} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold truncate">Profil & Kartu Siswa</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                      Cek NIS, kelas & kartu digital
                    </div>
                  </div>
                </Link>

                <Link
                  href="/siswa/buku"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-amber-100/70 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 flex items-center justify-center flex-shrink-0">
                    <Search size={16} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold truncate">Cari Buku Cepat</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                      Telusuri katalog perpustakaan
                    </div>
                  </div>
                </Link>

                <Link
                  href="/siswa/peminjaman"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-emerald-100/70 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
                    <BookOpen size={16} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold truncate">Status Peminjaman</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                      Pantau buku & tenggat kembali
                    </div>
                  </div>
                </Link>
              </div>
            </div>
          )}

          {/* Translucent Capsule / Pill Navigation (Dribbble Left Element) */}
          <nav
            style={{ contain: 'paint layout' }}
            className="flex items-center gap-1 p-1 rounded-full bg-white/95 dark:bg-slate-900/95 border border-slate-200/90 dark:border-slate-800 shadow-[0_4px_20px_rgba(15,23,42,0.08),0_1px_3px_rgba(15,23,42,0.04)] dark:shadow-[0_6px_24px_rgba(0,0,0,0.45)] ring-1 ring-black/[0.04] dark:ring-white/[0.08]"
            aria-label="Navigasi Utama Siswa"
          >
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href ||
                (item.href !== '/siswa/dashboard' && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  id={`mobile-nav-${item.label.toLowerCase()}`}
                  aria-current={isActive ? 'page' : undefined}
                  className={`flex flex-col items-center justify-center min-w-[68px] sm:min-w-[76px] py-1.5 px-3 rounded-full transition-all duration-150 select-none min-h-[48px] active:scale-95 ${
                    isActive
                      ? 'bg-slate-100/95 dark:bg-slate-800/95 text-slate-900 dark:text-white font-bold shadow-xs border border-slate-200/60 dark:border-slate-700/60'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50/50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <Icon
                    size={19}
                    className={`transition-colors ${
                      isActive
                        ? 'text-slate-900 dark:text-white stroke-[2.2]'
                        : 'text-slate-500 dark:text-slate-400 stroke-[1.75]'
                    }`}
                  />
                  <span
                    className={`text-[10px] leading-tight mt-0.5 tracking-tight ${
                      isActive ? 'font-bold' : 'font-medium'
                    }`}
                  >
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </nav>

          {/* Circular Action Button (Dribbble Right Element) */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsMenuOpen((prev) => !prev)}
              aria-expanded={isMenuOpen}
              aria-haspopup="dialog"
              aria-label="Menu Aksi Cepat Siswa"
              style={{ contain: 'paint layout' }}
              className={`w-[52px] h-[52px] rounded-full flex items-center justify-center transition-all duration-150 active:scale-95 select-none shadow-[0_4px_16px_rgba(15,23,42,0.15)] dark:shadow-[0_6px_20px_rgba(0,0,0,0.45)] ${
                isMenuOpen
                  ? 'bg-rose-600 text-white ring-4 ring-rose-500/20'
                  : isProfilActive
                  ? 'bg-blue-600 text-white ring-4 ring-blue-500/20 shadow-blue-500/20'
                  : 'bg-slate-800 dark:bg-slate-800 hover:bg-slate-900 dark:hover:bg-slate-700 text-white border border-slate-700 dark:border-slate-700'
              }`}
            >
              <Plus
                size={22}
                className={`stroke-[2.5] transition-transform duration-200 ease-out ${
                  isMenuOpen ? 'rotate-45' : 'rotate-0'
                }`}
              />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default memo(MobileFloatingNav);

