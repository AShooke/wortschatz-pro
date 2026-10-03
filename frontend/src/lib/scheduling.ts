export type ReviewRating = 'again' | 'hard' | 'good' | 'easy';

export interface SrsState {
  algorithmVersion: 1;
  repetitions: number;
  difficulty: number;
  stabilityDays: number;
  lastReviewedAt: string | null;
  dueAt: string | null;
  lapses: number;
}

export interface LegacySchedule {
  stage: number;
  intervalHours: number;
  mistakes: number;
  nextReviewAt: string | null;
}

export interface ScheduledReview {
  srs: SrsState;
  intervalHours: number;
  stage: number;
  nextReviewAt: string;
}

const MIN_INTERVAL_DAYS = 4 / 24;
const MAX_INTERVAL_DAYS = 365;
const LEGACY_INTERVALS = [4, 24, 72, 168, 336, 720];

export function createInitialSrsState(legacy: LegacySchedule): SrsState {
  return {
    algorithmVersion: 1,
    repetitions: clampInteger(legacy.stage, 0, 100),
    difficulty: 5,
    stabilityDays: clamp(legacy.intervalHours / 24, MIN_INTERVAL_DAYS, MAX_INTERVAL_DAYS),
    lastReviewedAt: null,
    dueAt: legacy.nextReviewAt,
    lapses: clampInteger(legacy.mistakes, 0, Number.MAX_SAFE_INTEGER),
  };
}

export function normalizeSrsState(value: unknown, legacy: LegacySchedule): SrsState {
  if (typeof value !== 'object' || value === null) return createInitialSrsState(legacy);
  const candidate = value as Partial<SrsState>;
  if (candidate.algorithmVersion !== 1) return createInitialSrsState(legacy);

  return {
    algorithmVersion: 1,
    repetitions: clampInteger(candidate.repetitions ?? 0, 0, 100),
    difficulty: clamp(candidate.difficulty ?? 5, 1, 10),
    stabilityDays: clamp(candidate.stabilityDays ?? MIN_INTERVAL_DAYS, MIN_INTERVAL_DAYS, MAX_INTERVAL_DAYS),
    lastReviewedAt: validTimestamp(candidate.lastReviewedAt),
    dueAt: validTimestamp(candidate.dueAt) ?? legacy.nextReviewAt,
    lapses: clampInteger(candidate.lapses ?? legacy.mistakes, 0, Number.MAX_SAFE_INTEGER),
  };
}

export function scheduleReview(srs: SrsState, rating: ReviewRating, now = new Date()): ScheduledReview {
  const difficultyChange: Record<ReviewRating, number> = {
    again: 0.8,
    hard: 0.25,
    good: -0.15,
    easy: -0.5,
  };
  const difficulty = clamp(srs.difficulty + difficultyChange[rating], 1, 10);
  let stabilityDays: number;
  let repetitions: number;
  let lapses = srs.lapses;

  if (rating === 'again') {
    stabilityDays = MIN_INTERVAL_DAYS;
    repetitions = 0;
    lapses += 1;
  } else {
    const growth: Record<Exclude<ReviewRating, 'again'>, number> = {
      hard: clamp(1.15 - srs.difficulty * 0.025, 0.85, 1.1),
      good: clamp(1.45 - srs.difficulty * 0.035, 1.1, 1.42),
      easy: clamp(2 - srs.difficulty * 0.04, 1.6, 1.96),
    };
    const minimum: Record<Exclude<ReviewRating, 'again'>, number> = { hard: 0.5, good: 1, easy: 3 };
    stabilityDays = Math.max(minimum[rating], srs.stabilityDays * growth[rating]);
    repetitions = srs.repetitions + 1;
  }

  stabilityDays = clamp(stabilityDays, MIN_INTERVAL_DAYS, MAX_INTERVAL_DAYS);
  const intervalHours = Math.max(1, Math.round(stabilityDays * 24));
  const nextReviewAt = new Date(now.getTime() + intervalHours * 60 * 60 * 1000).toISOString();
  const nextSrs: SrsState = {
    algorithmVersion: 1,
    repetitions,
    difficulty,
    stabilityDays: intervalHours / 24,
    lastReviewedAt: now.toISOString(),
    dueAt: nextReviewAt,
    lapses,
  };

  return { srs: nextSrs, intervalHours, stage: stageForInterval(intervalHours), nextReviewAt };
}

export function isDue(dueAt: string | null | undefined, now = new Date()): boolean {
  if (!dueAt) return true;
  const dueTime = Date.parse(dueAt);
  return !Number.isFinite(dueTime) || dueTime <= now.getTime();
}

function stageForInterval(intervalHours: number): number {
  let stage = 0;
  for (let index = 1; index < LEGACY_INTERVALS.length; index += 1) {
    if (intervalHours >= LEGACY_INTERVALS[index]) stage = index;
  }
  return stage;
}

function validTimestamp(value: unknown): string | null {
  return typeof value === 'string' && Number.isFinite(Date.parse(value)) ? value : null;
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Number.isFinite(value) ? Math.min(Math.max(value, minimum), maximum) : minimum;
}

function clampInteger(value: number, minimum: number, maximum: number): number {
  return clamp(Math.floor(value), minimum, maximum);
}