import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function PUT(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Akses ditolak. Khusus Admin.' }, { status: 403 });
    }

    const { id } = await params;
    const kategoriId = parseInt(id);
    if (!kategoriId || isNaN(kategoriId)) {
      return NextResponse.json({ error: 'ID tidak valid' }, { status: 400 });
    }

    const { nama, deskripsi } = await req.json();
    const data = await prisma.kategori.update({
      where: { id: kategoriId },
      data: { nama: nama?.trim(), deskripsi: deskripsi?.trim() || null },
    });
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Akses ditolak. Khusus Admin.' }, { status: 403 });
    }

    const { id } = await params;
    const kategoriId = parseInt(id);
    if (!kategoriId || isNaN(kategoriId)) {
      return NextResponse.json({ error: 'ID tidak valid' }, { status: 400 });
    }

    await prisma.kategori.delete({ where: { id: kategoriId } });
    return NextResponse.json({ message: 'Kategori berhasil dihapus' });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

