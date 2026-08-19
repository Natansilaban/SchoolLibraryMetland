import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

// POST /api/pengembalian — proses pengembalian buku
export async function POST(req) {
  try {
    const { peminjamanId, tglKembali, catatan } = await req.json();

    const result = await prisma.$transaction(async (tx) => {
      const peminjaman = await tx.peminjaman.findUnique({
        where: { id: parseInt(peminjamanId) },
        include: { buku: true },
      });

      if (!peminjaman) throw new Error('Data peminjaman tidak ditemukan');
      if (peminjaman.status === 'DIKEMBALIKAN') throw new Error('Buku sudah dikembalikan');

      const tglAktual = tglKembali ? new Date(tglKembali) : new Date();
      const tglRencana = new Date(peminjaman.tglKembaliRencana);

      // Hitung denda (Rp 500/hari)
      let denda = 0;
      if (tglAktual > tglRencana) {
        const hariTerlambat = Math.ceil((tglAktual - tglRencana) / (1000 * 60 * 60 * 24));
        denda = hariTerlambat * 500;
      }

      const updated = await tx.peminjaman.update({
        where: { id: parseInt(peminjamanId) },
        data: {
          status: 'DIKEMBALIKAN',
          tglKembaliAktual: tglAktual,
          denda,
          catatan: catatan || peminjaman.catatan,
        },
        include: { anggota: true, buku: true },
      });

      // Restore stok
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

// GET /api/pengembalian — list peminjaman yang bisa dikembalikan
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search') || '';

  const data = await prisma.peminjaman.findMany({
    where: {
      status: { in: ['DIPINJAM', 'TERLAMBAT'] },
      ...(search ? {
        OR: [
          { anggota: { nama: { contains: search, mode: 'insensitive' } } },
          { buku: { judul: { contains: search, mode: 'insensitive' } } },
        ],
      } : {}),
    },
    orderBy: { tglKembaliRencana: 'asc' },
    include: {
      anggota: { select: { nama: true, nis: true, kelas: true } },
      buku: { select: { judul: true, isbn: true } },
    },
  });

  // Auto update status TERLAMBAT
  const today = new Date();
  const updates = data
    .filter((p) => p.status === 'DIPINJAM' && new Date(p.tglKembaliRencana) < today)
    .map((p) => prisma.peminjaman.update({ where: { id: p.id }, data: { status: 'TERLAMBAT' } }));

  if (updates.length > 0) await Promise.all(updates);

  return NextResponse.json(data);
}
