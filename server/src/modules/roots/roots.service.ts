import { Injectable, NotFoundException } from '@nestjs/common';
import { MorphemeKind, RootOrigin } from '@prisma/client';
import { PrismaService } from '../../common/prisma.service';
import { ExamplesService } from '../examples/examples.service';
import {
  buildCatalogDerivativeSamples,
  mergeDerivativeSamples,
} from './morpheme-derivatives';
import { MORPHEME_CATALOG } from './morpheme-catalog';
import {
  MorphemeKind as ApiMorphemeKind,
  RootDetailPayload,
  RootDerivativeItem,
  RootListItem,
  RootListPayload,
} from './roots.types';

const ORIGIN_LABELS: Record<RootOrigin, string> = {
  latin: '拉丁语',
  greek: '希腊语',
  old_english: '古英语',
  french: '法语',
  other: '其他',
};

const MORPHEME_KINDS: ApiMorphemeKind[] = ['root', 'prefix', 'suffix', 'combining_form'];

function normalizeMorphemeForm(form: string): string {
  return form.replace(/^-+|-+$/g, '').toLowerCase();
}

function findCatalogMorpheme(kind: ApiMorphemeKind, normalizedForm: string): RootListItem | undefined {
  return MORPHEME_CATALOG.find(
    (item) => item.kind === kind && normalizeMorphemeForm(item.form) === normalizedForm,
  );
}

function isRootOrigin(value?: string): value is RootOrigin {
  return Boolean(value && Object.values(RootOrigin).includes(value as RootOrigin));
}

function isMorphemeKind(value?: string): value is ApiMorphemeKind {
  return Boolean(value && MORPHEME_KINDS.includes(value as ApiMorphemeKind));
}

function matchesQuery(item: RootListItem, query: string): boolean {
  return (
    item.form.toLowerCase().includes(query) ||
    item.meaning.toLowerCase().includes(query) ||
    item.originLabel.toLowerCase().includes(query) ||
    (item.extendedMeaning?.toLowerCase().includes(query) ?? false)
  );
}

function sortMorphemes(a: RootListItem, b: RootListItem): number {
  const kindOrder: Record<ApiMorphemeKind, number> = {
    root: 0,
    prefix: 1,
    suffix: 2,
    combining_form: 3,
  };
  return (
    kindOrder[a.kind] - kindOrder[b.kind] ||
    b.derivativeCount - a.derivativeCount ||
    a.form.localeCompare(b.form)
  );
}

function glossFromWordPos(wordPos: unknown): string {
  if (Array.isArray(wordPos) && wordPos.length > 0) {
    const first = wordPos[0] as { meaning?: string };
    if (typeof first?.meaning === 'string') {
      return first.meaning;
    }
  }
  return '派生词';
}

function mapDerivatives(
  links: { word: { id: bigint; spelling: string; pos: unknown } }[],
): RootDerivativeItem[] {
  return links.map((link) => ({
    spelling: link.word.spelling,
    gloss: glossFromWordPos(link.word.pos),
    wordId: link.word.id.toString(),
  }));
}

