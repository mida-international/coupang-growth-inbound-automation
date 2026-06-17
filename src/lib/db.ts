import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

import { PrismaClient } from "@/generated/prisma/client";

const globalForDb = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pgPool: Pool | undefined;
};

function getDatabasePoolMax(): number {
  const raw = process.env.DATABASE_POOL_MAX?.trim();

  if (!raw) {
    return 2;
  }

  const parsed = Number(raw);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return 2;
  }

  return Math.floor(parsed);
}

function getPgPool(): Pool {
  if (globalForDb.pgPool) {
    return globalForDb.pgPool;
  }

  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL 환경 변수가 설정되지 않았습니다.");
  }

  globalForDb.pgPool = new Pool({
    connectionString,
    max: getDatabasePoolMax(),
    idleTimeoutMillis: 20_000,
    connectionTimeoutMillis: 10_000,
  });

  return globalForDb.pgPool;
}

function createPrismaClient(): PrismaClient {
  const adapter = new PrismaPg(getPgPool());
  return new PrismaClient({ adapter });
}

function getPrismaClient(): PrismaClient {
  if (!globalForDb.prisma) {
    globalForDb.prisma = createPrismaClient();
  }

  return globalForDb.prisma;
}

export const prisma = getPrismaClient();
