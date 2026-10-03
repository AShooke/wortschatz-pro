import { describe, expect, it } from 'vitest';

import type { Word } from '../api/client';
import { formatStability, summarizeLearning } from './learningStats';

function makeWord(id: number, repetitions: number, stabilityDays: number, dueAt: string | null, lapses: number): Word {
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
    interval_hours: stabilityDays * 24,
    mistakes: lapses,
    next_review_at: dueAt,
    srs: { algorithmVersion: 1, repetitions, difficulty: 5, stabilityDays, lastReviewedAt: null, dueAt, lapses },
  };
}

describe('dynamic learning insights', () => {
  it('summarizes due, learning, mastered, lapse, and stability metrics', () => {
    const words = [
      makeWord(1, 1, 2, null, 1),
      makeWord(2, 6, 21, '2026-10-02T12:00:00.000Z', 2),
      makeWord(3, 2, 4, '2026-10-04T12:00:00.000Z', 0),
    ];
    const summary = summarizeLearning(words, new Date('2026-10-03T12:00:00.000Z'));

    expect(summary).toEqual({ total: 3, due: 2, learning: 2, mastered: 1, lapses: 3, averageStabilityDays: 9 });
  });

  it('formats stability with hours for short intervals and days for longer ones', () => {
    expect(formatStability(0.5)).toBe('12 ч');
    expect(formatStability(14.25)).toBe('14.3 дн.');
    expect(formatStability(0)).toBe('—');
  });
});