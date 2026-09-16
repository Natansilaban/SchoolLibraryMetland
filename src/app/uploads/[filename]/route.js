import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';

const MIME_TYPES = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
};

export async function GET(req, { params }) {
  try {
    const { filename } = await params;
    if (!filename) {
      return new NextResponse('Not found', { status: 404 });
    }

    // Strict path traversal prevention: ensure it's purely a filename
    const safeName = path.basename(filename);
    if (safeName !== filename || safeName.includes('..')) {
      return new NextResponse('Bad request', { status: 400 });
    }

    const ext = path.extname(safeName).toLowerCase();
    const contentType = MIME_TYPES[ext];
    if (!contentType) {
      return new NextResponse('Unsupported type', { status: 415 });
    }

    const filePath = path.join(process.cwd(), 'public', 'uploads', safeName);
    const fileBuffer = await readFile(filePath);

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch {
    return new NextResponse('File not found', { status: 404 });
  }
}
