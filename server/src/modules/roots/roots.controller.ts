import { Controller, Get, Param, Query } from '@nestjs/common';
import { MindmapService } from '../mindmap/mindmap.service';
import type { MindmapDimension, MindmapGraphPayload } from '../mindmap/mindmap.types';
import { RootsService } from './roots.service';
import { RootDetailPayload, RootListPayload } from './roots.types';

const MINDMAP_DIMENSIONS: MindmapDimension[] = ['derivatives', 'synonyms', 'families', 'mixed'];

function parseDimension(raw?: string): MindmapDimension {
  if (raw && MINDMAP_DIMENSIONS.includes(raw as MindmapDimension)) {
    return raw as MindmapDimension;
  }
  return 'mixed';
}

@Controller('roots')
export class RootsController {
  constructor(
    private readonly rootsService: RootsService,
    private readonly mindmapService: MindmapService,
  ) {}

  @Get()
  list(
    @Query('q') q?: string,
    @Query('origin') origin?: string,
    @Query('kind') kind?: string,
  ): Promise<RootListPayload> {
    return this.rootsService.list(q, origin, kind);
  }

  @Get(':id/mindmap')
  getMindmap(
    @Param('id') id: string,
    @Query('depth') depthRaw?: string,
    @Query('dimension') dimensionRaw?: string,
  ): Promise<MindmapGraphPayload> {
    const depth = Math.min(3, Math.max(1, Number(depthRaw) || 2));
    return this.mindmapService.buildGraph(BigInt(id), parseDimension(dimensionRaw), depth);
  }

  @Get(':form')
  getByForm(
    @Param('form') form: string,
    @Query('kind') kind?: string,
  ): Promise<RootDetailPayload> {
    return this.rootsService.getByForm(form, kind);
  }
}
