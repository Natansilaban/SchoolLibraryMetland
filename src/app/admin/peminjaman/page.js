'use client';

import { useState, useEffect, useCallback } from 'react';
import TopBar from '@/components/layout/TopBar';
import { Plus, Search, BookCopy, X, ChevronLeft, ChevronRight, Check, Ban } from 'lucide-react';
import { toast } from '@/components/ui/Toast';
import { confirmModal } from '@/components/ui/ConfirmModal';

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
  const [debouncedSearch, setDebouncedSearch] = useState('');
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

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 280);
    return () => clearTimeout(timer);
  }, [search]);

  const fetch_ = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ search: debouncedSearch, page: page.toString(), limit: limit.toString(), ...(statusFilter ? { status: statusFilter } : {}) });
      const res = await fetch(`/api/peminjaman?${params}`);
      const json = await res.json();
      setData(json.data || []);
      setTotal(json.total || 0);
    } catch {
      setData([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, page, statusFilter]);

  const fetchRefs = useCallback(async () => {
    try {
      const [a, b] = await Promise.all([
        fetch('/api/anggota?limit=100').then(r => r.json()),
        fetch('/api/buku?limit=100').then(r => r.json()),
      ]);
      setAnggotaList(a.data || []);
      setBukuList(b.data || []);
    } catch {
      setAnggotaList([]);
      setBukuList([]);
    }
  }, []);

  useEffect(() => { fetch_(); }, [fetch_]);

  const defaultTglKembali = () => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  };

  const openAdd = () => {
    if (anggotaList.length === 0 && bukuList.length === 0) {
      fetchRefs();
    }
    setForm({ anggotaId: '', bukuId: '', tglKembaliRencana: defaultTglKembali(), catatan: '', status: 'DIPINJAM' });
    setError('');
    setModal(true);
  };

  const handleSave = async () => {
    if (!form.anggotaId || !form.bukuId || !form.tglKembaliRencana) { setError('Semua field wajib diisi'); return; }
    setSaving(true); setError('');
    try {
      const res = await fetch('/api/peminjaman', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const json = await res.json();
      if (!res.ok) { setError(json.error); setSaving(false); return; }
      toast.success('Peminjaman berhasil dicatat');
      setModal(false); fetch_();
    } catch {
      setError('Terjadi kendala koneksi dengan server');
      toast.error('Terjadi kendala koneksi dengan server');
    } finally {
      setSaving(false);
    }
  };

  const handleAction = async (id, action) => {
    const isApprove = action === 'APPROVE';
    const confirmed = await confirmModal({
      title: isApprove ? 'Setujui Peminjaman' : 'Tolak Peminjaman',
      message: isApprove
        ? 'Setujui pengajuan peminjaman ini? Stok buku akan otomatis berkurang 1.'
        : 'Tolak pengajuan peminjaman ini?',
      confirmText: isApprove ? 'Ya, Setujui' : 'Ya, Tolak',
      cancelText: 'Batal',
      type: isApprove ? 'primary' : 'danger',
    });

    if (!confirmed) return;

    setActionLoading(id);
    try {
      const res = await fetch(`/api/peminjaman/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error || 'Gagal memproses aksi');
      } else {
        toast.success(action === 'APPROVE' ? 'Peminjaman berhasil disetujui' : 'Peminjaman berhasil ditolak');
        fetch_();
      }
    } catch (err) {
      toast.error(err.message || 'Terjadi kesalahan');
    } finally {
      setActionLoading(null);
    }
  };

  const totalPages = Math.ceil(total / limit);

  const fmt = (d) => d ? new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';

  return (
    <>
      <TopBar title="Kelola Peminjaman Buku" subtitle="Catat peminjaman langsung, konfirmasi pengajuan siswa, dan pantau jatuh tempo" />
      <div className="p-4 sm:p-6 space-y-5">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                id="search-peminjaman"
                type="text"
                className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-blue-600 rounded-lg outline-none transition-colors"
                placeholder="Cari nama anggota, NIS, atau judul buku..."
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
            <select
              id="filter-status"
              className="px-3 py-2 text-xs sm:text-sm bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-blue-600 rounded-lg outline-none transition-colors text-slate-700 sm:w-auto"
              value={statusFilter}
              onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
            >
              <option value="">Semua Status Peminjaman</option>
              <option value="MENUNGGU_KONFIRMASI">Menunggu Konfirmasi</option>
              <option value="DIPINJAM">Sedang Dipinjam</option>
              <option value="DIKEMBALIKAN">Telah Dikembalikan</option>
              <option value="TERLAMBAT">Terlambat</option>
              <option value="DITOLAK">Ditolak</option>
            </select>
          </div>
          <button
            id="add-peminjaman"
            onClick={openAdd}
            className="btn-primary justify-center sm:flex-initial text-xs sm:text-sm min-h-[40px]"
          >
            <Plus size={16} /> Catat Peminjaman
          </button>
        </div>

        <div className="library-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="library-table min-w-[700px]">
              <thead>
                <tr>
                  <th>No</th>
                  <th>Nama Siswa / Peminjam</th>
                  <th>Buku Dipinjam</th>
                  <th>Tgl Pinjam</th>
                  <th>Batas Kembali</th>
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
                        <BookCopy size={36} className="mx-auto mb-2 opacity-40" />
                        <p className="font-semibold text-slate-700">Belum ada data peminjaman</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  data.map((d, i) => {
                    const isPending = d.status === 'MENUNGGU_KONFIRMASI';
                    return (
                      <tr key={d.id}>
                        <td className="text-slate-500 font-medium">{(page - 1) * limit + i + 1}</td>
                        <td>
                          <div className="font-bold text-slate-900">{d.anggota.nama}</div>
                          <div className="text-xs text-slate-500 font-medium">NIS: {d.anggota.nis} · Kelas {d.anggota.kelas}</div>
                        </td>
                        <td>
                          <div className="font-bold text-slate-900">{d.buku.judul}</div>
                          {d.buku.isbn && <div className="text-xs text-slate-500 font-medium">ISBN: {d.buku.isbn}</div>}
                        </td>
                        <td className="text-slate-600 font-medium">{fmt(d.tglPinjam)}</td>
                        <td className="text-slate-600 font-medium">{fmt(d.tglKembaliRencana)}</td>
                        <td>{STATUS_BADGE[d.status] || d.status}</td>
                        <td>
                          {isPending ? (
                            <div className="flex items-center gap-1.5">
                              <button
                                id={`approve-${d.id}`}
                                onClick={() => handleAction(d.id, 'APPROVE')}
                                disabled={actionLoading === d.id}
                                className="btn-success min-h-[32px] py-1 px-2.5 text-xs font-semibold flex items-center gap-1"
                                title="Setujui Peminjaman"
                              >
                                <Check size={12} /> Setujui
                              </button>
                              <button
                                id={`reject-${d.id}`}
                                onClick={() => handleAction(d.id, 'REJECT')}
                                disabled={actionLoading === d.id}
                                className="btn-danger min-h-[32px] py-1 px-2.5 text-xs font-semibold flex items-center gap-1"
                                title="Tolak Peminjaman"
                              >
                                <Ban size={12} /> Tolak
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400 font-medium">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200">
              <span className="text-xs text-slate-500 font-medium">
                {total} transaksi · Halaman {page} dari {totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  disabled={page === 1}
                  onClick={() => setPage(p => p - 1)}
                  className="btn-secondary min-h-[36px] min-w-[36px] p-1.5 disabled:opacity-40"
                >
                  <ChevronLeft size={14} />
                </button>
                <button
                  disabled={page === totalPages}
                  onClick={() => setPage(p => p + 1)}
                  className="btn-secondary min-h-[36px] min-w-[36px] p-1.5 disabled:opacity-40"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {modal && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setModal(false)}
          className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4 animate-fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-xl border border-slate-200 p-6 max-w-lg w-full shadow-xl space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">Catat Peminjaman Buku</h2>
              <button onClick={() => setModal(false)} className="p-1 rounded text-slate-400 hover:text-slate-600">
                <X size={16} />
              </button>
            </div>

            {error && (
              <div className="p-3 rounded-lg text-xs font-medium bg-rose-50 border border-rose-200 text-rose-800">
                {error}
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="form-label text-xs">Peminjam (Siswa) *</label>
                <select
                  id="form-anggota-peminjaman"
                  className="library-input text-xs"
                  value={form.anggotaId}
                  onChange={e => setForm({ ...form, anggotaId: e.target.value })}
                >
                  <option value="">Pilih anggota...</option>
                  {anggotaList.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.nama} : NIS {a.nis} ({a.kelas})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="form-label text-xs">Buku Yang Dipinjam *</label>
                <select
                  id="form-buku-peminjaman"
                  className="library-input text-xs"
                  value={form.bukuId}
                  onChange={e => setForm({ ...form, bukuId: e.target.value })}
                >
                  <option value="">Pilih buku dari katalog...</option>
                  {bukuList.map(b => (
                    <option key={b.id} value={b.id} disabled={b.stok === 0}>
                      {b.judul} {b.stok === 0 ? '(Stok Habis)' : `(Tersedia: ${b.stok})`}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="form-label text-xs">Batas Waktu Pengembalian *</label>
                <input
                  id="form-tgl-kembali"
                  className="library-input text-xs"
                  type="date"
                  value={form.tglKembaliRencana}
                  onChange={e => setForm({ ...form, tglKembaliRencana: e.target.value })}
                />
              </div>

              <div>
                <label className="form-label text-xs">Catatan Tambahan</label>
                <textarea
                  className="library-input text-xs resize-none"
                  rows={2}
                  value={form.catatan}
                  onChange={e => setForm({ ...form, catatan: e.target.value })}
                  placeholder="Catatan kondisi buku sebelum dipinjam..."
                />
              </div>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setModal(false)}
                className="btn-secondary flex-1 justify-center text-xs min-h-[38px]"
              >
                Batal
              </button>
              <button
                id="save-peminjaman"
                onClick={handleSave}
                disabled={saving}
                className="btn-primary flex-1 justify-center text-xs font-semibold min-h-[38px]"
              >
                {saving ? 'Menyimpan...' : 'Simpan Data Peminjaman'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
