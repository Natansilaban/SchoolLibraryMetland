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
    const penulisId = parseInt(id, 10);
    if (!penulisId || isNaN(penulisId)) {
      return NextResponse.json({ error: 'ID tidak valid' }, { status: 400 });
    }

    const { nama, bio } = await req.json();
    if (!nama || !nama.trim()) {
      return NextResponse.json({ error: 'Nama penulis wajib diisi' }, { status: 400 });
    }

    const data = await prisma.penulis.update({
      where: { id: penulisId },
      data: { nama: nama.trim(), bio: bio?.trim() || null },
    });
    return NextResponse.json(data);
  } catch (e) {
    if (e.code === 'P2002') {
      return NextResponse.json({ error: 'Nama penulis sudah terdaftar' }, { status: 409 });
    }
    return handleApiError(e, 'Gagal memperbarui data penulis');
  }
}

export async function DELETE(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Akses ditolak. Khusus Admin.' }, { status: 403 });
    }

    const { id } = await params;
    const penulisId = parseInt(id, 10);
    if (!penulisId || isNaN(penulisId)) {
      return NextResponse.json({ error: 'ID tidak valid' }, { status: 400 });
    }
    const existing = await prisma.penulis.findUnique({
      where: { id: penulisId },
      include: {
        _count: {
          select: { buku: true },
        },
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Penulis tidak ditemukan atau sudah dihapus' },
        { status: 404 }
      );
    }

    if (existing._count.buku > 0) {
      return NextResponse.json(
        { error: `Penulis tidak dapat dihapus karena masih terkait dengan ${existing._count.buku} buku.` },
        { status: 409 }
      );
    }

    await prisma.penulis.delete({ where: { id: penulisId } });
    return NextResponse.json({ message: 'Penulis berhasil dihapus' });
  } catch (e) {
    if (e.code === 'P2025') {
      return NextResponse.json(
        { error: 'Penulis tidak ditemukan atau sudah dihapus' },
        { status: 404 }
      );
    }
    return handleApiError(e, 'Gagal menghapus data penulis');
  }
}

