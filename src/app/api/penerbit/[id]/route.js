import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { handleApiError } from '@/lib/api-error';

export async function PUT(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Akses ditolak. Khusus Admin.' }, { status: 403 });
    }

    const { id } = await params;
    const penerbitId = parseInt(id, 10);
    if (!penerbitId || isNaN(penerbitId)) {
      return NextResponse.json({ error: 'ID tidak valid' }, { status: 400 });
    }

    const { nama, kota, website } = await req.json();
    if (!nama || !nama.trim()) {
      return NextResponse.json({ error: 'Nama penerbit wajib diisi' }, { status: 400 });
    }

    const data = await prisma.penerbit.update({
      where: { id: penerbitId },
      data: { nama: nama.trim(), kota: kota?.trim() || null, website: website?.trim() || null },
    });
    return NextResponse.json(data);
  } catch (e) {
    if (e.code === 'P2002') {
      return NextResponse.json({ error: 'Nama penerbit sudah terdaftar' }, { status: 409 });
    }
    return handleApiError(e, 'Gagal memperbarui data penerbit');
  }
}

export async function DELETE(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Akses ditolak. Khusus Admin.' }, { status: 403 });
    }

    const { id } = await params;
    const penerbitId = parseInt(id, 10);
    if (!penerbitId || isNaN(penerbitId)) {
      return NextResponse.json({ error: 'ID tidak valid' }, { status: 400 });
    }
    const booksCount = await prisma.buku.count({ where: { penerbitId } });
    if (booksCount > 0) {
      return NextResponse.json(
        { error: `Penerbit tidak dapat dihapus karena masih terkait dengan ${booksCount} buku.` },
        { status: 409 }
      );
    }

    await prisma.penerbit.delete({ where: { id: penerbitId } });
    return NextResponse.json({ message: 'Penerbit berhasil dihapus' });
  } catch (e) {
    return handleApiError(e, 'Gagal menghapus data penerbit');
  }
}

