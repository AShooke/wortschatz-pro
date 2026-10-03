import { describe, expect, it } from 'vitest';

import type { Word } from '../api/client';
import { buildStudyQueue } from './studySession';

function makeWord(id: number, overrides: Partial<Word> = {}): Word {
  return {
    id,
    german: `Wort ${id}`,
    russian: `слово ${id}`,
    article: null,
    category: null,
    part_of_speech: 'other',
    plural: null,
    example: null,
    stage: 0,
    interval_hours: 4,
    mistakes: 0,
    next_review_at: null,
    ...overrides,
  };
}

describe('daily study queue', () => {
  it('mixes eligible activities and respects the due date and session limit', () => {
    const words = Array.from({ length: 24 }, (_, index) => makeWord(index + 1, {
      article: index % 2 === 0 ? 'die' : null,
      part_of_speech: index % 2 === 0 ? 'noun' : 'verb',
      tabooExplanations: index % 3 === 0 ? ['Eine Erklärung.'] : undefined,
      next_review_at: index >= 22 ? '2026-10-04T00:00:00.000Z' : null,
    }));
    const queue = buildStudyQueue(words, {
      now: new Date('2026-10-03T12:00:00.000Z'),
      limit: 16,
      random: () => 0.42,
    });
    const activities = new Set(queue.map((item) => item.activity));

    expect(queue).toHaveLength(16);
    expect(new Set(queue.map((item) => item.wordId)).size).toBe(queue.length);
    expect(activities).toEqual(new Set(['recall', 'taboo', 'article', 'matching']));
  });

  it('falls back to recall when specialist activities are unavailable', () => {
    const queue = buildStudyQueue([makeWord(1), makeWord(2)], { random: () => 0.5 });

    expect(queue.map((item) => item.activity)).toEqual(['recall', 'recall']);
  });
});