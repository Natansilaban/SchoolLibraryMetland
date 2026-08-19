'use client';

import { useState, useEffect, useCallback } from 'react';
import TopBar from '@/components/layout/TopBar';
import { Plus, Pencil, Trash2, Tag, X, Search } from 'lucide-react';

export default function KategoriPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ nama: '', deskripsi: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetch_ = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/kategori');
    const json = await res.json();
    setData(json);
    setLoading(false);
  }, []);

  useEffect(() => { fetch_(); }, [fetch_]);

  const filteredData = data.filter(d =>
    d.nama.toLowerCase().includes(search.toLowerCase()) ||
    (d.deskripsi && d.deskripsi.toLowerCase().includes(search.toLowerCase()))
  );

  const openAdd = () => { setForm({ nama: '', deskripsi: '' }); setError(''); setModal('add'); };
  const openEdit = (d) => { setSelected(d); setForm({ nama: d.nama, deskripsi: d.deskripsi || '' }); setError(''); setModal('edit'); };
  const openDelete = (d) => { setSelected(d); setModal('delete'); };

  const handleSave = async () => {
    if (!form.nama.trim()) { setError('Nama wajib diisi'); return; }
    setSaving(true); setError('');
    const url = modal === 'add' ? '/api/kategori' : `/api/kategori/${selected.id}`;
    const method = modal === 'add' ? 'POST' : 'PUT';
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    const json = await res.json();
    if (!res.ok) { setError(json.error); setSaving(false); return; }
    setModal(null); fetch_();
    setSaving(false);
  };

  const handleDelete = async () => {
    setSaving(true);
    const res = await fetch(`/api/kategori/${selected.id}`, { method: 'DELETE' });
    if (!res.ok) { alert('Gagal menghapus'); setSaving(false); return; }
    setModal(null); fetch_(); setSaving(false);
  };

  return (
    <>
      <TopBar title="Kategori Buku" subtitle="Kelola kategori koleksi buku" />
      <div className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6">
          <div className="relative flex-1 max-w-none sm:max-w-xs">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              className="glass-input pl-9 w-full"
              placeholder="Cari kategori..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <button id="add-kategori" onClick={openAdd} className="btn-primary justify-center sm:flex-initial">
            <Plus size={16} /> Tambah Kategori
          </button>
        </div>

        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="glass-table min-w-[500px]">
              <thead><tr><th>No</th><th>Nama Kategori</th><th>Deskripsi</th><th>Aksi</th></tr></thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i}>{[1,2,3,4].map(j => <td key={j}><div className="h-4 shimmer rounded" /></td>)}</tr>
                  ))
                ) : filteredData.length === 0 ? (
                  <tr><td colSpan={4}><div className="text-center py-12 text-slate-400"><Tag size={36} className="mx-auto mb-2 opacity-40" /><p className="font-medium">Belum ada kategori</p></div></td></tr>
                ) : filteredData.map((d, i) => (
                  <tr key={d.id}>
                    <td className="text-slate-500 font-medium">{i + 1}</td>
                    <td className="font-bold text-slate-900">{d.nama}</td>
                    <td className="text-slate-600 font-medium">{d.deskripsi || '—'}</td>
                    <td>
                      <div className="flex gap-2">
                        <button id={`edit-kategori-${d.id}`} onClick={() => openEdit(d)} className="btn-glass btn-sm"><Pencil size={13} /></button>
                        <button id={`delete-kategori-${d.id}`} onClick={() => openDelete(d)} className="btn-danger btn-sm"><Trash2 size={13} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {(modal === 'add' || modal === 'edit') && (
        <div className="glass-modal-overlay">
          <div className="glass-modal p-6" style={{ maxWidth: '440px' }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-slate-900">{modal === 'add' ? 'Tambah' : 'Edit'} Kategori</h2>
              <button onClick={() => setModal(null)} className="btn-glass" style={{ padding: '6px' }}><X size={16} /></button>
            </div>
            {error && <div className="mb-4 p-3 rounded-xl text-sm font-medium" style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b' }}>{error}</div>}
            <div className="space-y-4">
              <div><label className="form-label">Nama *</label><input id="form-nama-kategori" className="glass-input" value={form.nama} onChange={e => setForm({ ...form, nama: e.target.value })} placeholder="Nama kategori" /></div>
              <div><label className="form-label">Deskripsi</label><textarea className="glass-input" rows={3} value={form.deskripsi} onChange={e => setForm({ ...form, deskripsi: e.target.value })} placeholder="Deskripsi kategori..." style={{ resize: 'vertical' }} /></div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setModal(null)} className="btn-glass flex-1 justify-center">Batal</button>
              <button id="save-kategori" onClick={handleSave} disabled={saving} className="btn-primary flex-1 justify-center">{saving ? 'Menyimpan...' : 'Simpan'}</button>
            </div>
          </div>
        </div>
      )}

      {modal === 'delete' && (
        <div className="glass-modal-overlay">
          <div className="glass-modal p-6" style={{ maxWidth: '380px' }}>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center bg-rose-100 border border-rose-200"><Trash2 size={22} className="text-rose-600" /></div>
              <h2 className="text-lg font-bold text-slate-900 mb-2">Hapus Kategori?</h2>
              <p className="text-sm text-slate-500 mb-6 font-medium">Kategori <strong className="text-slate-900">"{selected?.nama}"</strong> akan dihapus.</p>
              <div className="flex gap-3">
                <button onClick={() => setModal(null)} className="btn-glass flex-1 justify-center">Batal</button>
                <button id="confirm-delete-kategori" onClick={handleDelete} disabled={saving} className="btn-danger flex-1 justify-center">{saving ? 'Menghapus...' : 'Hapus'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
