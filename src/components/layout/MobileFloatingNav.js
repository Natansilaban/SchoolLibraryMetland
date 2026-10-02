'use client';

import { useState, useEffect, useRef, memo } from 'react';
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
 * MobileFloatingNav
 * High-performance, GPU-accelerated translucent floating pill navigation for mobile.
 * Features:
 * - Dynamic scroll awareness (auto-tucks on scroll down, springs back on scroll up)
 * - Zero layout thrashing (throttled with requestAnimationFrame + passive listener)
 * - Ultra-responsive active pill highlight with WCAG compliant contrast
 */
function MobileFloatingNav() {
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);
  const ticking = useRef(false);

  const activeIndex = NAV_ITEMS.findIndex((item) =>
    pathname === item.href || (item.href !== '/siswa/dashboard' && pathname.startsWith(item.href))
  );

  useEffect(() => {
    lastScrollY.current = window.scrollY;

    const handleScroll = () => {
      if (!ticking.current) {
        window.requestAnimationFrame(() => {
          const currentY = window.scrollY;
          const diff = currentY - lastScrollY.current;

          if (currentY > 48) {
            if (diff > 10) {
              setIsVisible(false);
            } else if (diff < -6) {
              setIsVisible(true);
            }
          } else {
            setIsVisible(true);
          }

          lastScrollY.current = Math.max(0, currentY);
          ticking.current = false;
        });
        ticking.current = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav
      aria-label="Navigasi Mobile Terapung"
      className={`md:hidden fixed bottom-4 inset-x-0 mx-auto z-40 w-[calc(100%-2rem)] max-w-[360px] transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        isVisible
          ? 'translate-y-0 opacity-100 pointer-events-auto'
          : 'translate-y-20 opacity-0 pointer-events-none'
      }`}
      style={{ willChange: 'transform, opacity' }}
    >
      {/* Translucent Frosted Glass Pill Container */}
      <div className="relative rounded-full p-1.5 bg-white/80 dark:bg-slate-900/85 backdrop-blur-xl border border-white/70 dark:border-slate-700/70 shadow-[0_14px_40px_-4px_rgba(15,23,42,0.16),0_2px_10px_rgba(15,23,42,0.06)] dark:shadow-[0_14px_40px_-4px_rgba(0,0,0,0.5)] ring-1 ring-black/[0.04] dark:ring-white/[0.06]">
        {/* Liquid Active Sliding Pill Indicator */}
        {activeIndex !== -1 && (
          <div
            aria-hidden="true"
            className="absolute top-1.5 bottom-1.5 rounded-full bg-blue-600 shadow-[0_4px_18px_rgba(37,99,235,0.45),inset_0_1px_1px_rgba(255,255,255,0.35)] transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] pointer-events-none"
            style={{
              width: 'calc((100% - 0.75rem) / 4)',
              left: `calc(0.375rem + (${activeIndex} * ((100% - 0.75rem) / 4)))`,
            }}
          >
            {/* Liquid specular light sheen */}
            <div className="absolute inset-x-2 top-0.5 h-[1.5px] rounded-full bg-white/40 blur-[0.5px]" />
          </div>
        )}

        <div className="grid grid-cols-4 gap-0 items-center relative">
          {NAV_ITEMS.map((item, idx) => {
            const Icon = item.icon;
            const isActive = activeIndex === idx;

            return (
              <Link
                key={item.href}
                href={item.href}
                id={`mobile-nav-${item.label.toLowerCase()}`}
                className={`relative z-10 flex flex-col items-center justify-center py-2 px-1 rounded-full transition-all duration-200 select-none min-h-[46px] group active:scale-95`}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon
                  size={18}
                  className={`transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
                    isActive
                      ? 'scale-110 stroke-[2.4] text-white -translate-y-0.5'
                      : 'scale-100 stroke-[1.8] text-slate-500 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-slate-200'
                  }`}
                />
                <span
                  className={`text-[10px] mt-0.5 leading-none tracking-tight transition-colors duration-200 ${
                    isActive ? 'text-white font-bold' : 'text-slate-500 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-slate-200'
                  }`}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

export default memo(MobileFloatingNav);
