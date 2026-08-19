'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Search, BookMarked, ChevronLeft, ChevronRight } from 'lucide-react';

export default function SiswaBukuPage() {
  const [buku, setBuku] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [kategori, setKategori] = useState([]);
  const [kategoriFilter, setKategoriFilter] = useState('');
  const limit = 12;

  const fetch_ = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ search, page, limit, ...(kategoriFilter ? { kategoriId: kategoriFilter } : {}) });
    const res = await fetch(`/api/buku?${params}`);
    const json = await res.json();
    setBuku(json.data || []);
    setTotal(json.total || 0);
    setLoading(false);
  }, [search, page, kategoriFilter]);

  useEffect(() => { fetch_(); }, [fetch_]);
  useEffect(() => {
    fetch('/api/kategori').then(r => r.json()).then(setKategori);
  }, []);

  const totalPages = Math.ceil(total / limit);

  return (
    <div>
      <div className="mb-4 sm:mb-6">
        <h1 className="section-title text-xl sm:text-3xl mb-0.5 text-slate-900">Katalog Buku</h1>
        <p className="section-subtitle text-xs sm:text-sm text-slate-500">Temukan koleksi buku perpustakaan sekolah</p>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 mb-5">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            id="search-buku-siswa"
            type="text"
            className="glass-input pl-9 w-full text-xs sm:text-sm"
            placeholder="Cari judul, penulis, ISBN..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <select id="filter-kategori-siswa" className="glass-input sm:w-auto text-xs sm:text-sm" value={kategoriFilter} onChange={e => { setKategoriFilter(e.target.value); setPage(1); }}>
          <option value="">Semua Kategori</option>
          {kategori.map(k => <option key={k.id} value={k.id}>{k.nama}</option>)}
        </select>
      </div>

      {/* Book Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-56 sm:h-64 shimmer rounded-2xl" />
          ))}
        </div>
      ) : buku.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <BookMarked size={40} className="mx-auto mb-2.5 opacity-40" />
          <p className="text-base font-bold text-slate-700">Tidak ada buku ditemukan</p>
          {search && <p className="text-xs mt-1 text-slate-500 font-medium">Coba kata kunci lain</p>}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {buku.map(b => (
            <Link
              key={b.id}
              href={`/siswa/buku/${b.id}`}
              id={`buku-card-${b.id}`}
              className="glass-card p-3 sm:p-4 flex flex-col group border-l-4 border-l-blue-600 hover:border-l-blue-700"
            >
              {/* Cover placeholder */}
              <div
                className="w-full rounded-xl mb-2.5 flex items-center justify-center shadow-inner"
                style={{
                  height: '110px',
                  background: 'linear-gradient(135deg, rgba(37,99,235,0.08), rgba(37,99,235,0.02))',
                  border: '1px solid #e2e8f0',
                }}
              >
                <BookMarked size={32} color="#2563eb" className="opacity-70" />
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug mb-1 group-hover:text-blue-600 transition-colors line-clamp-2">
                  {b.judul}
                </h3>
                {b.penulis && <p className="text-[11px] sm:text-xs font-semibold text-slate-500 mb-1.5 truncate">{b.penulis.nama}</p>}
                {b.kategori && <span className="badge badge-blue text-[10px] sm:text-xs">{b.kategori.nama}</span>}
              </div>

              <div className="mt-2.5 flex items-center justify-between">
                <span className={`badge text-[10px] sm:text-xs ${b.stok > 0 ? 'badge-green' : 'badge-red'}`}>
                  {b.stok > 0 ? `${b.stok} stok` : 'Habis'}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6 sm:mt-8">
          <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="btn-glass p-2" style={{ opacity: page === 1 ? 0.4 : 1 }}>
            <ChevronLeft size={16} />
          </button>
          <span className="btn-glass px-3 py-2 text-xs sm:text-sm text-slate-700 font-bold" style={{ cursor: 'default' }}>
            {page} / {totalPages}
          </span>
          <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="btn-glass p-2" style={{ opacity: page === totalPages ? 0.4 : 1 }}>
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
