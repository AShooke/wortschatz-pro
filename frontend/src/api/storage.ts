export interface ReviewSummary {
  date: string;
  count: number;
}

export const WORDS_STORAGE_KEY = 'wortschatz.words.v3';
export const LEGACY_WORDS_STORAGE_KEY = 'wortschatz.words.v2';
export const REVIEWS_STORAGE_KEY = 'wortschatz.reviews.v3';
export const LEGACY_REVIEWS_STORAGE_KEY = 'wortschatz.reviews.v2';

type StoragePort = Pick<Storage, 'getItem' | 'setItem'>;

function browserStorage(): StoragePort | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage;
  } catch {
    return null;
  }
}

function readArray(storage: StoragePort, key: string): unknown[] | null {
  try {
    const value: unknown = JSON.parse(storage.getItem(key) ?? 'null');
    return Array.isArray(value) ? value : null;
  } catch {
    return null;
  }
}

function readSummary(storage: StoragePort, key: string): ReviewSummary | null {
  try {
    const value: unknown = JSON.parse(storage.getItem(key) ?? 'null');
    if (typeof value !== 'object' || value === null) return null;
    const summary = value as Partial<ReviewSummary>;
    if (typeof summary.date !== 'string' || !Number.isInteger(summary.count) || (summary.count ?? -1) < 0) return null;
    return { date: summary.date, count: summary.count as number };
  } catch {
    return null;
  }
}

export function readWordRecords(storage = browserStorage()): { records: unknown[] | null; migrated: boolean } {
  if (!storage) return { records: null, migrated: false };
  const current = readArray(storage, WORDS_STORAGE_KEY);
  if (current) return { records: current, migrated: false };
  const legacy = readArray(storage, LEGACY_WORDS_STORAGE_KEY);
  return { records: legacy, migrated: legacy !== null };
}

export function writeWordRecords(records: unknown[], storage = browserStorage()): void {
  storage?.setItem(WORDS_STORAGE_KEY, JSON.stringify(records));
}

export function readReviewSummary(storage = browserStorage()): ReviewSummary {
  if (!storage) return { date: '', count: 0 };
  return readSummary(storage, REVIEWS_STORAGE_KEY)
    ?? readSummary(storage, LEGACY_REVIEWS_STORAGE_KEY)
    ?? { date: '', count: 0 };
}

export function writeReviewSummary(summary: ReviewSummary, storage = browserStorage()): void {
  storage?.setItem(REVIEWS_STORAGE_KEY, JSON.stringify(summary));
}

export function recordReview(now = new Date(), storage = browserStorage()): void {
  if (!storage) return;
  const today = now.toISOString().slice(0, 10);
  const current = readReviewSummary(storage);
  writeReviewSummary({ date: today, count: current.date === today ? current.count + 1 : 1 }, storage);
}