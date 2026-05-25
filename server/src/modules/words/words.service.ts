import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import {
  PosEntry,
  SplitWordResult,
  WordDetail,
  WordScene,
  WordSplitSegment,
} from './words.types';

@Injectable()
export class WordsService {
  constructor(private readonly prisma: PrismaService) {}

  async getDetail(spelling: string): Promise<WordDetail> {
    const word = await this.prisma.word.findUnique({
      where: { spelling: spelling.toLowerCase() },
      include: {
        media: true,
        roots: { include: { root: true }, orderBy: { order: 'asc' } },
      },
    });

    if (!word) {
      throw new NotFoundException('word_not_found');
    }

    return {
      id: word.id.toString(),
      spelling: word.spelling,
      phoneticUk: word.phoneticUk,
      phoneticUs: word.phoneticUs,
      audioUkUrl: word.audioUkUrl,
      audioUsUrl: word.audioUsUrl,
      audioSlowUrl: word.audioSlowUrl,
      frequency: word.frequency,
      difficulty: word.difficulty,
      level: this.normalizeLevel(word.level),
      pos: this.normalizePos(word.pos),
      scenes: this.normalizeScenes(word.scenes),
      splitPattern: this.buildSplitPattern(word.splitPattern, word.roots),
      media: word.media.map((item) => ({
        type: item.type,
        url: item.url,
        thumbUrl: item.thumbUrl,
      })),
    };
  }

  async split(spelling: string): Promise<SplitWordResult> {
    const word = await this.prisma.word.findUnique({
      where: { spelling: spelling.toLowerCase() },
      include: { roots: { include: { root: true }, orderBy: { order: 'asc' } } },
    });

    if (word) {
      return {
        spelling: word.spelling,
        source: 'cache',
        splitPattern: this.buildSplitPattern(word.splitPattern, word.roots),
      };
    }

    return {
      spelling: spelling.toLowerCase(),
      source: 'fallback',
      splitPattern: [
        {
          form: spelling.toLowerCase(),
          type: 'root',
          meaning: '待补充词根拆解',
          rootId: null,
        },
      ],
    };
  }

  private normalizePos(raw: unknown): PosEntry[] {
    if (!Array.isArray(raw)) {
      return [];
    }
    const out: PosEntry[] = [];
    for (const item of raw) {
      if (typeof item !== 'object' || item === null) {
        continue;
      }
      const row = item as Record<string, unknown>;
      const pos = typeof row.pos === 'string' ? row.pos : null;
      const meaning = typeof row.meaning === 'string' ? row.meaning : null;
      if (pos && meaning) {
        out.push({ pos, meaning });
      }
    }
    return out;
  }

  private normalizeLevel(raw: unknown): string[] {
    if (!Array.isArray(raw)) {
      return [];
    }
    return raw.filter((item): item is string => typeof item === 'string' && item.length > 0);
  }

  private normalizeScenes(raw: unknown): WordScene[] {
    if (!Array.isArray(raw)) {
      return [];
    }
    const out: WordScene[] = [];
    for (const item of raw) {
      if (typeof item === 'string' && item.length > 0) {
        out.push({ title: item });
        continue;
      }
      if (typeof item !== 'object' || item === null) {
        continue;
      }
      const row = item as Record<string, unknown>;
      const title = typeof row.title === 'string' ? row.title : null;
      if (!title) {
        continue;
      }
      const description =
        typeof row.description === 'string' && row.description.length > 0
          ? row.description
          : undefined;
      out.push(description ? { title, description } : { title });
    }
    return out;
  }

  private buildSplitPattern(
    cachedPattern: unknown,
    roots: Array<{
      displayForm: string | null;
      position: 'prefix' | 'root' | 'suffix';
      root: { id: bigint; form: string; meaning: string };
    }>,
  ): WordSplitSegment[] {
    if (Array.isArray(cachedPattern)) {
      return cachedPattern as WordSplitSegment[];
    }

    return roots.map((item) => ({
      form: item.displayForm ?? item.root.form,
      type: item.position,
      meaning: item.root.meaning,
      rootId: item.root.id.toString(),
      rootForm: item.position === 'root' ? item.root.form : null,
    }));
  }
}
