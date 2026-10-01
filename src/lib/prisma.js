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
      max: 10,
      min: 2,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 4000,
      keepAlive: true,
      keepAliveInitialDelayMillis: 10000,
      statement_timeout: 10000,
    });

    globalForPrisma.pgPool.on('error', (err) => {
      console.error('Unexpected error on idle pg client', err);
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
