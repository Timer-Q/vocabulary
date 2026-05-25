import type { RootDetailRemote } from '@/services/api/roots';
import type { RootDetailData } from '@/types/learning';
import type { MorphemeKind } from '@/types/roots';
import {
  catalogItemToRootDetail,
  enrichRootDetail,
} from '@/utils/morpheme-detail-builder';
import { findCatalogMorpheme, mergeCatalogDerivativeSamples } from '@/utils/morpheme-derivatives';

export function catalogToRootDetail(form: string, kind?: MorphemeKind): RootDetailData | null {
  const normalized = form.replace(/^-+|-+$/g, '').toLowerCase();
  const item = findCatalogMorpheme(normalized, kind) ?? findCatalogMorpheme(form, kind);
  if (!item) {
    return null;
  }
  return catalogItemToRootDetail(item);
}

export function remoteToRootDetail(remote: RootDetailRemote): RootDetailData {
  const originKey = remote.origin as RootDetailData['originKey'];
  return enrichRootDetail({
    id: remote.id,
    kind: remote.kind,
    level: remote.level as RootDetailData['level'],
    form: remote.form,
    originKey,
    originLabel: remote.originLabel,
    meaning: remote.meaning,
    extendedMeaning: remote.extendedMeaning ?? undefined,
    story: remote.story ?? undefined,
    derivatives: mergeCatalogDerivativeSamples(
      remote.derivatives.map((d) => ({
        spelling: d.spelling,
        gloss: d.gloss,
        wordId: d.wordId,
        isPreview: d.isPreview,
      })),
      remote.form,
      remote.kind,
    ),
    examples: remote.examples,
  });
}
