import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const bulan = parseInt(searchParams.get('bulan') || new Date().getMonth() + 1);
  const tahun = parseInt(searchParams.get('tahun') || new Date().getFullYear());

  const startDate = new Date(tahun, bulan - 1, 1);
  const endDate = new Date(tahun, bulan, 0, 23, 59, 59);

  const [
    peminjaman,
    totalPeminjaman,
    totalDikembalikan,
    totalTerlambat,
    totalDenda,
    bukuTerpopuler,
    anggotaTerAktif,
  ] = await Promise.all([
    prisma.peminjaman.findMany({
      where: { createdAt: { gte: startDate, lte: endDate } },
      include: {
        anggota: { select: { nama: true, nis: true, kelas: true } },
        buku: { select: { judul: true } },
      },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.peminjaman.count({ where: { createdAt: { gte: startDate, lte: endDate } } }),
    prisma.peminjaman.count({ where: { createdAt: { gte: startDate, lte: endDate }, status: 'DIKEMBALIKAN' } }),
    prisma.peminjaman.count({ where: { createdAt: { gte: startDate, lte: endDate }, status: 'TERLAMBAT' } }),
    prisma.peminjaman.aggregate({
      where: { createdAt: { gte: startDate, lte: endDate } },
      _sum: { denda: true },
    }),
    prisma.buku.findMany({
      take: 10,
      orderBy: { peminjaman: { _count: 'desc' } },
      include: { _count: { select: { peminjaman: true } } },
    }),
    prisma.anggota.findMany({
      take: 10,
      orderBy: { peminjaman: { _count: 'desc' } },
      include: { _count: { select: { peminjaman: true } } },
    }),
  ]);

  return NextResponse.json({
    periode: { bulan, tahun },
    ringkasan: {
      totalPeminjaman,
      totalDikembalikan,
      totalTerlambat,
      totalDenda: totalDenda._sum.denda || 0,
    },
    peminjaman,
    bukuTerpopuler,
    anggotaTerAktif,
  });
}
