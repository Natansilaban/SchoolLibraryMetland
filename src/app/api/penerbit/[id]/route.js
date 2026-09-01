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
    const penerbitId = parseInt(id);
    if (!penerbitId || isNaN(penerbitId)) {
      return NextResponse.json({ error: 'ID tidak valid' }, { status: 400 });
    }

    const { nama, kota, website } = await req.json();
    const data = await prisma.penerbit.update({
      where: { id: penerbitId },
      data: { nama: nama?.trim(), kota: kota?.trim() || null, website: website?.trim() || null },
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
    const penerbitId = parseInt(id);
    if (!penerbitId || isNaN(penerbitId)) {
      return NextResponse.json({ error: 'ID tidak valid' }, { status: 400 });
    }

    await prisma.penerbit.delete({ where: { id: penerbitId } });
    return NextResponse.json({ message: 'Penerbit berhasil dihapus' });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

