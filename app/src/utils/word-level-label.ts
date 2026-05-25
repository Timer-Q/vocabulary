import type { WordLevelTag } from '@/services/api/types';

const LEVEL_LABELS: Record<string, string> = {
  cet4: 'CET-4',
  cet6: 'CET-6',
  kaoyan: '考研',
  ielts: 'IELTS',
  toefl: 'TOEFL',
  gre: 'GRE',
};

export function formatLevelTag(tag: WordLevelTag): string {
  const key = tag.trim().toLowerCase();
  return LEVEL_LABELS[key] ?? tag.toUpperCase();
}
