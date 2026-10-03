import { prisma } from "@/lib/prisma";
import { computeEmbedding } from "@/lib/search/embeddings";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { handleApiError } from "@/lib/api-error";
import { invalidateCatalogCache } from "@/lib/catalog-cache";

export async function GET(req, { params }) {
  try {
    const { id } = await params;
    const bukuId = parseInt(id, 10);
    if (!bukuId || isNaN(bukuId)) {
      return NextResponse.json({ error: "ID tidak valid" }, { status: 400 });
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
    if (!buku)
      return NextResponse.json(
        { error: "Buku tidak ditemukan" },
        { status: 404 },
      );
    return NextResponse.json(buku);
  } catch (error) {
    return handleApiError(error, "Gagal memuat detail buku");
  }
}

export async function PUT(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Akses ditolak. Khusus Admin." },
        { status: 403 },
      );
    }

    const { id } = await params;
    const bukuId = parseInt(id, 10);
    if (!bukuId || isNaN(bukuId)) {
      return NextResponse.json({ error: "ID tidak valid" }, { status: 400 });
    }

    const body = await req.json();
    const {
      judul,
      isbn,
      kategoriId,
      penulisId,
      penerbitId,
      tahunTerbit,
      stok,
      deskripsi,
      cover,
    } = body;

    if (!judul || !judul.trim()) {
      return NextResponse.json(
        { error: "Judul buku wajib diisi" },
        { status: 400 },
      );
    }

    const buku = await prisma.buku.update({
      where: { id: bukuId },
      data: {
        judul: judul.trim(),
        isbn: isbn ? isbn.trim() : null,
        kategoriId: kategoriId ? parseInt(kategoriId, 10) : null,
        penulisId: penulisId ? parseInt(penulisId, 10) : null,
        penerbitId: penerbitId ? parseInt(penerbitId, 10) : null,
        tahunTerbit: tahunTerbit ? parseInt(tahunTerbit, 10) : null,
        stok:
          stok !== undefined && stok !== null
            ? Math.max(0, parseInt(stok, 10))
            : 1,
        deskripsi: deskripsi || null,
        cover: cover || null,
      },
      include: { kategori: true, penulis: true, penerbit: true },
    });
    invalidateCatalogCache();

    // Asynchronously update embedding with new metadata
    const embedText = `${buku.judul} ${buku.penulis?.nama ?? ''} ${buku.kategori?.nama ?? ''} ${buku.deskripsi ?? ''}`.trim();
    computeEmbedding(embedText, 'RETRIEVAL_DOCUMENT').then(async (vec) => {
      if (vec && vec.length) {
        const vectorStr = `[${Array.from(vec).join(',')}]`;
        await prisma.$executeRaw`
          UPDATE buku 
          SET embedding = ${vectorStr}::vector 
          WHERE id = ${buku.id}
        `.catch((e) => console.warn('[EMBEDDING] Failed to update vector for book:', e.message));
      }
    }).catch((e) => console.warn('[EMBEDDING] Failed to compute updated vector for book:', e.message));

    return NextResponse.json(buku);
  } catch (error) {
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "ISBN sudah digunakan oleh buku lain" },
        { status: 409 },
      );
    }
    return handleApiError(error, "Gagal memperbarui data buku");
  }
}

export async function DELETE(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Akses ditolak. Khusus Admin." },
        { status: 403 },
      );
    }

    const { id } = await params;
    const bukuId = parseInt(id, 10);
    if (!bukuId || isNaN(bukuId)) {
      return NextResponse.json({ error: "ID tidak valid" }, { status: 400 });
    }

    const active = await prisma.peminjaman.count({
      where: {
        bukuId: bukuId,
        status: { in: ["DIPINJAM", "TERLAMBAT", "MENUNGGU_KONFIRMASI"] },
      },
    });

    if (active > 0) {
      return NextResponse.json(
        {
          error:
            "Buku masih memiliki peminjaman atau pengajuan aktif, tidak dapat dihapus",
        },
        { status: 409 },
      );
    }

    await prisma.buku.delete({ where: { id: bukuId } });
    invalidateCatalogCache();
    return NextResponse.json({ message: "Buku berhasil dihapus" });
  } catch (error) {
    return handleApiError(error, "Gagal menghapus buku");
  }
}
