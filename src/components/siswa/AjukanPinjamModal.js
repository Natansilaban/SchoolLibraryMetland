'use client';

import { useState, useEffect } from 'react';
import { Calendar, BookMarked, CheckCircle2 } from 'lucide-react';
import { toast } from '@/components/ui/Toast';

export default function AjukanPinjamModal({ buku, isOpen, onClose, onSuccess }) {
  const defaultTglKembali = () => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  };

  const [tglKembaliRencana, setTglKembaliRencana] = useState(defaultTglKembali());
  const [catatan, setCatatan] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen || !buku) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/peminjaman', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bukuId: buku.id,
          tglKembaliRencana,
          catatan,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Gagal mengajukan peminjaman');
      }

      toast.success('Pengajuan peminjaman berhasil diajukan!');
      if (onSuccess) onSuccess(json);
      onClose();
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      onClick={onClose}
      className="glass-modal-overlay overscroll-contain touch-pan-y"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="glass-modal p-5 sm:p-6 max-w-md w-full overscroll-contain"
      >
        <div className="flex items-center gap-2.5 mb-4">
          <BookMarked size={22} className="text-blue-600 flex-shrink-0" />
          <h2 className="text-lg font-bold text-slate-900">Ajukan Peminjaman Buku</h2>
        </div>

        <div className="mb-4 p-3 rounded-xl bg-slate-50 border border-slate-200">
          <div className="text-sm font-bold text-slate-900 line-clamp-1">{buku.judul}</div>
          <div className="text-xs text-slate-500 font-medium mt-0.5">
            Stok Tersedia: <span className="font-bold text-emerald-600">{buku.stok}</span>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl text-xs font-medium bg-rose-50 border border-rose-200 text-rose-800">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="form-label flex items-center gap-1.5">
              <Calendar size={14} className="text-slate-500" />
              Rencana Tanggal Pengembalian *
            </label>
            <input
              type="date"
              className="glass-input w-full"
              min={new Date().toISOString().split('T')[0]}
              value={tglKembaliRencana}
              onChange={(e) => setTglKembaliRencana(e.target.value)}
              required
            />
            <p className="text-[11px] text-slate-500 mt-1 font-medium">Batas peminjaman standar adalah 7 hari.</p>
          </div>

          <div>
            <label className="form-label">Catatan Tambahan (Opsional)</label>
            <textarea
              className="glass-input w-full resize-none"
              rows={2}
              placeholder="Contoh: Digunakan untuk keperluan tugas kelompok..."
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
            />
          </div>

          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs leading-relaxed font-medium">
            📌 <strong>Catatan:</strong> Setelah diajukan, status akan <strong>Menunggu Konfirmasi Admin</strong>. Silakan ambil buku fisik di perpustakaan setelah diapprove.
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-glass flex-1 justify-center">
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary flex-1 justify-center items-center gap-2"
            >
              {submitting ? (
                'Mengirim...'
              ) : (
                <>
                  <CheckCircle2 size={16} />
                  Kirim Pengajuan
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
