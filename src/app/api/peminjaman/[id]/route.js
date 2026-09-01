import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// PATCH /api/peminjaman/[id] - Konfirmasi/Tolak oleh Admin, Batalkan oleh Siswa, atau Ajukan Pengembalian Online oleh Siswa
export async function PATCH(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Autentikasi diperlukan' }, { status: 401 });
    }

    const resolvedParams = await params;
    const peminjamanId = parseInt(resolvedParams?.id);
    if (!peminjamanId || isNaN(peminjamanId)) {
      return NextResponse.json({ error: 'ID peminjaman tidak valid' }, { status: 400 });
    }

    const { action, catatan, tglKembali } = await req.json();
    if (!['APPROVE', 'REJECT', 'CANCEL', 'REQUEST_RETURN', 'CANCEL_RETURN_REQUEST'].includes(action)) {
      return NextResponse.json({ error: 'Aksi tidak valid (APPROVE / REJECT / CANCEL / REQUEST_RETURN / CANCEL_RETURN_REQUEST)' }, { status: 400 });
    }

    const isAdmin = session.user?.role === 'ADMIN';
    const isStudent = session.user?.role === 'SISWA';
    const userAnggotaId = session.user?.anggotaId ? parseInt(session.user.anggotaId) : null;

    const updated = await prisma.$transaction(async (tx) => {
      const peminjaman = await tx.peminjaman.findUnique({
        where: { id: peminjamanId },
        include: { buku: true },
      });

      if (!peminjaman) {
        throw new Error('Data peminjaman tidak ditemukan');
      }

      // 1. Handle REQUEST_RETURN by student or admin (Pengembalian Buku Online / Lebih Awal)
      if (action === 'REQUEST_RETURN') {
        if (isStudent && peminjaman.anggotaId !== userAnggotaId) {
          throw new Error('Akses ditolak');
        }

        if (!['DIPINJAM', 'TERLAMBAT'].includes(peminjaman.status)) {
          throw new Error(`Buku ini berstatus ${peminjaman.status} dan tidak sedang aktif dipinjam`);
        }

        const tglAktual = tglKembali ? new Date(tglKembali) : new Date();
        const tglRencana = new Date(peminjaman.tglKembaliRencana);
        tglAktual.setHours(0, 0, 0, 0);
        tglRencana.setHours(0, 0, 0, 0);

        let denda = 0;
        if (tglAktual > tglRencana) {
          const diffDays = Math.ceil((tglAktual - tglRencana) / (1000 * 60 * 60 * 24));
          denda = diffDays * 500;
        }

        const returnNote = `[Pengajuan Pengembalian Siswa] ${catatan || 'Siswa mengajukan pengembalian buku.'}`;

        return await tx.peminjaman.update({
          where: { id: peminjamanId },
          data: {
            tglKembaliAktual: tglKembali ? new Date(tglKembali) : new Date(),
            denda,
            catatan: returnNote,
          },
          include: { anggota: true, buku: true },
        });
      }

      // 2. Handle CANCEL_RETURN_REQUEST
      if (action === 'CANCEL_RETURN_REQUEST') {
        if (isStudent && peminjaman.anggotaId !== userAnggotaId) {
          throw new Error('Akses ditolak');
        }

        return await tx.peminjaman.update({
          where: { id: peminjamanId },
          data: {
            tglKembaliAktual: null,
            denda: 0,
            catatan: peminjaman.catatan?.replace(/\[Pengajuan Pengembalian Siswa\].*$/, '').trim() || null,
          },
          include: { anggota: true, buku: true },
        });
      }

      // 3. Handle CANCEL loan application by student or admin
      if (action === 'CANCEL') {
        if (peminjaman.status !== 'MENUNGGU_KONFIRMASI') {
          throw new Error(`Hanya pengajuan dengan status MENUNGGU_KONFIRMASI yang dapat dibatalkan`);
        }

        if (isStudent && peminjaman.anggotaId !== userAnggotaId) {
          throw new Error('Anda tidak memiliki izin untuk membatalkan pengajuan ini');
        }

        return await tx.peminjaman.update({
          where: { id: peminjamanId },
          data: {
            status: 'DITOLAK',
            catatan: catatan || 'Dibatalkan oleh siswa',
          },
          include: { anggota: true, buku: true },
        });
      }

      // 4. APPROVE & REJECT only by Admin
      if (!isAdmin) {
        throw new Error('Aksi ini hanya dapat dilakukan oleh Admin');
      }

      if (peminjaman.status !== 'MENUNGGU_KONFIRMASI') {
        throw new Error(`Peminjaman ini sudah berstatus ${peminjaman.status} dan tidak dapat diubah`);
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


// DELETE /api/peminjaman/[id] - Hapus / Tarik pengajuan yang masih MENUNGGU_KONFIRMASI
export async function DELETE(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Autentikasi diperlukan' }, { status: 401 });
    }

    const resolvedParams = await params;
    const peminjamanId = parseInt(resolvedParams?.id);
    if (!peminjamanId || isNaN(peminjamanId)) {
      return NextResponse.json({ error: 'ID peminjaman tidak valid' }, { status: 400 });
    }

    const isStudent = session.user?.role === 'SISWA';
    const userAnggotaId = session.user?.anggotaId ? parseInt(session.user.anggotaId) : null;

    const peminjaman = await prisma.peminjaman.findUnique({
      where: { id: peminjamanId },
    });

    if (!peminjaman) {
      return NextResponse.json({ error: 'Data peminjaman tidak ditemukan' }, { status: 404 });
    }

    if (isStudent && peminjaman.anggotaId !== userAnggotaId) {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });
    }

    if (peminjaman.status !== 'MENUNGGU_KONFIRMASI') {
      return NextResponse.json(
        { error: `Tidak dapat menghapus pengajuan yang berstatus ${peminjaman.status}` },
        { status: 400 }
      );
    }

    await prisma.peminjaman.delete({
      where: { id: peminjamanId },
    });

    return NextResponse.json({ message: 'Pengajuan peminjaman berhasil dibatalkan dan dihapus' });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

