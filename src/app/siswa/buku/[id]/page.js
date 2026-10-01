import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { Tag, PenLine, Building2, Calendar, Hash, ArrowLeft, Library, BookOpen } from 'lucide-react';
import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import PinjamBukuButton from '@/components/siswa/PinjamBukuButton';

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const id = parseInt(resolvedParams?.id);
  if (!id) return { title: 'Detail Buku | Perpustakaan Metland' };
  const buku = await prisma.buku.findUnique({ where: { id } });
  return { title: `${buku?.judul || 'Detail Buku'} | Perpustakaan Metland` };
}

export default async function DetailBukuPage({ params }) {
  const resolvedParams = await params;
  const id = parseInt(resolvedParams?.id);
  if (!id) notFound();

  const session = await getServerSession(authOptions);
  const rawAnggotaId = session?.user?.anggotaId;
  const anggotaId = rawAnggotaId ? parseInt(rawAnggotaId) : null;
  const isStudent = session?.user?.role === 'SISWA';

  const buku = await prisma.buku.findUnique({
    where: { id },
    include: {
      kategori: true,
      penulis: true,
      penerbit: true,
      _count: { select: { peminjaman: true } },
    },
  });

  if (!buku) notFound();

  const existingLoan = (anggotaId && !isNaN(anggotaId) && id) ? await prisma.peminjaman.findFirst({
    where: {
      anggotaId: anggotaId,
      bukuId: id,
      status: { in: ['MENUNGGU_KONFIRMASI', 'DIPINJAM', 'TERLAMBAT'] },
    },
  }) : null;

  const info = [
    { label: 'Kategori Koleksi', value: buku.kategori?.nama, icon: Tag },
    { label: 'Pengarang / Penulis', value: buku.penulis?.nama, icon: PenLine },
    { label: 'Penerbit Buku', value: buku.penerbit?.nama, icon: Building2 },
    { label: 'Tahun Terbit', value: buku.tahunTerbit, icon: Calendar },
    { label: 'Nomor Standar ISBN', value: buku.isbn, icon: Hash },
  ].filter(i => i.value);

  return (
    <div className="space-y-6">
      <Link
        href="/siswa/buku"
        className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 font-semibold text-xs sm:text-sm transition-colors"
      >
        <ArrowLeft size={16} /> Kembali ke Katalog Buku
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
        {/* Left Column: Book Physical Representation & Circulation Status */}
        <div className="lg:col-span-4 space-y-4">
          <div className="w-full rounded-xl overflow-hidden bg-slate-100 border border-slate-200 book-cover-wrap relative h-80 sm:h-96 flex items-center justify-center">
            {buku.cover ? (
              <img src={buku.cover} alt={buku.judul} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-slate-100">
                <Library size={48} className="text-slate-400 mb-2" />
                <span className="text-xs font-bold text-slate-600 line-clamp-3">
                  {buku.judul}
                </span>
              </div>
            )}
          </div>

          <div className="library-card p-4 space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs font-semibold text-slate-500">Ketersediaan Stok Fisik</span>
              <span className={`badge text-xs ${buku.stok > 0 ? 'badge-green' : 'badge-red'}`}>
                {buku.stok > 0 ? `${buku.stok} Buku Tersedia` : 'Sedang Habis Dipinjam'}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">Frekuensi Peminjaman</span>
              <span className="font-bold text-slate-900">{buku._count.peminjaman} kali dibaca</span>
            </div>
          </div>

          <PinjamBukuButton buku={buku} existingLoan={existingLoan} isStudent={isStudent} />
        </div>

        {/* Right Column: Bibliographic Details & Description */}
        <div className="lg:col-span-8 space-y-5">
          <div className="library-card p-5 sm:p-6 space-y-4">
            <div>
              {buku.kategori && (
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-1 rounded inline-block mb-2">
                  {buku.kategori.nama}
                </span>
              )}
              <h1 className="text-xl sm:text-3xl font-bold text-slate-900 leading-snug tracking-tight">
                {buku.judul}
              </h1>
              {buku.penulis && (
                <p className="text-sm font-medium text-slate-600 mt-1">
                  Karya <span className="font-bold text-slate-900">{buku.penulis.nama}</span>
                </p>
              )}
            </div>

            <hr className="border-slate-100" />

            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                Informasi Bibliografi Koleksi
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {info.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.label} className="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                      <Icon size={16} className="text-slate-400 mt-0.5 flex-shrink-0" />
                      <div className="min-w-0">
                        <div className="text-[11px] font-medium text-slate-500">{item.label}</div>
                        <div className="text-xs sm:text-sm font-bold text-slate-900 mt-0.5 truncate">
                          {item.value}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {buku.deskripsi && (
              <div className="pt-2">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Sinopsis & Deskripsi Buku
                </h2>
                <div className="p-4 rounded-lg bg-slate-50/70 border border-slate-100 text-xs sm:text-sm text-slate-700 leading-relaxed font-normal whitespace-pre-line">
                  {buku.deskripsi}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
