import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const globalForPrisma = globalThis;

function getPgPool() {
  if (!globalForPrisma.pgPool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is required');
    }
    globalForPrisma.pgPool = new Pool({
      connectionString,
      max: 5,
      min: 1,
      idleTimeoutMillis: 60000,
      connectionTimeoutMillis: 15000,
      keepAlive: true,
      keepAliveInitialDelayMillis: 2000,
      statement_timeout: 10000,
      query_timeout: 10000,
    });

    globalForPrisma.pgPool.on('error', (err) => {
      if (err.message?.includes('Connection terminated') || err.message?.includes('timeout')) {
        return;
      }
      console.warn('[DB POOL] Database pool notice:', err.message);
    });
  }
  return globalForPrisma.pgPool;
}

function createPrismaClient() {
  const pool = getPgPool();
  const adapter = new PrismaPg(pool);
  return new PrismaClient({
    adapter,
    log: ['error'],
  });
}

export const prisma = globalForPrisma.prisma || createPrismaClient();
globalForPrisma.prisma = prisma;
