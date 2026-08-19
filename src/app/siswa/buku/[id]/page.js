import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { BookMarked, Tag, PenLine, Building2, Calendar, Hash, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import PinjamBukuButton from '@/components/siswa/PinjamBukuButton';

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const id = parseInt(resolvedParams?.id);
  if (!id) return { title: 'Detail Buku' };
  const buku = await prisma.buku.findUnique({ where: { id } });
  return { title: buku?.judul || 'Detail Buku' };
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
    { label: 'Kategori', value: buku.kategori?.nama, icon: Tag },
    { label: 'Penulis', value: buku.penulis?.nama, icon: PenLine },
    { label: 'Penerbit', value: buku.penerbit?.nama, icon: Building2 },
    { label: 'Tahun Terbit', value: buku.tahunTerbit, icon: Calendar },
    { label: 'ISBN', value: buku.isbn, icon: Hash },
  ].filter(i => i.value);

  return (
    <div>
      <Link href="/siswa/buku" className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-bold transition-colors mb-6 text-sm">
        <ArrowLeft size={16} /> Kembali ke Katalog
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cover */}
        <div className="lg:col-span-1">
          <div
            className="w-full rounded-2xl flex items-center justify-center shadow-inner"
            style={{
              height: '280px',
              background: 'linear-gradient(135deg, rgba(37,99,235,0.08), rgba(37,99,235,0.02))',
              border: '1px solid #e2e8f0',
            }}
          >
            <BookMarked size={64} color="#2563eb" className="opacity-60" />
          </div>

          <div className="mt-4 glass-card-sm p-4 text-center">
            <div className="text-3xl font-extrabold text-slate-900 mb-1">{buku.stok}</div>
            <div className="text-xs font-semibold text-slate-500">Stok tersedia</div>
            <div className={`badge mt-2 ${buku.stok > 0 ? 'badge-green' : 'badge-red'}`}>
              {buku.stok > 0 ? 'Tersedia' : 'Habis'}
            </div>
          </div>

          {/* Tombol Ajukan Pinjam bagi Siswa */}
          <PinjamBukuButton buku={buku} existingLoan={existingLoan} isStudent={isStudent} />
        </div>

        {/* Detail */}
        <div className="lg:col-span-2">
          <h1 className="text-2xl font-bold text-slate-900 mb-2 leading-snug">{buku.judul}</h1>

          {buku.penulis && (
            <p className="text-slate-600 font-medium mb-4">oleh <span className="text-blue-600 font-bold">{buku.penulis.nama}</span></p>
          )}

          {/* Info Grid */}
          <div className="glass-card-sm p-4 mb-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {info.map(item => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="flex items-start gap-2">
                    <Icon size={14} className="text-slate-400 mt-0.5" />
                    <div>
                      <div className="text-xs font-semibold text-slate-500">{item.label}</div>
                      <div className="text-sm font-bold text-slate-900 mt-0.5">{item.value}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Deskripsi */}
          {buku.deskripsi && (
            <div className="glass-card-sm p-4 mb-4">
              <h3 className="text-sm font-bold text-slate-900 mb-2">Deskripsi</h3>
              <p className="text-sm text-slate-600 leading-relaxed font-medium">{buku.deskripsi}</p>
            </div>
          )}

          {/* Statistik */}
          <div className="glass-card-sm p-4">
            <div className="text-sm text-slate-500 font-medium">
              Total dipinjam: <span className="text-slate-900 font-bold">{buku._count.peminjaman}×</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
