import { config } from 'dotenv';

config({ path: '.env.local' });
config({ path: '.env' });
import {
  ContentStatus,
  MorphemeKind,
  MorphemeLevel,
  Prisma,
  RootOrigin,
} from '@prisma/client';
import { createSeedPrisma, disconnectSeedClient, withSeedRetry } from './seed-db';
import { MORPHEME_CATALOG } from '../src/modules/roots/morpheme-catalog';
import { MORPHEME_ETYMOLOGY_SEEDS } from './seed/catalog-seed-merge';
import {
  SEED_EXAMPLES,
  SEED_ROOT_RELATIONS,
  SEED_ROOTS,
  SEED_WORD_MORPHEME_LINKS,
  SEED_WORD_RELATIONS,
  SEED_WORD_ROOT_LINKS,
  SEED_WORDS,
} from './seed-data';

function normalizeMorphemeForm(form: string): string {
  return form.replace(/^-+|-+$/g, '').toLowerCase();
}

function morphemeKey(kind: MorphemeKind, form: string): string {
  return `${kind}:${normalizeMorphemeForm(form)}`;
}

async function main(): Promise<void> {
  const { prisma, pool } = createSeedPrisma();

  const etymologyByKey = new Map(
    MORPHEME_ETYMOLOGY_SEEDS.map((item) => [`${item.kind}:${item.normalizedForm}`, item.story]),
  );

  console.log(`[seed] morphemes: ${MORPHEME_CATALOG.length}…`);
  for (let i = 0; i < MORPHEME_CATALOG.length; i += 1) {
    const morpheme = MORPHEME_CATALOG[i];
    const normalizedForm = normalizeMorphemeForm(morpheme.form);
    const etymology = etymologyByKey.get(`${morpheme.kind}:${normalizedForm}`) ?? null;
    await withSeedRetry(`morpheme ${morpheme.form}`, () =>
      prisma.morpheme.upsert({
      where: {
        kind_normalizedForm: {
          kind: morpheme.kind as MorphemeKind,
          normalizedForm,
        },
      },
      update: {
        form: morpheme.form,
        origin: morpheme.origin as RootOrigin,
        originLabel: morpheme.originLabel,
        meaning: morpheme.meaning,
        extendedMeaning: morpheme.extendedMeaning,
        etymology,
        level: morpheme.level as MorphemeLevel,
        derivativeCount: morpheme.derivativeCount,
        productivity: morpheme.derivativeCount,
      },
      create: {
        form: morpheme.form,
        normalizedForm,
        kind: morpheme.kind as MorphemeKind,
        origin: morpheme.origin as RootOrigin,
        originLabel: morpheme.originLabel,
        meaning: morpheme.meaning,
        extendedMeaning: morpheme.extendedMeaning,
        etymology,
        level: morpheme.level as MorphemeLevel,
        derivativeCount: morpheme.derivativeCount,
        productivity: morpheme.derivativeCount,
      },
      }),
    );
    if ((i + 1) % 50 === 0 || i === MORPHEME_CATALOG.length - 1) {
      console.log(`[seed] morphemes ${i + 1}/${MORPHEME_CATALOG.length}`);
    }
  }

  const rootIdByForm = new Map<string, bigint>();
  console.log(`[seed] roots: ${SEED_ROOTS.length}…`);
  for (const root of SEED_ROOTS) {
    const row = await withSeedRetry(`root ${root.form}`, () =>
      prisma.root.upsert({
      where: { form: root.form },
      update: {
        origin: root.origin,
        meaning: root.meaning,
        extendedMeaning: root.extendedMeaning ?? null,
        story: root.story ?? null,
      },
      create: {
        form: root.form,
        origin: root.origin,
        meaning: root.meaning,
        extendedMeaning: root.extendedMeaning ?? null,
        story: root.story ?? null,
      },
      }),
    );
    rootIdByForm.set(root.form, row.id);
  }

  const wordIdBySpelling = new Map<string, bigint>();
  console.log(`[seed] words: ${SEED_WORDS.length}…`);
  for (let i = 0; i < SEED_WORDS.length; i += 1) {
    const word = SEED_WORDS[i];
    const splitPattern = word.splitPattern.map((seg) => {
      const rootId = seg.rootForm ? rootIdByForm.get(seg.rootForm) : null;
      return {
        form: seg.form,
        type: seg.type,
        meaning: seg.meaning,
        rootId: rootId ? rootId.toString() : null,
      };
    });

    const row = await withSeedRetry(`word ${word.spelling}`, () =>
      prisma.word.upsert({
        where: { spelling: word.spelling },
        update: {
          phoneticUk: word.phoneticUk ?? null,
          phoneticUs: word.phoneticUs ?? null,
          frequency: word.frequency,
          level: word.level as unknown as Prisma.InputJsonValue,
          pos: word.pos as unknown as Prisma.InputJsonValue,
          splitPattern: splitPattern as unknown as Prisma.InputJsonValue,
        },
        create: {
          spelling: word.spelling,
          phoneticUk: word.phoneticUk ?? null,
          phoneticUs: word.phoneticUs ?? null,
          frequency: word.frequency,
          level: word.level as unknown as Prisma.InputJsonValue,
          pos: word.pos as unknown as Prisma.InputJsonValue,
          splitPattern: splitPattern as unknown as Prisma.InputJsonValue,
        },
      }),
    );
    wordIdBySpelling.set(word.spelling, row.id);
    if ((i + 1) % 100 === 0 || i === SEED_WORDS.length - 1) {
      console.log(`[seed] words ${i + 1}/${SEED_WORDS.length}`);
    }
  }

  console.log(`[seed] word-root links: ${SEED_WORD_ROOT_LINKS.length}…`);
  for (const link of SEED_WORD_ROOT_LINKS) {
    const wordId = wordIdBySpelling.get(link.spelling);
    const rootId = rootIdByForm.get(link.rootForm);
    if (!wordId || !rootId) {
      continue;
    }

    await prisma.wordRoot.upsert({
      where: { wordId_order: { wordId, order: link.order } },
      update: {
        rootId,
        position: link.position,
        displayForm: link.displayForm ?? null,
      },
      create: {
        wordId,
        rootId,
        position: link.position,
        order: link.order,
        displayForm: link.displayForm ?? null,
      },
    });
  }

  const morphemeIdByKey = new Map<string, bigint>();
  const allMorphemes = await withSeedRetry('load morphemes', () =>
    prisma.morpheme.findMany({ select: { id: true, kind: true, normalizedForm: true } }),
  );
  for (const m of allMorphemes) {
    morphemeIdByKey.set(`${m.kind}:${m.normalizedForm}`, m.id);
  }

  console.log(`[seed] morpheme-word links: ${SEED_WORD_MORPHEME_LINKS.length}…`);
  for (let i = 0; i < SEED_WORD_MORPHEME_LINKS.length; i += 1) {
    const link = SEED_WORD_MORPHEME_LINKS[i];
    const wordId = wordIdBySpelling.get(link.spelling);
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
      console.log(`[seed] morpheme-word ${i + 1}/${SEED_WORD_MORPHEME_LINKS.length}`);
    }
  }

  console.log('[seed] refreshing derivative counts…');
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

    await prisma.rootRelation.upsert({
      where: {
        fromRootId_toRootId_kind: {
          fromRootId,
          toRootId,
          kind: rel.kind,
        },
      },
      update: { weight: 1 },
      create: {
        fromRootId,
        toRootId,
        kind: rel.kind,
      },
    });
  }

  for (const rel of SEED_WORD_RELATIONS) {
    const fromWordId = wordIdBySpelling.get(rel.from);
    const toWordId = wordIdBySpelling.get(rel.to);
    if (!fromWordId || !toWordId) {
      continue;
    }

    await prisma.wordRelation.upsert({
      where: {
        fromWordId_toWordId_kind: {
          fromWordId,
          toWordId,
          kind: rel.kind,
        },
      },
      update: { weight: 1 },
      create: {
        fromWordId,
        toWordId,
        kind: rel.kind,
      },
    });
  }

  console.log(`[seed] examples: ${SEED_EXAMPLES.length}…`);
  for (let i = 0; i < SEED_EXAMPLES.length; i += 1) {
    const ex = SEED_EXAMPLES[i];
    const wordId = wordIdBySpelling.get(ex.spelling);
    if (!wordId) {
      continue;
    }
    const targetRootId = ex.targetRootForm ? rootIdByForm.get(ex.targetRootForm) : null;

    await withSeedRetry(`example ${ex.spelling}`, async () => {
      const existing = await prisma.example.findFirst({
        where: {
          wordId,
          sentence: ex.sentence,
        },
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

    if ((i + 1) % 100 === 0 || i === SEED_EXAMPLES.length - 1) {
      console.log(`[seed] examples ${i + 1}/${SEED_EXAMPLES.length}`);
    }
  }

  await disconnectSeedClient(prisma, pool);
  console.log(`Seeded ${MORPHEME_CATALOG.length} morphemes, ${SEED_ROOTS.length} roots, ${SEED_WORDS.length} words`);
}

void main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
