import { MVP_ROOT_ID_TO_FORM } from '@/data/mvp';
import type { WordSplitSegment } from '@/services/api/types';

/** 从拆词段解析词根形态，优先 API 字段，其次 MVP 静态映射 */
export function resolveRootForm(segment: WordSplitSegment): string | null {
  if (segment.rootForm) {
    return segment.rootForm;
  }
  if (segment.rootId && MVP_ROOT_ID_TO_FORM[segment.rootId]) {
    return MVP_ROOT_ID_TO_FORM[segment.rootId];
  }
  if (segment.type === 'root') {
    return segment.form.replace(/^-+|-+$/g, '');
  }
  return null;
}
