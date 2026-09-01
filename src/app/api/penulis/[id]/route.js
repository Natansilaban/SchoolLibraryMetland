import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function PUT(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Akses ditolak. Khusus Admin.' }, { status: 403 });
    }

    const { id } = await params;
    const penulisId = parseInt(id);
    if (!penulisId || isNaN(penulisId)) {
      return NextResponse.json({ error: 'ID tidak valid' }, { status: 400 });
    }

    const { nama, bio } = await req.json();
    const data = await prisma.penulis.update({
      where: { id: penulisId },
      data: { nama: nama?.trim(), bio: bio?.trim() || null },
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
    const penulisId = parseInt(id);
    if (!penulisId || isNaN(penulisId)) {
      return NextResponse.json({ error: 'ID tidak valid' }, { status: 400 });
    }

    await prisma.penulis.delete({ where: { id: penulisId } });
    return NextResponse.json({ message: 'Penulis berhasil dihapus' });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

