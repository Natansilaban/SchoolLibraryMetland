import { prisma } from '@/lib/prisma';
import TopBar from '@/components/layout/TopBar';
import Link from 'next/link';
import {
  BookMarked, Users, BookCopy,
  TrendingUp, AlertTriangle, CheckCircle2, Clock, ChevronRight
} from 'lucide-react';

async function getDashboardStats() {
  const now = new Date();

  try {
    const [
      totalBuku,
      totalAnggota,
      statusCounts,
      overdueActiveCount,
      recentPeminjaman,
      bukuTerpopuler,
    ] = await Promise.all([
      prisma.buku.count(),
      prisma.anggota.count(),
      prisma.peminjaman.groupBy({
        by: ['status'],
        _count: { _all: true },
      }),
      prisma.peminjaman.count({
        where: {
          status: 'DIPINJAM',
          tglKembaliRencana: { lt: now },
        },
      }),
      prisma.peminjaman.findMany({
        take: 6,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          status: true,
          tglPinjam: true,
          tglKembaliRencana: true,
          anggota: { select: { nama: true, kelas: true } },
          buku: { select: { judul: true } },
        },
      }),
      prisma.buku.findMany({
        take: 5,
        orderBy: { peminjaman: { _count: 'desc' } },
        select: {
          id: true,
          judul: true,
          stok: true,
          _count: { select: { peminjaman: true } },
        },
      }),
    ]);

    let totalPeminjaman = 0;
    let dipinjam = 0;
    let terlambat = overdueActiveCount;
    let dikembalikan = 0;

    for (const item of statusCounts) {
      const count = item._count._all;
      totalPeminjaman += count;
      if (item.status === 'DIPINJAM') {
        dipinjam += count - overdueActiveCount;
      } else if (item.status === 'TERLAMBAT') {
        terlambat += count;
      } else if (item.status === 'DIKEMBALIKAN') {
        dikembalikan += count;
      }
    }

    return {
      totalBuku,
      totalAnggota,
      totalPeminjaman,
      dipinjam: Math.max(0, dipinjam),
      terlambat,
      dikembalikan,
      recentPeminjaman,
      bukuTerpopuler,
    };
  } catch (err) {
    console.warn('[ADMIN DASHBOARD] Graceful fallback on database connection hiccup:', err.message || err);
    return {
      totalBuku: 0,
      totalAnggota: 0,
      totalPeminjaman: 0,
      dipinjam: 0,
      terlambat: 0,
      dikembalikan: 0,
      recentPeminjaman: [],
      bukuTerpopuler: [],
    };
  }
}

export const metadata = {
  title: 'Dashboard Layanan | Perpustakaan Metland School',
};

