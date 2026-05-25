import { MORPHEME_CATALOG } from '../src/modules/roots/morpheme-catalog';
import { expandMorphemeCatalog, normalizeMorphemeForm } from '../src/modules/roots/morpheme-detail-expander';
import {
  DERIVED_MORPHEME_STORIES,
  DERIVED_WORDS,
  DERIVED_WORD_MORPHEME_LINKS,
} from './seed/derived-data';
import { SEED_EXAMPLES, SEED_WORDS, SEED_WORD_MORPHEME_LINKS } from './seed-data';

const MIN_DERIVED_PER_MORPHEME = 10;
const MIN_DERIVED_STORY_LENGTH = 20;

function main(): void {
  const expanded = expandMorphemeCatalog(MORPHEME_CATALOG);
  const detailKeys = new Set(expanded.details.map((d) => `${d.kind}:${d.normalizedForm}`));
  const catalogKeys = MORPHEME_CATALOG.map((m) => `${m.kind}:${normalizeMorphemeForm(m.form)}`);

  const missing = catalogKeys.filter((key) => !detailKeys.has(key));
  if (missing.length > 0) {
    throw new Error(`Missing morpheme details: ${missing.slice(0, 5).join(', ')} (+${missing.length})`);
  }

  const emptyStory = expanded.details.filter((d) => !d.story.trim());
  if (emptyStory.length > 0) {
    throw new Error(`Empty stories: ${emptyStory.length}`);
  }

  const emptyDerivatives = expanded.details.filter((d) => d.derivatives.length === 0);
  if (emptyDerivatives.length > 0) {
    throw new Error(`No derivatives: ${emptyDerivatives.map((d) => d.form).slice(0, 5).join(', ')}`);
  }

  const spellings = new Set(SEED_WORDS.map((w) => w.spelling.toLowerCase()));
  const missingWords = expanded.details
    .flatMap((d) => d.derivatives)
    .filter((s) => !spellings.has(s.toLowerCase()));
  const uniqueMissing = [...new Set(missingWords)];
  if (uniqueMissing.length > 0 && DERIVED_WORDS.length === 0) {
    throw new Error(`Derivatives missing seed words: ${uniqueMissing.slice(0, 5).join(', ')}`);
  }

  if (DERIVED_WORDS.length > 0) {
    const linksByMorpheme = new Map<string, number>();
    for (const link of DERIVED_WORD_MORPHEME_LINKS) {
      const key = `${link.morphemeKind}:${normalizeMorphemeForm(link.morphemeForm)}`;
      linksByMorpheme.set(key, (linksByMorpheme.get(key) ?? 0) + 1);
    }

    const underfilled: string[] = [];
    for (const morpheme of MORPHEME_CATALOG) {
      const key = `${morpheme.kind}:${normalizeMorphemeForm(morpheme.form)}`;
      const count = linksByMorpheme.get(key) ?? 0;
      if (count < MIN_DERIVED_PER_MORPHEME) {
        underfilled.push(`${key}(${count})`);
      }
    }
    if (underfilled.length > 0) {
      throw new Error(
        `Derived links below ${MIN_DERIVED_PER_MORPHEME}: ${underfilled.slice(0, 8).join(', ')} (+${underfilled.length})`,
      );
    }

    const storyByKey = new Map(
      DERIVED_MORPHEME_STORIES.map((s) => [`${s.kind}:${s.normalizedForm}`, s.story]),
    );
    const missingDerivedStories = catalogKeys.filter((key) => {
      const story = storyByKey.get(key);
      return !story || story.trim().length < MIN_DERIVED_STORY_LENGTH;
    });
    if (missingDerivedStories.length > 0) {
      throw new Error(
        `Missing derived stories: ${missingDerivedStories.slice(0, 5).join(', ')} (+${missingDerivedStories.length})`,
      );
    }
  }

  if (SEED_EXAMPLES.length < MORPHEME_CATALOG.length) {
    console.warn(
      `Examples (${SEED_EXAMPLES.length}) fewer than morphemes (${MORPHEME_CATALOG.length}); merged examples expected.`,
    );
  }

  console.log(
    `OK: ${MORPHEME_CATALOG.length} morphemes, ${expanded.details.length} details, ${SEED_WORDS.length} words, ${SEED_EXAMPLES.length} examples, derived words ${DERIVED_WORDS.length}`,
  );
}

main();
