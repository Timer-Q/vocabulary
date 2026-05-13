import type { ReactElement} from 'react';
import { useMemo, useState } from 'react';
import { Text, View } from '@tarojs/components';
import type { ExampleHighlightSpan, ExampleItem } from '@/services/api/types';
import './index.scss';

const levelLabels: Record<ExampleItem['level'], string> = {
  basic: '基础句',
  exam: '真题句',
  classic: '经典句',
  advanced: '进阶句',
  root_transfer: '词根迁移',
};

const allLevels: ExampleItem['level'][] = ['basic', 'exam', 'classic', 'advanced', 'root_transfer'];

export interface ExampleListProps {
  examples: ExampleItem[];
}

function renderSentence(sentence: string, spans: ExampleHighlightSpan[] | null): ReactElement {
  if (!spans || spans.length === 0) {
    return <Text className="example-card__sentence">{sentence}</Text>;
  }
  const sorted = [...spans].sort((a, b) => a.start - b.start);
  const nodes: ReactElement[] = [];
  let cursor = 0;
  sorted.forEach((span, idx) => {
    const start = Math.max(0, Math.min(span.start, sentence.length));
    const end = Math.max(start, Math.min(span.end, sentence.length));
    if (start > cursor) {
      nodes.push(<Text key={`plain-${idx}-${cursor}`}>{sentence.slice(cursor, start)}</Text>);
    }
    if (end > start) {
      nodes.push(
        <Text key={`hl-${idx}`} className="example-card__hl">
          {sentence.slice(start, end)}
        </Text>,
      );
    }
    cursor = Math.max(cursor, end);
  });
  if (cursor < sentence.length) {
    nodes.push(<Text key="tail">{sentence.slice(cursor)}</Text>);
  }
  return <Text className="example-card__sentence">{nodes}</Text>;
}

export function ExampleList(props: ExampleListProps): ReactElement {
  const { examples } = props;
  const [filter, setFilter] = useState<'all' | ExampleItem['level']>('all');
  const [showTranslation, setShowTranslation] = useState(false);

  const filtered = useMemo(() => {
    if (filter === 'all') {
      return examples;
    }
    return examples.filter((e) => e.level === filter);
  }, [examples, filter]);

  return (
    <View className="example-list">
      <View className="example-list__toolbar">
        <ScrollChips filter={filter} onChange={setFilter} />
        <Text
          className="example-list__toggle"
          onClick={() => setShowTranslation((v) => !v)}
        >
          {showTranslation ? '隐藏译文' : '显示译文'}
        </Text>
      </View>

      {filtered.map((example) => (
        <View key={example.id} className={`example-card is-${example.level}`}>
          <View className="example-card__meta">
            <Text className="example-card__badge">{levelLabels[example.level]}</Text>
            <Text className="example-card__source">{example.source}</Text>
          </View>
          {renderSentence(example.sentence, example.highlightSpans)}
          {showTranslation ? (
            <Text className="example-card__translation">{example.translation}</Text>
          ) : null}
        </View>
      ))}
    </View>
  );
}

interface ScrollChipsProps {
  filter: 'all' | ExampleItem['level'];
  onChange: (next: 'all' | ExampleItem['level']) => void;
}

function ScrollChips(props: ScrollChipsProps): ReactElement {
  const { filter, onChange } = props;
  return (
    <View className="example-list__chips">
      <Text
        className={`example-list__chip ${filter === 'all' ? 'is-active' : ''}`}
        onClick={() => onChange('all')}
      >
        全部
      </Text>
      {allLevels.map((lv) => (
        <Text
          key={lv}
          className={`example-list__chip ${filter === lv ? 'is-active' : ''}`}
          onClick={() => onChange(lv)}
        >
          {levelLabels[lv]}
        </Text>
      ))}
    </View>
  );
}
