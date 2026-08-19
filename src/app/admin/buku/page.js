'use client';

import { useState, useEffect, useCallback } from 'react';
import TopBar from '@/components/layout/TopBar';
import {
  Plus, Search, Pencil, Trash2, BookMarked, X,
  ChevronLeft, ChevronRight, RefreshCw
} from 'lucide-react';

export default function BukuPage() {
  const [buku, setBuku] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | 'add' | 'edit' | 'delete'
  const [selected, setSelected] = useState(null);
  const [kategori, setKategori] = useState([]);
  const [penulis, setPenulis] = useState([]);
  const [penerbit, setPenerbit] = useState([]);
  const [form, setForm] = useState({
    judul: '', isbn: '', kategoriId: '', penulisId: '',
    penerbitId: '', tahunTerbit: '', stok: '1', deskripsi: '', cover: ''
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const limit = 10;

  const fetchBuku = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/buku?search=${search}&page=${page}&limit=${limit}`);
    const data = await res.json();
    setBuku(data.data || []);
    setTotal(data.total || 0);
    setLoading(false);
  }, [search, page]);

  const fetchReferensi = useCallback(async () => {
    const [k, p, pb] = await Promise.all([
      fetch('/api/kategori').then(r => r.json()),
      fetch('/api/penulis').then(r => r.json()),
      fetch('/api/penerbit').then(r => r.json()),
    ]);
    setKategori(k);
    setPenulis(p);
    setPenerbit(pb);
  }, []);

  useEffect(() => { fetchBuku(); }, [fetchBuku]);
  useEffect(() => { fetchReferensi(); }, [fetchReferensi]);

  const openAdd = () => {
    setForm({ judul: '', isbn: '', kategoriId: '', penulisId: '', penerbitId: '', tahunTerbit: '', stok: '1', deskripsi: '', cover: '' });
    setError('');
    setModal('add');
  };

  const openEdit = (b) => {
    setSelected(b);
    setForm({
      judul: b.judul || '',
      isbn: b.isbn || '',
      kategoriId: b.kategoriId?.toString() || '',
      penulisId: b.penulisId?.toString() || '',
      penerbitId: b.penerbitId?.toString() || '',
      tahunTerbit: b.tahunTerbit?.toString() || '',
      stok: b.stok?.toString() || '1',
      deskripsi: b.deskripsi || '',
      cover: b.cover || '',
    });
    setError('');
    setModal('edit');
  };

  const openDelete = (b) => { setSelected(b); setModal('delete'); };

  const handleSave = async () => {
    if (!form.judul.trim()) { setError('Judul wajib diisi'); return; }
    setSaving(true);
    setError('');
    try {
      const url = modal === 'add' ? '/api/buku' : `/api/buku/${selected.id}`;
      const method = modal === 'add' ? 'POST' : 'PUT';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Terjadi kesalahan'); setSaving(false); return; }
      setModal(null);
      fetchBuku();
    } catch { setError('Terjadi kesalahan'); }
    setSaving(false);
  };

  const handleDelete = async () => {
    setSaving(true);
    const res = await fetch(`/api/buku/${selected.id}`, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok) { alert(data.error); setSaving(false); return; }
    setModal(null);
    fetchBuku();
    setSaving(false);
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <>
      <TopBar title="Data Buku" subtitle="Kelola koleksi buku perpustakaan" />

      <div className="p-4 sm:p-6">
        {/* Header actions */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6">
          <div className="relative flex-1 max-w-none sm:max-w-sm">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id="search-buku"
              type="text"
              className="glass-input pl-9"
              placeholder="Cari judul, ISBN, penulis..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <div className="flex items-center gap-2">
            <button id="refresh-buku" onClick={fetchBuku} className="btn-glass flex-shrink-0" style={{ padding: '10px' }}>
              <RefreshCw size={15} />
            </button>
            <button id="add-buku" onClick={openAdd} className="btn-primary flex-1 sm:flex-initial justify-center">
              <Plus size={16} /> Tambah Buku
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="glass-table">
              <thead>
                <tr>
                  <th>No</th>
                  <th>Judul</th>
                  <th>ISBN</th>
                  <th>Kategori</th>
                  <th>Penulis</th>
                  <th>Tahun</th>
                  <th>Stok</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 8 }).map((_, j) => (
                        <td key={j}><div className="h-4 rounded shimmer" /></td>
                      ))}
                    </tr>
                  ))
                ) : buku.length === 0 ? (
                  <tr>
                    <td colSpan={8}>
                      <div className="text-center py-12 text-slate-400">
                        <BookMarked size={40} className="mx-auto mb-3 opacity-40" />
                        <p className="font-medium">Belum ada data buku</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  buku.map((b, i) => (
                    <tr key={b.id}>
                      <td className="text-slate-500 font-medium">{(page - 1) * limit + i + 1}</td>
                      <td>
                        <div className="font-bold text-slate-900">{b.judul}</div>
                        {b.penerbit && <div className="text-xs text-slate-500 font-medium">{b.penerbit.nama}</div>}
                      </td>
                      <td className="text-slate-600 font-medium">{b.isbn || '—'}</td>
                      <td>{b.kategori ? <span className="badge badge-blue">{b.kategori.nama}</span> : '—'}</td>
                      <td className="text-slate-600 font-medium">{b.penulis?.nama || '—'}</td>
                      <td className="text-slate-600 font-medium">{b.tahunTerbit || '—'}</td>
                      <td>
                        <span className={`badge ${b.stok > 0 ? 'badge-green' : 'badge-red'}`}>{b.stok}</span>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <button id={`edit-buku-${b.id}`} onClick={() => openEdit(b)} className="btn-glass btn-sm">
                            <Pencil size={13} />
                          </button>
                          <button id={`delete-buku-${b.id}`} onClick={() => openDelete(b)} className="btn-danger btn-sm">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200">
              <span className="text-xs text-slate-500 font-medium">
                {total} buku · hal {page}/{totalPages}
              </span>
              <div className="flex items-center gap-2">
                <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="btn-glass btn-sm" style={{ opacity: page === 1 ? 0.4 : 1 }}>
                  <ChevronLeft size={14} />
                </button>
                <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="btn-glass btn-sm" style={{ opacity: page === totalPages ? 0.4 : 1 }}>
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {(modal === 'add' || modal === 'edit') && (
        <div className="glass-modal-overlay">
          <div className="glass-modal p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-slate-900">
                {modal === 'add' ? 'Tambah Buku' : 'Edit Buku'}
              </h2>
              <button onClick={() => setModal(null)} className="btn-glass" style={{ padding: '6px' }}>
                <X size={16} />
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-xl text-sm font-medium" style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b' }}>
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="form-label">Judul Buku *</label>
                <input id="form-judul" className="glass-input" value={form.judul} onChange={e => setForm({ ...form, judul: e.target.value })} placeholder="Masukkan judul buku" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">ISBN</label>
                  <input id="form-isbn" className="glass-input" value={form.isbn} onChange={e => setForm({ ...form, isbn: e.target.value })} placeholder="978-xxx-xxx-xxx" />
                </div>
                <div>
                  <label className="form-label">Tahun Terbit</label>
                  <input id="form-tahun" className="glass-input" type="number" value={form.tahunTerbit} onChange={e => setForm({ ...form, tahunTerbit: e.target.value })} placeholder="2024" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Kategori</label>
                  <select id="form-kategori" className="glass-input" value={form.kategoriId} onChange={e => setForm({ ...form, kategoriId: e.target.value })}>
                    <option value="">Pilih kategori</option>
                    {kategori.map(k => <option key={k.id} value={k.id}>{k.nama}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">Stok</label>
                  <input id="form-stok" className="glass-input" type="number" min="0" value={form.stok} onChange={e => setForm({ ...form, stok: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Penulis</label>
                  <select id="form-penulis" className="glass-input" value={form.penulisId} onChange={e => setForm({ ...form, penulisId: e.target.value })}>
                    <option value="">Pilih penulis</option>
                    {penulis.map(p => <option key={p.id} value={p.id}>{p.nama}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">Penerbit</label>
                  <select id="form-penerbit" className="glass-input" value={form.penerbitId} onChange={e => setForm({ ...form, penerbitId: e.target.value })}>
                    <option value="">Pilih penerbit</option>
                    {penerbit.map(p => <option key={p.id} value={p.id}>{p.nama}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="form-label">Deskripsi</label>
                <textarea id="form-deskripsi" className="glass-input" rows={3} value={form.deskripsi} onChange={e => setForm({ ...form, deskripsi: e.target.value })} placeholder="Deskripsi singkat buku..." style={{ resize: 'vertical' }} />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setModal(null)} className="btn-glass flex-1 justify-center">Batal</button>
              <button id="save-buku" onClick={handleSave} disabled={saving} className="btn-primary flex-1 justify-center">
                {saving ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {modal === 'delete' && (
        <div className="glass-modal-overlay">
          <div className="glass-modal p-6" style={{ maxWidth: '400px' }}>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center bg-rose-100 border border-rose-200">
                <Trash2 size={22} className="text-rose-600" />
              </div>
              <h2 className="text-lg font-bold text-slate-900 mb-2">Hapus Buku?</h2>
              <p className="text-sm text-slate-500 mb-1 font-medium">Buku berikut akan dihapus permanen:</p>
              <p className="text-sm font-bold text-slate-900 mb-6">"{selected?.judul}"</p>
              <div className="flex gap-3">
                <button onClick={() => setModal(null)} className="btn-glass flex-1 justify-center">Batal</button>
                <button id="confirm-delete-buku" onClick={handleDelete} disabled={saving} className="btn-danger flex-1 justify-center">
                  {saving ? 'Menghapus...' : 'Hapus'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
