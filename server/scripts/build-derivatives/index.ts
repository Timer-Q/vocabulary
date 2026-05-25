import { config } from 'dotenv';

config({ path: '.env.local' });
config({ path: '.env' });

import { buildDerivedDataFile } from './build-derived-data';
import { ensureEcdictCsv } from './download-ecdict';
import { enrichAllSelections } from './enrich-llm';
import { fetchAllWiktionary } from './fetch-wiktionary-derived';
import { selectAllDerivatives } from './select-derivatives';
import { loadSelectionsFromCache } from './load-selection-cache';

type Stage = 'all' | 'ecdict' | 'wiktionary' | 'select' | 'llm' | 'build';

function parseArgs(): { stage: Stage; force: boolean; skipLlm: boolean; skipWiktionary: boolean } {
  const args = process.argv.slice(2);
  let stage: Stage = 'all';
  let force = false;
  let skipLlm = false;
  let skipWiktionary = false;

  for (const arg of args) {
    if (arg === '--force') {
      force = true;
    }
    if (arg === '--skip-llm') {
      skipLlm = true;
    }
    if (arg === '--skip-wiktionary') {
      skipWiktionary = true;
    }
    if (arg.startsWith('--stage=')) {
      stage = arg.slice('--stage='.length) as Stage;
    }
  }

  return { stage, force, skipLlm, skipWiktionary };
}

async function main(): Promise<void> {
  const { stage, force, skipLlm, skipWiktionary } = parseArgs();
  console.log(
    `[build-derivatives] stage=${stage} force=${force} skipLlm=${skipLlm} skipWiktionary=${skipWiktionary}`,
  );

  if (stage === 'all' || stage === 'ecdict') {
    await ensureEcdictCsv();
    if (stage === 'ecdict') {
      return;
    }
  }

  if (stage === 'build') {
    buildDerivedDataFile();
    return;
  }

  if (!skipWiktionary && (stage === 'all' || stage === 'wiktionary')) {
    await fetchAllWiktionary(force);
    if (stage === 'wiktionary') {
      return;
    }
  }

  let selections;
  if (stage === 'llm') {
    selections = loadSelectionsFromCache();
  } else if (stage === 'all' || stage === 'select') {
    selections = await selectAllDerivatives();
    if (stage === 'select') {
      return;
    }
  } else {
    selections = await selectAllDerivatives();
  }

  if (stage === 'all' || stage === 'llm') {
    await enrichAllSelections(selections, { useLlm: !skipLlm, force });
    if (stage === 'llm') {
      return;
    }
  }

  if (stage === 'all') {
    buildDerivedDataFile();
  }
}

void main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
