import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function PUT(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Autentikasi diperlukan' }, { status: 401 });
    }

    const { id } = await params;
    const anggotaId = parseInt(id);
    if (!anggotaId || isNaN(anggotaId)) {
      return NextResponse.json({ error: 'ID tidak valid' }, { status: 400 });
    }

    const isAdmin = session.user?.role === 'ADMIN';
    const isOwner = session.user?.anggotaId === anggotaId;
    if (!isAdmin && !isOwner) {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });
    }

    const { nama, nis, kelas, alamat, noHp } = await req.json();
    const data = await prisma.anggota.update({
      where: { id: anggotaId },
      data: { nama, nis, kelas, alamat, noHp },
    });
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Akses ditolak. Khusus Admin.' }, { status: 403 });
    }

    const { id } = await params;
    const anggotaId = parseInt(id);
    if (!anggotaId || isNaN(anggotaId)) {
      return NextResponse.json({ error: 'ID tidak valid' }, { status: 400 });
    }

    const anggota = await prisma.anggota.findUnique({
      where: { id: anggotaId },
      include: {
        _count: {
          select: {
            peminjaman: {
              where: { status: { in: ['DIPINJAM', 'TERLAMBAT', 'MENUNGGU_KONFIRMASI'] } },
            },
          },
        },
      },
    });

    if (!anggota) {
      return NextResponse.json({ error: 'Anggota tidak ditemukan' }, { status: 404 });
    }

    if (anggota._count.peminjaman > 0) {
      return NextResponse.json(
        { error: 'Anggota masih memiliki peminjaman atau pengajuan aktif yang belum selesai' },
        { status: 409 }
      );
    }

    await prisma.user.delete({ where: { id: anggota.userId } });
    return NextResponse.json({ message: 'Anggota berhasil dihapus' });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

