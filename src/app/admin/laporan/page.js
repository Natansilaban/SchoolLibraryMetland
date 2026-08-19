'use client';

import { useState, useEffect, useCallback } from 'react';
import TopBar from '@/components/layout/TopBar';
import { Printer, CheckCircle2, BookCopy, AlertTriangle, Wallet } from 'lucide-react';

const MONTHS = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];

export default function LaporanPage() {
  const now = new Date();
  const [bulan, setBulan] = useState(now.getMonth() + 1);
  const [tahun, setTahun] = useState(now.getFullYear());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetch_ = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/laporan?bulan=${bulan}&tahun=${tahun}`);
    setData(await res.json());
    setLoading(false);
  }, [bulan, tahun]);

  useEffect(() => { fetch_(); }, [fetch_]);

  const fmt = (d) => d ? new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

  const handlePrint = () => window.print();

  return (
    <>
      <TopBar title="Laporan" subtitle="Laporan peminjaman per periode" />
      <div className="p-4 sm:p-6">
        {/* Filter */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-6 no-print">
          <div className="flex items-center gap-3 flex-1">
            <select id="filter-bulan" className="glass-input flex-1 sm:flex-initial sm:w-40" value={bulan} onChange={e => setBulan(parseInt(e.target.value))}>
              {MONTHS.map((m, i) => <option key={i} value={i+1}>{m}</option>)}
            </select>
            <select id="filter-tahun" className="glass-input flex-1 sm:flex-initial sm:w-28" value={tahun} onChange={e => setTahun(parseInt(e.target.value))}>
              {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <button id="print-laporan" onClick={handlePrint} className="btn-primary justify-center sm:flex-initial">
            <Printer size={16}/> Cetak Laporan
          </button>
        </div>

        {/* Print Header */}
        <div className="hidden print:block mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Perpustakaan Metland School</h1>
          <h2 className="text-xl text-slate-700">Laporan Peminjaman — {MONTHS[bulan-1]} {tahun}</h2>
          <p className="text-slate-500">Dicetak: {new Date().toLocaleDateString('id-ID', { dateStyle: 'full' })}</p>
          <hr className="my-4 border-slate-300"/>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[1,2,3,4].map(i => <div key={i} className="h-28 shimmer rounded-2xl"/>)}
          </div>
        ) : data && (
          <>
            {/* Ringkasan Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {[
                { label: 'Total Peminjaman', value: data.ringkasan.totalPeminjaman, icon: BookCopy, color: '#2563eb', bg: 'rgba(37,99,235,0.08)', border: 'rgba(37,99,235,0.2)', spineColor: '#2563eb' },
                { label: 'Dikembalikan', value: data.ringkasan.totalDikembalikan, icon: CheckCircle2, color: '#059669', bg: 'rgba(5,150,105,0.08)', border: 'rgba(5,150,105,0.2)', spineColor: '#059669' },
                { label: 'Terlambat', value: data.ringkasan.totalTerlambat, icon: AlertTriangle, color: '#dc2626', bg: 'rgba(220,38,38,0.08)', border: 'rgba(220,38,38,0.2)', spineColor: '#dc2626' },
                { label: 'Total Denda', value: `Rp ${(data.ringkasan.totalDenda||0).toLocaleString('id')}`, icon: Wallet, color: '#d97706', bg: 'rgba(217,119,6,0.08)', border: 'rgba(217,119,6,0.2)', spineColor: '#d97706' },
              ].map(c => {
                const Icon = c.icon;
                return (
                  <div key={c.label} className="stat-card relative pl-7" style={{ borderLeft: `4px solid ${c.spineColor}` }}>
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{background:c.bg,border:`1px solid ${c.border}`}}>
                      <Icon size={18} color={c.color}/>
                    </div>
                    <div className="text-xl font-extrabold text-slate-900">{c.value}</div>
                    <div className="text-xs font-semibold text-slate-500 mt-0.5">{c.label}</div>
                  </div>
                );
              })}
            </div>

            {/* Tabel Peminjaman */}
            <div className="glass-card overflow-hidden mb-6">
              <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/50">
                <h3 className="font-bold text-slate-900 text-sm sm:text-base">Detail Peminjaman — {MONTHS[bulan-1]} {tahun}</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="glass-table min-w-[600px]">
                  <thead><tr><th>No</th><th>Anggota</th><th>Buku</th><th>Tgl Pinjam</th><th>Tgl Kembali</th><th>Status</th><th>Denda</th></tr></thead>
                  <tbody>
                    {data.peminjaman.length === 0 ? (
                      <tr><td colSpan={7}><div className="text-center py-8 text-slate-400 font-medium">Tidak ada data untuk periode ini</div></td></tr>
                    ) : data.peminjaman.map((p,i) => (
                      <tr key={p.id}>
                        <td className="text-slate-500 font-medium">{i+1}</td>
                        <td>
                          <div className="font-bold text-slate-900">{p.anggota.nama}</div>
                          <div className="text-xs text-slate-500 font-medium">{p.anggota.nis} · {p.anggota.kelas}</div>
                        </td>
                        <td className="font-bold text-slate-900">{p.buku.judul}</td>
                        <td className="text-slate-600 font-medium">{fmt(p.tglPinjam)}</td>
                        <td className="text-slate-600 font-medium">{fmt(p.tglKembaliAktual || p.tglKembaliRencana)}</td>
                        <td>
                          {p.status === 'DIPINJAM' && <span className="badge badge-yellow">Dipinjam</span>}
                          {p.status === 'DIKEMBALIKAN' && <span className="badge badge-green">Dikembalikan</span>}
                          {p.status === 'TERLAMBAT' && <span className="badge badge-red">Terlambat</span>}
                        </td>
                        <td className="text-slate-600 font-medium">{p.denda > 0 ? <span className="text-rose-600 font-bold">Rp {p.denda.toLocaleString('id')}</span> : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Buku Terpopuler & Anggota Teraktif */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="glass-card p-5">
                <h3 className="font-bold text-slate-900 text-sm sm:text-base mb-4">Buku Terpopuler</h3>
                {data.bukuTerpopuler.length === 0 ? (
                  <p className="text-xs text-slate-400 font-medium">Belum ada data</p>
                ) : data.bukuTerpopuler.map((b,i) => (
                  <div key={b.id} className="flex items-center gap-3 py-2 border-b border-slate-100 last:border-0">
                    <span className="text-xs font-bold text-slate-400 w-5">{i+1}</span>
                    <span className="flex-1 text-sm font-bold text-slate-900 truncate">{b.judul}</span>
                    <span className="badge badge-blue">{b._count.peminjaman}×</span>
                  </div>
                ))}
              </div>
              <div className="glass-card p-5">
                <h3 className="font-bold text-slate-900 text-sm sm:text-base mb-4">Anggota Teraktif</h3>
                {data.anggotaTerAktif.length === 0 ? (
                  <p className="text-xs text-slate-400 font-medium">Belum ada data</p>
                ) : data.anggotaTerAktif.map((a,i) => (
                  <div key={a.id} className="flex items-center gap-3 py-2 border-b border-slate-100 last:border-0">
                    <span className="text-xs font-bold text-slate-400 w-5">{i+1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-slate-900 truncate">{a.nama}</div>
                      <div className="text-xs text-slate-500 font-medium">{a.kelas}</div>
                    </div>
                    <span className="badge badge-purple">{a._count.peminjaman}×</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
