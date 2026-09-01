'use client';

import { useState } from 'react';
import { BookPlus, Clock, BookCheck, AlertCircle, XCircle } from 'lucide-react';
import AjukanPinjamModal from './AjukanPinjamModal';
import { useRouter } from 'next/navigation';

export default function PinjamBukuButton({ buku, existingLoan, isStudent }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const router = useRouter();

  if (!isStudent) return null;

  const handleCancel = async () => {
    if (!existingLoan || !window.confirm('Yakin ingin membatalkan pengajuan peminjaman untuk buku ini?')) return;
    setCancelling(true);
    try {
      const res = await fetch(`/api/peminjaman/${existingLoan.id}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (!res.ok) {
        alert(json.error || 'Gagal membatalkan pengajuan');
      } else {
        router.refresh();
      }
    } catch (e) {
      alert(e.message);
    } finally {
      setCancelling(false);
    }
  };

  if (existingLoan) {
    if (existingLoan.status === 'MENUNGGU_KONFIRMASI') {
      return (
        <div className="mt-4 p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex flex-col gap-2.5">
          <div className="flex items-start gap-3">
            <Clock size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs font-semibold flex-1">
              Status Pengajuan: <span className="font-bold text-amber-700">Menunggu Konfirmasi</span>
              <p className="text-[11px] text-amber-700/80 font-medium mt-0.5">Tunjukkan ke pustakawan untuk pengambilan buku.</p>
            </div>
          </div>
          <button
            onClick={handleCancel}
            disabled={cancelling}
            className="btn-danger py-1.5 px-3 text-xs font-bold w-full justify-center flex items-center gap-1.5"
          >
            <XCircle size={14} />
            {cancelling ? 'Membatalkan...' : 'Batalkan Pengajuan Ini'}
          </button>
        </div>
      );
    }

    if (existingLoan.status === 'DIPINJAM' || existingLoan.status === 'TERLAMBAT') {
      return (
        <div className="mt-4 p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 flex items-center gap-3">
          <BookCheck size={20} className="text-blue-600 flex-shrink-0" />
          <div className="text-xs font-semibold">
            Kamu sedang meminjam buku ini.
            <p className="text-[11px] text-blue-700 font-medium mt-0.5">Kembalikan ke perpustakaan untuk meminjam lagi. Kamu bisa mengembalikannya lebih awal kapan saja.</p>
          </div>
        </div>
      );
    }
  }

  if (buku.stok === 0) {
    return (
      <div className="mt-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-3">
        <AlertCircle size={20} className="text-rose-600 flex-shrink-0" />
        <div className="text-xs font-semibold">
          Buku ini sedang habis dipinjam.
        </div>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => setModalOpen(true)}
        className="btn-primary w-full mt-4 justify-center py-3 text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2"
      >
        <BookPlus size={18} />
        Ajukan Pinjam Buku
      </button>

      <AjukanPinjamModal
        buku={buku}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={() => {
          router.refresh();
          router.push('/siswa/peminjaman');
        }}
      />
    </>
  );
}

