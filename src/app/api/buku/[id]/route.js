import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

// GET /api/buku/[id]
export async function GET(req, { params }) {
  try {
    const { id } = await params;
    const buku = await prisma.buku.findUnique({
      where: { id: parseInt(id) },
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
    const { id } = await params;
    const body = await req.json();
    const { judul, isbn, kategoriId, penulisId, penerbitId, tahunTerbit, stok, deskripsi, cover } = body;

    const buku = await prisma.buku.update({
      where: { id: parseInt(id) },
      data: {
        judul,
        isbn: isbn || null,
        kategoriId: kategoriId ? parseInt(kategoriId) : null,
        penulisId: penulisId ? parseInt(penulisId) : null,
        penerbitId: penerbitId ? parseInt(penerbitId) : null,
        tahunTerbit: tahunTerbit ? parseInt(tahunTerbit) : null,
        stok: stok ? parseInt(stok) : 1,
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
    const { id } = await params;
    // Check active peminjaman
    const active = await prisma.peminjaman.count({
      where: { bukuId: parseInt(id), status: 'DIPINJAM' },
    });
    if (active > 0) {
      return NextResponse.json(
        { error: 'Buku masih dipinjam, tidak dapat dihapus' },
        { status: 409 }
      );
    }
    await prisma.buku.delete({ where: { id: parseInt(id) } });
    return NextResponse.json({ message: 'Buku berhasil dihapus' });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
