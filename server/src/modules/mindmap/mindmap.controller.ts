import { Controller, Get, Param, Query } from '@nestjs/common';
import { MindmapService } from './mindmap.service';
import type { MindmapDimension, MindmapGraphPayload, MindmapThemeSummary } from './mindmap.types';

const MINDMAP_DIMENSIONS: MindmapDimension[] = ['derivatives', 'synonyms', 'families', 'mixed'];

function parseDimension(raw?: string): MindmapDimension {
  if (raw && MINDMAP_DIMENSIONS.includes(raw as MindmapDimension)) {
    return raw as MindmapDimension;
  }
  return 'mixed';
}

@Controller('mindmap')
export class MindmapController {
  constructor(private readonly mindmapService: MindmapService) {}

  @Get('by-form/:form')
  getByForm(
    @Param('form') form: string,
    @Query('depth') depthRaw?: string,
    @Query('dimension') dimensionRaw?: string,
    @Query('kind') kind?: string,
  ): Promise<MindmapGraphPayload> {
    const depth = Math.min(3, Math.max(1, Number(depthRaw) || 2));
    const morphemeKind =
      kind === 'root' || kind === 'prefix' || kind === 'suffix' || kind === 'combining_form'
        ? kind
        : undefined;
    return this.mindmapService.buildGraphByForm(
      form,
      parseDimension(dimensionRaw),
      depth,
      morphemeKind,
    );
  }

  @Get('themes')
  listThemes(): Promise<MindmapThemeSummary[]> {
    return this.mindmapService.listThemes();
  }

  @Get('themes/:slug')
  getTheme(@Param('slug') slug: string): Promise<MindmapThemeSummary & { graph: MindmapGraphPayload }> {
    return this.mindmapService.getTheme(slug);
  }
}
