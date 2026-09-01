import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET /api/buku
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const kategoriId = searchParams.get('kategoriId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const where = {
      AND: [
        search ? {
          OR: [
            { judul: { contains: search, mode: 'insensitive' } },
            { isbn: { contains: search, mode: 'insensitive' } },
            { penulis: { nama: { contains: search, mode: 'insensitive' } } },
          ],
        } : {},
        kategoriId ? { kategoriId: parseInt(kategoriId) } : {},
      ],
    };

    const [data, total] = await Promise.all([
      prisma.buku.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          kategori: { select: { id: true, nama: true } },
          penulis: { select: { id: true, nama: true } },
          penerbit: { select: { id: true, nama: true } },
          _count: { select: { peminjaman: true } },
        },
      }),
      prisma.buku.count({ where }),
    ]);

    return NextResponse.json({ data, total, page, limit });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/buku
export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Akses ditolak. Khusus Admin.' }, { status: 403 });
    }

    const body = await req.json();
    const { judul, isbn, kategoriId, penulisId, penerbitId, tahunTerbit, stok, deskripsi, cover } = body;

    if (!judul || !judul.trim()) {
      return NextResponse.json({ error: 'Judul buku wajib diisi' }, { status: 400 });
    }

    const buku = await prisma.buku.create({
      data: {
        judul: judul.trim(),
        isbn: isbn ? isbn.trim() : null,
        kategoriId: kategoriId ? parseInt(kategoriId) : null,
        penulisId: penulisId ? parseInt(penulisId) : null,
        penerbitId: penerbitId ? parseInt(penerbitId) : null,
        tahunTerbit: tahunTerbit ? parseInt(tahunTerbit) : null,
        stok: stok !== undefined && stok !== null ? Math.max(0, parseInt(stok)) : 1,
        deskripsi: deskripsi || null,
        cover: cover || null,
      },
      include: {
        kategori: true,
        penulis: true,
        penerbit: true,
      },
    });

    return NextResponse.json(buku, { status: 201 });
  } catch (error) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'ISBN sudah digunakan' }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

