import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function PUT(req, { params }) {
  const { id } = await params;
  const { nama, nis, kelas, alamat, noHp } = await req.json();
  try {
    const data = await prisma.anggota.update({
      where: { id: parseInt(id) },
      data: { nama, nis, kelas, alamat, noHp },
    });
    return NextResponse.json(data);
  } catch (e) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}

export async function DELETE(req, { params }) {
  try {
    const { id } = await params;
    const anggota = await prisma.anggota.findUnique({
      where: { id: parseInt(id) },
      include: { _count: { select: { peminjaman: { where: { status: 'DIPINJAM' } } } } },
    });
    if (anggota._count.peminjaman > 0) {
      return NextResponse.json({ error: 'Anggota masih memiliki peminjaman aktif' }, { status: 409 });
    }
    await prisma.user.delete({ where: { id: anggota.userId } });
    return NextResponse.json({ message: 'Anggota dihapus' });
  } catch (e) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
