import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Akses ditolak. Khusus Admin.' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const now = new Date();
    const bulan = parseInt(searchParams.get('bulan') || (now.getMonth() + 1));
    const tahun = parseInt(searchParams.get('tahun') || now.getFullYear());

    const startDate = new Date(tahun, bulan - 1, 1, 0, 0, 0, 0);
    const endDate = new Date(tahun, bulan, 0, 23, 59, 59, 999);

    const periodFilter = { createdAt: { gte: startDate, lte: endDate } };

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
        where: periodFilter,
        include: {
          anggota: { select: { nama: true, nis: true, kelas: true } },
          buku: { select: { judul: true } },
        },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.peminjaman.count({ where: periodFilter }),
      prisma.peminjaman.count({ where: { ...periodFilter, status: 'DIKEMBALIKAN' } }),
      prisma.peminjaman.count({ where: { ...periodFilter, status: 'TERLAMBAT' } }),
      prisma.peminjaman.aggregate({
        where: periodFilter,
        _sum: { denda: true },
      }),
      // Buku terpopuler strictly within the selected period
      prisma.buku.findMany({
        where: { peminjaman: { some: periodFilter } },
        take: 10,
        include: {
          _count: {
            select: { peminjaman: { where: periodFilter } },
          },
        },
        orderBy: { peminjaman: { _count: 'desc' } },
      }),
      // Anggota teraktif strictly within the selected period
      prisma.anggota.findMany({
        where: { peminjaman: { some: periodFilter } },
        take: 10,
        include: {
          _count: {
            select: { peminjaman: { where: periodFilter } },
          },
        },
        orderBy: { peminjaman: { _count: 'desc' } },
      }),
    ]);

    return NextResponse.json({
      periode: { bulan, tahun },
      ringkasan: {
        totalPeminjaman,
        totalDikembalikan,
        totalTerlambat,
        totalDenda: totalDenda._sum?.denda || 0,
      },
      peminjaman,
      bukuTerpopuler,
      anggotaTerAktif,
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

