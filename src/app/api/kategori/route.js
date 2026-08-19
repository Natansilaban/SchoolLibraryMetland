import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  const data = await prisma.kategori.findMany({ orderBy: { nama: 'asc' } });
  return NextResponse.json(data);
}

export async function POST(req) {
  try {
    const { nama, deskripsi } = await req.json();
    if (!nama) return NextResponse.json({ error: 'Nama wajib diisi' }, { status: 400 });
    const data = await prisma.kategori.create({ data: { nama, deskripsi } });
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    if (error.code === 'P2002') return NextResponse.json({ error: 'Nama kategori sudah ada' }, { status: 409 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
