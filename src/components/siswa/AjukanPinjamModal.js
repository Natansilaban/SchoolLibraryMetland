'use client';

import { useState } from 'react';
import { X, Calendar, BookMarked, CheckCircle2 } from 'lucide-react';

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

      if (onSuccess) onSuccess(json);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="glass-modal-overlay">
      <div className="glass-modal p-6 max-w-md w-full">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BookMarked size={20} className="text-blue-600" />
            <h2 className="text-lg font-bold text-slate-900">Ajukan Peminjaman Buku</h2>
          </div>
          <button onClick={onClose} className="btn-glass p-1.5 rounded-lg text-slate-400 hover:text-slate-600">
            <X size={18} />
          </button>
        </div>

        <div className="mb-4 p-3 rounded-xl bg-slate-50 border border-slate-200">
          <div className="text-sm font-bold text-slate-900 line-clamp-1">{buku.judul}</div>
          <div className="text-xs text-slate-500 font-medium mt-0.5">Stok Tersedia: <span className="font-bold text-emerald-600">{buku.stok} eksemplar</span></div>
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
              className="glass-input w-full"
              rows={2}
              placeholder="Contoh: Digunakan untuk keperluan tugas kelompok..."
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              style={{ resize: 'vertical' }}
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
