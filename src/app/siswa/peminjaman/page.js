'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  BookCopy, Calendar, AlertTriangle, Clock, Info,
  XCircle, CheckCircle2, RotateCcw, X, Send, Sparkles, Coins
} from 'lucide-react';
import Link from 'next/link';

export default function SiswaPeminjamanPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState(null);
  const [returnModal, setReturnModal] = useState(null);
  const [returnForm, setReturnForm] = useState({ catatan: '' });
  const [submittingReturn, setSubmittingReturn] = useState(false);
  const [notification, setNotification] = useState(null);

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

  // 1. Batalkan Pengajuan (MENUNGGU_KONFIRMASI)
  const handleCancelApplication = async (id, bookTitle) => {
    if (!window.confirm(`Yakin ingin membatalkan pengajuan peminjaman untuk "${bookTitle}"?`)) {
      return;
    }

    setCancellingId(id);
    try {
      const res = await fetch(`/api/peminjaman/${id}`, {
        method: 'DELETE',
      });
      const json = await res.json();

      if (!res.ok) {
        alert(json.error || 'Gagal membatalkan pengajuan');
      } else {
        setNotification({ type: 'success', message: 'Pengajuan peminjaman berhasil dibatalkan.' });
        setTimeout(() => setNotification(null), 4000);
        fetchLoans();
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setCancellingId(null);
    }
  };

  // 2. Buka Modal Pengembalian Online (DIPINJAM / TERLAMBAT)
  const openReturnModal = (loan) => {
    setReturnModal(loan);
    setReturnForm({ catatan: '' });
  };

  // 3. Submit Pengajuan Pengembalian Online
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
        alert(json.error || 'Gagal mengajukan pengembalian');
      } else {
        setReturnModal(null);
        setNotification({
          type: 'success',
          message: 'Pengembalian berhasil diajukan! Silakan serahkan buku fisik ke meja perpustakaan untuk verifikasi.',
        });
        setTimeout(() => setNotification(null), 5000);
        fetchLoans();
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmittingReturn(false);
    }
  };

  // 4. Batalkan Permintaan Pengembalian
  const handleCancelReturnRequest = async (id) => {
    if (!window.confirm('Batalkan permintaan pengembalian untuk buku ini?')) return;
    try {
      const res = await fetch(`/api/peminjaman/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'CANCEL_RETURN_REQUEST' }),
      });
      if (res.ok) {
        fetchLoans();
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const fmt = (d) => d ? new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) : '—';

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

  return (
    <div>
      <div className="mb-6">
        <h1 className="section-title text-2xl sm:text-3xl mb-1 text-slate-900">Riwayat & Status Peminjaman</h1>
        <p className="section-subtitle text-xs sm:text-sm text-slate-500">
          Kelola pinjaman aktif, ajukan pengembalian buku lebih awal, atau batalkan pengajuan
        </p>
      </div>

      {notification && (
        <div className="mb-5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 size={18} className="text-emerald-600 flex-shrink-0" />
          {notification.message}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 shimmer rounded-2xl" />
          ))}
        </div>
      ) : data.length === 0 ? (
        <div className="text-center py-16 text-slate-400 glass-card p-8">
          <BookCopy size={48} className="mx-auto mb-3 opacity-40" />
          <p className="text-base sm:text-lg font-bold text-slate-700">Belum ada riwayat peminjaman</p>
          <p className="text-xs text-slate-500 mt-1">Kamu dapat meminjam buku melalui katalog perpustakaan.</p>
          <Link href="/siswa/buku" className="btn-primary mt-4 inline-flex">
            Lihat Katalog Buku
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {data.map(p => {
            const { daysLate, estimatedFine } = getDaysLateAndFine(p.tglKembaliRencana);
            const isCurrentlyOverdue = (p.status === 'DIPINJAM' || p.status === 'TERLAMBAT') && daysLate > 0;
            const hasRequestedReturn = isReturnRequested(p);

            return (
              <div key={p.id} className="glass-card p-4 sm:p-5 relative transition-all hover:shadow-md">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Link
                        href={`/siswa/buku/${p.buku.id}`}
                        className="font-bold text-slate-900 hover:text-blue-600 transition-colors text-sm sm:text-base"
                      >
                        {p.buku.judul}
                      </Link>
                    </div>

                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600 font-medium mt-2">
                      <span className="flex items-center gap-1">
                        <Calendar size={12} className="text-slate-400" /> Tgl Pengajuan: {fmt(p.createdAt)}
                      </span>

                      {p.status !== 'MENUNGGU_KONFIRMASI' && p.status !== 'DITOLAK' && (
                        <span className="flex items-center gap-1">
                          <Calendar size={12} className="text-slate-400" /> Tgl Pinjam: {fmt(p.tglPinjam)}
                        </span>
                      )}

                      <span
                        className="flex items-center gap-1"
                        style={{ color: isCurrentlyOverdue ? '#dc2626' : 'inherit', fontWeight: isCurrentlyOverdue ? '700' : '500' }}
                      >
                        {isCurrentlyOverdue && <AlertTriangle size={12} />}
                        Jatuh Tempo: {fmt(p.tglKembaliRencana)}
                      </span>

                      {p.status === 'DIKEMBALIKAN' && p.tglKembaliAktual && (
                        <span className="flex items-center gap-1 text-emerald-700 font-bold">
                          <CheckCircle2 size={12} /> Selesai Dikembalikan: {fmt(p.tglKembaliAktual)}
                        </span>
                      )}
                    </div>

                    {/* STATUS 1: MENUNGGU_KONFIRMASI (Tampilkan Tombol Batalkan Pengajuan) */}
                    {p.status === 'MENUNGGU_KONFIRMASI' && (
                      <div className="mt-3.5 p-3 rounded-xl bg-amber-50/90 border border-amber-200 text-amber-900 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 font-medium">
                        <div className="flex items-center gap-2">
                          <Clock size={15} className="text-amber-600 flex-shrink-0" />
                          <span>Pengajuanmu sedang ditinjau Admin. Belum mengambil buku fisik? Kamu bisa membatalkannya.</span>
                        </div>
                        <button
                          onClick={() => handleCancelApplication(p.id, p.buku.judul)}
                          disabled={cancellingId === p.id}
                          className="btn-danger py-1.5 px-3 text-xs font-bold self-start sm:self-auto flex items-center gap-1.5 shadow-sm"
                        >
                          <XCircle size={14} />
                          {cancellingId === p.id ? 'Membatalkan...' : 'Batalkan Pengajuan'}
                        </button>
                      </div>
                    )}

                    {/* STATUS 2: DIPINJAM / TERLAMBAT — Belum Mengajukan Kembali */}
                    {(p.status === 'DIPINJAM' || p.status === 'TERLAMBAT') && !hasRequestedReturn && (
                      <div className="mt-3.5 p-3 rounded-xl bg-blue-50/80 border border-blue-200 text-blue-900 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 font-medium">
                        <div className="flex items-center gap-2">
                          <RotateCcw size={16} className="text-blue-600 flex-shrink-0" />
                          <div>
                            <span>Buku sedang kamu pinjam. Siap mengembalikan buku ke perpustakaan?</span>
                            {isCurrentlyOverdue && (
                              <p className="text-rose-600 font-bold mt-0.5">
                                ⚠️ Terlambat {daysLate} hari · Estimasi Denda: Rp {estimatedFine.toLocaleString('id')} (Rp 500/hari)
                              </p>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => openReturnModal(p)}
                          className="btn-success py-1.5 px-3.5 text-xs font-bold self-start sm:self-auto flex items-center gap-1.5 shadow-sm hover:scale-[1.02] transition-transform"
                        >
                          <RotateCcw size={14} />
                          Kembalikan Buku Sekarang
                        </button>
                      </div>
                    )}

                    {/* STATUS 3: DIPINJAM / TERLAMBAT — Sudah Mengajukan Kembali (Menunggu Verifikasi Admin) */}
                    {(p.status === 'DIPINJAM' || p.status === 'TERLAMBAT') && hasRequestedReturn && (
                      <div className="mt-3.5 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 font-medium">
                        <div className="flex items-center gap-2">
                          <Clock size={16} className="text-emerald-600 flex-shrink-0" />
                          <div>
                            <span className="font-bold text-emerald-800">Pengembalian Sedang Diajukan</span>
                            <p className="text-[11px] text-emerald-700 mt-0.5">
                              Silakan serahkan buku fisik ke meja sirkulasi perpustakaan untuk verifikasi pustakawan.
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleCancelReturnRequest(p.id)}
                          className="btn-glass py-1 px-2.5 text-[11px] font-bold text-slate-600 hover:text-rose-600 self-start sm:self-auto flex items-center gap-1"
                          title="Batalkan pengajuan kembali"
                        >
                          <X size={13} /> Batalkan
                        </button>
                      </div>
                    )}

                    {/* STATUS 4: DITOLAK / DIBATALKAN */}
                    {p.status === 'DITOLAK' && (
                      <div className="mt-3.5 p-2.5 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 text-xs flex items-center gap-2 font-medium">
                        <Info size={14} className="text-slate-500 flex-shrink-0" />
                        Status: {p.catatan || 'Pengajuan dibatalkan atau ditolak admin.'}
                      </div>
                    )}
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 flex-shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    <span className={`badge ${
                      p.status === 'MENUNGGU_KONFIRMASI' ? 'badge-yellow'
                      : hasRequestedReturn ? 'badge-yellow'
                      : isCurrentlyOverdue ? 'badge-red'
                      : p.status === 'DIPINJAM' ? 'badge-blue'
                      : p.status === 'DIKEMBALIKAN' ? 'badge-green'
                      : 'badge-red'
                    }`}>
                      {hasRequestedReturn ? 'Menunggu Verifikasi Kembali'
                        : isCurrentlyOverdue ? 'Terlambat'
                        : p.status === 'DIPINJAM' ? 'Sedang Dipinjam'
                        : p.status === 'MENUNGGU_KONFIRMASI' ? 'Menunggu Persetujuan'
                        : p.status === 'DIKEMBALIKAN' ? 'Dikembalikan'
                        : 'Ditolak/Batal'}
                    </span>

                    {p.denda > 0 && p.status === 'DIKEMBALIKAN' && (
                      <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                        Denda: Rp {p.denda.toLocaleString('id')}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL AJUKAN PENGEMBALIAN BUKU OLEH SISWA */}
      {returnModal && (
        <div className="glass-modal-overlay">
          <div className="glass-modal p-6 max-w-md w-full animate-fadeIn">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <RotateCcw size={20} className="text-emerald-600" />
                <h2 className="text-lg font-bold text-slate-900">Ajukan Pengembalian Buku</h2>
              </div>
              <button onClick={() => setReturnModal(null)} className="btn-glass p-1.5 rounded-lg text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <div className="mb-4 p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <div className="font-bold text-sm text-slate-900 line-clamp-1 mb-1">{returnModal.buku.judul}</div>
              <div className="text-slate-500 font-medium">Tgl Pinjam: {fmt(returnModal.tglPinjam)}</div>
              <div className="text-slate-500 font-medium">Batas Kembali: {fmt(returnModal.tglKembaliRencana)}</div>
            </div>

            {/* Hitung Denda Estimasi */}
            {(() => {
              const { daysLate, estimatedFine } = getDaysLateAndFine(returnModal.tglKembaliRencana);
              const isLate = daysLate > 0;
              return (
                <div className="mb-4">
                  {isLate ? (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs">
                      <div className="flex items-center gap-1.5 font-bold mb-1">
                        <AlertTriangle size={15} className="text-rose-600" />
                        Terlambat {daysLate} Hari
                      </div>
                      <div className="flex items-center justify-between mt-1 pt-1 border-t border-rose-200/60">
                        <span>Estimasi Denda (Rp 500/hari):</span>
                        <span className="font-extrabold text-sm text-rose-700">Rp {estimatedFine.toLocaleString('id')}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2">
                      <Sparkles size={16} className="text-emerald-600 flex-shrink-0" />
                      <div>
                        <span className="font-bold">Pengembalian Tepat Waktu / Lebih Awal</span>
                        <p className="text-[11px] text-emerald-700 mt-0.5">Bebas denda keterlambatan (Rp 0).</p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            <form onSubmit={handleSubmitReturn} className="space-y-4">
              <div>
                <label className="form-label">Catatan Kondisi Buku (Opsional)</label>
                <textarea
                  className="glass-input w-full"
                  rows={2}
                  placeholder="Contoh: Buku dalam kondisi rapi, siap diserahkan..."
                  value={returnForm.catatan}
                  onChange={(e) => setReturnForm({ catatan: e.target.value })}
                  style={{ resize: 'vertical' }}
                />
              </div>

              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs leading-relaxed font-medium">
                📌 <strong>Langkah Selanjutnya:</strong> Setelah menekan tombol di bawah, bawa buku fisik ke perpustakaan agar pustakawan/admin dapat memverifikasi pengembalian.
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setReturnModal(null)} className="btn-glass flex-1 justify-center">
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingReturn}
                  className="btn-success flex-1 justify-center items-center gap-2 font-bold"
                >
                  {submittingReturn ? (
                    'Mengirim...'
                  ) : (
                    <>
                      <Send size={15} />
                      Konfirmasi Pengembalian
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
