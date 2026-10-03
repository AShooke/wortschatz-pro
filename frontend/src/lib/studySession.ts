import type { Word } from '../api/client';
import { isDue } from './scheduling';

export type StudyActivity = 'recall' | 'taboo' | 'article' | 'matching';

export interface StudyQueueItem {
  id: string;
  wordId: number;
  activity: StudyActivity;
}

export interface BuildStudyQueueOptions {
  now?: Date;
  limit?: number;
  random?: () => number;
  includeMatching?: boolean;
}

const ACTIVITY_WEIGHTS: Record<StudyActivity, number> = {
  recall: 0.5,
  taboo: 0.2,
  article: 0.2,
  matching: 0.1,
};

export function buildStudyQueue(words: Word[], options: BuildStudyQueueOptions = {}): StudyQueueItem[] {
  const now = options.now ?? new Date();
  const limit = Math.max(0, Math.floor(options.limit ?? 12));
  const random = options.random ?? Math.random;
  const dueWords = shuffle(words.filter((word) => isDue(word.srs?.dueAt ?? word.next_review_at, now)), random).slice(0, limit);
  const activityCounts: Record<StudyActivity, number> = { recall: 0, taboo: 0, article: 0, matching: 0 };
  const matchingAvailable = options.includeMatching !== false && words.length >= 4;

  return dueWords.map((word) => {
    const available: StudyActivity[] = ['recall'];
    if (word.tabooExplanations?.length) available.push('taboo');
    if (word.part_of_speech === 'noun' && word.article) available.push('article');
    if (matchingAvailable) available.push('matching');

    const activity = shuffle(available, random).sort((left, right) => {
      const leftRatio = activityCounts[left] / ACTIVITY_WEIGHTS[left];
      const rightRatio = activityCounts[right] / ACTIVITY_WEIGHTS[right];
      return leftRatio - rightRatio;
    })[0] ?? 'recall';
    activityCounts[activity] += 1;
    return { id: `${word.id}:${activity}`, wordId: word.id, activity };
  });
}

function shuffle<T>(items: T[], random: () => number): T[] {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const value = random();
    const swapIndex = Math.floor(Math.min(Math.max(value, 0), 0.999999999) * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}