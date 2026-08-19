import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

// GET /api/anggota
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search') || '';
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');

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
      skip: (page - 1) * limit,
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
}

// POST /api/anggota — create user + anggota
export async function POST(req) {
  try {
    const { nama, nis, kelas, email, password, alamat, noHp } = await req.json();
    if (!nama || !nis || !kelas || !email || !password) {
      return NextResponse.json({ error: 'Semua field wajib wajib diisi' }, { status: 400 });
    }

    const hash = await bcrypt.hash(password, 10);

    const anggota = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: { email, password: hash, role: 'SISWA' },
      });
      return tx.anggota.create({
        data: { userId: user.id, nama, nis, kelas, alamat, noHp },
        include: { user: { select: { email: true } } },
      });
    });

    return NextResponse.json(anggota, { status: 201 });
  } catch (error) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Email atau NIS sudah terdaftar' }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
