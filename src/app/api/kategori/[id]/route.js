import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function PUT(req, { params }) {
  const { id } = await params;
  const { nama, deskripsi } = await req.json();
  try {
    const data = await prisma.kategori.update({ where: { id: parseInt(id) }, data: { nama, deskripsi } });
    return NextResponse.json(data);
  } catch (e) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}

export async function DELETE(req, { params }) {
  try {
    const { id } = await params;
    await prisma.kategori.delete({ where: { id: parseInt(id) } });
    return NextResponse.json({ message: 'Dihapus' });
  } catch (e) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
