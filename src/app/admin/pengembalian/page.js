'use client';

import { useState, useEffect, useCallback } from 'react';
import TopBar from '@/components/layout/TopBar';
import { Search, RotateCcw, X, CheckCircle2, AlertTriangle, Sparkles, Coins } from 'lucide-react';

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
        setSaving(false);
        return;
      }
      setModal(null);
      fetch_();
    } catch {
      setError('Terjadi kesalahan saat memproses pengembalian');
    } finally {
      setSaving(false);
    }
  };

  const fmt = (d) => d ? new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
  
  const isOverdue = (d) => {
    if (!d) return false;
    const planned = new Date(d);
    const now = new Date();
    planned.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);
    return now > planned;
  };

  const isEarlyReturn = () => {
    if (!selected || !form.tglKembali) return false;
    const planned = new Date(selected.tglKembaliRencana);
    const actual = new Date(form.tglKembali);
    planned.setHours(0, 0, 0, 0);
    actual.setHours(0, 0, 0, 0);
    return actual < planned;
  };

  return (
    <>
      <TopBar title="Kelola Pengembalian" subtitle="Verifikasi penerimaan fisik buku dan denda dari anggota" />
      <div className="p-4 sm:p-6">
        <div className="mb-6 max-w-none sm:max-w-sm">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id="search-pengembalian"
              type="text"
              className="glass-input pl-9 w-full"
              placeholder="Cari nama anggota, NIS, judul buku..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="glass-table min-w-[650px]">
              <thead>
                <tr>
                  <th>No</th>
                  <th>Anggota</th>
                  <th>Buku</th>
                  <th>Tgl Pinjam</th>
                  <th>Tgl Harus Kembali</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      {[1, 2, 3, 4, 5, 6, 7].map(j => (
                        <td key={j}><div className="h-4 shimmer rounded" /></td>
                      ))}
                    </tr>
                  ))
                ) : data.length === 0 ? (
                  <tr>
                    <td colSpan={7}>
                      <div className="text-center py-12 text-slate-400">
                        <RotateCcw size={36} className="mx-auto mb-2 opacity-40" />
                        <p className="font-medium">Tidak ada buku aktif yang perlu dikembalikan</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  data.map((d, i) => {
                    const late = isOverdue(d.tglKembaliRencana);
                    return (
                      <tr key={d.id}>
                        <td className="text-slate-500 font-medium">{i + 1}</td>
                        <td>
                          <div className="font-bold text-slate-900">{d.anggota.nama}</div>
                          <div className="text-xs text-slate-500 font-medium">{d.anggota.nis} · {d.anggota.kelas}</div>
                        </td>
                        <td className="font-bold text-slate-900">{d.buku.judul}</td>
                        <td className="text-slate-600 font-medium">{fmt(d.tglPinjam)}</td>
                        <td>
                          <span className={late ? 'text-rose-600 font-bold' : 'text-slate-600 font-medium'}>
                            {fmt(d.tglKembaliRencana)}
                          </span>
                        </td>
                        <td>
                          {d.catatan && d.catatan.includes('[Pengajuan Pengembalian Siswa]') ? (
                            <span className="badge badge-green flex items-center gap-1">
                              <Sparkles size={11} /> Diajukan Siswa
                            </span>
                          ) : late ? (
                            <span className="badge badge-red flex items-center gap-1">
                              <AlertTriangle size={11} /> Terlambat
                            </span>
                          ) : (
                            <span className="badge badge-blue">Dipinjam</span>
                          )}
                        </td>
                        <td>
                          <button
                            id={`process-return-${d.id}`}
                            onClick={() => openProcess(d)}
                            className="btn-success btn-sm flex items-center gap-1 font-bold"
                          >
                            <RotateCcw size={13} /> Proses Kembali
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
        <div className="glass-modal-overlay">
          <div className="glass-modal p-6 max-w-lg w-full">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <RotateCcw size={20} className="text-emerald-600" />
                <h2 className="text-lg font-bold text-slate-900">Verifikasi Pengembalian Buku</h2>
              </div>
              <button onClick={() => setModal(null)} className="btn-glass" style={{ padding: '6px' }}>
                <X size={16} />
              </button>
            </div>

            {/* Info buku */}
            <div className="p-4 rounded-xl mb-4 bg-slate-50 border border-slate-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-slate-500 block text-xs mb-0.5 font-semibold">Peminjam</span>
                  <span className="text-slate-900 font-bold">{selected.anggota.nama} ({selected.anggota.kelas})</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-xs mb-0.5 font-semibold">NIS</span>
                  <span className="text-slate-900 font-bold">{selected.anggota.nis}</span>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-slate-500 block text-xs mb-0.5 font-semibold">Judul Buku</span>
                  <span className="text-slate-900 font-bold">{selected.buku.judul}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-xs mb-0.5 font-semibold">Tgl Pinjam</span>
                  <span className="text-slate-700 font-medium">{fmt(selected.tglPinjam)}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-xs mb-0.5 font-semibold">Jadwal Jatuh Tempo</span>
                  <span className={isOverdue(selected.tglKembaliRencana) ? 'text-rose-600 font-bold' : 'text-slate-700 font-medium'}>
                    {fmt(selected.tglKembaliRencana)}
                  </span>
                </div>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-xl text-sm font-medium bg-rose-50 border border-rose-200 text-rose-800">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="form-label">Tanggal Kembali Aktual (Diterima Fisik) *</label>
                <input
                  id="form-tgl-kembali-aktual"
                  className="glass-input w-full"
                  type="date"
                  value={form.tglKembali}
                  onChange={e => handleDateChange(e.target.value)}
                  required
                />
              </div>

              {isEarlyReturn() && (
                <div className="p-3 rounded-xl flex items-center gap-2.5 bg-blue-50 border border-blue-200 text-blue-900 text-xs font-semibold">
                  <Sparkles size={16} className="text-blue-600 flex-shrink-0" />
                  <span>Pengembalian lebih awal dari jadwal yang ditentukan — tidak ada denda keterlambatan.</span>
                </div>
              )}

              <div>
                <label className="form-label flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Coins size={14} className="text-slate-500" />
                    Nominal Denda (Rp)
                  </span>
                  <span className="text-[11px] text-slate-400 font-normal">Dihitung otomatis: Rp 500/hari terlambat</span>
                </label>
                <input
                  id="form-denda"
                  className="glass-input w-full font-bold text-slate-900"
                  type="number"
                  min="0"
                  value={form.denda}
                  onChange={e => setForm({ ...form, denda: e.target.value })}
                />
              </div>

              {parseInt(form.denda) > 0 && (
                <div className="p-3 rounded-xl flex items-center gap-3 bg-rose-50 border border-rose-200">
                  <AlertTriangle size={18} className="text-rose-600 flex-shrink-0" />
                  <div>
                    <div className="text-xs font-bold text-rose-900">Total Denda Yang Harus Diterima:</div>
                    <div className="text-lg font-extrabold text-rose-600">Rp {parseInt(form.denda).toLocaleString('id')}</div>
                  </div>
                </div>
              )}

              {parseInt(form.denda) === 0 && !isEarlyReturn() && (
                <div className="p-2.5 rounded-xl flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
                  <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0" />
                  <span>Tepat waktu — bebas denda.</span>
                </div>
              )}

              <div>
                <label className="form-label">Catatan Kondisi / Pengembalian</label>
                <textarea
                  className="glass-input w-full"
                  rows={2}
                  value={form.catatan}
                  onChange={e => setForm({ ...form, catatan: e.target.value })}
                  placeholder="Kondisi buku baik, denda lunas dibayar, dll..."
                  style={{ resize: 'vertical' }}
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button type="button" onClick={() => setModal(null)} className="btn-glass flex-1 justify-center">
                Batal
              </button>
              <button
                id="confirm-pengembalian"
                onClick={handleProcess}
                disabled={saving}
                className="btn-success flex-1 justify-center font-bold"
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
