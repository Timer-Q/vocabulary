import * as fs from 'node:fs';
import * as https from 'node:https';
import * as zlib from 'node:zlib';
import { parse } from 'csv-parse/sync';
import { CACHE_ROOT, ECDICT_CSV_PATH, ensureDir } from './paths';
import type { EcdictRow } from './types';

const ECDICT_URLS = [
  'https://raw.githubusercontent.com/skywind3000/ECDICT/master/ecdict.csv',
  'https://github.com/skywind3000/ECDICT/releases/download/1.0.28/ecdict.csv',
];

function downloadToFile(url: string, destPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destPath);
    https
      .get(url, (response) => {
        if (
          response.statusCode &&
          response.statusCode >= 300 &&
          response.statusCode < 400 &&
          response.headers.location
        ) {
          file.close();
          fs.unlinkSync(destPath);
          downloadToFile(response.headers.location, destPath).then(resolve).catch(reject);
          return;
        }
        if (response.statusCode !== 200) {
          file.close();
          fs.unlink(destPath, () => undefined);
          reject(new Error(`HTTP ${response.statusCode} for ${url}`));
          return;
        }
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          resolve();
        });
      })
      .on('error', (err) => {
        file.close();
        fs.unlink(destPath, () => undefined);
        reject(err);
      });
  });
}

function gunzipIfNeeded(filePath: string): string {
  if (!filePath.endsWith('.gz')) {
    return filePath;
  }
  const outPath = filePath.replace(/\.gz$/, '');
  const buf = zlib.gunzipSync(fs.readFileSync(filePath));
  fs.writeFileSync(outPath, buf);
  fs.unlinkSync(filePath);
  return outPath;
}

function parseTags(tag: string | undefined): string[] {
  if (!tag?.trim()) {
    return [];
  }
  return tag
    .split(/\s+/)
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);
}

function parseCollins(value: string | undefined): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function parseOptionalInt(value: string | undefined): number | null {
  if (!value?.trim()) {
    return null;
  }
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function rowToEcdict(record: Record<string, string>): EcdictRow | null {
  const word = record.word?.trim().toLowerCase();
  if (!word) {
    return null;
  }
  const translation = record.translation?.trim() || null;
  if (!translation) {
    return null;
  }

  return {
    word,
    phonetic: record.phonetic?.trim() || null,
    definition: record.definition?.trim() || null,
    translation,
    pos: record.pos?.trim() || null,
    collins: parseCollins(record.collins),
    oxford: record.oxford === '1',
    tags: parseTags(record.tag),
    bnc: parseOptionalInt(record.bnc),
    frq: parseOptionalInt(record.frq),
  };
}

export async function ensureEcdictCsv(): Promise<string> {
  ensureDir(CACHE_ROOT);
  if (fs.existsSync(ECDICT_CSV_PATH)) {
    console.log(`[ecdict] 使用缓存 ${ECDICT_CSV_PATH}`);
    return ECDICT_CSV_PATH;
  }

  let lastError: unknown;
  for (const url of ECDICT_URLS) {
    const tempPath = `${ECDICT_CSV_PATH}.download`;
    const gzPath = url.endsWith('.gz') ? `${tempPath}.gz` : tempPath;
    try {
      console.log(`[ecdict] 下载 ${url} …`);
      await downloadToFile(url, gzPath);
      const csvPath = gunzipIfNeeded(gzPath);
      if (csvPath !== ECDICT_CSV_PATH) {
        fs.renameSync(csvPath, ECDICT_CSV_PATH);
      }
      console.log(`[ecdict] 已保存到 ${ECDICT_CSV_PATH}`);
      return ECDICT_CSV_PATH;
    } catch (err) {
      lastError = err;
      if (fs.existsSync(gzPath)) {
        fs.unlinkSync(gzPath);
      }
      if (fs.existsSync(tempPath)) {
        fs.unlinkSync(tempPath);
      }
      console.warn(`[ecdict] ${url} 失败:`, err instanceof Error ? err.message : err);
    }
  }

  throw lastError ?? new Error('ECDICT download failed');
}

let ecdictIndex: Map<string, EcdictRow> | null = null;
let ecdictRows: EcdictRow[] | null = null;

export async function loadEcdict(): Promise<Map<string, EcdictRow>> {
  if (ecdictIndex) {
    return ecdictIndex;
  }

  const csvPath = await ensureEcdictCsv();
  console.log('[ecdict] 解析 CSV …');
  const content = fs.readFileSync(csvPath, 'utf8');
  const records = parse(content, {
    columns: true,
    skip_empty_lines: true,
    relax_column_count: true,
    bom: true,
  }) as Record<string, string>[];

  const index = new Map<string, EcdictRow>();
  const rows: EcdictRow[] = [];

  for (const record of records) {
    const row = rowToEcdict(record);
    if (!row) {
      continue;
    }
    index.set(row.word, row);
    rows.push(row);
  }

  ecdictIndex = index;
  ecdictRows = rows;
  console.log(`[ecdict] 已加载 ${index.size} 条词条`);
  return index;
}

export function getEcdictRows(): EcdictRow[] {
  if (!ecdictRows) {
    throw new Error('ECDICT not loaded; call loadEcdict() first');
  }
  return ecdictRows;
}

export function lookupEcdict(index: Map<string, EcdictRow>, spelling: string): EcdictRow | undefined {
  return index.get(spelling.toLowerCase());
}
