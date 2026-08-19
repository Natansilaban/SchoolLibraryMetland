'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { useSidebar } from '@/components/layout/AdminSidebarContext';
import {
  LayoutDashboard, BookMarked, Tag,
  PenLine, Building2, Users, BookCopy, RotateCcw,
  BarChart2, LogOut, ChevronRight, X
} from 'lucide-react';

const navItems = [
  {
    section: 'Utama',
    items: [
      { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    ],
  },
  {
    section: 'Kelola Data',
    items: [
      { href: '/admin/buku', label: 'Buku', icon: BookMarked },
      { href: '/admin/kategori', label: 'Kategori', icon: Tag },
      { href: '/admin/penulis', label: 'Penulis', icon: PenLine },
      { href: '/admin/penerbit', label: 'Penerbit', icon: Building2 },
      { href: '/admin/anggota', label: 'Anggota', icon: Users },
    ],
  },
  {
    section: 'Transaksi',
    items: [
      { href: '/admin/peminjaman', label: 'Peminjaman', icon: BookCopy },
      { href: '/admin/pengembalian', label: 'Pengembalian', icon: RotateCcw },
    ],
  },
  {
    section: 'Laporan',
    items: [
      { href: '/admin/laporan', label: 'Laporan', icon: BarChart2 },
    ],
  },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const { isOpen, close } = useSidebar();

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden transition-opacity"
          onClick={close}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`glass-sidebar fixed top-0 left-0 bottom-0 z-50 w-64 transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo Header */}
        <div className="p-6 pb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 p-1"
              style={{
                background: 'linear-gradient(135deg, rgba(37,99,235,0.12), rgba(37,99,235,0.04))',
                border: '1px solid rgba(37,99,235,0.2)',
              }}
            >
              <img src="/logo.png" alt="Metland Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900 leading-tight">Metland</div>
              <div className="text-xs text-slate-500 font-medium">Library System</div>
            </div>
          </div>

          {/* Close button for Mobile */}
          <button
            onClick={close}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 lg:hidden"
            aria-label="Tutup Menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* Admin Badge */}
        <div className="px-6 pb-4">
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-lg"
            style={{
              background: 'rgba(37,99,235,0.06)',
              border: '1px solid rgba(37,99,235,0.12)',
            }}
          >
            <div className="w-2 h-2 rounded-full bg-blue-600 flex-shrink-0" />
            <span className="text-xs font-semibold text-blue-900">
              Administrator
            </span>
          </div>
        </div>

        <hr className="glass-divider mx-4" />

        {/* Navigation List */}
        <nav className="flex-1 px-4 pb-4 overflow-y-auto">
          {navItems.map((group) => (
            <div key={group.section} className="mb-4">
              <p className="text-xs font-bold uppercase tracking-wider mb-2 px-2 text-slate-400">
                {group.section}
              </p>
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    id={`nav-${item.label.toLowerCase().replace(' ', '-')}`}
                    onClick={close}
                    className={`sidebar-item mb-0.5 ${isActive ? 'active' : ''}`}
                  >
                    <Icon size={16} />
                    <span className="flex-1">{item.label}</span>
                    {isActive && <ChevronRight size={14} className="opacity-70" />}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Logout Button */}
        <div className="p-4 border-t border-slate-200">
          <button
            id="sidebar-logout"
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="sidebar-item w-full hover:bg-rose-50 hover:text-rose-600 text-rose-500"
          >
            <LogOut size={16} />
            <span>Keluar</span>
          </button>
        </div>
      </aside>
    </>
  );
}
