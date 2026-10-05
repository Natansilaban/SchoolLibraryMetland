import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { handleApiError } from '@/lib/api-error';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const data = await prisma.penulis.findMany({
      orderBy: { nama: 'asc' },
      include: {
        buku: { select: { id: true, judul: true, isbn: true, stok: true } },
        _count: { select: { buku: true } },
      },
    });
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      },
    });
  } catch (error) {
    return handleApiError(error, 'Gagal memuat data penulis');
  }
}

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Akses ditolak. Khusus Admin.' }, { status: 403 });
    }

    const { nama, bio } = await req.json();
    if (!nama || !nama.trim()) return NextResponse.json({ error: 'Nama penulis wajib diisi' }, { status: 400 });
    const data = await prisma.penulis.create({ data: { nama: nama.trim(), bio: bio?.trim() || null } });
    return NextResponse.json(data, {
      status: 201,
      headers: {
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    if (error.code === 'P2002') return NextResponse.json({ error: 'Nama penulis sudah terdaftar' }, { status: 409 });
    return handleApiError(error, 'Gagal menambahkan penulis');
  }
}
