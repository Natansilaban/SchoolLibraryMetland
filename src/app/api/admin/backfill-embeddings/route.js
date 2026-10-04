import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { computeBatchEmbeddings } from '@/lib/search/embeddings';

const BATCH = parseInt(process.env.EMBEDDING_BATCH_SIZE, 10) || 15;

async function requireAdmin(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.user?.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  return null;
}

export async function GET(req) {
  const deny = await requireAdmin(req);
  if (deny) return deny;

  try {
    const [{ count: nullCount }, { count: totalCount }] = await Promise.all([
      prisma.$queryRaw`SELECT COUNT(*)::int AS count FROM buku WHERE embedding IS NULL`.then(r => r[0]),
      prisma.$queryRaw`SELECT COUNT(*)::int AS count FROM buku`.then(r => r[0]),
    ]);

    return NextResponse.json({
      total: Number(totalCount),
      withEmbedding: Number(totalCount) - Number(nullCount),
      nullEmbedding: Number(nullCount),
      ready: Number(nullCount) === 0,
    });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req) {
  const deny = await requireAdmin(req);
  if (deny) return deny;

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (obj) => {
        controller.enqueue(encoder.encode(JSON.stringify(obj) + '\n'));
      };

      try {
        const books = await prisma.$queryRaw`
          SELECT
            b.id,
            b.judul,
            b.deskripsi,
            p.nama AS penulis_nama,
            k.nama AS kategori_nama
          FROM buku b
          LEFT JOIN penulis  p ON b.penulis_id  = p.id
          LEFT JOIN kategori k ON b.kategori_id = k.id
          WHERE b.embedding IS NULL
          ORDER BY b.id ASC
        `;

        send({ type: 'start', total: books.length });

        if (books.length === 0) {
          send({ type: 'done', success: 0, failed: 0, message: 'All books already have embeddings.' });
          controller.close();
          return;
        }

        let success = 0, failed = 0;

        for (let i = 0; i < books.length; i += BATCH) {
          const batch = books.slice(i, i + BATCH);
          const texts = batch.map(b => [
            b.judul,
            b.penulis_nama  ? 'Penulis: '  + b.penulis_nama  : '',
            b.kategori_nama ? 'Kategori: ' + b.kategori_nama : '',
            b.deskripsi ?? '',
          ].filter(Boolean).join('. ').slice(0, 512));

          try {
            const vecs = await computeBatchEmbeddings(texts, 'RETRIEVAL_DOCUMENT');

            for (let j = 0; j < batch.length; j++) {
              const vec = vecs[j];
              if (!vec || vec.length === 0) { failed++; continue; }
              const vecStr = '[' + Array.from(vec).join(',') + ']';
              await prisma.$executeRaw`
                UPDATE buku SET embedding = ${vecStr}::vector WHERE id = ${batch[j].id}
              `;
              success++;
            }

            send({
              type: 'progress',
              processed: Math.min(i + BATCH, books.length),
              total: books.length,
              success,
              failed,
            });
          } catch (batchErr) {
            failed += batch.length;
            send({ type: 'batch_error', message: batchErr.message, batch: i });
          }

          await new Promise(r => setTimeout(r, 200));
        }

        send({ type: 'done', success, failed });
      } catch (err) {
        send({ type: 'error', message: err.message });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'application/x-ndjson',
      'Transfer-Encoding': 'chunked',
      'Cache-Control': 'no-store',
    },
  });
}
