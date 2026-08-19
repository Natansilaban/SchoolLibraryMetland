'use client';

import { useState, useEffect, useCallback } from 'react';
import TopBar from '@/components/layout/TopBar';
import { Search, RotateCcw, X, CheckCircle2, AlertTriangle } from 'lucide-react';

export default function PengembalianPage() {
  const [data, setData] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ tglKembali: '', catatan: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const today = new Date().toISOString().split('T')[0];

  const fetch_ = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/pengembalian?search=${search}`);
    const json = await res.json();
    setData(json);
    setLoading(false);
  }, [search]);

  useEffect(() => { fetch_(); }, [fetch_]);

  const openProcess = (d) => {
    setSelected(d);
    setForm({ tglKembali: today, catatan: '' });
    setError('');
    setModal(true);
  };

  const calcDenda = () => {
    if (!selected || !form.tglKembali) return 0;
    const tglRencana = new Date(selected.tglKembaliRencana);
    const tglAktual = new Date(form.tglKembali);
    if (tglAktual <= tglRencana) return 0;
    const hari = Math.ceil((tglAktual - tglRencana) / (1000 * 60 * 60 * 24));
    return hari * 500;
  };

  const handleProcess = async () => {
    setSaving(true); setError('');
    const res = await fetch('/api/pengembalian', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ peminjamanId: selected.id, ...form }),
    });
    const json = await res.json();
    if (!res.ok) { setError(json.error); setSaving(false); return; }
    setModal(null); fetch_(); setSaving(false);
  };

  const fmt = (d) => d ? new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
  const isLate = (d) => d && new Date(d) < new Date();

  return (
    <>
      <TopBar title="Kelola Pengembalian" subtitle="Proses pengembalian buku dari anggota" />
      <div className="p-4 sm:p-6">
        <div className="mb-6 max-w-none sm:max-w-sm">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input id="search-pengembalian" type="text" className="glass-input pl-9 w-full" placeholder="Cari nama anggota atau buku..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="glass-table min-w-[600px]">
              <thead><tr><th>No</th><th>Anggota</th><th>Buku</th><th>Tgl Pinjam</th><th>Tgl Harus Kembali</th><th>Status</th><th>Aksi</th></tr></thead>
              <tbody>
                {loading ? Array.from({length:5}).map((_,i)=><tr key={i}>{[1,2,3,4,5,6,7].map(j=><td key={j}><div className="h-4 shimmer rounded"/></td>)}</tr>)
                : data.length === 0 ? (
                  <tr><td colSpan={7}>
                    <div className="text-center py-12 text-slate-400">
                      <RotateCcw size={36} className="mx-auto mb-2 opacity-40"/>
                      <p className="font-medium">Tidak ada buku yang perlu dikembalikan</p>
                    </div>
                  </td></tr>
                ) : data.map((d,i) => (
                  <tr key={d.id}>
                    <td className="text-slate-500 font-medium">{i+1}</td>
                    <td>
                      <div className="font-bold text-slate-900">{d.anggota.nama}</div>
                      <div className="text-xs text-slate-500 font-medium">{d.anggota.nis} · {d.anggota.kelas}</div>
                    </td>
                    <td className="font-bold text-slate-900">{d.buku.judul}</td>
                    <td className="text-slate-600 font-medium">{fmt(d.tglPinjam)}</td>
                    <td>
                      <span className={isLate(d.tglKembaliRencana) ? 'text-rose-600 font-bold' : 'text-slate-600 font-medium'}>
                        {fmt(d.tglKembaliRencana)}
                      </span>
                    </td>
                    <td>
                      {isLate(d.tglKembaliRencana)
                        ? <span className="badge badge-red flex items-center gap-1"><AlertTriangle size={11}/>Terlambat</span>
                        : <span className="badge badge-yellow">Dipinjam</span>
                      }
                    </td>
                    <td>
                      <button id={`process-return-${d.id}`} onClick={() => openProcess(d)} className="btn-success btn-sm">
                        <RotateCcw size={13}/> Proses
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {modal && selected && (
        <div className="glass-modal-overlay">
          <div className="glass-modal p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-slate-900">Proses Pengembalian</h2>
              <button onClick={()=>setModal(null)} className="btn-glass" style={{padding:'6px'}}><X size={16}/></button>
            </div>

            {/* Info buku */}
            <div className="p-4 rounded-xl mb-5 bg-slate-50 border border-slate-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div><span className="text-slate-500 block text-xs mb-1 font-semibold">Anggota</span><span className="text-slate-900 font-bold">{selected.anggota.nama}</span></div>
                <div><span className="text-slate-500 block text-xs mb-1 font-semibold">Kelas</span><span className="text-slate-900 font-bold">{selected.anggota.kelas}</span></div>
                <div className="sm:col-span-2"><span className="text-slate-500 block text-xs mb-1 font-semibold">Buku</span><span className="text-slate-900 font-bold">{selected.buku.judul}</span></div>
                <div><span className="text-slate-500 block text-xs mb-1 font-semibold">Tgl Pinjam</span><span className="text-slate-700 font-medium">{fmt(selected.tglPinjam)}</span></div>
                <div><span className="text-slate-500 block text-xs mb-1 font-semibold">Batas Kembali</span><span className={isLate(selected.tglKembaliRencana)?'text-rose-600 font-bold':'text-slate-700 font-medium'}>{fmt(selected.tglKembaliRencana)}</span></div>
              </div>
            </div>

            {error && <div className="mb-4 p-3 rounded-xl text-sm font-medium" style={{background:'#fef2f2',border:'1px solid #fecaca',color:'#991b1b'}}>{error}</div>}

            <div className="space-y-4">
              <div>
                <label className="form-label">Tanggal Kembali Aktual</label>
                <input id="form-tgl-kembali-aktual" className="glass-input" type="date" value={form.tglKembali} max={today} onChange={e=>setForm({...form,tglKembali:e.target.value})}/>
              </div>

              {calcDenda() > 0 && (
                <div className="p-3 rounded-xl flex items-center gap-3 bg-rose-50 border border-rose-200">
                  <AlertTriangle size={18} className="text-rose-600"/>
                  <div>
                    <div className="text-sm font-bold text-rose-900">Terlambat · Denda</div>
                    <div className="text-lg font-extrabold text-rose-600">Rp {calcDenda().toLocaleString('id')}</div>
                  </div>
                </div>
              )}

              {calcDenda() === 0 && form.tglKembali && (
                <div className="p-3 rounded-xl flex items-center gap-3 bg-emerald-50 border border-emerald-200">
                  <CheckCircle2 size={18} className="text-emerald-600"/>
                  <span className="text-sm font-bold text-emerald-800">Tepat waktu — tidak ada denda</span>
                </div>
              )}

              <div>
                <label className="form-label">Catatan</label>
                <textarea className="glass-input" rows={2} value={form.catatan} onChange={e=>setForm({...form,catatan:e.target.value})} placeholder="Kondisi buku, dll..." style={{resize:'vertical'}}/>
              </div>
            </div>

            <div className="flex gap-3 mt-5">
              <button onClick={()=>setModal(null)} className="btn-glass flex-1 justify-center">Batal</button>
              <button id="confirm-pengembalian" onClick={handleProcess} disabled={saving} className="btn-success flex-1 justify-center">{saving?'Memproses...':'Konfirmasi Kembali'}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
