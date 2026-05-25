import * as fs from 'node:fs';
import * as path from 'node:path';

export const SERVER_ROOT = path.resolve(__dirname, '../..');
export const CACHE_ROOT = path.join(SERVER_ROOT, '.cache');
export const ECDICT_CSV_PATH = path.join(CACHE_ROOT, 'ecdict.csv');
export const WIKTIONARY_CACHE_DIR = path.join(CACHE_ROOT, 'wiktionary');
export const SELECTION_CACHE_DIR = path.join(CACHE_ROOT, 'selection');
export const DERIVATIVES_CACHE_DIR = path.join(CACHE_ROOT, 'derivatives');
export const DERIVED_DATA_PATH = path.join(SERVER_ROOT, 'prisma/seed/derived-data.ts');

export function ensureDir(dir: string): void {
  fs.mkdirSync(dir, { recursive: true });
}

export function cacheFileName(kind: string, form: string): string {
  const safe = form.replace(/[^a-z0-9-]/gi, '_').toLowerCase();
  return `${kind}-${safe}.json`;
}

export function readJsonFile<T>(filePath: string): T | null {
  if (!fs.existsSync(filePath)) {
    return null;
  }
  const raw = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(raw) as T;
}

export function writeJsonFile(filePath: string, data: unknown): void {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
