import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { serverErrMsg } from '@/lib/apiError';

export async function GET() {
  try {
    const data = await prisma.penerbit.findMany({
      orderBy: { nama: 'asc' },
      include: {
        buku: { select: { id: true, judul: true, isbn: true, stok: true } },
        _count: { select: { buku: true } },
      },
    });
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=120',
      },
    });
  } catch (error) {
    return NextResponse.json({ error: serverErrMsg(error) }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Akses ditolak. Khusus Admin.' }, { status: 403 });
    }

    const { nama, kota, website } = await req.json();
    if (!nama || !nama.trim()) return NextResponse.json({ error: 'Nama penerbit wajib diisi' }, { status: 400 });
    if (nama.length > 255) return NextResponse.json({ error: 'Nama penerbit terlalu panjang (maks 255 karakter)' }, { status: 400 });
    const data = await prisma.penerbit.create({
      data: { nama: nama.trim(), kota: kota?.trim() || null, website: website?.trim() || null },
    });
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: serverErrMsg(error) }, { status: 500 });
  }
}
