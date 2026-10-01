import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getPaginationParams, handleApiError } from '@/lib/api-error';
import bcrypt from 'bcryptjs';

// Sliding-window IP rate limiter to mitigate registration bcrypt CPU-exhaustion DoS
const registrationLimits = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REGISTRATIONS_PER_WINDOW = 5;

function isRateLimited(ip) {
  const now = Date.now();
  const entry = registrationLimits.get(ip) || [];
  const validTimestamps = entry.filter((time) => now - time < RATE_LIMIT_WINDOW_MS);

  if (validTimestamps.length >= MAX_REGISTRATIONS_PER_WINDOW) {
    return true;
  }

  validTimestamps.push(now);
  registrationLimits.set(ip, validTimestamps);

  // Periodic cleanup if map grows
  if (registrationLimits.size > 1000) {
    for (const [key, times] of registrationLimits.entries()) {
      if (times.every((t) => now - t >= RATE_LIMIT_WINDOW_MS)) {
        registrationLimits.delete(key);
      }
    }
  }

  return false;
}

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Akses ditolak. Khusus Admin.' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const { page, limit, skip } = getPaginationParams(searchParams, 20, 100);

    const where = search ? {
      OR: [
        { nama: { contains: search, mode: 'insensitive' } },
        { nis: { contains: search, mode: 'insensitive' } },
        { kelas: { contains: search, mode: 'insensitive' } },
      ],
    } : {};

    const [data, total] = await Promise.all([
      prisma.anggota.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { email: true } },
          _count: { select: { peminjaman: true } },
        },
      }),
      prisma.anggota.count({ where }),
    ]);

    return NextResponse.json({ data, total, page, limit });
  } catch (error) {
    return handleApiError(error, 'Gagal memuat data anggota');
  }
}

export async function POST(req) {
  try {
    // Rate limit public registration
    const forwarded = req.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0].trim() : 'local';

    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: 'Terlalu banyak permintaan pendaftaran. Silakan tunggu 1 menit sebelum mencoba lagi.' },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { nama, nis, kelas, email, password, alamat, noHp } = body || {};

    if (!nama || !nis || !kelas || !email || !password) {
      return NextResponse.json({ error: 'Nama, NIS, Kelas, Email, dan Password wajib diisi' }, { status: 400 });
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Format alamat email tidak valid' }, { status: 400 });
    }

    if (password.length < 6 || password.length > 72) {
      return NextResponse.json({ error: 'Password harus memiliki panjang antara 6 hingga 72 karakter' }, { status: 400 });
    }

    const trimmedNis = String(nis).trim();
    if (trimmedNis.length < 3 || trimmedNis.length > 25) {
      return NextResponse.json({ error: 'Panjang NIS harus antara 3 hingga 25 karakter' }, { status: 400 });
    }

    const hash = await bcrypt.hash(password, 10);

    const anggota = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: String(email).toLowerCase().trim(),
          password: hash,
          role: 'SISWA',
        },
      });
      return tx.anggota.create({
        data: {
          userId: user.id,
          nama: String(nama).trim(),
          nis: trimmedNis,
          kelas: String(kelas).trim(),
          alamat: alamat ? String(alamat).trim() : null,
          noHp: noHp ? String(noHp).trim() : null,
        },
        include: { user: { select: { email: true } } },
      });
    });

    return NextResponse.json(anggota, { status: 201 });
  } catch (error) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Alamat Email atau NIS tersebut sudah terdaftar' }, { status: 409 });
    }
    return handleApiError(error, 'Gagal memproses pendaftaran anggota');
  }
}
