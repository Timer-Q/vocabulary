import { Injectable, NotFoundException } from '@nestjs/common';
import { MorphemeKind, RootRelationKind, WordRelationKind } from '@prisma/client';
import { PrismaService } from '../../common/prisma.service';
import { buildCatalogDerivativeSamples } from '../roots/morpheme-derivatives';
import { MORPHEME_CATALOG } from '../roots/morpheme-catalog';
import { MINDMAP_THEMES } from './mindmap-themes';
import type {
  MindmapDimension,
  MindmapEdge,
  MindmapGraphPayload,
  MindmapNode,
  MindmapThemeSummary,
} from './mindmap.types';

function normalizeMorphemeForm(form: string): string {
  return form.replace(/^-+|-+$/g, '').toLowerCase();
}

function derivativeTakeLimit(depth: number): number {
  if (depth <= 1) {
    return 12;
  }
  if (depth === 2) {
    return 32;
  }
  return 48;
}

function findCatalogItem(kind: MorphemeKind, normalizedForm: string) {
  return MORPHEME_CATALOG.find(
    (item) => item.kind === kind && normalizeMorphemeForm(item.form) === normalizedForm,
  );
}

@Injectable()
export class MindmapService {
  constructor(private readonly prisma: PrismaService) {}

  async listThemes(): Promise<MindmapThemeSummary[]> {
    const forms = MINDMAP_THEMES.map((t) => t.rootForm);
    const roots = await this.prisma.root.findMany({
      where: { form: { in: forms } },
      select: { id: true, form: true },
    });
    const idByForm = new Map(roots.map((r) => [r.form, r.id.toString()]));

    return MINDMAP_THEMES.map((theme) => ({
      ...theme,
      rootId: idByForm.get(theme.rootForm) ?? '0',
    }));
  }

  async getTheme(slug: string): Promise<MindmapThemeSummary & { graph: MindmapGraphPayload }> {
    const theme = MINDMAP_THEMES.find((t) => t.slug === slug);
    if (!theme) {
      throw new NotFoundException('theme_not_found');
    }

    const morpheme = await this.prisma.morpheme.findFirst({
      where: { kind: 'root', normalizedForm: theme.rootForm },
    });
    if (!morpheme) {
      throw new NotFoundException('morpheme_not_found');
    }

    const graph = await this.buildGraphForMorpheme(morpheme.id, 'mixed', 2);
    return {
      ...theme,
      rootId: morpheme.id.toString(),
      graph,
    };
  }

  async buildGraphByForm(
    form: string,
    dimension: MindmapDimension,
    depth: number,
    kind?: MorphemeKind,
  ): Promise<MindmapGraphPayload> {
    const normalized = normalizeMorphemeForm(form);
    const morpheme = await this.prisma.morpheme.findFirst({
      where: kind ? { kind, normalizedForm: normalized } : { normalizedForm: normalized },
      orderBy: [{ kind: 'asc' }],
    });
    if (!morpheme) {
      throw new NotFoundException('morpheme_not_found');
    }
    return this.buildGraphForMorpheme(morpheme.id, dimension, depth);
  }

  /** 兼容旧路由：按 Root 表 id 构图时转发到同名 Morpheme */
  async buildGraph(
    rootId: bigint,
    dimension: MindmapDimension,
    depth: number,
  ): Promise<MindmapGraphPayload> {
    const root = await this.prisma.root.findUnique({ where: { id: rootId } });
    if (!root) {
      throw new NotFoundException('root_not_found');
    }
    const morpheme = await this.prisma.morpheme.findFirst({
      where: { kind: 'root', normalizedForm: root.form },
    });
    if (!morpheme) {
      throw new NotFoundException('morpheme_not_found');
    }
    return this.buildGraphForMorpheme(morpheme.id, dimension, depth);
  }

