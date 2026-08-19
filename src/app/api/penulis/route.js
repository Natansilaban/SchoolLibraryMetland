import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  const data = await prisma.penulis.findMany({ orderBy: { nama: 'asc' } });
  return NextResponse.json(data);
}

export async function POST(req) {
  const { nama, bio } = await req.json();
  if (!nama) return NextResponse.json({ error: 'Nama wajib diisi' }, { status: 400 });
  const data = await prisma.penulis.create({ data: { nama, bio } });
  return NextResponse.json(data, { status: 201 });
}