@Injectable()
export class RootsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly examplesService: ExamplesService,
  ) {}

  async list(query?: string, origin?: string, kind?: string): Promise<RootListPayload> {
    const q = query?.trim().toLowerCase();
    const originFilter = isRootOrigin(origin) ? origin : undefined;
    const kindFilter = isMorphemeKind(kind) ? kind : undefined;
    const morphemes = await this.prisma.morpheme.findMany({
      where: {
        ...(originFilter ? { origin: originFilter } : {}),
        ...(kindFilter ? { kind: kindFilter } : {}),
        ...(q
          ? {
              OR: [
                { form: { contains: q, mode: 'insensitive' } },
                { meaning: { contains: q, mode: 'insensitive' } },
                { originLabel: { contains: q, mode: 'insensitive' } },
                { extendedMeaning: { contains: q, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      orderBy: [{ level: 'asc' }, { derivativeCount: 'desc' }, { form: 'asc' }],
    });
    const roots =
      kindFilter && kindFilter !== 'root'
        ? []
        : await this.prisma.root.findMany({
            where: {
              ...(originFilter ? { origin: originFilter } : {}),
              ...(q
                ? {
                    OR: [
                      { form: { contains: q, mode: 'insensitive' } },
                      { meaning: { contains: q, mode: 'insensitive' } },
                    ],
                  }
                : {}),
            },
            orderBy: [{ derivativeCount: 'desc' }, { form: 'asc' }],
          });

    const items: RootListItem[] = roots.map((root) => ({
      id: root.id.toString(),
      kind: 'root',
      form: root.form,
      origin: root.origin,
      originLabel: ORIGIN_LABELS[root.origin],
      meaning: root.meaning,
      extendedMeaning: root.extendedMeaning,
      level: 'core',
      derivativeCount: root.derivativeCount,
    }));

    const morphemeItems: RootListItem[] = morphemes.map((morpheme) => ({
      id: morpheme.id.toString(),
      kind: morpheme.kind,
      form: morpheme.form,
      origin: morpheme.origin,
      originLabel: morpheme.originLabel,
      meaning: morpheme.meaning,
      extendedMeaning: morpheme.extendedMeaning,
      level: morpheme.level,
      derivativeCount: morpheme.derivativeCount,
    }));

    const byKey = new Map<string, RootListItem>();
    for (const item of MORPHEME_CATALOG) {
      byKey.set(`${item.kind}:${item.form}`, item);
    }
    for (const item of morphemeItems) {
      byKey.set(`${item.kind}:${item.form}`, item);
    }
    for (const item of items) {
      byKey.set(`${item.kind}:${item.form}`, item);
    }

    const merged = [...byKey.values()].filter((item) => {
      if (originFilter && item.origin !== originFilter) {
        return false;
      }
      if (kindFilter && item.kind !== kindFilter) {
        return false;
      }
      return q ? matchesQuery(item, q) : true;
    });
    merged.sort(sortMorphemes);

    return { items: merged, total: merged.length };
  }

  async getByForm(form: string, kind?: string): Promise<RootDetailPayload> {
    const normalized = normalizeMorphemeForm(form);
    const kindFilter = isMorphemeKind(kind) ? (kind as MorphemeKind) : undefined;

    const morpheme = await this.prisma.morpheme.findFirst({
      where: kindFilter
        ? { kind: kindFilter, normalizedForm: normalized }
        : {
            OR: [{ normalizedForm: normalized }, { form: { equals: form, mode: 'insensitive' } }],
          },
      include: {
        words: {
          include: { word: true },
          orderBy: { order: 'asc' },
        },
      },
      orderBy: [{ kind: 'asc' }],
    });

    if (!morpheme) {
      throw new NotFoundException('morpheme_not_found');
    }

    const catalogItem = findCatalogMorpheme(morpheme.kind, morpheme.normalizedForm);
    const catalogSamples = catalogItem ? buildCatalogDerivativeSamples(catalogItem) : [];
    const derivatives = mergeDerivativeSamples(mapDerivatives(morpheme.words), catalogSamples);
    const wordIds = morpheme.words.map((link) => link.wordId);

    const rootRow =
      morpheme.kind === 'root'
        ? await this.prisma.root.findUnique({
            where: { form: morpheme.normalizedForm },
          })
        : null;

    const story =
      (morpheme.kind === 'root' ? rootRow?.story : null) ?? morpheme.etymology ?? null;

    const examplesByWords = await this.examplesService.listByWordIds(wordIds, 5);
    let examples = examplesByWords;

    if (rootRow) {
      const rootExamples = await this.examplesService.listByRoot(Number(rootRow.id), 3);
      const seen = new Set(examples.map((e) => e.id));
      for (const ex of rootExamples) {
        if (!seen.has(ex.id)) {
          examples.push(ex);
          seen.add(ex.id);
        }
      }
      examples = examples.slice(0, 6);
    }

    return {
      id: morpheme.id.toString(),
      kind: morpheme.kind,
      level: morpheme.level,
      form: morpheme.form,
      origin: morpheme.origin,
      originLabel: morpheme.originLabel,
      meaning: morpheme.meaning,
      extendedMeaning: morpheme.extendedMeaning,
      story,
      derivativeCount: Math.max(
        morpheme.derivativeCount,
        derivatives.length,
        catalogItem?.derivativeCount ?? 0,
      ),
      derivatives,
      examples,
    };
  }

  async findIdByForm(form: string, kind?: string): Promise<bigint | null> {
    const normalized = normalizeMorphemeForm(form);
    const kindFilter = isMorphemeKind(kind) ? (kind as MorphemeKind) : undefined;
    const morpheme = await this.prisma.morpheme.findFirst({
      where: kindFilter
        ? { kind: kindFilter, normalizedForm: normalized }
        : { normalizedForm: normalized },
      select: { id: true },
      orderBy: [{ kind: 'asc' }],
    });
    return morpheme?.id ?? null;
  }
}
