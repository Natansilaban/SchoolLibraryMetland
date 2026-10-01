import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { handleApiError } from '@/lib/api-error';

export async function GET() {
  try {
    const data = await prisma.kategori.findMany({ orderBy: { nama: 'asc' } });
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=120',
      },
    });
  } catch (error) {
    return handleApiError(error, 'Gagal memuat kategori');
  }
}

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Akses ditolak. Khusus Admin.' }, { status: 403 });
    }

    const { nama, deskripsi } = await req.json();
    if (!nama || !nama.trim()) return NextResponse.json({ error: 'Nama kategori wajib diisi' }, { status: 400 });
    const data = await prisma.kategori.create({ data: { nama: nama.trim(), deskripsi: deskripsi?.trim() || null } });
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    if (error.code === 'P2002') return NextResponse.json({ error: 'Nama kategori sudah digunakan' }, { status: 409 });
    return handleApiError(error, 'Gagal menambahkan kategori');
  }
}

