import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Mail, Hash, GraduationCap, Phone, MapPin, Library, CheckCircle2, AlertCircle } from 'lucide-react';

export const metadata = { title: 'Profil Anggota | Perpustakaan Metland School' };

export default async function SiswaProfilPage() {
  const session = await getServerSession(authOptions);
  const anggotaId = session?.user?.anggotaId;

  let anggota = null;
  let sudahKembali = 0;
  let sedangPinjam = 0;
  let totalDenda = 0;

  if (anggotaId) {
    try {
      const [anggotaRes, allLoans] = await Promise.all([
        prisma.anggota.findUnique({
          where: { id: anggotaId },
          include: {
            user: { select: { email: true, createdAt: true } },
            _count: { select: { peminjaman: true } },
          },
        }),
        prisma.peminjaman.findMany({
          where: { anggotaId },
          select: { status: true, denda: true },
        }),
      ]);

      anggota = anggotaRes;
      for (const l of allLoans) {
        if (l.status === 'DIKEMBALIKAN') sudahKembali++;
        else if (l.status === 'DIPINJAM') sedangPinjam++;
        if (l.denda) totalDenda += l.denda;
      }
    } catch (err) {
      console.warn('[PROFIL] Graceful fallback on database connection hiccup:', err.message || err);
    }
  }

  const infoItems = [
    { label: 'Nomor Induk Siswa (NIS)', value: anggota?.nis, icon: Hash },
    { label: 'Rombongan Belajar (Kelas)', value: anggota?.kelas, icon: GraduationCap },
    { label: 'Alamat Email Terdaftar', value: anggota?.user?.email, icon: Mail },
    { label: 'Nomor Telepon / WhatsApp', value: anggota?.noHp, icon: Phone },
    { label: 'Alamat Domisili Siswa', value: anggota?.alamat, icon: MapPin },
  ].filter(i => i.value);

  const registeredDate = anggota?.user?.createdAt
    ? new Date(anggota.user.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })
    : 'Tanggal tidak tercatat';

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
          Profil & Kartu Anggota
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Informasi kartu anggota dan riwayat peminjaman buku perpustakaan
        </p>
      </div>

      {/* Scholastic Student Member Identity Card */}
      <div className="library-card overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white p-1 flex items-center justify-center shadow-xs flex-shrink-0">
              <img src="/logo.png" alt="Logo Metland School" width={40} height={40} decoding="async" className="w-full h-full object-contain" />
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-300">Kartu Anggota</div>
              <div className="text-sm font-extrabold tracking-tight">Perpustakaan Metland School</div>
            </div>
          </div>
          <div className="text-[10px] font-mono tracking-widest text-slate-400 uppercase bg-slate-800 px-2 py-1 rounded border border-slate-700">
            {anggota?.nis || 'METLAND-LIB'}
          </div>
        </div>

        <div className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-5">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800/60 text-blue-700 dark:text-blue-300 flex items-center justify-center text-2xl sm:text-3xl font-bold flex-shrink-0 shadow-sm">
            {anggota?.nama?.[0]?.toUpperCase() || 'S'}
          </div>

          <div className="min-w-0 flex-1">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white truncate">
              {anggota?.nama || 'Siswa Perpustakaan'}
            </h2>
            <div className="text-xs sm:text-sm font-semibold text-blue-700 dark:text-blue-400 mt-0.5">
              Kelas {anggota?.kelas || 'Metland School'}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-medium">
              Terdaftar sejak: {registeredDate}
            </div>
          </div>

          <div className="sm:text-right pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1 rounded-md border border-emerald-200 dark:border-emerald-800/60">
              <CheckCircle2 size={13} />
              Status: Aktif
            </span>
          </div>
        </div>
      </div>

      {/* Member Details */}
      <div className="library-card p-5 sm:p-6 space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">
          Data Anggota Siswa
        </h2>
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {infoItems.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="py-2.5 first:pt-0 last:pb-0 flex items-start gap-3">
                <div className="w-7 h-7 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Icon size={14} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">{item.label}</div>
                  <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 mt-0.5 break-all">
                    {item.value}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Circulation Statistics */}
      <div className="library-card p-5 sm:p-6 space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">
          Statistik Peminjaman Buku
        </h2>

        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-700/60">
            <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
              {anggota?._count?.peminjaman || 0}
            </div>
            <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">Total Pinjam</div>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-700/60">
            <div className="text-xl sm:text-2xl font-bold text-emerald-700 dark:text-emerald-400">
              {sudahKembali}
            </div>
            <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">Telah Kembali</div>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-700/60">
            <div className="text-xl sm:text-2xl font-bold text-blue-700 dark:text-blue-400">
              {sedangPinjam}
            </div>
            <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">Sedang Dibawa</div>
          </div>
        </div>

        {totalDenda > 0 ? (
          <div className="p-3.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-rose-800 dark:text-rose-200">
              <AlertCircle size={16} className="text-rose-600 dark:text-rose-400 flex-shrink-0" />
              <span>Terdapat catatan denda keterlambatan buku</span>
            </div>
            <span className="font-bold text-rose-700 dark:text-rose-300 text-sm">
              Rp {totalDenda.toLocaleString('id')}
            </span>
          </div>
        ) : (
          <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/50 flex items-center gap-2 text-xs text-emerald-800 dark:text-emerald-300 font-medium">
            <CheckCircle2 size={15} className="text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
            <span>Tidak ada catatan tunggakan denda. Status peminjaman aktif rapi.</span>
          </div>
        )}
      </div>
    </div>
  );
}
