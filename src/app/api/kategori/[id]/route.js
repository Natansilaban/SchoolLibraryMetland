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
    const kategoriId = parseInt(id, 10);
    if (!kategoriId || isNaN(kategoriId)) {
      return NextResponse.json({ error: 'ID tidak valid' }, { status: 400 });
    }

    const { nama, deskripsi } = await req.json();
    if (!nama || !nama.trim()) {
      return NextResponse.json({ error: 'Nama kategori wajib diisi' }, { status: 400 });
    }

    const existing = await prisma.kategori.findUnique({
      where: { id: kategoriId },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Kategori tidak ditemukan' }, { status: 404 });
    }

    const data = await prisma.kategori.update({
      where: { id: kategoriId },
      data: { nama: nama.trim(), deskripsi: deskripsi?.trim() || null },
    });
    return NextResponse.json(data);
  } catch (e) {
    if (e.code === 'P2002') {
      return NextResponse.json({ error: 'Nama kategori sudah digunakan' }, { status: 409 });
    }
    if (e.code === 'P2025') {
      return NextResponse.json({ error: 'Kategori tidak ditemukan' }, { status: 404 });
    }
    return handleApiError(e, 'Gagal memperbarui kategori');
  }
}

export async function DELETE(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Akses ditolak. Khusus Admin.' }, { status: 403 });
    }

    const { id } = await params;
    const kategoriId = parseInt(id, 10);
    if (!kategoriId || isNaN(kategoriId)) {
      return NextResponse.json({ error: 'ID tidak valid' }, { status: 400 });
    }

    const existing = await prisma.kategori.findUnique({
      where: { id: kategoriId },
      include: {
        _count: {
          select: { buku: true },
        },
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Kategori tidak ditemukan atau sudah dihapus' },
        { status: 404 }
      );
    }

    if (existing._count.buku > 0) {
      return NextResponse.json(
        { error: `Kategori tidak dapat dihapus karena masih digunakan oleh ${existing._count.buku} buku.` },
        { status: 409 }
      );
    }

    await prisma.kategori.delete({ where: { id: kategoriId } });
    return NextResponse.json({ message: 'Kategori berhasil dihapus' });
  } catch (e) {
    if (e.code === 'P2025') {
      return NextResponse.json(
        { error: 'Kategori tidak ditemukan atau sudah dihapus' },
        { status: 404 }
      );
    }
    return handleApiError(e, 'Gagal menghapus kategori');
  }
}

