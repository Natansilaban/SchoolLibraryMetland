import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET /api/buku/[id]
export async function GET(req, { params }) {
  try {
    const { id } = await params;
    const bukuId = parseInt(id);
    if (!bukuId || isNaN(bukuId)) {
      return NextResponse.json({ error: 'ID tidak valid' }, { status: 400 });
    }

    const buku = await prisma.buku.findUnique({
      where: { id: bukuId },
      include: {
        kategori: true,
        penulis: true,
        penerbit: true,
        _count: { select: { peminjaman: true } },
      },
    });
    if (!buku) return NextResponse.json({ error: 'Buku tidak ditemukan' }, { status: 404 });
    return NextResponse.json(buku);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT /api/buku/[id]
export async function PUT(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Akses ditolak. Khusus Admin.' }, { status: 403 });
    }

    const { id } = await params;
    const bukuId = parseInt(id);
    if (!bukuId || isNaN(bukuId)) {
      return NextResponse.json({ error: 'ID tidak valid' }, { status: 400 });
    }

    const body = await req.json();
    const { judul, isbn, kategoriId, penulisId, penerbitId, tahunTerbit, stok, deskripsi, cover } = body;

    const buku = await prisma.buku.update({
      where: { id: bukuId },
      data: {
        judul: judul?.trim(),
        isbn: isbn ? isbn.trim() : null,
        kategoriId: kategoriId ? parseInt(kategoriId) : null,
        penulisId: penulisId ? parseInt(penulisId) : null,
        penerbitId: penerbitId ? parseInt(penerbitId) : null,
        tahunTerbit: tahunTerbit ? parseInt(tahunTerbit) : null,
        stok: stok !== undefined && stok !== null ? Math.max(0, parseInt(stok)) : 1,
        deskripsi: deskripsi || null,
        cover: cover || null,
      },
      include: { kategori: true, penulis: true, penerbit: true },
    });
    return NextResponse.json(buku);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/buku/[id]
export async function DELETE(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Akses ditolak. Khusus Admin.' }, { status: 403 });
    }

    const { id } = await params;
    const bukuId = parseInt(id);
    if (!bukuId || isNaN(bukuId)) {
      return NextResponse.json({ error: 'ID tidak valid' }, { status: 400 });
    }

    // Check active peminjaman (including DIPINJAM, TERLAMBAT, and MENUNGGU_KONFIRMASI)
    const active = await prisma.peminjaman.count({
      where: {
        bukuId: bukuId,
        status: { in: ['DIPINJAM', 'TERLAMBAT', 'MENUNGGU_KONFIRMASI'] },
      },
    });

    if (active > 0) {
      return NextResponse.json(
        { error: 'Buku masih memiliki peminjaman atau pengajuan aktif, tidak dapat dihapus' },
        { status: 409 }
      );
    }

    await prisma.buku.delete({ where: { id: bukuId } });
    return NextResponse.json({ message: 'Buku berhasil dihapus' });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

