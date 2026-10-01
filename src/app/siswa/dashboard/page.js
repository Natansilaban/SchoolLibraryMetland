import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { BookMarked, BookCopy, Clock, CheckCircle2, ChevronRight, AlertCircle, Library } from 'lucide-react';
import Link from 'next/link';

export const metadata = { title: 'Beranda Siswa | Perpustakaan Metland School' };

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
          take: 4,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            status: true,
            tglPinjam: true,
            tglKembaliRencana: true,
            buku: { select: { id: true, judul: true, cover: true } },
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
  let selesai = 0;

  for (const item of statusCounts) {
    const count = item._count._all;
    totalPinjam += count;
    if (item.status === 'DIPINJAM') {
      sedangPinjam += count;
    } else if (item.status === 'TERLAMBAT') {
      terlambat += count;
    } else if (item.status === 'DIKEMBALIKAN') {
      selesai += count;
    }
  }

  const statusBadge = (status) => {
    if (status === 'MENUNGGU_KONFIRMASI') return <span className="badge badge-yellow">Menunggu Konfirmasi</span>;
    if (status === 'DIPINJAM') return <span className="badge badge-blue">Sedang Dipinjam</span>;
    if (status === 'DIKEMBALIKAN') return <span className="badge badge-green">Telah Kembali</span>;
    if (status === 'TERLAMBAT') return <span className="badge badge-red">Terlambat</span>;
    if (status === 'DITOLAK') return <span className="badge badge-red">Ditolak</span>;
    return null;
  };

  const fmt = (d) => d ? new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';

  return (
    <div className="space-y-6">
      {/* Student Academic Identification Banner */}
      <div className="library-card p-5 sm:p-6 bg-white border border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-13 h-13 sm:w-16 sm:h-16 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center text-xl sm:text-2xl font-bold flex-shrink-0 shadow-sm">
              {anggota?.nama?.[0]?.toUpperCase() || 'S'}
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Kartu Anggota Perpustakaan
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 leading-snug truncate">
                {anggota?.nama || session?.user?.name || 'Siswa'}
              </h1>
              <p className="text-xs sm:text-sm font-semibold text-slate-600 mt-0.5">
                NIS: {anggota?.nis || 'Belum Terdaftar'} · Kelas: {anggota?.kelas || 'Metland School'}
              </p>
            </div>
          </div>

          <div className="flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
              Keanggotaan Aktif
            </span>
            <span className="text-[11px] text-slate-400 mt-1 font-medium hidden sm:block">
              Perpustakaan Metland School
            </span>
          </div>
        </div>
      </div>

      {/* Circulation Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="stat-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Buku Dipinjam</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Clock size={16} />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">{sedangPinjam}</div>
          <p className="text-[11px] text-slate-500 mt-1">Buku fisik dalam masa pinjam</p>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Keterlambatan</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertCircle size={16} />
            </div>
          </div>
          <div className={`text-2xl font-bold ${terlambat > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
            {terlambat}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {terlambat > 0 ? 'Perlu segera dikembalikan' : 'Semua pinjaman tepat waktu'}
          </p>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Total Riwayat Baca</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">{selesai}</div>
          <p className="text-[11px] text-slate-500 mt-1">Buku yang telah selesai dibaca</p>
        </div>
      </div>

      {/* Actionable Library Gateways */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          href="/siswa/buku"
          className="library-card p-5 flex items-center justify-between group hover:border-blue-400 transition-all"
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-11 h-11 rounded-lg bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0">
              <BookMarked size={20} />
            </div>
            <div className="min-w-0">
              <h2 className="font-bold text-sm sm:text-base text-slate-900 group-hover:text-blue-700 transition-colors">
                Katalog & Pencarian Buku
              </h2>
              <p className="text-xs text-slate-500 truncate mt-0.5">
                Cari judul, pengarang, nomor rak, dan ketersediaan stok
              </p>
            </div>
          </div>
          <ChevronRight size={18} className="text-slate-400 group-hover:text-blue-700 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
        </Link>

        <Link
          href="/siswa/peminjaman"
          className="library-card p-5 flex items-center justify-between group hover:border-blue-400 transition-all"
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-11 h-11 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center flex-shrink-0">
              <BookCopy size={20} />
            </div>
            <div className="min-w-0">
              <h2 className="font-bold text-sm sm:text-base text-slate-900 group-hover:text-blue-700 transition-colors">
                Status Pinjaman Saya
              </h2>
              <p className="text-xs text-slate-500 truncate mt-0.5">
                Periksa jatuh tempo, ajukan pengembalian, dan riwayat baca
              </p>
            </div>
          </div>
          <ChevronRight size={18} className="text-slate-400 group-hover:text-blue-700 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
        </Link>
      </div>

      {/* Recent Loans Feed */}
      <div className="library-card p-5 sm:p-6">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
          <div>
            <h2 className="font-bold text-sm sm:text-base text-slate-900">Aktivitas Peminjaman Terkini</h2>
            <p className="text-xs text-slate-500">Daftar buku yang baru kamu pinjam atau kembalikan</p>
          </div>
          <Link
            href="/siswa/peminjaman"
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors"
          >
            Lihat Semua Pinjaman
          </Link>
        </div>

        {recentPeminjaman.length === 0 ? (
          <div className="text-center py-10 text-slate-400">
            <BookMarked size={36} className="mx-auto mb-2.5 opacity-40" />
            <p className="text-sm font-semibold text-slate-700">Belum ada riwayat peminjaman</p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Kunjungi katalog buku untuk meminjam buku bacaan pelajaran atau fiksi perpustakaan.
            </p>
            <Link href="/siswa/buku" className="btn-primary mt-4 text-xs font-semibold">
              Eksplorasi Katalog Buku
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {recentPeminjaman.map((p) => (
              <div
                key={p.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-lg bg-slate-50 border border-slate-200/80 hover:bg-white hover:border-slate-300 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-12 rounded bg-slate-200 border border-slate-300 flex items-center justify-center flex-shrink-0 overflow-hidden shadow-xs">
                    {p.buku?.cover ? (
                      <img src={p.buku.cover} alt={p.buku.judul} className="w-full h-full object-cover" />
                    ) : (
                      <Library size={18} className="text-slate-400" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/siswa/buku/${p.buku?.id}`}
                      className="text-xs sm:text-sm font-bold text-slate-900 hover:text-blue-700 truncate block transition-colors"
                    >
                      {p.buku?.judul || 'Buku Perpustakaan'}
                    </Link>
                    <p className="text-[11px] font-medium text-slate-500 mt-0.5">
                      Batas Kembali: <span className="font-semibold text-slate-700">{fmt(p.tglKembaliRencana)}</span>
                    </p>
                  </div>
                </div>

                <div className="flex-shrink-0 self-start sm:self-center">
                  {statusBadge(p.status)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
