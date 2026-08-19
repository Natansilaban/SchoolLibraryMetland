import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET /api/peminjaman
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search') || '';
  const status = searchParams.get('status') || '';
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const anggotaId = searchParams.get('anggotaId');

  const where = {
    AND: [
      status ? { status } : {},
      anggotaId ? { anggotaId: parseInt(anggotaId) } : {},
      search ? {
        OR: [
          { buku: { judul: { contains: search, mode: 'insensitive' } } },
          { anggota: { nama: { contains: search, mode: 'insensitive' } } },
          { anggota: { nis: { contains: search, mode: 'insensitive' } } },
        ],
      } : {},
    ],
  };

  const [data, total] = await Promise.all([
    prisma.peminjaman.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        anggota: { select: { id: true, nama: true, nis: true, kelas: true } },
        buku: { select: { id: true, judul: true, isbn: true, stok: true } },
      },
    }),
    prisma.peminjaman.count({ where }),
  ]);

  return NextResponse.json({ data, total, page, limit });
}

// POST /api/peminjaman
export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    const body = await req.json();
    const { anggotaId, bukuId, tglKembaliRencana, catatan, status: statusDirect } = body;

    // Use anggotaId from body, or fallback to session user's anggotaId for students
    const targetAnggotaId = anggotaId ? parseInt(anggotaId) : session?.user?.anggotaId;

    if (!targetAnggotaId || !bukuId || !tglKembaliRencana) {
      return NextResponse.json({ error: 'Data tidak lengkap' }, { status: 400 });
    }

    const isAdmin = session?.user?.role === 'ADMIN';
    // If admin requested DIPINJAM directly, or default to MENUNGGU_KONFIRMASI
    const initialStatus = (isAdmin && statusDirect === 'DIPINJAM') ? 'DIPINJAM' : 'MENUNGGU_KONFIRMASI';

    const result = await prisma.$transaction(async (tx) => {
      // Check stok
      const buku = await tx.buku.findUnique({ where: { id: parseInt(bukuId) } });
      if (!buku || buku.stok < 1) {
        throw new Error('Stok buku tidak tersedia');
      }

      // Check if already has active or pending loan for this book
      const existing = await tx.peminjaman.findFirst({
        where: {
          anggotaId: targetAnggotaId,
          bukuId: parseInt(bukuId),
          status: { in: ['MENUNGGU_KONFIRMASI', 'DIPINJAM', 'TERLAMBAT'] },
        },
      });
      if (existing) {
        if (existing.status === 'MENUNGGU_KONFIRMASI') {
          throw new Error('Anda sudah mempunyai pengajuan yang menunggu konfirmasi untuk buku ini');
        }
        throw new Error('Anggota sedang meminjam buku ini');
      }

      // Create peminjaman
      const peminjaman = await tx.peminjaman.create({
        data: {
          anggotaId: targetAnggotaId,
          bukuId: parseInt(bukuId),
          adminId: initialStatus === 'DIPINJAM' && session?.user?.id ? parseInt(session.user.id) : null,
          tglKembaliRencana: new Date(tglKembaliRencana),
          catatan,
          status: initialStatus,
        },
        include: {
          anggota: true,
          buku: true,
        },
      });

      // If status is DIPINJAM (direct admin loan), reduce stock immediately
      if (initialStatus === 'DIPINJAM') {
        await tx.buku.update({
          where: { id: parseInt(bukuId) },
          data: { stok: { decrement: 1 } },
        });
      }

      return peminjaman;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
