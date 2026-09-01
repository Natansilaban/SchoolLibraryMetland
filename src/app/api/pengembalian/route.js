import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// POST /api/pengembalian — proses verifikasi pengembalian buku oleh Admin
export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Akses ditolak. Khusus Admin/Pustakawan.' }, { status: 403 });
    }

    const { peminjamanId, tglKembali, denda: customDenda, catatan } = await req.json();
    const id = parseInt(peminjamanId);
    if (!id || isNaN(id)) {
      return NextResponse.json({ error: 'ID peminjaman tidak valid' }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const peminjaman = await tx.peminjaman.findUnique({
        where: { id },
        include: { buku: true },
      });

      if (!peminjaman) {
        throw new Error('Data peminjaman tidak ditemukan');
      }

      if (peminjaman.status === 'DIKEMBALIKAN') {
        throw new Error('Buku ini sudah berstatus dikembalikan');
      }

      // CRITICAL FIX: Only loans currently active (DIPINJAM or TERLAMBAT) can be returned and have stock incremented
      if (!['DIPINJAM', 'TERLAMBAT'].includes(peminjaman.status)) {
        throw new Error(`Peminjaman berstatus ${peminjaman.status} tidak dapat diproses untuk pengembalian.`);
      }

      const tglAktual = tglKembali ? new Date(tglKembali) : new Date();
      const tglRencana = new Date(peminjaman.tglKembaliRencana);

      // Hitung denda standar (Rp 500/hari keterlambatan)
      let calculatedDenda = 0;
      if (tglAktual > tglRencana) {
        const diffMs = tglAktual.setHours(0, 0, 0, 0) - tglRencana.setHours(0, 0, 0, 0);
        if (diffMs > 0) {
          const hariTerlambat = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
          calculatedDenda = hariTerlambat * 500;
        }
      }

      // Allow admin to override denda if specified (e.g. damages or penalty waiver)
      const finalDenda = (customDenda !== undefined && customDenda !== null && !isNaN(Number(customDenda)))
        ? Number(customDenda)
        : calculatedDenda;

      const updated = await tx.peminjaman.update({
        where: { id },
        data: {
          status: 'DIKEMBALIKAN',
          tglKembaliAktual: tglKembali ? new Date(tglKembali) : new Date(),
          denda: finalDenda,
          catatan: catatan !== undefined ? catatan : peminjaman.catatan,
          adminId: parseInt(session.user.id),
        },
        include: { anggota: true, buku: true },
      });

      // Restore stok buku secara aman
      await tx.buku.update({
        where: { id: peminjaman.bukuId },
        data: { stok: { increment: 1 } },
      });

      return updated;
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// GET /api/pengembalian — list peminjaman aktif yang perlu/bisa dikembalikan
export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Akses ditolak. Khusus Admin.' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';

    const data = await prisma.peminjaman.findMany({
      where: {
        status: { in: ['DIPINJAM', 'TERLAMBAT'] },
        ...(search ? {
          OR: [
            { anggota: { nama: { contains: search, mode: 'insensitive' } } },
            { anggota: { nis: { contains: search, mode: 'insensitive' } } },
            { buku: { judul: { contains: search, mode: 'insensitive' } } },
          ],
        } : {}),
      },
      orderBy: { tglKembaliRencana: 'asc' },
      include: {
        anggota: { select: { nama: true, nis: true, kelas: true } },
        buku: { select: { id: true, judul: true, isbn: true, stok: true } },
      },
    });

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

