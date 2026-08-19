'use client';

import { useState, useEffect, useCallback } from 'react';
import TopBar from '@/components/layout/TopBar';
import { Plus, Pencil, Trash2, Users, X, Search, ChevronLeft, ChevronRight } from 'lucide-react';

export default function AnggotaPage() {
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ nama: '', nis: '', kelas: '', email: '', password: '', alamat: '', noHp: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const limit = 10;

  const fetch_ = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/anggota?search=${search}&page=${page}&limit=${limit}`);
    const json = await res.json();
    setData(json.data || []);
    setTotal(json.total || 0);
    setLoading(false);
  }, [search, page]);

  useEffect(() => { fetch_(); }, [fetch_]);

  const openAdd = () => { setForm({ nama: '', nis: '', kelas: '', email: '', password: '', alamat: '', noHp: '' }); setError(''); setModal('add'); };
  const openEdit = (d) => { setSelected(d); setForm({ nama: d.nama, nis: d.nis, kelas: d.kelas, email: d.user.email, password: '', alamat: d.alamat || '', noHp: d.noHp || '' }); setError(''); setModal('edit'); };
  const openDelete = (d) => { setSelected(d); setModal('delete'); };

  const handleSave = async () => {
    if (!form.nama || !form.nis || !form.kelas) { setError('Nama, NIS, dan kelas wajib diisi'); return; }
    if (modal === 'add' && (!form.email || !form.password)) { setError('Email dan password wajib untuk anggota baru'); return; }
    setSaving(true); setError('');
    const url = modal === 'add' ? '/api/anggota' : `/api/anggota/${selected.id}`;
    const res = await fetch(url, { method: modal === 'add' ? 'POST' : 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    const json = await res.json();
    if (!res.ok) { setError(json.error); setSaving(false); return; }
    setModal(null); fetch_(); setSaving(false);
  };

  const handleDelete = async () => {
    setSaving(true);
    const res = await fetch(`/api/anggota/${selected.id}`, { method: 'DELETE' });
    const json = await res.json();
    if (!res.ok) { alert(json.error); setSaving(false); return; }
    setModal(null); fetch_(); setSaving(false);
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <>
      <TopBar title="Data Anggota" subtitle="Kelola data anggota perpustakaan" />
      <div className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6">
          <div className="relative flex-1 max-w-none sm:max-w-sm">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input id="search-anggota" type="text" className="glass-input pl-9 w-full" placeholder="Cari nama, NIS, kelas..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
          </div>
          <button id="add-anggota" onClick={openAdd} className="btn-primary justify-center sm:flex-initial"><Plus size={16}/> Tambah Anggota</button>
        </div>

        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="glass-table min-w-[550px]">
              <thead><tr><th>No</th><th>Nama</th><th>NIS</th><th>Kelas</th><th>Email</th><th>Peminjaman</th><th>Aksi</th></tr></thead>
              <tbody>
                {loading ? Array.from({length:5}).map((_,i)=><tr key={i}>{[1,2,3,4,5,6,7].map(j=><td key={j}><div className="h-4 shimmer rounded"/></td>)}</tr>)
                : data.length === 0 ? <tr><td colSpan={7}><div className="text-center py-12 text-slate-400"><Users size={36} className="mx-auto mb-2 opacity-40"/><p className="font-medium">Belum ada anggota</p></div></td></tr>
                : data.map((d,i) => (
                  <tr key={d.id}>
                    <td className="text-slate-500 font-medium">{(page-1)*limit+i+1}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shadow-sm" style={{background:'rgba(37,99,235,0.12)',color:'#1d4ed8'}}>{d.nama[0]}</div>
                        <span className="font-bold text-slate-900">{d.nama}</span>
                      </div>
                    </td>
                    <td className="text-slate-600 font-medium">{d.nis}</td>
                    <td><span className="badge badge-blue">{d.kelas}</span></td>
                    <td className="text-slate-600 font-medium">{d.user?.email}</td>
                    <td><span className="badge badge-gray">{d._count?.peminjaman || 0}×</span></td>
                    <td><div className="flex gap-2">
                      <button id={`edit-anggota-${d.id}`} onClick={()=>openEdit(d)} className="btn-glass btn-sm"><Pencil size={13}/></button>
                      <button id={`delete-anggota-${d.id}`} onClick={()=>openDelete(d)} className="btn-danger btn-sm"><Trash2 size={13}/></button>
                    </div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200">
              <span className="text-xs text-slate-500 font-medium">{total} anggota · hal {page}/{totalPages}</span>
              <div className="flex gap-2">
                <button disabled={page===1} onClick={()=>setPage(p=>p-1)} className="btn-glass btn-sm" style={{opacity:page===1?0.4:1}}><ChevronLeft size={14}/></button>
                <button disabled={page===totalPages} onClick={()=>setPage(p=>p+1)} className="btn-glass btn-sm" style={{opacity:page===totalPages?0.4:1}}><ChevronRight size={14}/></button>
              </div>
            </div>
          )}
        </div>
      </div>

      {(modal === 'add' || modal === 'edit') && (
        <div className="glass-modal-overlay">
          <div className="glass-modal p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-slate-900">{modal==='add'?'Tambah':'Edit'} Anggota</h2>
              <button onClick={()=>setModal(null)} className="btn-glass" style={{padding:'6px'}}><X size={16}/></button>
            </div>
            {error && <div className="mb-4 p-3 rounded-xl text-sm font-medium" style={{background:'#fef2f2',border:'1px solid #fecaca',color:'#991b1b'}}>{error}</div>}
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><label className="form-label">Nama Lengkap *</label><input id="form-nama-anggota" className="glass-input" value={form.nama} onChange={e=>setForm({...form,nama:e.target.value})} placeholder="Nama lengkap"/></div>
                <div><label className="form-label">NIS *</label><input id="form-nis" className="glass-input" value={form.nis} onChange={e=>setForm({...form,nis:e.target.value})} placeholder="Nomor Induk Siswa"/></div>
              </div>
              <div><label className="form-label">Kelas *</label><input id="form-kelas" className="glass-input" value={form.kelas} onChange={e=>setForm({...form,kelas:e.target.value})} placeholder="10A"/></div>
              <div><label className="form-label">Email {modal==='add'?'*':''}</label><input id="form-email-anggota" className="glass-input" type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="email@metland.sch.id" disabled={modal==='edit'}/></div>
              {modal === 'add' && <div><label className="form-label">Password *</label><input id="form-password-anggota" className="glass-input" type="password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} placeholder="Min 6 karakter"/></div>}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><label className="form-label">No HP</label><input className="glass-input" value={form.noHp} onChange={e=>setForm({...form,noHp:e.target.value})} placeholder="08xx"/></div>
                <div><label className="form-label">Alamat</label><input className="glass-input" value={form.alamat} onChange={e=>setForm({...form,alamat:e.target.value})} placeholder="Alamat"/></div>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={()=>setModal(null)} className="btn-glass flex-1 justify-center">Batal</button>
              <button id="save-anggota" onClick={handleSave} disabled={saving} className="btn-primary flex-1 justify-center">{saving?'Menyimpan...':'Simpan'}</button>
            </div>
          </div>
        </div>
      )}

      {modal === 'delete' && (
        <div className="glass-modal-overlay">
          <div className="glass-modal p-6" style={{maxWidth:'380px'}}>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center bg-rose-100 border border-rose-200"><Trash2 size={22} className="text-rose-600"/></div>
              <h2 className="text-lg font-bold text-slate-900 mb-2">Hapus Anggota?</h2>
              <p className="text-sm text-slate-500 mb-6 font-medium">Anggota <strong className="text-slate-900">"{selected?.nama}"</strong> akan dihapus beserta akun loginnya.</p>
              <div className="flex gap-3">
                <button onClick={()=>setModal(null)} className="btn-glass flex-1 justify-center">Batal</button>
                <button id="confirm-delete-anggota" onClick={handleDelete} disabled={saving} className="btn-danger flex-1 justify-center">{saving?'Menghapus...':'Hapus'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