export default async function DashboardPage() {
  const stats = await getDashboardStats();

  const statCards = [
    {
      label: 'Sedang Dipinjam',
      value: stats.dipinjam.toLocaleString('id'),
      subtext: 'Buku fisik beredar',
      icon: BookCopy,
      colorClass: 'text-blue-600 bg-blue-50',
    },
    {
      label: 'Keterlambatan',
      value: stats.terlambat.toLocaleString('id'),
      subtext: stats.terlambat > 0 ? 'Perlu tindakan penagihan' : 'Tidak ada keterlambatan',
      icon: AlertTriangle,
      colorClass: stats.terlambat > 0 ? 'text-rose-600 bg-rose-50' : 'text-slate-600 bg-slate-100',
    },
    {
      label: 'Total Koleksi Buku',
      value: stats.totalBuku.toLocaleString('id'),
      subtext: 'Judul buku terdaftar',
      icon: BookMarked,
      colorClass: 'text-slate-700 bg-slate-100',
    },
    {
      label: 'Anggota Terdaftar',
      value: stats.totalAnggota.toLocaleString('id'),
      subtext: 'Siswa aktif terdaftar',
      icon: Users,
      colorClass: 'text-slate-700 bg-slate-100',
    },
  ];

  const statusBadge = (status) => {
    if (status === 'MENUNGGU_KONFIRMASI') return <span className="badge badge-yellow">Menunggu Verifikasi</span>;
    if (status === 'DIPINJAM') return <span className="badge badge-blue">Dipinjam</span>;
    if (status === 'DIKEMBALIKAN') return <span className="badge badge-green">Kembali</span>;
    if (status === 'TERLAMBAT') return <span className="badge badge-red">Terlambat</span>;
    if (status === 'DITOLAK') return <span className="badge badge-red">Ditolak</span>;
    return null;
  };

  return (
    <>
      <TopBar title="Dashboard Layanan Perpustakaan" subtitle="Pantau aktivitas peminjaman, pengembalian, dan ketersediaan buku" />

      <div className="p-4 sm:p-6 space-y-6">
        {/* Urgent Action Notice (Overdue Triage) */}
        {stats.terlambat > 0 && (
          <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300 flex items-center justify-center flex-shrink-0">
                <AlertTriangle size={18} />
              </div>
              <div>
                <h2 className="text-xs sm:text-sm font-bold text-rose-900 dark:text-rose-200">
                  Perhatian: Terdapat {stats.terlambat} transaksi peminjaman yang telah melewati batas waktu
                </h2>
                <p className="text-[11px] text-rose-700 dark:text-rose-300">
                  Lakukan pemeriksaan pada modul peminjaman untuk konfirmasi denda atau perpanjangan.
                </p>
              </div>
            </div>
            <Link
              href="/admin/pengembalian"
              className="btn-danger py-1.5 px-3 text-xs font-semibold self-start sm:self-auto min-h-[34px]"
            >
              Buka Rekap Denda
            </Link>
          </div>
        )}

        {/* 4 Core Circulation Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {statCards.map((card) => {
            const Icon = card.icon;
            return (
              <div key={card.label} className="stat-card">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{card.label}</span>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${card.colorClass}`}>
                    <Icon size={16} />
                  </div>
                </div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">{card.value}</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 truncate">{card.subtext}</div>
              </div>
            );
          })}
        </div>

        {/* Working Modules Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Circulation Transactions */}
          <div className="library-card p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h2 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">Peminjaman Terbaru</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">Aktivitas peminjaman dan pengembalian terbaru</p>
              </div>
              <Link
                href="/admin/peminjaman"
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
              >
                Semua Transaksi
              </Link>
            </div>

            {stats.recentPeminjaman.length === 0 ? (
              <div className="text-center py-10 text-slate-400 dark:text-slate-500">
                <BookCopy size={36} className="mx-auto mb-2 opacity-40" />
                <p className="text-xs font-medium">Belum ada transaksi peminjaman</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {stats.recentPeminjaman.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 hover:bg-white dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                        {p.buku.judul}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                        {p.anggota.nama} · Kelas {p.anggota.kelas}
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      {statusBadge(p.status)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Popular Books In Demand */}
          <div className="library-card p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h2 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">Koleksi Paling Banyak Dipinjam</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">Peringkat berdasarkan frekuensi peminjaman siswa</p>
              </div>
              <Link
                href="/admin/buku"
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
              >
                Kelola Koleksi
              </Link>
            </div>

            {stats.bukuTerpopuler.length === 0 ? (
              <div className="text-center py-10 text-slate-400 dark:text-slate-500">
                <BookMarked size={36} className="mx-auto mb-2 opacity-40" />
                <p className="text-xs font-medium">Belum ada riwayat peminjaman buku</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {stats.bukuTerpopuler.map((buku, idx) => (
                  <div
                    key={buku.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800"
                  >
                    <span className="w-6 h-6 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center justify-center flex-shrink-0">
                      {idx + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                        {buku.judul}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                        Sisa Stok Fisik: <span className="font-bold text-slate-700 dark:text-slate-200">{buku.stok}</span>
                      </div>
                    </div>
                    <span className="badge badge-blue">
                      {buku._count.peminjaman}× dipinjam
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Operational Circulation Totals */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 pt-2">
          <div className="library-card p-4 flex items-center gap-3.5">
            <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 flex items-center justify-center flex-shrink-0">
              <TrendingUp size={18} />
            </div>
            <div>
              <div className="text-lg font-bold text-slate-900 dark:text-white">{stats.totalPeminjaman}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Akumulasi Transaksi</div>
            </div>
          </div>

          <div className="library-card p-4 flex items-center gap-3.5">
            <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 size={18} />
            </div>
            <div>
              <div className="text-lg font-bold text-slate-900 dark:text-white">{stats.dikembalikan}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Buku Berhasil Dikembalikan</div>
            </div>
          </div>

          <div className="library-card p-4 flex items-center gap-3.5">
            <div className="w-9 h-9 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 flex items-center justify-center flex-shrink-0">
              <Clock size={18} />
            </div>
            <div>
              <div className="text-lg font-bold text-slate-900 dark:text-white">{stats.dipinjam + stats.terlambat}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Buku Sedang di Tangan Siswa</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

