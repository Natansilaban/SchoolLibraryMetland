'use client';

import { memo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, BookMarked, BookCopy, User } from 'lucide-react';

const NAV_ITEMS = [
  { href: '/siswa/dashboard', label: 'Beranda', icon: LayoutDashboard },
  { href: '/siswa/buku', label: 'Katalog', icon: BookMarked },
  { href: '/siswa/peminjaman', label: 'Pinjam', icon: BookCopy },
  { href: '/siswa/profil', label: 'Profil', icon: User },
];

/**
 * MobileBottomNav
 * High-performance, zero-jank docked navigation bar for mobile devices.
 * 
 * Performance characteristics:
 * - Solid opaque background (0% GPU shader cost, eliminates mobile backdrop-filter lag)
 * - Zero scroll listeners (0 CPU usage during page scroll, no layout thrashing)
 * - Static CSS active states (no expensive javascript bounding-rect math)
 * - Hardware-accelerated tap response (transform active:scale-95 only)
 * - Full safe-area-inset support for modern notch/gesture navigation phones
 */
function MobileFloatingNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navigasi Utama Mobile"
      className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shadow-[0_-2px_8px_rgba(15,23,42,0.06)] dark:shadow-[0_-4px_16px_rgba(0,0,0,0.35)]"
    >
      <div className="max-w-md mx-auto grid grid-cols-4 items-center px-2 pt-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))]">
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
              className="flex flex-col items-center justify-center py-1 group select-none min-h-[48px] active:scale-95 transition-transform duration-75"
            >
              {/* Icon Container with active accent pill */}
              <div
                className={`flex items-center justify-center px-3 py-1 rounded-full transition-colors duration-150 ${
                  isActive
                    ? 'bg-blue-100/80 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400'
                    : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300'
                }`}
              >
                <Icon
                  size={20}
                  className={isActive ? 'stroke-[2.2]' : 'stroke-[1.75]'}
                />
              </div>

              {/* Label */}
              <span
                className={`text-[10px] leading-tight mt-0.5 tracking-tight transition-colors duration-150 ${
                  isActive
                    ? 'font-bold text-blue-600 dark:text-blue-400'
                    : 'font-medium text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200'
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export default memo(MobileFloatingNav);
