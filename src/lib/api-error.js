import { NextResponse } from 'next/server';

export function getPaginationParams(searchParams, defaultLimit = 20, maxLimit = 100) {
  const rawPage = parseInt(searchParams.get('page') || '1', 10);
  const rawLimit = parseInt(searchParams.get('limit') || String(defaultLimit), 10);

  const page = isNaN(rawPage) || rawPage < 1 ? 1 : rawPage;
  const limit = isNaN(rawLimit) || rawLimit < 1 ? defaultLimit : Math.min(maxLimit, rawLimit);
  const skip = (page - 1) * limit;

  return { page, limit, skip };
}

export function handleApiError(error, customMessage) {
  if (error?.code !== 'P2025') {
    console.error('[API Handler Error]:', error);
  } else {
    console.warn('[API Handler Notice]: Record not found (P2025)');
  }

  if (!error) {
    return NextResponse.json(
      { error: customMessage || 'Terjadi kesalahan internal pada server' },
      { status: 500 }
    );
  }
  if (error.code === 'P2002') {
    const target = Array.isArray(error.meta?.target) ? error.meta.target.join(', ') : 'tersebut';
    return NextResponse.json(
      { error: `Data dengan nilai unik ${target} sudah terdaftar di sistem.` },
      { status: 409 }
    );
  }

  if (error.code === 'P2003') {
    return NextResponse.json(
      { error: 'Operasi gagal karena data masih terhubung dengan relasi lain.' },
      { status: 409 }
    );
  }

  if (error.code === 'P2025') {
    return NextResponse.json(
      { error: 'Data yang dicari tidak ditemukan.' },
      { status: 404 }
    );
  }
  const msg = error.message || '';
  const isPrismaOrDbTrace =
    error.code?.startsWith('P') ||
    error.name?.includes('Prisma') ||
    msg.includes('prisma') ||
    msg.includes('Prisma') ||
    msg.includes('SELECT') ||
    msg.includes('INSERT') ||
    msg.includes('UPDATE') ||
    msg.includes('DELETE') ||
    msg.includes('postgresql://') ||
    msg.includes('connection');

  if (isPrismaOrDbTrace) {
    return NextResponse.json(
      { error: customMessage || 'Terjadi kendala pada pemrosesan database. Silakan coba beberapa saat lagi.' },
      { status: 500 }
    );
  }
  return NextResponse.json(
    { error: msg || customMessage || 'Terjadi kesalahan pada server' },
    { status: error.statusCode || 500 }
  );
}
