'use client';

import { useState, useEffect, useCallback } from 'react';
import TopBar from '@/components/layout/TopBar';
import { Search, RotateCcw, X, CheckCircle2, AlertTriangle, Coins } from 'lucide-react';
import { toast } from '@/components/ui/Toast';

export default function PengembalianPage() {
  const [data, setData] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ tglKembali: '', denda: '0', catatan: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const today = new Date().toISOString().split('T')[0];

  const fetch_ = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/pengembalian?search=${encodeURIComponent(search)}`);
      const json = await res.json();
      setData(Array.isArray(json) ? json : []);
    } catch {
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetch_();
  }, [fetch_]);

  const calcAutoDenda = (tglAktualStr, tglRencanaStr) => {
    if (!tglAktualStr || !tglRencanaStr) return 0;
    const tglRencana = new Date(tglRencanaStr);
    const tglAktual = new Date(tglAktualStr);
    tglRencana.setHours(0, 0, 0, 0);
    tglAktual.setHours(0, 0, 0, 0);

    if (tglAktual <= tglRencana) return 0;
    const hari = Math.ceil((tglAktual - tglRencana) / (1000 * 60 * 60 * 24));
    return hari * 500;
  };

  const openProcess = (d) => {
    setSelected(d);
    const autoDenda = calcAutoDenda(today, d.tglKembaliRencana);
    const studentNote = d.catatan?.replace(/\[Pengajuan Pengembalian Siswa\]/, '').trim() || '';
    setForm({
      tglKembali: today,
      denda: autoDenda.toString(),
      catatan: studentNote ? `Catatan Siswa: "${studentNote}". ` : '',
    });
    setError('');
    setModal(true);
  };

  const handleDateChange = (newDate) => {
    if (!selected) return;
    const autoDenda = calcAutoDenda(newDate, selected.tglKembaliRencana);
    setForm(prev => ({
      ...prev,
      tglKembali: newDate,
      denda: autoDenda.toString(),
    }));
  };

  const handleProcess = async () => {
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/pengembalian', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          peminjamanId: selected.id,
          tglKembali: form.tglKembali,
          denda: parseInt(form.denda) || 0,
          catatan: form.catatan,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || 'Gagal memproses pengembalian');
        toast.error(json.error || 'Gagal memproses pengembalian');
        setSaving(false);
        return;
      }
      toast.success('Buku berhasil diverifikasi dan stok fisik diperbarui');
      setModal(null);
      fetch_();
    } catch {
      setError('Terjadi kendala koneksi saat memproses pengembalian');
      toast.error('Terjadi kendala koneksi saat memproses pengembalian');
    } finally {
      setSaving(false);
    }
  };

  const fmt = (d) => d ? new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';
  
  const isOverdue = (d) => {
    if (!d) return false;
    const planned = new Date(d);
    const now = new Date();
    planned.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);
    return now > planned;
  };

  const isEarlyReturn = () => {
    if (!form.tglKembali || !selected) return false;
    const planned = new Date(selected.tglKembaliRencana);
    const actual = new Date(form.tglKembali);
    planned.setHours(0,0,0,0);
    actual.setHours(0,0,0,0);
    return actual < planned;
  };

  return (
    <>
      <TopBar title="Verifikasi Pengembalian Buku" subtitle="Pemeriksaan kondisi buku, hitung denda, dan pengembalian stok" />
      <div className="p-4 sm:p-6 space-y-5">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="relative flex-1 max-w-none sm:max-w-md">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-slate-50 hover:bg-white focus:bg-white dark:bg-slate-800 dark:hover:bg-slate-800/80 dark:focus:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:border-blue-600 dark:focus:border-blue-500 rounded-lg outline-none transition-colors"
              placeholder="Cari nama peminjam, judul buku, atau NIS..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="library-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="library-table min-w-[750px]">
              <thead>
                <tr>
                  <th>No</th>
                  <th>Peminjam</th>
                  <th>Buku Dipinjam</th>
                  <th>Tgl Pinjam</th>
                  <th>Jatuh Tempo</th>
                  <th>Status Buku</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i}>
                      {[1, 2, 3, 4, 5, 6, 7].map(j => (
                        <td key={j}><div className="h-4 shimmer rounded" /></td>
                      ))}
                    </tr>
                  ))
                ) : data.length === 0 ? (
                  <tr>
                    <td colSpan={7}>
                      <div className="text-center py-12 text-slate-400 dark:text-slate-500">
                        <CheckCircle2 size={36} className="mx-auto mb-2 text-emerald-600 opacity-60" />
                        <p className="font-bold text-slate-700 dark:text-slate-200">Semua Buku Telah Kembali</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Tidak ada peminjaman aktif yang menunggu pengembalian saat ini.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  data.map((d, i) => {
                    const overdue = isOverdue(d.tglKembaliRencana);
                    const isReturnRequested = d.catatan && d.catatan.includes('[Pengajuan Pengembalian Siswa]');

                    return (
                      <tr key={d.id} className={isReturnRequested ? 'bg-emerald-50/30 dark:bg-emerald-950/20' : ''}>
                        <td className="text-slate-500 dark:text-slate-400 font-medium">{i + 1}</td>
                        <td>
                          <div className="font-bold text-slate-900 dark:text-slate-100">{d.anggota.nama}</div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">NIS: {d.anggota.nis} · Kelas {d.anggota.kelas}</div>
                        </td>
                        <td>
                          <div className="font-bold text-slate-900 dark:text-slate-100">{d.buku.judul}</div>
                        </td>
                        <td className="text-slate-600 dark:text-slate-300 font-medium">{fmt(d.tglPinjam)}</td>
                        <td>
                          <span className={overdue ? 'text-rose-600 dark:text-rose-400 font-bold' : 'text-slate-700 dark:text-slate-300 font-medium'}>
                            {fmt(d.tglKembaliRencana)}
                          </span>
                        </td>
                        <td>
                          <div className="flex flex-col gap-1 items-start">
                            {isReturnRequested ? (
                              <span className="badge badge-green">
                                <CheckCircle2 size={11} /> Siswa Mengajukan
                              </span>
                            ) : overdue ? (
                              <span className="badge badge-red">
                                <AlertTriangle size={11} /> Terlambat
                              </span>
                            ) : (
                              <span className="badge badge-blue">Sedang Dipinjam</span>
                            )}
                          </div>
                        </td>
                        <td>
                          <button
                            id={`process-return-${d.id}`}
                            onClick={() => openProcess(d)}
                            className={`btn-sm font-semibold flex items-center gap-1.5 ${
                              isReturnRequested ? 'btn-success' : 'btn-primary'
                            }`}
                          >
                            <RotateCcw size={13} />
                            Verifikasi
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {modal && selected && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setModal(null)}
          className="fixed inset-0 bg-slate-900/50 dark:bg-black/70 z-50 flex items-center justify-center p-4 animate-fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 max-w-lg w-full shadow-xl space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <RotateCcw size={18} className="text-emerald-600 dark:text-emerald-400" />
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Verifikasi Pengembalian Buku</h2>
              </div>
              <button onClick={() => setModal(null)} className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                <X size={16} />
              </button>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block text-[11px] font-semibold">Peminjam</span>
                  <span className="text-slate-900 dark:text-slate-100 font-bold">{selected.anggota.nama} ({selected.anggota.kelas})</span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block text-[11px] font-semibold">NIS</span>
                  <span className="text-slate-900 dark:text-slate-100 font-bold">{selected.anggota.nis}</span>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-slate-500 dark:text-slate-400 block text-[11px] font-semibold">Judul Buku</span>
                  <span className="text-slate-900 dark:text-slate-100 font-bold">{selected.buku.judul}</span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block text-[11px] font-semibold">Tgl Pinjam</span>
                  <span className="text-slate-700 dark:text-slate-300 font-medium">{fmt(selected.tglPinjam)}</span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block text-[11px] font-semibold">Jadwal Jatuh Tempo</span>
                  <span className={isOverdue(selected.tglKembaliRencana) ? 'text-rose-600 dark:text-rose-400 font-bold' : 'text-slate-700 dark:text-slate-300 font-medium'}>
                    {fmt(selected.tglKembaliRencana)}
                  </span>
                </div>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-lg text-xs font-medium bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-800 dark:text-rose-300">
                {error}
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="form-label text-xs">Tanggal Buku Diterima Petugas *</label>
                <input
                  id="form-tgl-kembali-aktual"
                  className="library-input text-xs"
                  type="date"
                  value={form.tglKembali}
                  onChange={e => handleDateChange(e.target.value)}
                  required
                />
              </div>

              {isEarlyReturn() && (
                <div className="p-2.5 rounded-lg flex items-center gap-2 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 text-blue-900 dark:text-blue-300 text-xs font-medium">
                  <CheckCircle2 size={15} className="text-blue-600 dark:text-blue-400 shrink-0" />
                  <span>Pengembalian lebih awal dari jadwal: bebas denda keterlambatan.</span>
                </div>
              )}

              <div>
                <label className="form-label text-xs flex items-center justify-between">
                  <span className="flex items-center gap-1.5 font-bold">
                    <Coins size={14} className="text-slate-500 dark:text-slate-400" />
                    Nominal Denda Keterlambatan (Rp)
                  </span>
                  <span className="text-[11px] text-slate-400 dark:text-slate-500 font-normal">Tarif standar: Rp 500/hari</span>
                </label>
                <input
                  id="form-denda"
                  className="library-input text-xs font-bold text-slate-900 dark:text-slate-100"
                  type="number"
                  min="0"
                  value={form.denda}
                  onChange={e => setForm({ ...form, denda: e.target.value })}
                />
              </div>

              {parseInt(form.denda) > 0 && (
                <div className="p-3 rounded-lg flex items-center gap-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50">
                  <AlertTriangle size={18} className="text-rose-600 dark:text-rose-400 shrink-0" />
                  <div>
                    <div className="text-xs font-bold text-rose-900 dark:text-rose-200">Total Denda Yang Harus Diterima:</div>
                    <div className="text-base font-bold text-rose-600 dark:text-rose-400">Rp {parseInt(form.denda).toLocaleString('id')}</div>
                  </div>
                </div>
              )}

              <div>
                <label className="form-label text-xs">Catatan Kondisi Buku (Opsional)</label>
                <textarea
                  className="library-input text-xs resize-none"
                  rows={2}
                  value={form.catatan}
                  onChange={e => setForm({ ...form, catatan: e.target.value })}
                  placeholder="Kondisi buku baik, halaman utuh, denda lunas dibayar, dll..."
                />
              </div>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setModal(null)}
                className="btn-secondary flex-1 justify-center text-xs min-h-[38px]"
              >
                Batal
              </button>
              <button
                id="confirm-pengembalian"
                onClick={handleProcess}
                disabled={saving}
                className="btn-success flex-1 justify-center text-xs font-bold min-h-[38px]"
              >
                {saving ? 'Memproses...' : 'Konfirmasi Pengembalian'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
