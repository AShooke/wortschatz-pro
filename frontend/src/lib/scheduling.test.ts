import { describe, expect, it } from 'vitest';

import { createInitialSrsState, isDue, normalizeSrsState, scheduleReview } from './scheduling';

const now = new Date('2026-10-03T12:00:00.000Z');

describe('dynamic review scheduling', () => {
  it('increases intervals with stronger recall ratings', () => {
    const initial = createInitialSrsState({ stage: 0, intervalHours: 4, mistakes: 0, nextReviewAt: null });
    const hard = scheduleReview(initial, 'hard', now);
    const good = scheduleReview(initial, 'good', now);
    const easy = scheduleReview(initial, 'easy', now);

    expect(hard.intervalHours).toBeGreaterThan(4);
    expect(good.intervalHours).toBeGreaterThan(hard.intervalHours);
    expect(easy.intervalHours).toBeGreaterThan(good.intervalHours);
    expect(easy.nextReviewAt).toBe(easy.srs.dueAt);
  });

  it('resets repetitions and records a lapse for Again', () => {
    const established = { ...createInitialSrsState({ stage: 3, intervalHours: 168, mistakes: 2, nextReviewAt: null }), repetitions: 4 };
    const result = scheduleReview(established, 'again', now);

    expect(result.intervalHours).toBe(4);
    expect(result.stage).toBe(0);
    expect(result.srs.repetitions).toBe(0);
    expect(result.srs.lapses).toBe(3);
  });

  it('hydrates legacy intervals and treats malformed due dates as due', () => {
    const state = normalizeSrsState(null, { stage: 2, intervalHours: 72, mistakes: 1, nextReviewAt: '2026-10-04T00:00:00.000Z' });

    expect(state.stabilityDays).toBe(3);
    expect(state.dueAt).toBe('2026-10-04T00:00:00.000Z');
    expect(isDue(state.dueAt, now)).toBe(false);
    expect(isDue('not-a-date', now)).toBe(true);
  });
});