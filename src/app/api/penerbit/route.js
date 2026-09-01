import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    const data = await prisma.penerbit.findMany({
      orderBy: { nama: 'asc' },
      include: {
        buku: { select: { id: true, judul: true, isbn: true, stok: true } },
        _count: { select: { buku: true } },
      },
    });
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
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
    const data = await prisma.penerbit.create({
      data: { nama: nama.trim(), kota: kota?.trim() || null, website: website?.trim() || null },
    });
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

