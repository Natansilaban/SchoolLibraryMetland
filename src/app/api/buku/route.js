import { prisma } from '@/lib/prisma';
import { searchCatalog } from '@/lib/search/catalog-search';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getPaginationParams, handleApiError } from '@/lib/api-error';
import { getCachedCatalog, setCachedCatalog, invalidateCatalogCache } from '@/lib/catalog-cache';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const kategoriId = searchParams.get('kategoriId');
    const mode = searchParams.get('mode') || 'auto';
    const { page, limit } = getPaginationParams(searchParams, 20, 100);

    const cacheKey = `${search.toLowerCase().trim()}_${kategoriId || 'all'}_${page}_${limit}_${mode}`;
    const cached = getCachedCatalog(cacheKey);
    if (cached) {
      return NextResponse.json(cached, {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
          'X-Cache': 'HIT',
        },
      });
    }

    const result = await searchCatalog({
      query: search,
      kategoriId,
      page,
      limit,
      searchMode: mode,
    });

    setCachedCatalog(cacheKey, result);

    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
        'X-Cache': 'MISS',
      },
    });
  } catch (error) {
    return handleApiError(error, 'Gagal memuat katalog buku');
  }
}

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Akses ditolak. Khusus Admin.' }, { status: 403 });
    }

    const body = await req.json();
    const { judul, isbn, kategoriId, penulisId, penerbitId, tahunTerbit, stok, deskripsi, cover } = body;

    if (!judul || !judul.trim()) {
      return NextResponse.json({ error: 'Judul buku wajib diisi' }, { status: 400 });
    }

    const buku = await prisma.buku.create({
      data: {
        judul: judul.trim(),
        isbn: isbn ? isbn.trim() : null,
        kategoriId: kategoriId ? parseInt(kategoriId) : null,
        penulisId: penulisId ? parseInt(penulisId) : null,
        penerbitId: penerbitId ? parseInt(penerbitId) : null,
        tahunTerbit: tahunTerbit ? parseInt(tahunTerbit) : null,
        stok: stok !== undefined && stok !== null ? Math.max(0, parseInt(stok)) : 1,
        deskripsi: deskripsi || null,
        cover: cover || null,
      },
      include: {
        kategori: true,
        penulis: true,
        penerbit: true,
      },
    });

    invalidateCatalogCache();
    return NextResponse.json(buku, { status: 201 });
  } catch (error) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'ISBN sudah digunakan oleh buku lain' }, { status: 409 });
    }
    return handleApiError(error, 'Gagal menambahkan buku baru');
  }
}
