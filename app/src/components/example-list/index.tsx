import type { ReactElement} from 'react';
import { useMemo, useState } from 'react';
import { Text, View } from '@tarojs/components';
import type { ExampleHighlightSpan, ExampleItem } from '@/services/api/types';
import { playAudioUrl } from '@/utils/play-audio';
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

function pickExampleAudio(example: ExampleItem): { url: string | null; label: string } | null {
  if (example.audioUsUrl) {
    return { url: example.audioUsUrl, label: '美音' };
  }
  if (example.audioUkUrl) {
    return { url: example.audioUkUrl, label: '英音' };
  }
  if (example.audioSlowUrl) {
    return { url: example.audioSlowUrl, label: '慢速' };
  }
  return null;
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

  if (examples.length === 0) {
    return (
      <View className="example-list">
        <Text className="example-list__empty">暂无例句，稍后接入分层例句库</Text>
      </View>
    );
  }

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

      {filtered.length === 0 ? (
        <Text className="example-list__empty">该层级暂无例句</Text>
      ) : null}

      {filtered.map((example) => {
        const audio = pickExampleAudio(example);
        return (
          <View key={example.id} className={`example-card is-${example.level}`}>
            <View className="example-card__meta">
              <Text className="example-card__badge">{levelLabels[example.level]}</Text>
              <Text className="example-card__source">{example.source}</Text>
              {example.likes > 0 ? (
                <Text className="example-card__likes">♥ {example.likes}</Text>
              ) : null}
              {audio ? (
                <Text
                  className="example-card__audio"
                  onClick={() => playAudioUrl(audio.url, audio.label)}
                >
                  播放
                </Text>
              ) : null}
            </View>
            {renderSentence(example.sentence, example.highlightSpans)}
            {example.grammarTags && example.grammarTags.length > 0 ? (
              <View className="example-card__tags">
                {example.grammarTags.map((tag) => (
                  <Text key={tag} className="example-card__tag">
                    {tag}
                  </Text>
                ))}
              </View>
            ) : null}
            {showTranslation ? (
              <Text className="example-card__translation">{example.translation}</Text>
            ) : null}
          </View>
        );
      })}
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
