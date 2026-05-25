/**
 * 从 morpheme-word 关联起续跑 seed（词素/单词已写入时使用）。
 * 用法: pnpm --filter @vocabulary/server run prisma:seed:resume
 */
import { config } from 'dotenv';

config({ path: '.env.local' });
config({ path: '.env' });

import { ContentStatus, MorphemeKind } from '@prisma/client';
import { createSeedPrisma, disconnectSeedClient, withSeedRetry } from './seed-db';
import {
  SEED_EXAMPLES,
  SEED_ROOT_RELATIONS,
  SEED_WORD_MORPHEME_LINKS,
  SEED_WORD_RELATIONS,
} from './seed-data';

function normalizeMorphemeForm(form: string): string {
  return form.replace(/^-+|-+$/g, '').toLowerCase();
}

function morphemeKey(kind: MorphemeKind, form: string): string {
  return `${kind}:${normalizeMorphemeForm(form)}`;
}

async function main(): Promise<void> {
  const { prisma, pool } = createSeedPrisma();

  const wordIdBySpelling = new Map<string, bigint>();
  const words = await withSeedRetry('load words', () =>
    prisma.word.findMany({ select: { id: true, spelling: true } }),
  );
  for (const w of words) {
    wordIdBySpelling.set(w.spelling.toLowerCase(), w.id);
  }
  console.log(`[seed-resume] loaded ${wordIdBySpelling.size} words from DB`);

  const morphemeIdByKey = new Map<string, bigint>();
  const morphemes = await withSeedRetry('load morphemes', () =>
    prisma.morpheme.findMany({ select: { id: true, kind: true, normalizedForm: true } }),
  );
  for (const m of morphemes) {
    morphemeIdByKey.set(`${m.kind}:${m.normalizedForm}`, m.id);
  }

  const rootIdByForm = new Map<string, bigint>();
  const roots = await withSeedRetry('load roots', () =>
    prisma.root.findMany({ select: { id: true, form: true } }),
  );
  for (const r of roots) {
    rootIdByForm.set(r.form, r.id);
  }

  console.log(`[seed-resume] morpheme-word links: ${SEED_WORD_MORPHEME_LINKS.length}…`);
  for (let i = 0; i < SEED_WORD_MORPHEME_LINKS.length; i += 1) {
    const link = SEED_WORD_MORPHEME_LINKS[i];
    const wordId = wordIdBySpelling.get(link.spelling.toLowerCase());
    const morphemeId = morphemeIdByKey.get(morphemeKey(link.morphemeKind, link.morphemeForm));
    if (!wordId || !morphemeId) {
      continue;
    }

    await withSeedRetry(`morpheme-word ${link.spelling}:${link.order}`, () =>
      prisma.morphemeWord.upsert({
        where: { wordId_order: { wordId, order: link.order } },
        update: {
          morphemeId,
          position: link.position,
          displayForm: link.displayForm ?? null,
        },
        create: {
          wordId,
          morphemeId,
          position: link.position,
          order: link.order,
          displayForm: link.displayForm ?? null,
        },
      }),
    );

    if ((i + 1) % 500 === 0 || i === SEED_WORD_MORPHEME_LINKS.length - 1) {
      console.log(`[seed-resume] morpheme-word ${i + 1}/${SEED_WORD_MORPHEME_LINKS.length}`);
    }
  }

  console.log('[seed-resume] refreshing derivative counts…');
  await withSeedRetry('morpheme counts', () =>
    prisma.$executeRaw`
      UPDATE morpheme m
      SET derivative_count = COALESCE(sub.cnt, 0),
          productivity = COALESCE(sub.cnt, 0)
      FROM (
        SELECT morpheme_id, COUNT(*)::int AS cnt
        FROM morpheme_word
        GROUP BY morpheme_id
      ) sub
      WHERE m.id = sub.morpheme_id
    `,
  );
  await withSeedRetry('root counts', () =>
    prisma.$executeRaw`
      UPDATE root r
      SET derivative_count = COALESCE(sub.cnt, 0)
      FROM (
        SELECT root_id, COUNT(*)::int AS cnt
        FROM word_root
        GROUP BY root_id
      ) sub
      WHERE r.id = sub.root_id
    `,
  );

  for (const rel of SEED_ROOT_RELATIONS) {
    const fromRootId = rootIdByForm.get(rel.from);
    const toRootId = rootIdByForm.get(rel.to);
    if (!fromRootId || !toRootId) {
      continue;
    }
    await withSeedRetry(`root-relation ${rel.from}->${rel.to}`, () =>
      prisma.rootRelation.upsert({
        where: {
          fromRootId_toRootId_kind: { fromRootId, toRootId, kind: rel.kind },
        },
        update: { weight: 1 },
        create: { fromRootId, toRootId, kind: rel.kind },
      }),
    );
  }

  for (const rel of SEED_WORD_RELATIONS) {
    const fromWordId = wordIdBySpelling.get(rel.from.toLowerCase());
    const toWordId = wordIdBySpelling.get(rel.to.toLowerCase());
    if (!fromWordId || !toWordId) {
      continue;
    }
    await withSeedRetry(`word-relation ${rel.from}->${rel.to}`, () =>
      prisma.wordRelation.upsert({
        where: {
          fromWordId_toWordId_kind: { fromWordId, toWordId, kind: rel.kind },
        },
        update: { weight: 1 },
        create: { fromWordId, toWordId, kind: rel.kind },
      }),
    );
  }

  console.log(`[seed-resume] examples: ${SEED_EXAMPLES.length}…`);
  for (let i = 0; i < SEED_EXAMPLES.length; i += 1) {
    const ex = SEED_EXAMPLES[i];
    const wordId = wordIdBySpelling.get(ex.spelling.toLowerCase());
    if (!wordId) {
      continue;
    }
    const targetRootId = ex.targetRootForm ? rootIdByForm.get(ex.targetRootForm) : null;

    await withSeedRetry(`example ${ex.spelling}`, async () => {
      const existing = await prisma.example.findFirst({
        where: { wordId, sentence: ex.sentence },
      });
      if (existing) {
        await prisma.example.update({
          where: { id: existing.id },
          data: {
            translation: ex.translation,
            level: ex.level,
            source: ex.source,
            sourceMeta: ex.sourceMeta ?? undefined,
            targetRootId: targetRootId ?? null,
            status: ContentStatus.published,
          },
        });
      } else {
        await prisma.example.create({
          data: {
            wordId,
            targetRootId: targetRootId ?? null,
            sentence: ex.sentence,
            translation: ex.translation,
            level: ex.level,
            source: ex.source,
            sourceMeta: ex.sourceMeta ?? undefined,
            status: ContentStatus.published,
            createdBy: 'system',
          },
        });
      }
    });

    if ((i + 1) % 500 === 0 || i === SEED_EXAMPLES.length - 1) {
      console.log(`[seed-resume] examples ${i + 1}/${SEED_EXAMPLES.length}`);
    }
  }

  await disconnectSeedClient(prisma, pool);
  console.log(
    `[seed-resume] done: ${SEED_WORD_MORPHEME_LINKS.length} morpheme links, ${SEED_EXAMPLES.length} examples`,
  );
}

void main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
