import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { BookCopy, Calendar, AlertTriangle, Clock, Info } from 'lucide-react';
import Link from 'next/link';

export const metadata = { title: 'Riwayat Peminjaman' };

export default async function SiswaPeminjamanPage() {
  const session = await getServerSession(authOptions);
  const anggotaId = session?.user?.anggotaId;

  const peminjaman = anggotaId ? await prisma.peminjaman.findMany({
    where: { anggotaId },
    orderBy: { createdAt: 'desc' },
    include: {
      buku: {
        select: { id: true, judul: true, penulis: { select: { nama: true } }, kategori: { select: { nama: true } } },
      },
    },
  }) : [];

  const fmt = (d) => d ? new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) : '—';

  const statusConfig = {
    MENUNGGU_KONFIRMASI: { label: 'Menunggu Konfirmasi Admin', badge: 'badge-yellow' },
    DIPINJAM: { label: 'Dipinjam', badge: 'badge-blue' },
    DIKEMBALIKAN: { label: 'Dikembalikan', badge: 'badge-green' },
    TERLAMBAT: { label: 'Terlambat!', badge: 'badge-red' },
    DITOLAK: { label: 'Ditolak', badge: 'badge-red' },
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="section-title text-2xl sm:text-3xl mb-1 text-slate-900">Riwayat Peminjaman</h1>
        <p className="section-subtitle text-xs sm:text-sm text-slate-500">Semua pengajuan dan buku yang kamu pinjam</p>
      </div>

      {peminjaman.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <BookCopy size={48} className="mx-auto mb-3 opacity-40" />
          <p className="text-base sm:text-lg font-bold text-slate-700">Belum ada riwayat peminjaman</p>
          <Link href="/siswa/buku" className="btn-primary mt-4 inline-flex">
            Lihat Katalog Buku
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {peminjaman.map(p => {
            const sc = statusConfig[p.status] || { label: p.status, badge: 'badge-blue' };
            const isLate = p.status === 'TERLAMBAT' || (p.status === 'DIPINJAM' && new Date(p.tglKembaliRencana) < new Date());

            return (
              <div key={p.id} className="glass-card p-4 sm:p-5">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Link href={`/siswa/buku/${p.buku.id}`} className="font-bold text-slate-900 hover:text-blue-600 transition-colors text-sm sm:text-base">
                        {p.buku.judul}
                      </Link>
                    </div>
                    {p.buku.penulis && <p className="text-xs font-semibold text-slate-500 mb-3">{p.buku.penulis.nama}</p>}

                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600 font-medium">
                      <span className="flex items-center gap-1">
                        <Calendar size={11} className="text-slate-400" /> Tgl Pengajuan: {fmt(p.createdAt)}
                      </span>
                      {p.status !== 'MENUNGGU_KONFIRMASI' && p.status !== 'DITOLAK' && (
                        <span className="flex items-center gap-1">
                          <Calendar size={11} className="text-slate-400" /> Tgl Pinjam: {fmt(p.tglPinjam)}
                        </span>
                      )}
                      <span className="flex items-center gap-1" style={{ color: isLate ? '#dc2626' : 'inherit' }}>
                        {isLate && <AlertTriangle size={11} />}
                        Rencana kembali: {fmt(p.tglKembaliRencana)}
                      </span>
                      {p.tglKembaliAktual && (
                        <span className="flex items-center gap-1 text-emerald-700 font-bold">
                          Dikembalikan: {fmt(p.tglKembaliAktual)}
                        </span>
                      )}
                    </div>

                    {p.status === 'MENUNGGU_KONFIRMASI' && (
                      <div className="mt-3 p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2 font-medium">
                        <Clock size={14} className="text-amber-600 flex-shrink-0" />
                        Pengajuanmu sedang ditinjau Admin. Silakan kunjungi perpustakaan setelah disetujui.
                      </div>
                    )}

                    {p.status === 'DITOLAK' && (
                      <div className="mt-3 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2 font-medium">
                        <Info size={14} className="text-rose-600 flex-shrink-0" />
                        Pengajuan ditolak: {p.catatan || 'Alasan tidak ditentukan oleh admin.'}
                      </div>
                    )}
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 flex-shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    <span className={`badge ${sc.badge}`}>{sc.label}</span>
                    {p.denda > 0 && (
                      <span className="text-xs font-bold text-rose-600">
                        Denda: Rp {p.denda.toLocaleString('id')}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
