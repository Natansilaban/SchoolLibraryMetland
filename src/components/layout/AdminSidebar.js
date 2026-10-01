'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { useSidebar } from '@/components/layout/AdminSidebarContext';
import {
  LayoutDashboard, BookMarked, Tag,
  PenLine, Building2, Users, BookCopy, RotateCcw,
  BarChart2, LogOut, X, Library
} from 'lucide-react';

const navItems = [
  {
    section: 'Utama',
    items: [
      { href: '/admin/dashboard', label: 'Dashboard Petugas', icon: LayoutDashboard },
    ],
  },
  {
    section: 'Peminjaman & Pengembalian',
    items: [
      { href: '/admin/peminjaman', label: 'Peminjaman Buku', icon: BookCopy },
      { href: '/admin/pengembalian', label: 'Pengembalian & Denda', icon: RotateCcw },
    ],
  },
  {
    section: 'Katalog & Koleksi',
    items: [
      { href: '/admin/buku', label: 'Koleksi Buku', icon: BookMarked },
      { href: '/admin/kategori', label: 'Kategori Buku', icon: Tag },
      { href: '/admin/penulis', label: 'Data Penulis', icon: PenLine },
      { href: '/admin/penerbit', label: 'Data Penerbit', icon: Building2 },
    ],
  },
  {
    section: 'Keanggotaan & Laporan',
    items: [
      { href: '/admin/anggota', label: 'Daftar Anggota', icon: Users },
      { href: '/admin/laporan', label: 'Rekap & Laporan', icon: BarChart2 },
    ],
  },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const { isOpen, close } = useSidebar();

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 z-40 lg:hidden transition-opacity"
          onClick={close}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed top-0 left-0 bottom-0 z-50 w-64 bg-white border-r border-slate-200 transition-transform duration-200 ease-in-out lg:translate-x-0 flex flex-col ${
          isOpen ? 'translate-x-0 shadow-xl' : '-translate-x-full'
        }`}
      >
        <div className="p-5 pb-4 flex items-center justify-between border-b border-slate-100">
          <Link href="/admin/dashboard" className="flex items-center gap-2.5 group" onClick={close}>
            <div className="w-9 h-9 rounded-lg bg-white border border-slate-200 flex items-center justify-center p-1 shadow-xs flex-shrink-0 overflow-hidden">
              <img src="/logo.png" alt="Logo Metland School" className="w-full h-full object-contain" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900 leading-tight">Perpustakaan</div>
              <div className="text-xs text-slate-500 font-medium">Metland School</div>
            </div>
          </Link>

          <button
            onClick={close}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 lg:hidden"
            aria-label="Tutup Menu"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-4 py-3 bg-slate-50 border-b border-slate-100">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">
            Hak Akses
          </div>
          <div className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-600" />
            <span>Administrator Perpustakaan</span>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-5">
          {navItems.map((group) => (
            <div key={group.section}>
              <p className="text-[11px] font-bold uppercase tracking-wider mb-1.5 px-3 text-slate-400">
                {group.section}
              </p>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href || (item.href !== '/admin/dashboard' && pathname.startsWith(item.href));
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      id={`nav-${item.label.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                      onClick={close}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors min-h-[38px] ${
                        isActive
                          ? 'bg-blue-50 text-blue-700 font-bold border border-blue-100'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                    >
                      <Icon size={16} className={isActive ? 'text-blue-600' : 'text-slate-400'} />
                      <span className="flex-1">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-3 border-t border-slate-200 bg-slate-50/50">
          <button
            id="sidebar-logout"
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-colors min-h-[38px]"
          >
            <LogOut size={16} />
            <span>Keluar Sistem</span>
          </button>
        </div>
      </aside>
    </>
  );
}
