'use client';

import { useState, useEffect, useCallback } from 'react';
import TopBar from '@/components/layout/TopBar';
import { Plus, Search, BookCopy, X, ChevronLeft, ChevronRight, Check, Ban } from 'lucide-react';

const STATUS_BADGE = {
  MENUNGGU_KONFIRMASI: <span className="badge badge-yellow">Menunggu Konfirmasi</span>,
  DIPINJAM: <span className="badge badge-blue">Dipinjam</span>,
  DIKEMBALIKAN: <span className="badge badge-green">Dikembalikan</span>,
  TERLAMBAT: <span className="badge badge-red">Terlambat</span>,
  DITOLAK: <span className="badge badge-red">Ditolak</span>,
};

export default function PeminjamanPage() {
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [anggotaList, setAnggotaList] = useState([]);
  const [bukuList, setBukuList] = useState([]);
  const [form, setForm] = useState({ anggotaId: '', bukuId: '', tglKembaliRencana: '', catatan: '', status: 'DIPINJAM' });
  const [saving, setSaving] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState('');
  const limit = 10;

  const fetch_ = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ search, page, limit, ...(statusFilter ? { status: statusFilter } : {}) });
    const res = await fetch(`/api/peminjaman?${params}`);
    const json = await res.json();
    setData(json.data || []);
    setTotal(json.total || 0);
    setLoading(false);
  }, [search, page, statusFilter]);

  const fetchRefs = useCallback(async () => {
    try {
      const [a, b] = await Promise.all([
        fetch('/api/anggota?limit=1000').then(r => r.json()),
        fetch('/api/buku?limit=1000').then(r => r.json()),
      ]);
      setAnggotaList(a.data || []);
      setBukuList(b.data || []);
    } catch {
      setAnggotaList([]);
      setBukuList([]);
    }
  }, []);

  useEffect(() => { fetch_(); }, [fetch_]);
  useEffect(() => { fetchRefs(); }, [fetchRefs]);

  const defaultTglKembali = () => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  };

  const openAdd = () => {
    setForm({ anggotaId: '', bukuId: '', tglKembaliRencana: defaultTglKembali(), catatan: '', status: 'DIPINJAM' });
    setError('');
    setModal(true);
  };

  const handleSave = async () => {
    if (!form.anggotaId || !form.bukuId || !form.tglKembaliRencana) { setError('Semua field wajib diisi'); return; }
    setSaving(true); setError('');
    const res = await fetch('/api/peminjaman', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    const json = await res.json();
    if (!res.ok) { setError(json.error); setSaving(false); return; }
    setModal(false); fetch_(); setSaving(false);
  };

  const handleAction = async (id, action) => {
    const confirmText = action === 'APPROVE' 
      ? 'Setujui pengajuan peminjaman ini?' 
      : 'Tolak pengajuan peminjaman ini?';
    
    if (!window.confirm(confirmText)) return;

    setActionLoading(id);
    try {
      const res = await fetch(`/api/peminjaman/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const json = await res.json();
      if (!res.ok) {
        alert(json.error || 'Gagal memproses aksi');
      } else {
        fetch_();
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const totalPages = Math.ceil(total / limit);

  const fmt = (d) => d ? new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

  return (
    <>
      <TopBar title="Kelola Peminjaman" subtitle="Catat, setujui pengajuan, dan pantau peminjaman buku" />
      <div className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input id="search-peminjaman" type="text" className="glass-input pl-9 w-full" placeholder="Cari anggota atau buku..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
            </div>
            <select id="filter-status" className="glass-input sm:w-auto" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
              <option value="">Semua Status</option>
              <option value="MENUNGGU_KONFIRMASI">Menunggu Konfirmasi</option>
              <option value="DIPINJAM">Dipinjam</option>
              <option value="DIKEMBALIKAN">Dikembalikan</option>
              <option value="TERLAMBAT">Terlambat</option>
              <option value="DITOLAK">Ditolak</option>
            </select>
          </div>
          <button id="add-peminjaman" onClick={openAdd} className="btn-primary justify-center sm:flex-initial"><Plus size={16}/> Pinjam Buku</button>
        </div>

        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="glass-table min-w-[700px]">
              <thead><tr><th>No</th><th>Anggota</th><th>Buku</th><th>Tgl Pinjam</th><th>Tgl Kembali</th><th>Status</th><th>Aksi</th></tr></thead>
              <tbody>
                {loading ? Array.from({length:5}).map((_,i)=><tr key={i}>{[1,2,3,4,5,6,7].map(j=><td key={j}><div className="h-4 shimmer rounded"/></td>)}</tr>)
                : data.length === 0 ? <tr><td colSpan={7}><div className="text-center py-12 text-slate-400"><BookCopy size={36} className="mx-auto mb-2 opacity-40"/><p className="font-medium">Tidak ada data peminjaman</p></div></td></tr>
                : data.map((d,i) => (
                  <tr key={d.id}>
                    <td className="text-slate-500 font-medium">{(page-1)*limit+i+1}</td>
                    <td>
                      <div className="font-bold text-slate-900">{d.anggota.nama}</div>
                      <div className="text-xs text-slate-500 font-medium">{d.anggota.nis} · {d.anggota.kelas}</div>
                    </td>
                    <td className="font-bold text-slate-900">{d.buku.judul}</td>
                    <td className="text-slate-600 font-medium">{d.status === 'MENUNGGU_KONFIRMASI' ? '—' : fmt(d.tglPinjam)}</td>
                    <td className="text-slate-600 font-medium">{fmt(d.tglKembaliRencana)}</td>
                    <td>{STATUS_BADGE[d.status] || d.status}</td>
                    <td>
                      {d.status === 'MENUNGGU_KONFIRMASI' ? (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleAction(d.id, 'APPROVE')}
                            disabled={actionLoading === d.id}
                            className="btn-emerald py-1 px-2.5 text-xs font-bold flex items-center gap-1"
                            title="Setujui Peminjaman"
                          >
                            <Check size={14} /> Setujui
                          </button>
                          <button
                            onClick={() => handleAction(d.id, 'REJECT')}
                            disabled={actionLoading === d.id}
                            className="btn-rose py-1 px-2.5 text-xs font-bold flex items-center gap-1"
                            title="Tolak Peminjaman"
                          >
                            <Ban size={14} /> Tolak
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 font-medium">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200">
              <span className="text-xs text-slate-500 font-medium">{total} transaksi · hal {page}/{totalPages}</span>
              <div className="flex gap-2">
                <button disabled={page===1} onClick={()=>setPage(p=>p-1)} className="btn-glass btn-sm" style={{opacity:page===1?0.4:1}}><ChevronLeft size={14}/></button>
                <button disabled={page===totalPages} onClick={()=>setPage(p=>p+1)} className="btn-glass btn-sm" style={{opacity:page===totalPages?0.4:1}}><ChevronRight size={14}/></button>
              </div>
            </div>
          )}
        </div>
      </div>

      {modal && (
        <div className="glass-modal-overlay">
          <div className="glass-modal p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-slate-900">Catat Peminjaman</h2>
              <button onClick={()=>setModal(false)} className="btn-glass" style={{padding:'6px'}}><X size={16}/></button>
            </div>
            {error && <div className="mb-4 p-3 rounded-xl text-sm font-medium" style={{background:'#fef2f2',border:'1px solid #fecaca',color:'#991b1b'}}>{error}</div>}
            <div className="space-y-4">
              <div>
                <label className="form-label">Anggota *</label>
                <select id="form-anggota-peminjaman" className="glass-input" value={form.anggotaId} onChange={e=>setForm({...form,anggotaId:e.target.value})}>
                  <option value="">Pilih anggota...</option>
                  {anggotaList.map(a=><option key={a.id} value={a.id}>{a.nama} — {a.nis} ({a.kelas})</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">Buku *</label>
                <select id="form-buku-peminjaman" className="glass-input" value={form.bukuId} onChange={e=>setForm({...form,bukuId:e.target.value})}>
                  <option value="">Pilih buku...</option>
                  {bukuList.map(b=><option key={b.id} value={b.id} disabled={b.stok===0}>{b.judul} {b.stok===0?'(Habis)':''}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">Tanggal Kembali Rencana *</label>
                <input id="form-tgl-kembali" className="glass-input" type="date" value={form.tglKembaliRencana} onChange={e=>setForm({...form,tglKembaliRencana:e.target.value})}/>
              </div>
              <div>
                <label className="form-label">Catatan</label>
                <textarea className="glass-input" rows={2} value={form.catatan} onChange={e=>setForm({...form,catatan:e.target.value})} placeholder="Catatan opsional..." style={{resize:'vertical'}}/>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={()=>setModal(false)} className="btn-glass flex-1 justify-center">Batal</button>
              <button id="save-peminjaman" onClick={handleSave} disabled={saving} className="btn-primary flex-1 justify-center">{saving?'Memproses...':'Simpan & Setujui'}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
