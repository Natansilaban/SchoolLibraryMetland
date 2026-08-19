import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Mail, Hash, GraduationCap, Phone, MapPin } from 'lucide-react';

export const metadata = { title: 'Profil Saya' };

export default async function SiswaProfilPage() {
  const session = await getServerSession(authOptions);
  const anggotaId = session?.user?.anggotaId;

  const anggota = anggotaId ? await prisma.anggota.findUnique({
    where: { id: anggotaId },
    include: {
      user: { select: { email: true, createdAt: true } },
      _count: { select: { peminjaman: true } },
    },
  }) : null;

  const stats = anggotaId ? await Promise.all([
    prisma.peminjaman.count({ where: { anggotaId, status: 'DIKEMBALIKAN' } }),
    prisma.peminjaman.count({ where: { anggotaId, status: 'DIPINJAM' } }),
    prisma.peminjaman.aggregate({ where: { anggotaId }, _sum: { denda: true } }),
  ]) : [0, 0, { _sum: { denda: 0 } }];

  const [sudahKembali, sedangPinjam, dendaAgg] = stats;
  const totalDenda = dendaAgg._sum?.denda || 0;

  const infoItems = [
    { label: 'NIS', value: anggota?.nis, icon: Hash },
    { label: 'Kelas', value: anggota?.kelas, icon: GraduationCap },
    { label: 'Email', value: anggota?.user?.email, icon: Mail },
    { label: 'No HP', value: anggota?.noHp, icon: Phone },
    { label: 'Alamat', value: anggota?.alamat, icon: MapPin },
  ].filter(i => i.value);

  return (
    <div className="max-w-2xl mx-auto space-y-4 sm:space-y-6">
      <div className="mb-4 sm:mb-6">
        <h1 className="section-title text-xl sm:text-3xl mb-0.5 text-slate-900">Profil Saya</h1>
        <p className="section-subtitle text-xs sm:text-sm text-slate-500">Informasi akun dan statistik peminjaman</p>
      </div>

      {/* Avatar Card */}
      <div className="glass-card p-4 sm:p-6 flex flex-row items-center text-left gap-4 sm:gap-5 border-l-4 border-l-blue-600">
        <div
          className="w-14 h-14 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center text-xl sm:text-3xl font-extrabold flex-shrink-0 shadow-sm"
          style={{ background: 'rgba(37,99,235,0.12)', border: '1px solid rgba(37,99,235,0.2)', color: '#1d4ed8' }}
        >
          {anggota?.nama?.[0]?.toUpperCase() || 'S'}
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-base sm:text-xl font-extrabold text-slate-900 truncate">{anggota?.nama || 'Siswa'}</h2>
          <p className="text-blue-600 text-xs sm:text-sm font-bold mt-0.5">{anggota?.kelas || '—'}</p>
          <p className="text-slate-500 text-[11px] sm:text-xs font-medium mt-1">
            Terdaftar {anggota?.user?.createdAt ? new Date(anggota.user.createdAt).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' }) : '—'}
          </p>
        </div>
      </div>

      {/* Info */}
      <div className="glass-card p-4 sm:p-5">
        <h3 className="font-bold text-slate-900 mb-3 sm:mb-4 text-xs sm:text-base uppercase tracking-wider text-slate-500">Informasi Pribadi</h3>
        <div className="space-y-3">
          {infoItems.map(item => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-slate-100 border border-slate-200">
                  <Icon size={14} className="text-slate-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] font-semibold text-slate-500">{item.label}</div>
                  <div className="text-xs sm:text-sm font-bold text-slate-900 truncate">{item.value}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Stats */}
      <div className="glass-card p-4 sm:p-5">
        <h3 className="font-bold text-slate-900 mb-3 sm:mb-4 text-xs sm:text-base uppercase tracking-wider text-slate-500">Statistik Peminjaman</h3>
        <div className="grid grid-cols-3 gap-2.5 sm:gap-4 text-center">
          <div className="p-2.5 sm:p-3 bg-slate-50 rounded-xl border border-slate-100">
            <div className="text-lg sm:text-2xl font-black text-slate-900">{anggota?._count?.peminjaman || 0}</div>
            <div className="text-[10px] sm:text-xs font-semibold text-slate-500 mt-0.5">Total Pinjam</div>
          </div>
          <div className="p-2.5 sm:p-3 bg-slate-50 rounded-xl border border-slate-100">
            <div className="text-lg sm:text-2xl font-black text-emerald-600">{sudahKembali}</div>
            <div className="text-[10px] sm:text-xs font-semibold text-slate-500 mt-0.5">Dikembalikan</div>
          </div>
          <div className="p-2.5 sm:p-3 bg-slate-50 rounded-xl border border-slate-100">
            <div className="text-lg sm:text-2xl font-black text-amber-600">{sedangPinjam}</div>
            <div className="text-[10px] sm:text-xs font-semibold text-slate-500 mt-0.5">Dipinjam</div>
          </div>
        </div>
        {totalDenda > 0 && (
          <div className="mt-3 sm:mt-4 p-3 rounded-xl text-center bg-rose-50 border border-rose-200">
            <div className="text-xs font-semibold text-slate-500 mb-0.5">Total Denda</div>
            <div className="text-base sm:text-lg font-bold text-rose-600">Rp {totalDenda.toLocaleString('id')}</div>
          </div>
        )}
      </div>
    </div>
  );
}
