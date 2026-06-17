import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

import { PrismaClient } from "@/generated/prisma/client";
import {
  logPoolerUpgradeOnce,
  resolveRuntimeDatabaseUrl,
} from "@/lib/db/resolve-runtime-database-url";

const globalForDb = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pgPool: Pool | undefined;
};

function getDatabasePoolMax(): number {
  const raw = process.env.DATABASE_POOL_MAX?.trim();

  if (!raw) {
    return 1;
  }

  const parsed = Number(raw);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return 1;
  }

  return Math.floor(parsed);
}

async function endPgPool(): Promise<void> {
  const pool = globalForDb.pgPool;

  if (!pool) {
    return;
  }

  globalForDb.pgPool = undefined;
  globalForDb.prisma = undefined;

  await pool.end().catch(() => undefined);
}

function registerPoolShutdown(): void {
  if (globalForDb.pgPool && !(globalForDb.pgPool as Pool & { __shutdown?: boolean }).__shutdown) {
    (globalForDb.pgPool as Pool & { __shutdown?: boolean }).__shutdown = true;

    const shutdown = () => {
      void endPgPool();
    };

    process.once("SIGINT", shutdown);
    process.once("SIGTERM", shutdown);
    process.once("beforeExit", shutdown);
  }
}

function getPgPool(): Pool {
  if (globalForDb.pgPool) {
    return globalForDb.pgPool;
  }

  const originalUrl = process.env.DATABASE_URL?.trim() ?? "";
  const connectionString = resolveRuntimeDatabaseUrl();

  logPoolerUpgradeOnce(originalUrl, connectionString);

  globalForDb.pgPool = new Pool({
    connectionString,
    max: getDatabasePoolMax(),
    min: 0,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 10_000,
    maxLifetimeSeconds: 60,
    allowExitOnIdle: true,
  });

  registerPoolShutdown();

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

export async function disconnectDatabase(): Promise<void> {
  if (globalForDb.prisma) {
    await globalForDb.prisma.$disconnect().catch(() => undefined);
  }

  await endPgPool();
}
