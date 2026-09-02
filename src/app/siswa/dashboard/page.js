import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { BookMarked, BookCopy, Clock, CheckCircle2, ChevronRight } from 'lucide-react';
import Link from 'next/link';

export const metadata = { title: 'Beranda Siswa' };

export default async function SiswaDashboardPage() {
  const session = await getServerSession(authOptions);
  const anggotaId = session?.user?.anggotaId;

  const now = new Date();

  const [anggota, recentPeminjaman, statusCounts, overdueActive] = await Promise.all([
    anggotaId
      ? prisma.anggota.findUnique({
          where: { id: anggotaId },
          select: { nama: true, nis: true, kelas: true },
        })
      : null,
    anggotaId
      ? prisma.peminjaman.findMany({
          where: { anggotaId },
          take: 3,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            status: true,
            tglKembaliRencana: true,
            buku: { select: { judul: true } },
          },
        })
      : [],
    anggotaId
      ? prisma.peminjaman.groupBy({
          by: ['status'],
          where: { anggotaId },
          _count: { _all: true },
        })
      : [],
    anggotaId
      ? prisma.peminjaman.count({
          where: {
            anggotaId,
            status: 'DIPINJAM',
            tglKembaliRencana: { lt: now },
          },
        })
      : 0,
  ]);

  let totalPinjam = 0;
  let sedangPinjam = 0;
  let terlambat = overdueActive;

  for (const item of statusCounts) {
    const count = item._count._all;
    totalPinjam += count;
    if (item.status === 'DIPINJAM') {
      sedangPinjam += count;
    } else if (item.status === 'TERLAMBAT') {
      terlambat += count;
    }
  }

  const statusBadge = (status) => {
    if (status === 'MENUNGGU_KONFIRMASI') return <span className="badge badge-yellow text-[10px] sm:text-xs">Menunggu</span>;
    if (status === 'DIPINJAM') return <span className="badge badge-blue text-[10px] sm:text-xs">Dipinjam</span>;
    if (status === 'DIKEMBALIKAN') return <span className="badge badge-green text-[10px] sm:text-xs">Kembali</span>;
    if (status === 'TERLAMBAT') return <span className="badge badge-red text-[10px] sm:text-xs">Terlambat</span>;
    if (status === 'DITOLAK') return <span className="badge badge-red text-[10px] sm:text-xs">Ditolak</span>;
    return null;
  };

  const fmt = (d) => d ? new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Welcome Header */}
      <div
        className="glass-card p-4 sm:p-6 relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(37,99,235,0.08) 0%, rgba(37,99,235,0.02) 100%)',
          border: '1px solid rgba(37,99,235,0.18)',
        }}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider mb-0.5">Selamat datang,</p>
            <h1 className="text-lg sm:text-2xl font-extrabold text-slate-900 leading-tight truncate">
              {anggota?.nama || session?.user?.name || 'Siswa'}
            </h1>
            <p className="text-xs sm:text-sm font-bold text-blue-600 mt-1">
              {anggota?.nis ? `${anggota.nis} · ` : ''}{anggota?.kelas || 'Metland School'}
            </p>
          </div>
          <div
            className="w-11 h-11 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center text-lg sm:text-2xl font-black shadow-sm flex-shrink-0"
            style={{ background: 'rgba(37,99,235,0.12)', border: '1px solid rgba(37,99,235,0.2)', color: '#1d4ed8' }}
          >
            {anggota?.nama?.[0]?.toUpperCase() || 'S'}
          </div>
        </div>
      </div>

      {/* Stats - Grid 3 Columns on all screens for clean compact look */}
      <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
        {[
          { label: 'Total Pinjam', value: totalPinjam, icon: BookCopy, color: '#2563eb', bg: 'rgba(37,99,235,0.08)', spineColor: '#2563eb' },
          { label: 'Sedang Pinjam', value: sedangPinjam, icon: Clock, color: '#d97706', bg: 'rgba(217,119,6,0.08)', spineColor: '#d97706' },
          { label: 'Terlambat', value: terlambat, icon: BookMarked, color: '#dc2626', bg: 'rgba(220,38,38,0.08)', spineColor: '#dc2626' },
        ].map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="glass-card-sm p-3 sm:p-4 text-center relative flex flex-col items-center justify-center" style={{ borderTop: `3px solid ${s.spineColor}` }}>
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center mb-1.5" style={{ background: s.bg }}>
                <Icon size={18} color={s.color} />
              </div>
              <div className="text-xl sm:text-2xl font-black text-slate-900 leading-none">{s.value}</div>
              <div className="text-[10px] sm:text-xs font-semibold text-slate-500 mt-1 line-clamp-1">{s.label}</div>
            </div>
          );
        })}
      </div>

      {/* Quick Access */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <Link href="/siswa/buku" className="glass-card p-4 sm:p-5 flex items-center justify-between gap-3 group hover:border-blue-300">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(37,99,235,0.1)', border: '1px solid rgba(37,99,235,0.2)' }}>
              <BookMarked size={20} color="#2563eb" />
            </div>
            <div className="min-w-0">
              <div className="font-bold text-sm sm:text-base text-slate-900 group-hover:text-blue-600 transition-colors">Katalog Buku</div>
              <div className="text-xs font-medium text-slate-500 truncate">Jelajahi koleksi buku perpustakaan</div>
            </div>
          </div>
          <ChevronRight size={18} className="text-slate-400 group-hover:text-blue-600 transition-colors flex-shrink-0" />
        </Link>
        <Link href="/siswa/peminjaman" className="glass-card p-4 sm:p-5 flex items-center justify-between gap-3 group hover:border-emerald-300">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>
              <CheckCircle2 size={20} color="#059669" />
            </div>
            <div className="min-w-0">
              <div className="font-bold text-sm sm:text-base text-slate-900 group-hover:text-emerald-600 transition-colors">Pinjaman Saya</div>
              <div className="text-xs font-medium text-slate-500 truncate">Lihat riwayat peminjaman</div>
            </div>
          </div>
          <ChevronRight size={18} className="text-slate-400 group-hover:text-emerald-600 transition-colors flex-shrink-0" />
        </Link>
      </div>

      {/* Recent Peminjaman */}
      {recentPeminjaman.length > 0 && (
        <div className="glass-card p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3.5">
            <h2 className="font-bold text-sm sm:text-base text-slate-900">Peminjaman Terakhir</h2>
            <Link href="/siswa/peminjaman" className="text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors">
              Lihat semua →
            </Link>
          </div>
          <div className="space-y-2.5">
            {recentPeminjaman.map(p => (
              <div key={p.id} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-50/80 border border-slate-200">
                <div className="flex-1 min-w-0">
                  <div className="text-xs sm:text-sm font-bold text-slate-900 truncate">{p.buku.judul}</div>
                  <div className="text-[11px] font-medium text-slate-500 mt-0.5">Rencana Kembali: {fmt(p.tglKembaliRencana)}</div>
                </div>
                <div className="flex-shrink-0">
                  {statusBadge(p.status)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
