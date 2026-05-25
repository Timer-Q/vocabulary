import { MVP_ROOT_LIBRARY } from '@/data/mvp';
import { MORPHEME_CATALOG } from '@/data/morpheme-catalog';
import type { MorphemeKind, RootListData, RootListItem, RootOriginKey } from '@/types/roots';

function toListItem(form: string, detail: (typeof MVP_ROOT_LIBRARY)[string]): RootListItem {
  return {
    id: detail.id,
    kind: 'root',
    form: detail.form || form,
    origin: detail.originKey,
    originLabel: detail.originLabel,
    meaning: detail.meaning,
    extendedMeaning: detail.extendedMeaning ?? null,
    level: 'core',
    derivativeCount: detail.derivatives.length,
  };
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
  const kindOrder: Record<MorphemeKind, number> = {
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

export function mergeWithMorphemeCatalog(items: RootListItem[]): RootListItem[] {
  const byKey = new Map<string, RootListItem>();
  for (const item of MORPHEME_CATALOG) {
    byKey.set(`${item.kind}:${item.form}`, item);
  }
  for (const item of items) {
    byKey.set(`${item.kind}:${item.form}`, item);
  }
  return [...byKey.values()].sort(sortMorphemes);
}

export function filterMorphemeItems(
  items: RootListItem[],
  query?: string,
  origin?: RootOriginKey,
  kind?: MorphemeKind,
): RootListItem[] {
  const q = query?.trim().toLowerCase() ?? '';
  let filtered = items;

  if (kind) {
    filtered = filtered.filter((item) => item.kind === kind);
  }
  if (origin) {
    filtered = filtered.filter((item) => item.origin === origin);
  }
  if (q) {
    filtered = filtered.filter((item) => matchesQuery(item, q));
  }

  return filtered.sort(sortMorphemes);
}

export function buildMvpRootList(
  query?: string,
  origin?: RootOriginKey,
  kind?: MorphemeKind,
): RootListData {
  const items = filterMorphemeItems(
    mergeWithMorphemeCatalog(
      Object.entries(MVP_ROOT_LIBRARY).map(([form, detail]) => toListItem(form, detail)),
    ),
    query,
    origin,
    kind,
  );
  return { items, total: items.length };
}
