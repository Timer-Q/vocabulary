import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';

const TRANSIENT_ERROR =
  /Connection terminated|ECONNRESET|ETIMEDOUT|connection closed|socket hang up/i;

export function resolveSeedConnectionString(): string {
  const direct = process.env.DIRECT_URL?.trim();
  const pooled = process.env.DATABASE_URL?.trim();
  const connectionString = direct || pooled;

  if (!connectionString) {
    throw new Error('DIRECT_URL or DATABASE_URL is required for seed');
  }

  if (!direct && pooled?.includes('pooler')) {
    console.warn(
      '[seed] 未设置 DIRECT_URL，当前使用 Pooler 连接；大批量 seed 可能中断。请在 .env.local 配置 Supabase Direct Connection。',
    );
  } else if (direct?.includes('pooler')) {
    console.warn(
      '[seed] DIRECT_URL 仍指向 pooler（Session/Transaction），不是 db.<project>.supabase.co 直连；大批量 seed 仍可能中断。请在 Supabase → Database → Connection string 选择 Direct connection。',
    );
  }

  return connectionString;
}

export function createSeedPrisma(): { prisma: PrismaClient; pool: Pool } {
  const pool = new Pool({
    connectionString: resolveSeedConnectionString(),
    max: 4,
    idleTimeoutMillis: 120_000,
    connectionTimeoutMillis: 60_000,
    keepAlive: true,
  });

  const prisma = new PrismaClient({
    adapter: new PrismaPg(pool),
  });

  return { prisma, pool };
}

export async function disconnectSeedClient(prisma: PrismaClient, pool: Pool): Promise<void> {
  await prisma.$disconnect();
  await pool.end();
}

export function isTransientDbError(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err);
  return TRANSIENT_ERROR.test(message);
}

export async function withSeedRetry<T>(label: string, fn: () => Promise<T>, attempts = 4): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (!isTransientDbError(err) || attempt === attempts) {
        throw err;
      }
      const delayMs = attempt * 1500;
      console.warn(`[seed] ${label} 连接中断，${delayMs}ms 后重试 (${attempt}/${attempts})…`);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  throw lastError;
}
