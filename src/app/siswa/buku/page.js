'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Search, BookMarked, ChevronLeft, ChevronRight, Library } from 'lucide-react';
import VoiceSearchButton from '@/components/ui/VoiceSearchButton';
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

  useEffect(() => {
    const controller = new AbortController();
    const isDefaultBrowse = !debouncedSearch && page === 1 && !kategoriFilter;
    if (!isDefaultBrowse || !clientCatalogCache) {
      setLoading(true);
    }

    const params = new URLSearchParams({
      search: debouncedSearch,
      page: page.toString(),
      limit: limit.toString(),
      ...(kategoriFilter ? { kategoriId: kategoriFilter } : {}),
    });

    fetch(`/api/buku?${params}`, { signal: controller.signal })
      .then((res) => res.json())
      .then((json) => {
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
      })
      .catch((err) => {
        if (err.name === 'AbortError') return;
        if (!isDefaultBrowse) {
          setBuku([]);
          setTotal(0);
        }
        setSearchMeta({ mode: 'browse', hasSemanticResults: false });
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [debouncedSearch, page, kategoriFilter]);

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
    <div className="relative min-h-[80vh] space-y-8 pb-10">
      {/* Background Orbs - GPU Optimized: Removed mix-blend and added translate-z-0 for hardware acceleration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10 transform-gpu">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-400/20 dark:bg-blue-600/10 blur-[100px] sm:blur-[120px] transform-gpu" />
        <div className="absolute top-[20%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-400/20 dark:bg-indigo-600/10 blur-[100px] sm:blur-[120px] transform-gpu" />
        <div className="absolute bottom-[-20%] left-[20%] w-[60%] h-[60%] rounded-full bg-sky-400/20 dark:bg-sky-600/10 blur-[100px] sm:blur-[120px] transform-gpu" />
      </div>

      {/* Header */}
      <div className="relative z-10 text-center sm:text-left pt-2 sm:pt-4">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-linear-to-r from-blue-700 to-indigo-600 dark:from-blue-400 dark:to-indigo-300 drop-shadow-sm pb-1">
          Katalog Koleksi Buku
        </h1>
        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mt-2 font-medium max-w-2xl">
          Temukan buku teks pelajaran, referensi ilmiah, karya sastra, dan bacaan kejuruan dengan mudah.
        </p>
      </div>

      {/* Search Bar - Liquid Glass Pill */}
      <div className="relative z-10 space-y-3 transform-gpu">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl p-2 sm:p-2.5 rounded-2xl sm:rounded-full border border-white/80 dark:border-slate-700/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)]">
          <div className="relative flex-1 group">
            <div className="absolute inset-0 bg-blue-50/50 dark:bg-blue-900/20 rounded-xl sm:rounded-full opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none" />
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none z-10 transition-colors group-focus-within:text-blue-600 dark:group-focus-within:text-blue-400" />
            <input
              id="search-buku-siswa"
              type="text"
              className="relative z-10 w-full pl-11 pr-14 h-12 sm:h-11 text-sm bg-transparent border-none rounded-xl sm:rounded-full outline-none text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-0"
              placeholder="Cari buku, topik, atau tanya santai (misal: 'ada buku cara bikin kopi gak')..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center z-10">
              <VoiceSearchButton
                onTranscript={(spokenText) => {
                  setSearch(spokenText);
                  setDebouncedSearch(spokenText);
                  setPage(1);
                }}
              />
            </div>
          </div>
          
          <div className="w-px h-8 bg-slate-200/80 dark:bg-slate-700/80 hidden sm:block" />
          
          <select
            id="filter-kategori-siswa"
            className="sm:w-56 h-12 sm:h-11 px-4 text-sm font-medium bg-transparent hover:bg-slate-50/50 dark:hover:bg-slate-800/50 rounded-xl sm:rounded-full outline-none transition-colors text-slate-700 dark:text-slate-200 border-none focus:ring-0 cursor-pointer appearance-none"
            style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\' stroke=\'%2364748b\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'M6 8l4 4 4-4\'/%3E%3C/svg%3E")', backgroundPosition: 'right 1rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.2em 1.2em' }}
            value={kategoriFilter}
            onChange={(e) => {
              setKategoriFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Semua Kategori</option>
            {kategori.map((k) => (
              <option key={k.id} value={k.id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                {k.nama}
              </option>
            ))}
          </select>
        </div>

        {/* Results Meta */}
        {debouncedSearch && !loading && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-2 pt-2 gap-2">
            <span className="font-medium bg-white/40 dark:bg-slate-900/40 px-3 py-1.5 rounded-full border border-white/60 dark:border-slate-800/60 backdrop-blur-sm inline-block">
              Menampilkan <strong className="text-slate-700 dark:text-slate-200">{total}</strong> hasil untuk &quot;<strong className="text-slate-700 dark:text-slate-200">{debouncedSearch}</strong>&quot;
            </span>
            {(searchMeta.mode === 'hybrid' || searchMeta.mode === 'semantic') && (
              <span className="text-[11px] font-bold text-blue-700 dark:text-blue-300 bg-white/60 dark:bg-slate-900/60 px-3 py-1.5 rounded-full border border-blue-200/60 dark:border-blue-800/40 shadow-sm flex items-center gap-2 backdrop-blur-md self-start sm:self-auto transform-gpu">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-500 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600 dark:bg-blue-400"></span>
                </span>
                Pencarian AI &amp; Reranked
              </span>
            )}
          </div>
        )}
      </div>

      {/* Loading Skeleton */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 relative z-10 transform-gpu">
          {Array.from({ length: 8 }).map((_, i) => (
            <div 
              key={i} 
              style={{ animation: `slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) ${i * 0.05}s both` }}
              className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-md border border-white/60 dark:border-slate-800/50 p-4 flex flex-col h-72 sm:h-80 shimmer rounded-2xl shadow-sm" 
            />
          ))}
        </div>
      ) : buku.length === 0 ? (
        <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-white/80 dark:border-slate-700/50 rounded-3xl text-center py-20 px-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] relative z-10 transform-gpu">
          <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-5 shadow-inner">
            <BookMarked size={36} className="text-slate-400 dark:text-slate-500" />
          </div>
          <h2 className="text-lg font-extrabold text-slate-800 dark:text-slate-100">Tidak ada buku ditemukan</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-md mx-auto leading-relaxed">
            {search
              ? `Kami tidak menemukan koleksi yang persis dengan "${search}". Coba gunakan kata kunci yang lebih umum.`
              : 'Belum ada koleksi buku dalam kategori yang dipilih.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 relative z-10">
          {buku.map((b, index) => (
            <Link
              key={b.id}
              href={`/siswa/buku/${b.id}`}
              id={`buku-card-${b.id}`}
              style={{ animation: `slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) ${index * 0.04}s both` }}
              className="group relative flex flex-col h-full rounded-2xl overflow-hidden isolation-auto focus-visible:outline-2 focus-visible:outline-blue-600 transition-transform duration-300 hover:-translate-y-1 hover:scale-[1.02] will-change-transform transform-gpu"
            >
              {/* Glass Background - Optimized */}
              <div className="absolute inset-0 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border border-white/90 dark:border-slate-700/50 rounded-2xl transition-colors duration-300 group-hover:bg-white/95 dark:group-hover:bg-slate-800/90 shadow-[0_4px_24px_rgba(0,0,0,0.03)] group-hover:shadow-[0_16px_48px_rgba(0,0,0,0.1)] z-0" />
              
              {/* Glare effect - Optimized */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-linear-to-tr from-transparent via-white/30 to-transparent dark:via-white/5 transition-opacity duration-500 pointer-events-none z-10" />
              
              <div className="relative z-20 p-3 sm:p-4 flex flex-col h-full">
                {/* Image */}
                <div className="w-full rounded-xl mb-4 flex items-center justify-center overflow-hidden border border-slate-200/60 dark:border-slate-700/60 bg-slate-100/50 dark:bg-slate-800/50 relative h-44 sm:h-56 shrink-0 shadow-inner">
                  {b.cover ? (
                    <img
                      src={b.cover}
                      alt={b.judul}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out will-change-transform transform-gpu"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center">
                      <Library size={36} className="text-slate-300 dark:text-slate-600 mb-2 drop-shadow-sm" />
                      <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 line-clamp-2 px-1">
                        {b.judul}
                      </span>
                    </div>
                  )}
                  {/* Image overlay gradient for depth */}
                  <div className="absolute inset-0 bg-linear-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                </div>
                
                {/* Content */}
                <div className="flex-1 flex flex-col justify-between transform-gpu">
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap mb-2">
                      {b.kategori && (
                        <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300 bg-blue-500/10 dark:bg-blue-400/10 border border-blue-500/20 dark:border-blue-400/20 px-2 py-0.5 rounded-full inline-block">
                          {b.kategori.nama}
                        </span>
                      )}
                      {b._relevance?.isSemanticMatch && (
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 dark:bg-emerald-400/10 border border-emerald-500/20 dark:border-emerald-400/20 px-2 py-0.5 rounded-full inline-block flex items-center gap-1.5 shadow-sm">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Topik Relevan
                        </span>
                      )}
                    </div>
                    <h2 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-slate-100 leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200 line-clamp-2 drop-shadow-sm">
                      {b.judul}
                    </h2>
                    {b.penulis && (
                      <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium mt-1.5 truncate">
                        {b.penulis.nama}
                      </p>
                    )}
                  </div>
                  
                  <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
                    <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${b.stok > 0 ? 'bg-green-500/15 text-green-700 dark:text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-700 dark:text-red-400 border border-red-500/20'}`}>
                      {b.stok > 0 ? `${b.stok} Tersedia` : 'Habis'}
                    </span>
                    <span className="text-[11px] sm:text-xs font-bold text-blue-600 dark:text-blue-400 opacity-0 group-hover:opacity-100 -translate-x-3 group-hover:translate-x-0 transition-all duration-300 flex items-center gap-1 will-change-transform">
                      Detail <ChevronRight size={14} className="stroke-[2.5]" />
                    </span>
                  </div>
                  
                  <div className="grid grid-rows-[0fr] group-hover:grid-rows-[1fr] transition-[grid-template-rows] duration-300 ease-out will-change-[grid-template-rows]">
                    <div className="overflow-hidden">
                      <div className="pt-3 mt-3 border-t border-slate-200/60 dark:border-slate-700/60 text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed opacity-0 group-hover:opacity-100 transition-opacity duration-300 line-clamp-3">
                        {b.deskripsi || "Tidak ada detail deskripsi yang tersedia untuk buku ini."}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination - Glass style */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-6 pb-4 relative z-10">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="flex items-center justify-center min-h-[44px] min-w-[44px] p-2 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border border-white/80 dark:border-slate-700/50 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none transition-all shadow-sm hover:shadow-md"
            aria-label="Halaman Sebelumnya"
          >
            <ChevronLeft size={18} className="stroke-[2.5]" />
          </button>
          <span className="px-5 py-2.5 text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border border-white/80 dark:border-slate-700/50 rounded-xl min-h-[44px] flex items-center shadow-sm">
            Halaman {page} dari {totalPages}
          </span>
          <button
            disabled={page === totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="flex items-center justify-center min-h-[44px] min-w-[44px] p-2 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border border-white/80 dark:border-slate-700/50 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none transition-all shadow-sm hover:shadow-md"
            aria-label="Halaman Selanjutnya"
          >
            <ChevronRight size={18} className="stroke-[2.5]" />
          </button>
        </div>
      )}
    </div>
  );
}
