'use client';

import { useState, useEffect, useCallback } from 'react';
import TopBar from '@/components/layout/TopBar';
import { Printer, CheckCircle2, BookCopy, AlertTriangle, Wallet } from 'lucide-react';

const MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export default function LaporanPage() {
  const now = new Date();
  const [bulan, setBulan] = useState(now.getMonth() + 1);
  const [tahun, setTahun] = useState(now.getFullYear());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetch_ = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/laporan?bulan=${bulan}&tahun=${tahun}`);
      const json = await res.json();
      setData(json);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [bulan, tahun]);

  useEffect(() => {
    fetch_();
  }, [fetch_]);

  const fmt = (d) => d ? new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';

  const handlePrint = () => window.print();

  return (
    <>
      <TopBar title="Laporan Peminjaman Buku" subtitle="Rekapitulasi data peminjaman dan pengembalian buku per periode" />
      <div className="p-4 sm:p-6 space-y-6">
        {/* Controls Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 no-print bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5 flex-1">
            <select
              id="filter-bulan"
              className="library-input text-xs sm:text-sm flex-1 sm:flex-initial sm:w-44"
              value={bulan}
              onChange={(e) => setBulan(parseInt(e.target.value))}
            >
              {MONTHS.map((m, i) => (
                <option key={i} value={i + 1}>
                  Bulan {m}
                </option>
              ))}
            </select>
            <select
              id="filter-tahun"
              className="library-input text-xs sm:text-sm flex-1 sm:flex-initial sm:w-32"
              value={tahun}
              onChange={(e) => setTahun(parseInt(e.target.value))}
            >
              {[2024, 2025, 2026, 2027].map((y) => (
                <option key={y} value={y}>
                  Tahun {y}
                </option>
              ))}
            </select>
          </div>
          <button
            id="print-laporan"
            onClick={handlePrint}
            className="btn-primary justify-center sm:flex-initial text-xs sm:text-sm min-h-[40px]"
          >
            <Printer size={16} /> Cetak Laporan Fisik
          </button>
        </div>

        {/* Formal Print Header */}
        <div className="hidden print:block mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Perpustakaan Metland School</h1>
          <h2 className="text-lg text-slate-700">Laporan Peminjaman Buku: {MONTHS[bulan - 1]} {tahun}</h2>
          <p className="text-xs text-slate-500">Tanggal Dokumen: {new Date().toLocaleDateString('id-ID', { dateStyle: 'full' })}</p>
          <hr className="my-3 border-slate-300" />
        </div>

        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="library-card h-24 shimmer rounded-xl" />
            ))}
          </div>
        ) : data && (
          <>
            {/* Period Statistics Summary */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {[
                {
                  label: 'Total Peminjaman',
                  value: data.ringkasan?.totalPeminjaman || 0,
                  icon: BookCopy,
                  colorClass: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50',
                },
                {
                  label: 'Selesai Kembali',
                  value: data.ringkasan?.totalDikembalikan || 0,
                  icon: CheckCircle2,
                  colorClass: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50',
                },
                {
                  label: 'Buku Terlambat',
                  value: data.ringkasan?.totalTerlambat || 0,
                  icon: AlertTriangle,
                  colorClass: 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50',
                },
                {
                  label: 'Total Denda Terkumpul',
                  value: `Rp ${(data.ringkasan?.totalDenda || 0).toLocaleString('id')}`,
                  icon: Wallet,
                  colorClass: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50',
                },
              ].map((c) => {
                const Icon = c.icon;
                return (
                  <div key={c.label} className="stat-card">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{c.label}</span>
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${c.colorClass}`}>
                        <Icon size={16} />
                      </div>
                    </div>
                    <div className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100 leading-tight">{c.value}</div>
                  </div>
                );
              })}
            </div>

            {/* Circulation Detail Table */}
            <div className="library-card overflow-hidden">
              <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
                <h2 className="font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base">
                  Daftar Transaksi Peminjaman: {MONTHS[bulan - 1]} {tahun}
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="library-table min-w-[650px]">
                  <thead>
                    <tr>
                  <th>No</th>
                  <th>Nama Siswa / Peminjam</th>
                  <th>Judul Buku</th>
                  <th>Tanggal Pinjam</th>
                  <th>Tanggal Kembali</th>
                  <th>Status</th>
                  <th>Denda</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(!data.peminjaman || data.peminjaman.length === 0) ? (
                      <tr>
                        <td colSpan={7}>
                          <div className="text-center py-10 text-slate-400 dark:text-slate-500 font-medium text-xs sm:text-sm">
                            Tidak ada data peminjaman untuk periode {MONTHS[bulan - 1]} {tahun}
                          </div>
                        </td>
                      </tr>
                    ) : (
                      data.peminjaman.map((p, i) => (
                        <tr key={p.id}>
                          <td className="text-slate-500 dark:text-slate-400 font-medium">{i + 1}</td>
                          <td>
                            <div className="font-bold text-slate-900 dark:text-slate-100">{p.anggota.nama}</div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">NIS: {p.anggota.nis} · Kelas {p.anggota.kelas}</div>
                          </td>
                          <td className="font-bold text-slate-900 dark:text-slate-100">{p.buku.judul}</td>
                          <td className="text-slate-600 dark:text-slate-300 font-medium">{fmt(p.tglPinjam)}</td>
                          <td className="text-slate-600 dark:text-slate-300 font-medium">{fmt(p.tglKembaliAktual || p.tglKembaliRencana)}</td>
                          <td>
                            {p.status === 'DIPINJAM' && <span className="badge badge-yellow">Dipinjam</span>}
                            {p.status === 'DIKEMBALIKAN' && <span className="badge badge-green">Dikembalikan</span>}
                            {p.status === 'TERLAMBAT' && <span className="badge badge-red">Terlambat</span>}
                            {p.status === 'MENUNGGU_KONFIRMASI' && <span className="badge badge-gray">Menunggu</span>}
                          </td>
                          <td className="text-slate-600 dark:text-slate-300 font-medium">
                            {p.denda > 0 ? (
                              <span className="text-rose-600 dark:text-rose-400 font-bold">Rp {p.denda.toLocaleString('id')}</span>
                            ) : (
                              '-'
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Popular & Most Active Analysis */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="library-card p-5 space-y-3">
                <h2 className="font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base border-b border-slate-100 dark:border-slate-800 pb-2">
                  Koleksi Paling Banyak Dibaca
                </h2>
                {(!data.bukuTerpopuler || data.bukuTerpopuler.length === 0) ? (
                  <p className="text-xs text-slate-400 dark:text-slate-500 py-3 font-medium">Belum ada data</p>
                ) : (
                  data.bukuTerpopuler.map((b, i) => (
                    <div key={b.id} className="flex items-center gap-3 py-2 border-b border-slate-100 dark:border-slate-800 last:border-0">
                      <span className="text-xs font-bold text-slate-400 dark:text-slate-500 w-5">{i + 1}</span>
                      <span className="flex-1 text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 truncate">{b.judul}</span>
                      <span className="badge badge-blue">{b._count.peminjaman}× dipinjam</span>
                    </div>
                  ))
                )}
              </div>

              <div className="library-card p-5 space-y-3">
                <h2 className="font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base border-b border-slate-100 dark:border-slate-800 pb-2">
                  Siswa Teraktif Meminjam
                </h2>
                {(!data.anggotaTerAktif || data.anggotaTerAktif.length === 0) ? (
                  <p className="text-xs text-slate-400 dark:text-slate-500 py-3 font-medium">Belum ada data</p>
                ) : (
                  data.anggotaTerAktif.map((a, i) => (
                    <div key={a.id} className="flex items-center gap-3 py-2 border-b border-slate-100 dark:border-slate-800 last:border-0">
                      <span className="text-xs font-bold text-slate-400 dark:text-slate-500 w-5">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 truncate">{a.nama}</div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Kelas {a.kelas}</div>
                      </div>
                      <span className="badge badge-blue">{a._count.peminjaman}× meminjam</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
