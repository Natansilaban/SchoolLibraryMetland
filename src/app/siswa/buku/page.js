'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { Search, BookMarked, ChevronLeft, ChevronRight, Library } from 'lucide-react';
import VoiceSearchButton from '@/components/ui/VoiceSearchButton';

// SWR In-Memory Client Cache (persists during active browser session across tab switches)
let clientCatalogCache = null;
let clientKategoriCache = null;

export default function SiswaBukuPage() {
  const [buku, setBuku] = useState(() => clientCatalogCache?.data || []);
  const [total, setTotal] = useState(() => clientCatalogCache?.total || 0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [loading, setLoading] = useState(() => !clientCatalogCache);
  const [kategori, setKategori] = useState(() => clientKategoriCache || []);
  const [kategoriFilter, setKategoriFilter] = useState('');
  const [searchMeta, setSearchMeta] = useState({ mode: 'browse', hasSemanticResults: false });
  const limit = 12;

  const isInitialMount = useRef(true);

  // Initialize search query from URL parameter if navigated from dashboard
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const initialQuery = urlParams.get('search');
      if (initialQuery) {
        setSearch(initialQuery);
        setDebouncedSearch(initialQuery);
      }
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 280);
    return () => clearTimeout(timer);
  }, [search]);

  const fetch_ = useCallback(async () => {
    const isDefaultBrowse = !debouncedSearch && page === 1 && !kategoriFilter;
    // Only show full loading skeleton if we don't already have cached browse data
    if (!isDefaultBrowse || !clientCatalogCache) {
      setLoading(true);
    }

    const params = new URLSearchParams({
      search: debouncedSearch,
      page: page.toString(),
      limit: limit.toString(),
      ...(kategoriFilter ? { kategoriId: kategoriFilter } : {}),
    });
    try {
      const res = await fetch(`/api/buku?${params}`);
      const json = await res.json();
      const items = json.data || [];
      setBuku(items);
      setTotal(json.total || 0);
      setSearchMeta({
        mode: json.mode || 'browse',
        hasSemanticResults: !!json.hasSemanticResults,
      });
      if (isDefaultBrowse) {
        clientCatalogCache = json;
      }
    } catch {
      if (!isDefaultBrowse) {
        setBuku([]);
        setTotal(0);
      }
      setSearchMeta({ mode: 'browse', hasSemanticResults: false });
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, page, kategoriFilter]);

  useEffect(() => {
    fetch_();
  }, [fetch_]);

  useEffect(() => {
    if (!clientKategoriCache) {
      fetch('/api/kategori')
        .then((r) => r.json())
        .then((data) => {
          const list = Array.isArray(data) ? data : [];
          clientKategoriCache = list;
          setKategori(list);
        })
        .catch(() => setKategori([]));
    }
  }, []);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      {/* Catalog Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
          Katalog Koleksi Buku
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Temukan buku teks pelajaran, referensi ilmiah, karya sastra, dan bacaan kejuruan
        </p>
      </div>

      {/* Search & Category Filter Toolbar */}
      <div className="space-y-2">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" />
            <input
              id="search-buku-siswa"
              type="text"
              className="w-full pl-10 pr-12 py-2 text-xs sm:text-sm bg-slate-50 hover:bg-white focus:bg-white dark:bg-slate-950 dark:hover:bg-slate-900 dark:focus:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:border-blue-600 dark:focus:border-blue-500 rounded-lg outline-none transition-colors text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500"
              placeholder="Cari buku, topik pelajaran, atau tanya santai (misal: 'ada buku cara bikin kopi gak')..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
            <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center">
              <VoiceSearchButton
                onTranscript={(spokenText) => {
                  setSearch(spokenText);
                  setDebouncedSearch(spokenText);
                  setPage(1);
                }}
              />
            </div>
          </div>
          <select
            id="filter-kategori-siswa"
            className="sm:w-56 px-3 py-2 text-xs sm:text-sm bg-slate-50 hover:bg-white focus:bg-white dark:bg-slate-950 dark:hover:bg-slate-900 dark:focus:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:border-blue-600 dark:focus:border-blue-500 rounded-lg outline-none transition-colors text-slate-700 dark:text-slate-200"
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

        {/* Semantic Search Context Feedback Bar */}
        {debouncedSearch && !loading && (
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1 pt-0.5">
            <span>
              Menampilkan {total} hasil untuk &quot;{debouncedSearch}&quot;
            </span>
            {searchMeta.mode === 'semantic' && (
              <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                Pencarian berbasis makna &amp; konteks
              </span>
            )}
          </div>
        )}
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
          <BookMarked size={40} className="mx-auto mb-3 text-slate-300 dark:text-slate-600" />
          <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">Tidak ada buku ditemukan</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
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
              className="library-card p-3.5 sm:p-4 flex flex-col h-full group hover:border-slate-300 dark:hover:border-slate-700 transition-all block focus-visible:outline-2 focus-visible:outline-blue-600"
            >
              {/* Authentic Book Spine & Cover Container */}
              <div className="w-full rounded-lg mb-3 flex items-center justify-center overflow-hidden border border-slate-200/90 dark:border-slate-700/80 bg-slate-100 dark:bg-slate-800 relative h-48 sm:h-52 book-cover-wrap flex-shrink-0">
                {b.cover ? (
                  <img
                    src={b.cover}
                    alt={b.judul}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-200"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-800/90 p-4 text-center">
                    <Library size={36} className="text-slate-400 dark:text-slate-500 mb-2" />
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-300 line-clamp-2 px-1">
                      {b.judul}
                    </span>
                  </div>
                )}
              </div>

              {/* Bibliographic Info */}
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
                    {b.kategori && (
                      <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 dark:border dark:border-blue-800/40 px-2 py-0.5 rounded inline-block">
                        {b.kategori.nama}
                      </span>
                    )}
                    {b._relevance?.isSemanticMatch && (
                      <span className="text-[10px] font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200/80 dark:border-emerald-800/50 px-1.5 py-0.5 rounded inline-block">
                        Topik Relevan
                      </span>
                    )}
                  </div>
                  <h2 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 leading-snug group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
                    {b.judul}
                  </h2>
                  {b.penulis && (
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-1 truncate">
                      {b.penulis.nama}
                    </p>
                  )}
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className={`badge text-[11px] ${b.stok > 0 ? 'badge-green' : 'badge-red'}`}>
                    {b.stok > 0 ? `${b.stok} Tersedia` : 'Habis'}
                  </span>
                  <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 group-hover:text-blue-800 dark:group-hover:text-blue-300 transition-colors">
                    Lihat Detail
                  </span>
                </div>

                {/* Hover Reveal Details (Melebar vertikal kebawah) */}
                <div className="grid grid-rows-[0fr] group-hover:grid-rows-[1fr] transition-[grid-template-rows] duration-300 ease-in-out">
                  <div className="overflow-hidden">
                    <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100 line-clamp-4">
                      {b.deskripsi || "Tidak ada detail deskripsi yang tersedia untuk buku ini."}
                    </div>
                  </div>
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
          <span className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg min-h-[44px] flex items-center">
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
