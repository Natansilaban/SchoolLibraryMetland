import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { serverErrMsg } from '@/lib/apiError';

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Autentikasi diperlukan' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const rawPage = parseInt(searchParams.get('page') || '1');
    const rawLimit = parseInt(searchParams.get('limit') || '20');
    const page = Math.max(rawPage, 1);
    const limit = Math.min(Math.max(rawLimit, 1), 100);

    const isStudent = session.user.role === 'SISWA';
    const rawAnggotaId = isStudent ? session.user.anggotaId : searchParams.get('anggotaId');
    const targetAnggotaId = rawAnggotaId ? parseInt(rawAnggotaId) : null;

    if (isStudent && !targetAnggotaId) {
      return NextResponse.json({ data: [], total: 0, page: 1, limit });
    }

    const where = {
      AND: [
        status ? { status } : {},
        targetAnggotaId ? { anggotaId: targetAnggotaId } : {},
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
  } catch (error) {
    return NextResponse.json({ error: serverErrMsg(error) }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Autentikasi diperlukan' }, { status: 401 });
    }

    const body = await req.json();
    const { anggotaId, bukuId, tglKembaliRencana, catatan, status: statusDirect } = body;

    const isAdmin = session.user?.role === 'ADMIN';

    const targetAnggotaId = isAdmin
      ? (anggotaId ? parseInt(anggotaId) : null)
      : (session.user?.anggotaId ? parseInt(session.user.anggotaId) : null);

    if (!targetAnggotaId || !bukuId || !tglKembaliRencana) {
      return NextResponse.json({ error: 'Data peminjaman tidak lengkap' }, { status: 400 });
    }

    const parsedDate = new Date(tglKembaliRencana);
    if (isNaN(parsedDate.getTime())) {
      return NextResponse.json({ error: 'Format tanggal rencana pengembalian tidak valid' }, { status: 400 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (parsedDate < today) {
      return NextResponse.json({ error: 'Tanggal pengembalian tidak boleh di masa lalu' }, { status: 400 });
    }

    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 30);
    if (parsedDate > maxDate) {
      return NextResponse.json({ error: 'Batas waktu peminjaman maksimal adalah 30 hari' }, { status: 400 });
    }

    const initialStatus = (isAdmin && statusDirect === 'DIPINJAM') ? 'DIPINJAM' : 'MENUNGGU_KONFIRMASI';

    const result = await prisma.$transaction(async (tx) => {
      if (isAdmin) {
        const anggotaExists = await tx.anggota.findUnique({ where: { id: targetAnggotaId }, select: { id: true } });
        if (!anggotaExists) {
          throw new Error('Anggota dengan ID tersebut tidak ditemukan');
        }
      }

      const activeCount = await tx.peminjaman.count({
        where: {
          anggotaId: targetAnggotaId,
          status: { in: ['MENUNGGU_KONFIRMASI', 'DIPINJAM', 'TERLAMBAT'] },
        },
      });

      if (activeCount >= 3) {
        throw new Error('Batas kuota peminjaman aktif tercapai (maksimal 3 buku). Kembalikan buku yang dipinjam terlebih dahulu.');
      }

      const buku = await tx.buku.findUnique({ where: { id: parseInt(bukuId) } });
      if (!buku || buku.stok < 1) {
        throw new Error('Stok buku tidak tersedia');
      }

      const existing = await tx.peminjaman.findFirst({
        where: {
          anggotaId: targetAnggotaId,
          bukuId: parseInt(bukuId),
          status: { in: ['MENUNGGU_KONFIRMASI', 'DIPINJAM', 'TERLAMBAT'] },
        },
      });

      if (existing) {
        if (existing.status === 'MENUNGGU_KONFIRMASI') {
          throw new Error('Anda sudah memiliki pengajuan yang menunggu konfirmasi untuk buku ini');
        }
        throw new Error('Buku ini masih sedang dipinjam oleh anggota');
      }

      const peminjaman = await tx.peminjaman.create({
        data: {
          anggotaId: targetAnggotaId,
          bukuId: parseInt(bukuId),
          adminId: initialStatus === 'DIPINJAM' && session?.user?.id ? parseInt(session.user.id) : null,
          tglKembaliRencana: parsedDate,
          catatan,
          status: initialStatus,
        },
        include: {
          anggota: true,
          buku: true,
        },
      });

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
    return NextResponse.json({ error: serverErrMsg(error) }, { status: 500 });
  }
}
