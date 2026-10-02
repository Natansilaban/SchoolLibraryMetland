import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  BookMarked, BookCopy, Clock, CheckCircle2, ChevronRight,
  AlertCircle, Library, BookOpen, ArrowUpRight
} from 'lucide-react';
import Link from 'next/link';

export const metadata = { title: 'Beranda Siswa | Perpustakaan Metland School' };

export default async function SiswaDashboardPage() {
  const session = await getServerSession(authOptions);
  const anggotaId = session?.user?.anggotaId;

  const now = new Date();

  let anggota = {
    nama: session?.user?.name || 'Siswa',
    nis: session?.user?.nis || null,
    kelas: session?.user?.kelas || null,
  };
  let recentPeminjaman = [];
  let featuredBooks = [];
  let totalPinjam = 0;
  let sedangPinjam = 0;
  let terlambat = 0;
  let selesai = 0;

  try {
    const needsAnggotaFetch = anggotaId && (!anggota.nis || !anggota.kelas);

    const [anggotaRes, allLoans, booksRes] = await Promise.all([
      needsAnggotaFetch
        ? prisma.anggota.findUnique({
            where: { id: anggotaId },
            select: { nama: true, nis: true, kelas: true },
          }).catch(() => null)
        : Promise.resolve(null),
      anggotaId
        ? prisma.peminjaman.findMany({
            where: { anggotaId },
            orderBy: { createdAt: 'desc' },
            select: {
              id: true,
              status: true,
              tglPinjam: true,
              tglKembaliRencana: true,
              buku: { select: { id: true, judul: true, cover: true } },
            },
          }).catch(() => [])
        : Promise.resolve([]),
      prisma.buku.findMany({
        take: 4,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          judul: true,
          cover: true,
          stok: true,
          kategori: { select: { nama: true } },
          penulis: { select: { nama: true } },
        },
      }).catch(() => []),
    ]);

    if (anggotaRes) anggota = anggotaRes;
    featuredBooks = booksRes || [];

    if (Array.isArray(allLoans)) {
      recentPeminjaman = allLoans.slice(0, 4);
      totalPinjam = allLoans.length;

      for (const item of allLoans) {
        if (item.status === 'DIPINJAM') {
          sedangPinjam++;
          if (item.tglKembaliRencana && new Date(item.tglKembaliRencana) < now) {
            terlambat++;
          }
        } else if (item.status === 'TERLAMBAT') {
          terlambat++;
        } else if (item.status === 'DIKEMBALIKAN') {
          selesai++;
        }
      }
    }
  } catch (err) {
    console.warn('[DASHBOARD] Graceful fallback on database connection hiccup:', err.message || err);
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
      {/* Kartu Anggota Resmi Siswa */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center p-2.5 shadow-xs flex-shrink-0">
              <img src="/logo.png" alt="Logo SMK Pariwisata Metland" width={64} height={64} decoding="async" className="w-full h-full object-contain" />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Kartu Anggota Perpustakaan
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white leading-snug truncate">
                {anggota?.nama || session?.user?.name || 'Siswa'}
              </h1>
              <p className="text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300 mt-0.5">
                NIS: {anggota?.nis || 'Belum Terdaftar'} · Kelas: {anggota?.kelas || 'Metland School'}
              </p>
            </div>
          </div>

          <div className="flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100 dark:border-slate-800">
            <span className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 font-medium hidden sm:block">
              SMK Pariwisata Metland
            </span>
          </div>
        </div>
      </div>

      {/* Circulation Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="library-card p-4 sm:p-5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-blue-300 dark:hover:border-blue-800 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Buku Dipinjam</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Clock size={16} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">{sedangPinjam}</div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-medium">
            {sedangPinjam > 0 ? `${sedangPinjam} buku dalam masa pinjam` : 'Buku fisik dalam masa pinjam'}
          </p>
        </div>

        <div className="library-card p-4 sm:p-5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Keterlambatan</span>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${terlambat > 0 ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400' : 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400'}`}>
              <AlertCircle size={16} />
            </div>
          </div>
          <div className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${terlambat > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'}`}>
            {terlambat}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-medium">
            {terlambat > 0 ? 'Perlu segera dikembalikan' : 'Semua pinjaman tepat waktu'}
          </p>
        </div>

        <div className="library-card p-4 sm:p-5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Total Riwayat Baca</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">{selesai}</div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-medium">
            {selesai > 0 ? 'Buku yang telah selesai dibaca' : 'Buku yang telah selesai dibaca'}
          </p>
        </div>
      </div>

      {/* Actionable Library Gateways */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          href="/siswa/buku"
          className="library-card p-5 flex items-center justify-between group hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-xs transition-all duration-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-11 h-11 rounded-lg bg-blue-50 dark:bg-blue-950/50 border border-blue-100 dark:border-blue-800 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0">
              <BookMarked size={20} />
            </div>
            <div className="min-w-0">
              <h2 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                Katalog & Pencarian Buku
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                Cari judul, pengarang, nomor rak, dan ketersediaan stok
              </p>
            </div>
          </div>
          <ChevronRight size={18} className="text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
        </Link>

        <Link
          href="/siswa/peminjaman"
          className="library-card p-5 flex items-center justify-between group hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-xs transition-all duration-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-11 h-11 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 flex items-center justify-center flex-shrink-0">
              <BookCopy size={20} />
            </div>
            <div className="min-w-0">
              <h2 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                Status Pinjaman Saya
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                Periksa jatuh tempo, ajukan pengembalian, dan riwayat baca
              </p>
            </div>
          </div>
          <ChevronRight size={18} className="text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
        </Link>
      </div>

      {/* Featured Book Showcase */}
      {featuredBooks.length > 0 && (
        <div className="library-card p-5 sm:p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <BookOpen size={18} className="text-blue-600 dark:text-blue-400" />
                <h2 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">Rekomendasi Koleksi Untukmu</h2>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Koleksi buku terbaru yang siap dipinjam di perpustakaan</p>
            </div>
            <Link
              href="/siswa/buku"
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors inline-flex items-center gap-1"
            >
              Lihat Katalog <ArrowUpRight size={14} />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            {featuredBooks.map((buku) => (
              <Link
                key={buku.id}
                href={`/siswa/buku/${buku.id}`}
                className="group flex flex-col p-3 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-700/60 hover:bg-white dark:hover:bg-slate-800 hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-200"
              >
                <div className="aspect-[3/4] w-full rounded-lg bg-slate-200 dark:bg-slate-700 overflow-hidden relative mb-2.5 shadow-xs">
                  {buku.cover ? (
                    <img src={buku.cover} alt={buku.judul} loading="lazy" decoding="async" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                      <Library size={28} />
                    </div>
                  )}
                  {buku.kategori?.nama && (
                    <span className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded text-[9px] font-bold bg-slate-900/90 text-white shadow-xs">
                      {buku.kategori.nama}
                    </span>
                  )}
                </div>
                <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {buku.judul}
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                  {buku.penulis?.nama || 'Penulis Perpustakaan'}
                </p>
                <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                  <span>Stok: <b className="text-slate-800 dark:text-slate-200">{buku.stok}</b></span>
                  <span className="text-blue-600 dark:text-blue-400 font-semibold group-hover:underline">Pinjam</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Recent Loans Feed */}
      <div className="library-card p-5 sm:p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">Aktivitas Peminjaman Terkini</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Daftar buku yang baru kamu pinjam atau kembalikan</p>
          </div>
          <Link
            href="/siswa/peminjaman"
            className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
          >
            Lihat Semua Pinjaman
          </Link>
        </div>

        {recentPeminjaman.length === 0 ? (
          <div className="text-center py-10 text-slate-400">
            <BookMarked size={36} className="mx-auto mb-2.5 opacity-40" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Belum ada riwayat peminjaman</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              Kunjungi katalog buku untuk meminjam buku bacaan pelajaran atau fiksi perpustakaan.
            </p>
            <Link href="/siswa/buku" className="btn-primary mt-4 text-xs font-semibold inline-block">
              Eksplorasi Katalog Buku
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {recentPeminjaman.map((p) => (
              <div
                key={p.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 hover:bg-white dark:hover:bg-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-13 rounded-md bg-slate-200 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 flex items-center justify-center flex-shrink-0 overflow-hidden shadow-xs">
                    {p.buku?.cover ? (
                      <img src={p.buku.cover} alt={p.buku.judul} loading="lazy" decoding="async" className="w-full h-full object-cover" />
                    ) : (
                      <Library size={18} className="text-slate-400" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/siswa/buku/${p.buku?.id}`}
                      className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 truncate block transition-colors"
                    >
                      {p.buku?.judul || 'Buku Perpustakaan'}
                    </Link>
                    <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                      Batas Kembali: <span className="font-semibold text-slate-700 dark:text-slate-300">{fmt(p.tglKembaliRencana)}</span>
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
