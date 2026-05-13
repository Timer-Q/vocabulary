import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { SplitWordResult, WordDetail, WordSplitSegment } from './words.types';

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
      pos: word.pos,
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
    }));
  }
}
