'use client';

import { useState } from 'react';
import { BookPlus, Clock, BookCheck, AlertCircle } from 'lucide-react';
import AjukanPinjamModal from './AjukanPinjamModal';
import { useRouter } from 'next/navigation';

export default function PinjamBukuButton({ buku, existingLoan, isStudent }) {
  const [modalOpen, setModalOpen] = useState(false);
  const router = useRouter();

  if (!isStudent) return null;

  if (existingLoan) {
    if (existingLoan.status === 'MENUNGGU_KONFIRMASI') {
      return (
        <div className="mt-4 p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-center gap-3">
          <Clock size={20} className="text-amber-600 flex-shrink-0" />
          <div className="text-xs font-semibold">
            Status Pengajuan: <span className="font-bold text-amber-700">Menunggu Konfirmasi Admin</span>
            <p className="text-[11px] text-amber-700/80 font-medium mt-0.5">Tunjukkan ke pustakawan untuk pengambilan buku.</p>
          </div>
        </div>
      );
    }

    if (existingLoan.status === 'DIPINJAM' || existingLoan.status === 'TERLAMBAT') {
      return (
        <div className="mt-4 p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 flex items-center gap-3">
          <BookCheck size={20} className="text-blue-600 flex-shrink-0" />
          <div className="text-xs font-semibold">
            Kamu sedang meminjam buku ini.
            <p className="text-[11px] text-blue-700 font-medium mt-0.5">Kembalikan buku terlebih dahulu untuk meminjam lagi.</p>
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
