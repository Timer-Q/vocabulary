import dotenv from 'dotenv';
import { defineConfig, env } from 'prisma/config';

dotenv.config({ path: '.env.local' });
dotenv.config();

/** Prisma CLI（migrate / introspect）使用直连；Nest 里 PrismaService 使用 DATABASE_URL 连接池。 */
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: env('DIRECT_URL'),
  },
});
