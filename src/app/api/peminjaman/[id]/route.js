import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// PATCH /api/peminjaman/[id] - Konfirmasi atau Tolak peminjaman oleh Admin
export async function PATCH(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Akses ditolak. Khusus Admin.' }, { status: 403 });
    }

    const resolvedParams = await params;
    const peminjamanId = parseInt(resolvedParams?.id);
    if (!peminjamanId) {
      return NextResponse.json({ error: 'ID peminjaman tidak valid' }, { status: 400 });
    }

    const { action, catatan } = await req.json();
    if (!['APPROVE', 'REJECT'].includes(action)) {
      return NextResponse.json({ error: 'Aksi tidak valid (APPROVE / REJECT)' }, { status: 400 });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const peminjaman = await tx.peminjaman.findUnique({
        where: { id: peminjamanId },
        include: { buku: true },
      });

      if (!peminjaman) {
        throw new Error('Data peminjaman tidak ditemukan');
      }

      if (peminjaman.status !== 'MENUNGGU_KONFIRMASI') {
        throw new Error(`Peminjaman ini sudah berstatus ${peminjaman.status}`);
      }

      if (action === 'APPROVE') {
        // Cek stok buku
        if (peminjaman.buku.stok < 1) {
          throw new Error('Stok buku sudah habis. Tidak dapat menyetujui peminjaman.');
        }

        // Setujui peminjaman & kurangi stok
        const res = await tx.peminjaman.update({
          where: { id: peminjamanId },
          data: {
            status: 'DIPINJAM',
            adminId: parseInt(session.user.id),
            tglPinjam: new Date(),
            catatan: catatan || peminjaman.catatan,
          },
          include: { anggota: true, buku: true },
        });

        await tx.buku.update({
          where: { id: peminjaman.bukuId },
          data: { stok: { decrement: 1 } },
        });

        return res;
      } else {
        // Tolak peminjaman
        return await tx.peminjaman.update({
          where: { id: peminjamanId },
          data: {
            status: 'DITOLAK',
            adminId: parseInt(session.user.id),
            catatan: catatan || 'Pengajuan ditolak oleh admin',
          },
          include: { anggota: true, buku: true },
        });
      }
    });

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
