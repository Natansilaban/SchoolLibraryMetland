'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  BookCopy, Calendar, AlertTriangle, Clock,
  XCircle, CheckCircle2, RotateCcw, Library, X
} from 'lucide-react';
import Link from 'next/link';
import { toast } from '@/components/ui/Toast';
import { confirmModal } from '@/components/ui/ConfirmModal';

export default function SiswaPeminjamanPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState(null);
  const [returnModal, setReturnModal] = useState(null);
  const [returnForm, setReturnForm] = useState({ catatan: '' });
  const [submittingReturn, setSubmittingReturn] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  const fetchLoans = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/peminjaman');
      const json = await res.json();
      setData(json.data || []);
    } catch {
      setData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLoans();
  }, [fetchLoans]);

  const handleCancelApplication = async (id, bookTitle) => {
    const confirmed = await confirmModal({
      title: 'Batalkan Pengajuan Peminjaman',
      message: `Apakah kamu yakin ingin membatalkan pengajuan peminjaman untuk buku "${bookTitle}"?`,
      confirmText: 'Ya, Batalkan',
      cancelText: 'Kembali',
      type: 'danger',
    });
    if (!confirmed) return;

    setCancellingId(id);
    try {
      const res = await fetch(`/api/peminjaman/${id}`, {
        method: 'DELETE',
      });
      const json = await res.json();

      if (!res.ok) {
        toast.error(json.error || 'Gagal membatalkan pengajuan');
      } else {
        toast.success('Pengajuan peminjaman berhasil dibatalkan');
        fetchLoans();
      }
    } catch (err) {
      toast.error(err.message || 'Terjadi kesalahan');
    } finally {
      setCancellingId(null);
    }
  };

  const openReturnModal = (loan) => {
    setReturnModal(loan);
    setReturnForm({ catatan: '' });
  };

  const handleSubmitReturn = async (e) => {
    e.preventDefault();
    if (!returnModal) return;

    setSubmittingReturn(true);
    try {
      const res = await fetch(`/api/peminjaman/${returnModal.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'REQUEST_RETURN',
          tglKembali: today,
          catatan: returnForm.catatan,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error || 'Gagal mengajukan pengembalian');
      } else {
        setReturnModal(null);
        toast.success('Permintaan pengembalian dicatat. Silakan serahkan buku fisik ke meja petugas perpustakaan.');
        fetchLoans();
      }
    } catch (err) {
      toast.error(err.message || 'Terjadi kesalahan');
    } finally {
      setSubmittingReturn(false);
    }
  };

  const fmt = (d) => d ? new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) : '-';

  const getDaysLateAndFine = (tglRencanaStr) => {
    if (!tglRencanaStr) return { daysLate: 0, estimatedFine: 0 };
    const now = new Date();
    const planned = new Date(tglRencanaStr);
    now.setHours(0, 0, 0, 0);
    planned.setHours(0, 0, 0, 0);

    const diffTime = now.getTime() - planned.getTime();
    if (diffTime > 0) {
      const daysLate = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return { daysLate, estimatedFine: daysLate * 500 };
    }
    return { daysLate: 0, estimatedFine: 0 };
  };

  const isReturnRequested = (loan) => {
    return loan?.catatan && loan.catatan.includes('[Pengajuan Pengembalian Siswa]');
  };

  const statusBadge = (status) => {
    if (status === 'MENUNGGU_KONFIRMASI') return <span className="badge badge-yellow">Menunggu Konfirmasi Petugas</span>;
    if (status === 'DIPINJAM') return <span className="badge badge-blue">Sedang Dipinjam</span>;
    if (status === 'DIKEMBALIKAN') return <span className="badge badge-green">Telah Dikembalikan</span>;
    if (status === 'TERLAMBAT') return <span className="badge badge-red">Melebihi Jatuh Tempo</span>;
    if (status === 'DITOLAK') return <span className="badge badge-red">Permohonan Ditolak</span>;
    return null;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
          Status & Riwayat Peminjaman Buku
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Pantau buku yang sedang kamu bawa, jadwal pengembalian fisik, serta rekap denda
        </p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="library-card h-28 shimmer rounded-xl" />
          ))}
        </div>
      ) : data.length === 0 ? (
        <div className="library-card text-center py-16 px-4">
          <BookCopy size={44} className="mx-auto mb-3 text-slate-300 dark:text-slate-600" />
          <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">Belum ada riwayat peminjaman</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            Kamu belum pernah meminjam buku. Buka katalog untuk memilih buku bacaan favoritmu.
          </p>
          <Link href="/siswa/buku" className="btn-primary mt-4 text-xs font-semibold">
            Buka Katalog Buku
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {data.map((p) => {
            const { daysLate, estimatedFine } = getDaysLateAndFine(p.tglKembaliRencana);
            const isCurrentlyOverdue = (p.status === 'DIPINJAM' || p.status === 'TERLAMBAT') && daysLate > 0;
            const hasRequestedReturn = isReturnRequested(p);

            return (
              <div
                key={p.id}
                className="library-card p-4 sm:p-5 transition-all hover:border-slate-300 dark:hover:border-slate-700"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex items-start gap-3.5 min-w-0 flex-1">
                    <div className="w-12 h-16 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden flex-shrink-0 flex items-center justify-center shadow-xs">
                      {p.buku?.cover ? (
                        <img src={p.buku.cover} alt={p.buku.judul} loading="lazy" decoding="async" className="w-full h-full object-cover" />
                      ) : (
                        <Library size={22} className="text-slate-400 dark:text-slate-500" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <Link
                          href={`/siswa/buku/${p.buku?.id}`}
                          className="font-bold text-slate-900 dark:text-slate-100 hover:text-blue-700 dark:hover:text-blue-400 transition-colors text-sm sm:text-base leading-snug"
                        >
                          {p.buku?.judul || 'Buku Perpustakaan'}
                        </Link>
                        {statusBadge(p.status)}
                      </div>

                      <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-slate-600 dark:text-slate-400 font-medium mt-2">
                        <span className="inline-flex items-center gap-1.5">
                          <Calendar size={13} className="text-slate-400 dark:text-slate-500" /> Diajukan: {fmt(p.createdAt)}
                        </span>

                        {p.status !== 'MENUNGGU_KONFIRMASI' && p.status !== 'DITOLAK' && (
                          <span className="inline-flex items-center gap-1.5">
                            <Calendar size={13} className="text-slate-400 dark:text-slate-500" /> Tanggal Pinjam: {fmt(p.tglPinjam)}
                          </span>
                        )}

                        <span
                          className={`inline-flex items-center gap-1.5 ${
                            isCurrentlyOverdue ? 'text-rose-700 dark:text-rose-400 font-bold' : 'text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          {isCurrentlyOverdue ? <AlertTriangle size={13} className="text-rose-600 dark:text-rose-400" /> : <Clock size={13} className="text-slate-400 dark:text-slate-500" />}
                          Batas Kembali: {fmt(p.tglKembaliRencana)}
                        </span>

                        {p.status === 'DIKEMBALIKAN' && p.tglKembaliAktual && (
                          <span className="inline-flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-bold">
                            <CheckCircle2 size={13} /> Selesai: {fmt(p.tglKembaliAktual)}
                          </span>
                        )}
                      </div>

                      {/* Status Notice Banners */}
                      {p.status === 'MENUNGGU_KONFIRMASI' && (
                        <div className="mt-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                          <div className="flex items-center gap-2">
                            <Clock size={15} className="text-amber-600 dark:text-amber-400 flex-shrink-0" />
                            <span>Pengajuan menunggu persetujuan petugas. Jika berubah pikiran, kamu dapat membatalkannya.</span>
                          </div>
                          <button
                            onClick={() => handleCancelApplication(p.id, p.buku?.judul)}
                            disabled={cancellingId === p.id}
                            className="btn-danger py-1 px-3 text-xs font-semibold self-start sm:self-auto min-h-[32px]"
                          >
                            <XCircle size={14} />
                            {cancellingId === p.id ? 'Membatalkan...' : 'Batalkan'}
                          </button>
                        </div>
                      )}

                      {(p.status === 'DIPINJAM' || p.status === 'TERLAMBAT') && !hasRequestedReturn && (
                        <div className="mt-3 p-3 rounded-lg bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 text-blue-900 dark:text-blue-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div>
                            <span className="font-semibold block">Buku fisik sedang kamu pinjam.</span>
                            {isCurrentlyOverdue ? (
                              <p className="text-rose-700 dark:text-rose-400 font-bold mt-0.5 flex items-center gap-1">
                                <AlertTriangle size={13} />
                                Terlambat {daysLate} hari (Estimasi Denda: Rp {estimatedFine.toLocaleString('id')})
                              </p>
                            ) : (
                              <span className="text-slate-600 dark:text-slate-300 block mt-0.5">Sudah selesai membaca? Ajukan pengembalian sebelum jatuh tempo.</span>
                            )}
                          </div>
                          <button
                            onClick={() => openReturnModal(p)}
                            className="btn-primary py-1 px-3.5 text-xs font-semibold self-start sm:self-auto min-h-[34px] flex-shrink-0"
                          >
                            <RotateCcw size={14} />
                            Kembalikan Buku
                          </button>
                        </div>
                      )}

                      {hasRequestedReturn && p.status !== 'DIKEMBALIKAN' && (
                        <div className="mt-3 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-900 dark:text-emerald-200 text-xs flex items-center gap-2">
                          <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                          <span>Pengembalian telah diajukan. Silakan serahkan buku fisik ke meja petugas perpustakaan untuk diverifikasi.</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Return Book Confirmation Modal */}
      {returnModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 bg-slate-950/70 z-50 flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setReturnModal(null)}
        >
          <div
            className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-5 sm:p-6 shadow-xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Konfirmasi Pengembalian Buku
              </h2>
              <button
                onClick={() => setReturnModal(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
                aria-label="Tutup Dialog"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
              Kamu akan mengajukan pengembalian untuk buku <span className="font-bold text-slate-900 dark:text-white">&quot;{returnModal.buku?.judul}&quot;</span>. Pastikan kondisi buku lengkap dan tidak rusak.
            </p>

            <form onSubmit={handleSubmitReturn} className="space-y-3">
              <div>
                <label className="form-label text-xs">Catatan Kondisi Buku (Opsional)</label>
                <input
                  type="text"
                  className="library-input text-xs"
                  placeholder="Contoh: Sampul rapi, halaman lengkap..."
                  value={returnForm.catatan}
                  onChange={(e) => setReturnForm({ catatan: e.target.value })}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReturnModal(null)}
                  className="btn-secondary text-xs min-h-[38px]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingReturn}
                  className="btn-primary text-xs min-h-[38px]"
                >
                  {submittingReturn ? 'Mengirim...' : 'Kirim Pengajuan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
