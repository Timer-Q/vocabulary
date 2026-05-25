import type { ExampleItem } from '@/services/api/types';
import type { RootDerivative, RootDetailData } from '@/types/learning';
import type { MorphemeKind, RootListItem } from '@/types/roots';

const ENGLISH_WORD_PATTERN = /[A-Za-z][A-Za-z-]*/g;
const DERIVATIVE_LIMIT = 5;
const EXAMPLE_LIMIT = 2;

const KIND_LABEL: Record<MorphemeKind, string> = {
  root: '词根',
  prefix: '前缀',
  suffix: '后缀',
  combining_form: '连结词素',
};

function normalizeForm(form: string): string {
  return form.replace(/^-+|-+$/g, '').toLowerCase();
}

export function extractDerivativeWords(extendedMeaning: string | null | undefined): string[] {
  const matches = extendedMeaning?.match(ENGLISH_WORD_PATTERN) ?? [];
  const seen = new Set<string>();
  return matches
    .map((w) => w.replace(/^-+|-+$/g, '').toLowerCase())
    .filter((w) => {
      if (w.length < 3 || seen.has(w)) {
        return false;
      }
      seen.add(w);
      return true;
    })
    .slice(0, DERIVATIVE_LIMIT);
}

export function buildMorphemeStory(item: RootListItem, derivatives: string[]): string {
  const sample = derivatives.slice(0, 3).join('、') || '常见派生词';
  const kindLabel = KIND_LABEL[item.kind];
  const layer =
    item.level === 'advanced'
      ? '进阶层词素在学术与专业阅读中更常出现，'
      : '核心层词素在四六级与日常阅读中高频出现，';

  if (item.kind === 'root') {
    return `${item.form} 源自${item.originLabel}，本义「${item.meaning}」。${layer}拆词时先锁定这一节，再联系 ${sample} 等词族，能更快建立语义网络。`;
  }
  if (item.kind === 'prefix') {
    return `${item.form} 是${kindLabel}，多表示「${item.meaning}」。${layer}贴在词头会改写整词方向，可先从 ${sample} 等组合记牢。`;
  }
  if (item.kind === 'suffix') {
    return `${item.form} 是${kindLabel}，常表达「${item.meaning}」。${layer}它决定词性与抽象走向，留意 ${sample} 等尾缀搭配。`;
  }
  return `${item.form} 是${kindLabel}，含义为「${item.meaning}」。${layer}多见于科技术语组合，如 ${sample}，可与相邻词素并列记忆。`;
}

function glossForKind(kind: MorphemeKind): string {
  if (kind === 'root') {
    return '派生词';
  }
  if (kind === 'prefix') {
    return '含前缀';
  }
  if (kind === 'suffix') {
    return '含后缀';
  }
  return '组合词';
}

function buildExampleSentence(item: RootListItem, derivative: string): { en: string; zh: string } {
  const norm = normalizeForm(item.form);
  if (item.kind === 'root') {
    return {
      en: `In ${derivative}, the root "${norm}" carries the idea of ${item.meaning}.`,
      zh: `在 ${derivative} 中，词根 ${norm} 承载「${item.meaning}」的核心义。`,
    };
  }
  if (item.kind === 'prefix') {
    return {
      en: `The prefix in ${derivative} shifts the word toward "${item.meaning}".`,
      zh: `${derivative} 中的前缀把词义引向「${item.meaning}」。`,
    };
  }
  if (item.kind === 'suffix') {
    return {
      en: `${derivative} ends with ${item.form}, marking "${item.meaning}".`,
      zh: `${derivative} 以 ${item.form} 收尾，体现「${item.meaning}」的语法功能。`,
    };
  }
  return {
    en: `${derivative} combines ${item.form} with another stem in technical English.`,
    zh: `${derivative} 在专业英语里把 ${item.form} 与另一词干组合使用。`,
  };
}

function buildOfflineExamples(item: RootListItem, derivatives: string[]): ExampleItem[] {
  return derivatives.slice(0, EXAMPLE_LIMIT).map((spelling, index) => {
    const { en, zh } = buildExampleSentence(item, spelling);
    const lower = en.toLowerCase();
    const start = lower.indexOf(spelling.toLowerCase());
    return {
      id: `offline-ex-${item.id}-${index}`,
      wordId: `offline-${spelling}`,
      level: 'basic',
      source: 'other',
      sourceMeta: { morpheme: item.form },
      sentence: en,
      translation: zh,
      audioUkUrl: null,
      audioUsUrl: null,
      audioSlowUrl: null,
      highlightSpans:
        start >= 0 ? [{ start, end: start + spelling.length, type: 'target' as const }] : [],
      grammarTags: null,
      likes: 0,
    };
  });
}

export function catalogItemToRootDetail(item: RootListItem): RootDetailData {
  const derivatives = extractDerivativeWords(item.extendedMeaning);
  const gloss = glossForKind(item.kind);

  return {
    id: item.id,
    kind: item.kind,
    level: item.level,
    form: item.form,
    originKey: item.origin,
    originLabel: item.originLabel,
    meaning: item.meaning,
    extendedMeaning: item.extendedMeaning ?? undefined,
    story: buildMorphemeStory(item, derivatives),
    derivatives: derivatives.map((spelling) => ({
      spelling,
      gloss,
      isPreview: false,
    })),
    examples: buildOfflineExamples(item, derivatives),
  };
}

export function enrichRootDetail(detail: RootDetailData): RootDetailData {
  const derivatives =
    detail.derivatives.length > 0
      ? detail.derivatives
      : extractDerivativeWords(detail.extendedMeaning).map((spelling) => ({
          spelling,
          gloss: glossForKind(detail.kind),
          isPreview: false,
        }));

  const story = detail.story ?? buildMorphemeStory(
    {
      id: detail.id,
      kind: detail.kind,
      form: detail.form,
      origin: detail.originKey,
      originLabel: detail.originLabel,
      meaning: detail.meaning,
      extendedMeaning: detail.extendedMeaning ?? null,
      level: detail.level,
      derivativeCount: derivatives.length,
    },
    derivatives.map((d) => d.spelling),
  );

  const examples =
    detail.examples.length > 0
      ? detail.examples
      : buildOfflineExamples(
          {
            id: detail.id,
            kind: detail.kind,
            form: detail.form,
            origin: detail.originKey,
            originLabel: detail.originLabel,
            meaning: detail.meaning,
            extendedMeaning: detail.extendedMeaning ?? null,
            level: detail.level,
            derivativeCount: derivatives.length,
          },
          derivatives.map((d) => d.spelling),
        );

  return {
    ...detail,
    story,
    derivatives: derivatives.map((d) => ({ ...d, isPreview: d.isPreview ?? false })),
    examples,
  };
}
