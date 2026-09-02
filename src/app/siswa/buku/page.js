'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Search, BookMarked, ChevronLeft, ChevronRight } from 'lucide-react';
import Tilt3DCard from '@/components/ui/Tilt3DCard';


export default function SiswaBukuPage() {
  const [buku, setBuku] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [kategori, setKategori] = useState([]);
  const [kategoriFilter, setKategoriFilter] = useState('');
  const limit = 12;

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 280);
    return () => clearTimeout(timer);
  }, [search]);

  const fetch_ = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ search: debouncedSearch, page, limit, ...(kategoriFilter ? { kategoriId: kategoriFilter } : {}) });
    const res = await fetch(`/api/buku?${params}`);
    const json = await res.json();
    setBuku(json.data || []);
    setTotal(json.total || 0);
    setLoading(false);
  }, [debouncedSearch, page, kategoriFilter]);

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
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
          {buku.map(b => (
            <Tilt3DCard
              key={b.id}
              maxTilt={12}
              scale={1.03}
              glare={true}
              borderRadius="16px"
              className="h-full"
            >
              <Link
                href={`/siswa/buku/${b.id}`}
                id={`buku-card-${b.id}`}
                className="glass-card p-3.5 sm:p-4 flex flex-col h-full group border-l-4 border-l-blue-600 hover:border-l-blue-700 transition-all block"
              >
                {/* Cover */}
                <div
                  className="w-full rounded-xl mb-3 flex items-center justify-center overflow-hidden border border-slate-200/80 shadow-sm bg-slate-100 relative"
                  style={{ height: '150px' }}
                >
                  {b.cover ? (
                    <img
                      src={b.cover}
                      alt={b.judul}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div
                      className="w-full h-full flex items-center justify-center"
                      style={{ background: 'linear-gradient(135deg, rgba(37,99,235,0.08), rgba(37,99,235,0.02))' }}
                    >
                      <BookMarked size={38} color="#2563eb" className="opacity-60" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug mb-1 group-hover:text-blue-600 transition-colors line-clamp-2">
                    {b.judul}
                  </h3>
                  {b.penulis && (
                    <p className="text-[11px] sm:text-xs font-semibold text-slate-500 mb-1.5 truncate">
                      {b.penulis.nama}
                    </p>
                  )}
                  {b.kategori && <span className="badge badge-blue text-[10px] sm:text-xs">{b.kategori.nama}</span>}
                </div>

                <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-100">
                  <span className={`badge text-[10px] sm:text-xs ${b.stok > 0 ? 'badge-green' : 'badge-red'}`}>
                    {b.stok > 0 ? `${b.stok} stok` : 'Habis'}
                  </span>
                  <span className="text-[11px] font-bold text-blue-600 group-hover:translate-x-0.5 transition-transform">
                    Detail →
                  </span>
                </div>
              </Link>
            </Tilt3DCard>
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
