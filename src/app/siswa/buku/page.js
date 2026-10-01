'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Search, BookMarked, ChevronLeft, ChevronRight, Library } from 'lucide-react';

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
    const params = new URLSearchParams({
      search: debouncedSearch,
      page: page.toString(),
      limit: limit.toString(),
      ...(kategoriFilter ? { kategoriId: kategoriFilter } : {}),
    });
    try {
      const res = await fetch(`/api/buku?${params}`);
      const json = await res.json();
      setBuku(json.data || []);
      setTotal(json.total || 0);
    } catch {
      setBuku([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, page, kategoriFilter]);

  useEffect(() => {
    fetch_();
  }, [fetch_]);

  useEffect(() => {
    fetch('/api/kategori')
      .then((r) => r.json())
      .then((data) => setKategori(Array.isArray(data) ? data : []))
      .catch(() => setKategori([]));
  }, []);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      {/* Catalog Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          Katalog Koleksi Buku
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Temukan buku teks pelajaran, referensi ilmiah, karya sastra, dan bacaan umum
        </p>
      </div>

      {/* Search & Category Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            id="search-buku-siswa"
            type="text"
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-blue-600 rounded-lg outline-none transition-colors"
            placeholder="Cari judul buku, nama pengarang, atau ISBN..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <select
          id="filter-kategori-siswa"
          className="sm:w-56 px-3 py-2 text-xs sm:text-sm bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-blue-600 rounded-lg outline-none transition-colors text-slate-700"
          value={kategoriFilter}
          onChange={(e) => {
            setKategoriFilter(e.target.value);
            setPage(1);
          }}
        >
          <option value="">Semua Kategori Koleksi</option>
          {kategori.map((k) => (
            <option key={k.id} value={k.id}>
              {k.nama}
            </option>
          ))}
        </select>
      </div>

      {/* Book Grid State */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="library-card p-3.5 flex flex-col h-72 shimmer rounded-xl" />
          ))}
        </div>
      ) : buku.length === 0 ? (
        <div className="library-card text-center py-16 px-4">
          <BookMarked size={40} className="mx-auto mb-3 text-slate-300" />
          <h2 className="text-base font-bold text-slate-800">Tidak ada buku ditemukan</h2>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {search
              ? `Tidak ada koleksi buku yang cocok dengan "${search}". Coba periksa ejaan atau gunakan kata kunci lain.`
              : 'Belum ada koleksi buku dalam kategori yang dipilih.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
          {buku.map((b) => (
            <Link
              key={b.id}
              href={`/siswa/buku/${b.id}`}
              id={`buku-card-${b.id}`}
              className="library-card p-3.5 sm:p-4 flex flex-col h-full group hover:border-slate-300 transition-all block focus-visible:outline-2 focus-visible:outline-blue-600"
            >
              {/* Authentic Book Spine & Cover Container */}
              <div className="w-full rounded-lg mb-3 flex items-center justify-center overflow-hidden border border-slate-200/90 bg-slate-100 relative h-48 sm:h-52 book-cover-wrap flex-shrink-0">
                {b.cover ? (
                  <img
                    src={b.cover}
                    alt={b.judul}
                    className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 p-4 text-center">
                    <Library size={36} className="text-slate-400 mb-2" />
                    <span className="text-[11px] font-bold text-slate-500 line-clamp-2 px-1">
                      {b.judul}
                    </span>
                  </div>
                )}
              </div>

              {/* Bibliographic Info */}
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  {b.kategori && (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded mb-1.5 inline-block">
                      {b.kategori.nama}
                    </span>
                  )}
                  <h2 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug group-hover:text-blue-700 transition-colors line-clamp-2">
                    {b.judul}
                  </h2>
                  {b.penulis && (
                    <p className="text-[11px] text-slate-500 font-medium mt-1 truncate">
                      {b.penulis.nama}
                    </p>
                  )}
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                  <span className={`badge text-[11px] ${b.stok > 0 ? 'badge-green' : 'badge-red'}`}>
                    {b.stok > 0 ? `${b.stok} Tersedia` : 'Habis'}
                  </span>
                  <span className="text-xs font-semibold text-blue-600 group-hover:text-blue-800 transition-colors">
                    Lihat Detail
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination Controls (44px Minimum Touch Targets) */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="btn-secondary min-h-[44px] min-w-[44px] p-2 disabled:opacity-40 disabled:pointer-events-none"
            aria-label="Halaman Sebelumnya"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg min-h-[44px] flex items-center">
            Halaman {page} dari {totalPages}
          </span>
          <button
            disabled={page === totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="btn-secondary min-h-[44px] min-w-[44px] p-2 disabled:opacity-40 disabled:pointer-events-none"
            aria-label="Halaman Selanjutnya"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
