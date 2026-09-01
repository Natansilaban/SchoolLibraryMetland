import { prisma } from '@/lib/prisma';
import TopBar from '@/components/layout/TopBar';
import {
  BookMarked, Users, BookCopy,
  TrendingUp, AlertTriangle, CheckCircle2, Clock
} from 'lucide-react';

async function getDashboardStats() {
  const [
    totalBuku,
    totalAnggota,
    totalPeminjaman,
    dipinjam,
    terlambat,
    dikembalikan,
    recentPeminjaman,
    bukuTerpopuler,
  ] = await Promise.all([
    prisma.buku.count(),
    prisma.anggota.count(),
    prisma.peminjaman.count(),
    prisma.peminjaman.count({
      where: { status: 'DIPINJAM', tglKembaliRencana: { gte: new Date() } },
    }),
    prisma.peminjaman.count({
      where: {
        OR: [
          { status: 'TERLAMBAT' },
          { status: 'DIPINJAM', tglKembaliRencana: { lt: new Date() } },
        ],
      },
    }),
    prisma.peminjaman.count({ where: { status: 'DIKEMBALIKAN' } }),
    prisma.peminjaman.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        anggota: true,
        buku: true,
      },
    }),
    prisma.buku.findMany({
      take: 5,
      orderBy: { peminjaman: { _count: 'desc' } },
      include: { _count: { select: { peminjaman: true } } },
    }),
  ]);

  return {
    totalBuku, totalAnggota, totalPeminjaman,
    dipinjam, terlambat, dikembalikan,
    recentPeminjaman, bukuTerpopuler,
  };
}

export const metadata = {
  title: 'Dashboard',
};

export default async function DashboardPage() {
  const stats = await getDashboardStats();

  const statCards = [
    {
      label: 'Total Buku',
      value: stats.totalBuku.toLocaleString('id'),
      icon: BookMarked,
      color: '#2563eb',
      bg: 'rgba(37,99,235,0.08)',
      border: 'rgba(37,99,235,0.2)',
      spineColor: '#2563eb',
    },
    {
      label: 'Total Anggota',
      value: stats.totalAnggota.toLocaleString('id'),
      icon: Users,
      color: '#7c3aed',
      bg: 'rgba(124,58,237,0.08)',
      border: 'rgba(124,58,237,0.2)',
      spineColor: '#7c3aed',
    },
    {
      label: 'Sedang Dipinjam',
      value: stats.dipinjam.toLocaleString('id'),
      icon: BookCopy,
      color: '#d97706',
      bg: 'rgba(217,119,6,0.08)',
      border: 'rgba(217,119,6,0.2)',
      spineColor: '#d97706',
    },
    {
      label: 'Terlambat',
      value: stats.terlambat.toLocaleString('id'),
      icon: AlertTriangle,
      color: '#dc2626',
      bg: 'rgba(220,38,38,0.08)',
      border: 'rgba(220,38,38,0.2)',
      spineColor: '#dc2626',
    },
  ];

  const statusBadge = (status) => {
    if (status === 'MENUNGGU_KONFIRMASI') return <span className="badge badge-yellow">Menunggu Konfirmasi</span>;
    if (status === 'DIPINJAM') return <span className="badge badge-blue">Dipinjam</span>;
    if (status === 'DIKEMBALIKAN') return <span className="badge badge-green">Dikembalikan</span>;
    if (status === 'TERLAMBAT') return <span className="badge badge-red">Terlambat</span>;
    if (status === 'DITOLAK') return <span className="badge badge-red">Ditolak</span>;
    return null;
  };

  return (
    <>
      <TopBar title="Dashboard" subtitle="Selamat datang di Sistem Perpustakaan Metland School" />

      <div className="p-4 sm:p-6">
        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 sm:mb-8">
          {statCards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.label}
                className="stat-card relative pl-7"
                style={{ borderLeft: `4px solid ${card.spineColor}` }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                  style={{ background: card.bg, border: `1px solid ${card.border}` }}
                >
                  <Icon size={20} color={card.color} />
                </div>
                <div className="text-2xl font-extrabold text-slate-900 mb-0.5">{card.value}</div>
                <div className="text-xs font-semibold text-slate-500">{card.label}</div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Peminjaman */}
          <div className="glass-card p-5 sm:p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="section-title text-base">Peminjaman Terbaru</h2>
                <p className="section-subtitle text-xs">5 transaksi terakhir</p>
              </div>
              <a href="/admin/peminjaman" className="text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors">
                Lihat semua →
              </a>
            </div>

            {stats.recentPeminjaman.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <BookCopy size={32} className="mx-auto mb-2 opacity-40" />
                <p className="text-sm font-medium">Belum ada peminjaman</p>
              </div>
            ) : (
              <div className="space-y-3">
                {stats.recentPeminjaman.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center gap-3 p-3 rounded-xl transition-colors hover:bg-slate-50/80"
                    style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}
                  >
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                      style={{ background: 'rgba(37,99,235,0.1)', color: '#1d4ed8' }}
                    >
                      {p.anggota.nama[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-slate-900 truncate">{p.buku.judul}</div>
                      <div className="text-xs text-slate-500 font-medium truncate">
                        {p.anggota.nama} · {p.anggota.kelas}
                      </div>
                    </div>
                    {statusBadge(p.status)}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Buku Terpopuler */}
          <div className="glass-card p-5 sm:p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="section-title text-base">Buku Terpopuler</h2>
                <p className="section-subtitle text-xs">Berdasarkan total peminjaman</p>
              </div>
              <a href="/admin/buku" className="text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors">
                Lihat semua →
              </a>
            </div>

            {stats.bukuTerpopuler.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <BookMarked size={32} className="mx-auto mb-2 opacity-40" />
                <p className="text-sm font-medium">Belum ada data buku</p>
              </div>
            ) : (
              <div className="space-y-3">
                {stats.bukuTerpopuler.map((buku, idx) => (
                  <div
                    key={buku.id}
                    className="flex items-center gap-3 p-3 rounded-xl transition-colors hover:bg-slate-50/80"
                    style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}
                  >
                    <span
                      className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                      style={{ background: '#e2e8f0', color: '#475569' }}
                    >
                      {idx + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-slate-900 truncate">{buku.judul}</div>
                      <div className="text-xs text-slate-500 font-medium">
                        Stok: {buku.stok}
                      </div>
                    </div>
                    <span className="badge badge-blue">{buku._count.peminjaman}×</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Stats Row */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: 'Total Transaksi', value: stats.totalPeminjaman, icon: TrendingUp, color: '#059669', bg: '#d1fae5' },
            { label: 'Sudah Kembali', value: stats.dikembalikan, icon: CheckCircle2, color: '#2563eb', bg: '#dbeafe' },
            { label: 'Belum Kembali', value: stats.dipinjam + stats.terlambat, icon: Clock, color: '#d97706', bg: '#fef3c7' },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.label}
                className="glass-card-sm p-4 flex items-center gap-4"
              >
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: item.bg }}
                >
                  <Icon size={20} color={item.color} />
                </div>
                <div>
                  <div className="text-xl font-bold text-slate-900">{item.value}</div>
                  <div className="text-xs font-semibold text-slate-500">{item.label}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
