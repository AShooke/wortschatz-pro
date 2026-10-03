import type { Word } from '../api/client';
import { isDue } from './scheduling';

export interface LearningSummary {
  total: number;
  due: number;
  learning: number;
  mastered: number;
  lapses: number;
  averageStabilityDays: number;
}

export function summarizeLearning(words: Word[], now = new Date()): LearningSummary {
  const due = words.filter((word) => isDue(word.srs?.dueAt ?? word.next_review_at, now)).length;
  const mastered = words.filter((word) => (word.srs?.repetitions ?? 0) >= 5 && (word.srs?.stabilityDays ?? 0) >= 14).length;
  const lapses = words.reduce((total, word) => total + (word.srs?.lapses ?? word.mistakes), 0);
  const averageStabilityDays = words.length
    ? words.reduce((total, word) => total + (word.srs?.stabilityDays ?? word.interval_hours / 24), 0) / words.length
    : 0;

  return { total: words.length, due, learning: words.length - mastered, mastered, lapses, averageStabilityDays };
}

export function formatStability(days: number): string {
  if (!days) return '—';
  if (days < 1) return `${Math.max(1, Math.round(days * 24))} ч`;
  return `${Number(days.toFixed(1))} дн.`;
}