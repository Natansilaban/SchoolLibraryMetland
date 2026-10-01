import { NextResponse } from 'next/server';

/**
 * Parses and bounds pagination parameters to protect against DoS attacks.
 * @param {URLSearchParams} searchParams
 * @param {number} defaultLimit
 * @param {number} maxLimit
 * @returns {{ page: number, limit: number, skip: number }}
 */
export function getPaginationParams(searchParams, defaultLimit = 20, maxLimit = 100) {
  const rawPage = parseInt(searchParams.get('page') || '1', 10);
  const rawLimit = parseInt(searchParams.get('limit') || String(defaultLimit), 10);

  const page = isNaN(rawPage) || rawPage < 1 ? 1 : rawPage;
  const limit = isNaN(rawLimit) || rawLimit < 1 ? defaultLimit : Math.min(maxLimit, rawLimit);
  const skip = (page - 1) * limit;

  return { page, limit, skip };
}

/**
 * Sanitizes and handles API errors, masking sensitive database/Prisma internals.
 * @param {Error|any} error
 * @param {string} [customMessage]
 * @returns {NextResponse}
 */
export function handleApiError(error, customMessage) {
  // Always log the full trace on server-side for maintainers
  console.error('[API Handler Error]:', error);

  if (!error) {
    return NextResponse.json(
      { error: customMessage || 'Terjadi kesalahan internal pada server' },
      { status: 500 }
    );
  }

  // Handle Prisma-specific codes
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

  // Detect sensitive database/ORM traces in error message
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

  // Explicit operational error messages (safe business exceptions)
  return NextResponse.json(
    { error: msg || customMessage || 'Terjadi kesalahan pada server' },
    { status: error.statusCode || 500 }
  );
}
