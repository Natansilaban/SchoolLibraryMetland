import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function PUT(req, { params }) {
  const { id } = await params;
  const { nama, kota, website } = await req.json();
  const data = await prisma.penerbit.update({ where: { id: parseInt(id) }, data: { nama, kota, website } });
  return NextResponse.json(data);
}

export async function DELETE(req, { params }) {
  try {
    const { id } = await params;
    await prisma.penerbit.delete({ where: { id: parseInt(id) } });
    return NextResponse.json({ message: 'Dihapus' });
  } catch (e) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