  async buildGraphForMorpheme(
    morphemeId: bigint,
    dimension: MindmapDimension,
    depth: number,
  ): Promise<MindmapGraphPayload> {
    const morpheme = await this.prisma.morpheme.findUnique({ where: { id: morphemeId } });
    if (!morpheme) {
      throw new NotFoundException('morpheme_not_found');
    }

    const nodes: MindmapNode[] = [];
    const edges: MindmapEdge[] = [];
    const nodeIds = new Set<string>();

    const addNode = (node: MindmapNode): void => {
      if (nodeIds.has(node.id)) {
        return;
      }
      nodeIds.add(node.id);
      nodes.push(node);
    };

    const centerNodeId = `m_${morpheme.id}`;
    const centerType = morpheme.kind === 'root' ? 'root' : 'morpheme';
    addNode({
      id: centerNodeId,
      type: centerType,
      label: morpheme.form,
      meaning: morpheme.meaning,
    });

    const includeDerivatives = dimension === 'derivatives' || dimension === 'mixed';
    const includeSynonyms = dimension === 'synonyms' || dimension === 'mixed';
    const includeFamilies =
      (dimension === 'families' || dimension === 'mixed') && morpheme.kind === 'root';

    if (includeDerivatives) {
      const limit = derivativeTakeLimit(depth);
      const links = await this.prisma.morphemeWord.findMany({
        where: { morphemeId: morpheme.id },
        include: { word: true },
        orderBy: { order: 'asc' },
        take: limit,
      });

      for (const link of links) {
        const wordNodeId = `w_${link.word.id}`;
        addNode({
          id: wordNodeId,
          type: 'word',
          label: link.word.spelling,
          spelling: link.word.spelling,
        });
        edges.push({ from: centerNodeId, to: wordNodeId, relation: 'derives' });
      }

      if (links.length === 0) {
        const catalogItem = findCatalogItem(morpheme.kind, morpheme.normalizedForm);
        if (catalogItem) {
          const previewLimit = Math.min(8, limit);
          const samples = buildCatalogDerivativeSamples(catalogItem).slice(0, previewLimit);
          for (const sample of samples) {
            const wordNodeId = `w_preview_${sample.spelling}`;
            addNode({
              id: wordNodeId,
              type: 'word',
              label: sample.spelling,
              spelling: sample.spelling,
            });
            edges.push({ from: centerNodeId, to: wordNodeId, relation: 'derives' });
          }
        }
      }
    }

    if (includeFamilies) {
      const rootRow = await this.prisma.root.findUnique({
        where: { form: morpheme.normalizedForm },
      });
      if (rootRow) {
        const rootRels = await this.prisma.rootRelation.findMany({
          where: { fromRootId: rootRow.id },
          include: { toRoot: true },
          take: 8,
        });

        for (const rel of rootRels) {
          const relatedId = `r_${rel.toRoot.id}`;
          addNode({
            id: relatedId,
            type: 'root',
            label: rel.toRoot.form,
            meaning: rel.toRoot.meaning,
          });
          edges.push({
            from: centerNodeId,
            to: relatedId,
            relation: this.mapRootRelation(rel.kind),
          });
        }
      }
    }

    if (includeSynonyms) {
      const wordLinks = await this.prisma.morphemeWord.findMany({
        where: { morphemeId: morpheme.id },
        select: { wordId: true },
        take: 6,
      });
      const wordIds = wordLinks.map((l) => l.wordId);

      if (wordIds.length > 0) {
        const wordRels = await this.prisma.wordRelation.findMany({
          where: { fromWordId: { in: wordIds } },
          include: { toWord: true },
          take: 16,
        });

        for (const rel of wordRels) {
          const fromId = `w_${rel.fromWordId}`;
          const toId = `w_${rel.toWordId}`;
          if (!nodeIds.has(fromId)) {
            const fromWord = await this.prisma.word.findUnique({
              where: { id: rel.fromWordId },
            });
            if (fromWord) {
              addNode({
                id: fromId,
                type: 'word',
                label: fromWord.spelling,
                spelling: fromWord.spelling,
              });
            }
          }
          addNode({
            id: toId,
            type: 'word',
            label: rel.toWord.spelling,
            spelling: rel.toWord.spelling,
          });
          edges.push({
            from: fromId,
            to: toId,
            relation: this.mapWordRelation(rel.kind),
          });
        }
      }
    }

    return {
      rootId: morpheme.id.toString(),
      centerNodeId,
      morphemeKind: morpheme.kind,
      dimension,
      depth,
      nodes,
      edges,
    };
  }

  private mapRootRelation(kind: RootRelationKind): MindmapEdge['relation'] {
    switch (kind) {
      case RootRelationKind.cognate:
        return 'cognate';
      case RootRelationKind.similar_meaning:
        return 'similar_meaning';
      case RootRelationKind.opposite:
        return 'opposite';
      case RootRelationKind.similar_form:
        return 'similar_form';
      default:
        return 'cognate';
    }
  }

  private mapWordRelation(kind: WordRelationKind): MindmapEdge['relation'] {
    switch (kind) {
      case WordRelationKind.synonym:
        return 'synonym';
      case WordRelationKind.antonym:
        return 'antonym';
      case WordRelationKind.similar_form:
        return 'similar_form';
      default:
        return 'synonym';
    }
  }
}
