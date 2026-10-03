import { seedWords } from '../data/words';
import {
  LEGACY_WORDS_STORAGE_KEY,
  REVIEWS_STORAGE_KEY,
  WORDS_STORAGE_KEY,
  readReviewSummary,
  readWordRecords,
  recordReview as recordStoredReview,
  migrateWordGrammar,
  writeWordRecords,
  type WordGrammarRecord,
} from './storage';
import { createInitialSrsState, normalizeSrsState, scheduleReview, type ReviewRating, type SrsState } from '../lib/scheduling';

export type PartOfSpeech = 'noun' | 'verb' | 'adjective' | 'adverb' | 'pronoun' | 'preposition' | 'conjunction' | 'phrase' | 'other';

export interface Word {
  id: number;
  german: string;
  grammarInfo?: string;
  russian: string;
  article: 'der' | 'die' | 'das' | null;
  category: string | null;
  tags?: string[];
  part_of_speech: PartOfSpeech | string;
  plural: string | null;
  example: string | null;
  examples?: string[];
  tabooExplanations?: string[];
  stage: number;
  interval_hours: number;
  mistakes: number;
  next_review_at: string | null;
  srs?: SrsState;
}

export interface WordCreate {
  german: string;
  grammarInfo?: string;
  russian: string;
  article?: 'der' | 'die' | 'das' | null;
  category?: string | null;
  tags?: string[];
  part_of_speech: string;
  plural?: string | null;
  example?: string | null;
  examples?: string[];
  tabooExplanations?: string[];
}

export type WordUpdate = WordCreate;
export type ReviewRequest =
  | { word_id: number; rating: ReviewRating }
  | { word_id: number; quality: 0 | 1 | 2 | 3 };
export interface WordFilters { search?: string; category?: string; part_of_speech?: string }

function seedSnapshot(): Word[] {
  return seedWords.map((word, index) => ({
    ...word,
    id: index + 1,
    stage: 0,
    interval_hours: 4,
    mistakes: 0,
    next_review_at: null,
    srs: createInitialSrsState({ stage: 0, intervalHours: 4, mistakes: 0, nextReviewAt: null }),
  }));
}

function readWords(): Word[] {
  const stored = readWordRecords();
  if (!stored.records) {
    const words = seedSnapshot();
    writeWords(words);
    return words;
  }

  let changed = stored.migrated;
  const words = stored.records.flatMap((record) => {
    const word = normalizeStoredWord(record);
    if (!word) {
      changed = true;
      return [];
    }
    if (JSON.stringify(word) !== JSON.stringify(record)) changed = true;
    return [word];
  });
  const merged = mergeSeedWords(words);
  if (merged !== words) changed = true;
  if (changed) writeWords(merged);
  return merged;
}

function normalizeStoredWord(value: unknown): Word | null {
  if (typeof value !== 'object' || value === null) return null;
  const candidate = migrateWordGrammar(value as WordGrammarRecord) as Partial<Word>;
  if (!Number.isInteger(candidate.id) || typeof candidate.german !== 'string' || typeof candidate.russian !== 'string') return null;
  const stage = typeof candidate.stage === 'number' && Number.isFinite(candidate.stage) ? Math.min(Math.max(Math.floor(candidate.stage), 0), 5) : 0;
  const intervalHours = typeof candidate.interval_hours === 'number' && Number.isFinite(candidate.interval_hours) && candidate.interval_hours > 0 ? candidate.interval_hours : 4;
  const mistakes = typeof candidate.mistakes === 'number' && Number.isFinite(candidate.mistakes) && candidate.mistakes >= 0 ? Math.floor(candidate.mistakes) : 0;
  const nextReviewAt = typeof candidate.next_review_at === 'string' ? candidate.next_review_at : null;
  const legacy = { stage, intervalHours, mistakes, nextReviewAt };

  return {
    ...candidate,
    id: candidate.id as number,
    german: candidate.german,
    grammarInfo: typeof candidate.grammarInfo === 'string' ? candidate.grammarInfo : undefined,
    russian: candidate.russian,
    article: candidate.article === 'der' || candidate.article === 'die' || candidate.article === 'das' ? candidate.article : null,
    category: typeof candidate.category === 'string' ? candidate.category : null,
    part_of_speech: typeof candidate.part_of_speech === 'string' ? candidate.part_of_speech : 'other',
    plural: typeof candidate.plural === 'string' ? candidate.plural : null,
    example: typeof candidate.example === 'string' ? candidate.example : null,
    stage,
    interval_hours: intervalHours,
    mistakes,
    next_review_at: nextReviewAt,
    srs: normalizeSrsState(candidate.srs, legacy),
  } as Word;
}

function mergeSeedWords(words: Word[]): Word[] {
  const seeds = seedSnapshot();
  const seededGerman = new Set(seeds.map((word) => normalizeGerman(word.german)));
  const merged: Word[] = [];
  let changed = false;
  const existingByGerman = new Map<string, Word>();
  let nextId = words.reduce((max, word) => Math.max(max, word.id), 0);

  for (const word of words) {
    const key = normalizeGerman(word.german);
    const existing = existingByGerman.get(key);
    if (existing && seededGerman.has(key)) {
      existing.tags = [...new Set([...(existing.tags ?? []), ...(word.tags ?? [])])];
      if (!existing.tabooExplanations?.length && word.tabooExplanations?.length) existing.tabooExplanations = word.tabooExplanations;
      if (!existing.grammarInfo && word.grammarInfo) {
        existing.grammarInfo = word.grammarInfo;
        changed = true;
      }
      changed = true;
      continue;
    }
    merged.push(word);
    existingByGerman.set(key, word);
  }

  for (const seed of seeds) {
    const existing = existingByGerman.get(normalizeGerman(seed.german));
    if (existing) {
      if (!existing.grammarInfo && seed.grammarInfo) {
        existing.grammarInfo = seed.grammarInfo;
        changed = true;
      }
      if (!existing.tabooExplanations?.length && seed.tabooExplanations?.length) {
        existing.tabooExplanations = seed.tabooExplanations;
        changed = true;
      }
      if (!existing.examples?.length && seed.examples?.length) {
        existing.examples = seed.examples;
        changed = true;
      }
      if (existing.category === 'DTZ B1 Sprechen Teil 2' && seed.category === 'Sprechen Teil 2') {
        existing.category = seed.category;
        changed = true;
      }
      if (existing.category === 'Alltag A2-B1 Essentials' && seed.category === 'Sprechen Teil 2' && seed.tags?.includes('Redemittel')) {
        existing.category = seed.category;
        changed = true;
      }
      if (seed.tags?.length) {
        const tags = [...new Set([...(existing.tags ?? []), ...seed.tags])];
        if (tags.length !== (existing.tags?.length ?? 0) || tags.some((tag, index) => tag !== existing.tags?.[index])) {
          existing.tags = tags;
          changed = true;
        }
      }
      continue;
    }
    nextId += 1;
    const added = { ...seed, id: nextId };
    merged.push(added);
    existingByGerman.set(normalizeGerman(seed.german), added);
    changed = true;
  }

  return changed ? merged : words;
}

function normalizeGerman(german: string): string {
  return german.replace(/^(der|die|das)\s+/i, '').replace(/[.…]+$/g, '').trim().toLocaleLowerCase();
}

function writeWords(words: Word[]): void {
  writeWordRecords(words);
}

function matchesFilters(word: Word, filters: WordFilters): boolean {
  const search = filters.search?.toLocaleLowerCase();
  return (!search || word.german.toLocaleLowerCase().includes(search) || word.russian.toLocaleLowerCase().includes(search))
    && (!filters.category || word.category === filters.category)
    && (!filters.part_of_speech || word.part_of_speech === filters.part_of_speech);
}

function recordReview(): void {
  recordStoredReview();
}

const dataListeners = new Set<() => void>();

function notifyLearnerDataChanged(): void {
  dataListeners.forEach((listener) => listener());
}

export function subscribeToLearnerData(listener: () => void): () => void {
  dataListeners.add(listener);
  const handleStorage = (event: StorageEvent) => {
    if (event.key === WORDS_STORAGE_KEY || event.key === REVIEWS_STORAGE_KEY) listener();
  };
  if (typeof window !== 'undefined') window.addEventListener('storage', handleStorage);
  return () => {
    dataListeners.delete(listener);
    if (typeof window !== 'undefined') window.removeEventListener('storage', handleStorage);
  };
}

export class WortSchatzApi {
  async getWords(filters: WordFilters = {}): Promise<Word[]> { return readWords().filter((word) => matchesFilters(word, filters)); }

  async createWord(payload: WordCreate): Promise<Word> {
    const words = readWords();
    const cleanPayload = migrateWordGrammar(payload);
    const word: Word = {
      id: words.reduce((max, item) => Math.max(max, item.id), 0) + 1,
      german: cleanPayload.german,
      grammarInfo: cleanPayload.grammarInfo,
      russian: cleanPayload.russian,
      article: cleanPayload.article ?? null,
      category: cleanPayload.category ?? 'Мои слова',
      tags: cleanPayload.tags,
      part_of_speech: cleanPayload.part_of_speech,
      plural: cleanPayload.plural ?? null,
      example: cleanPayload.example ?? null,
      examples: cleanPayload.examples,
      tabooExplanations: cleanPayload.tabooExplanations,
      stage: 0,
      interval_hours: 4,
      mistakes: 0,
      next_review_at: null,
      srs: createInitialSrsState({ stage: 0, intervalHours: 4, mistakes: 0, nextReviewAt: null }),
    };
    writeWords([word, ...words]);
    notifyLearnerDataChanged();
    return word;
  }

  async updateWord(wordId: number, payload: WordUpdate): Promise<Word> {
    const words = readWords();
    const index = words.findIndex((word) => word.id === wordId);
    if (index < 0) throw new Error('Слово не найдено');
    const word = migrateWordGrammar({
      ...words[index],
      ...payload,
      article: payload.article ?? null,
      category: payload.category ?? null,
      plural: payload.plural ?? null,
      example: payload.example ?? null,
    }) as Word;
    words[index] = word;
    writeWords(words);
    notifyLearnerDataChanged();
    return word;
  }

  async deleteWord(wordId: number): Promise<void> {
    writeWords(readWords().filter((word) => word.id !== wordId));
    notifyLearnerDataChanged();
  }

  async reviewWord(payload: ReviewRequest): Promise<Word> {
    const words = readWords();
    const word = words.find((item) => item.id === payload.word_id);
    if (!word) throw new Error('Слово не найдено');
    const rating = 'rating' in payload ? payload.rating : legacyRating(payload.quality);
    const schedule = scheduleReview(word.srs ?? createInitialSrsState({ stage: word.stage, intervalHours: word.interval_hours, mistakes: word.mistakes, nextReviewAt: word.next_review_at }), rating);
    word.srs = schedule.srs;
    word.stage = schedule.stage;
    word.interval_hours = schedule.intervalHours;
    word.mistakes = schedule.srs.lapses;
    word.next_review_at = schedule.nextReviewAt;
    writeWords(words);
    recordReview();
    notifyLearnerDataChanged();
    return word;
  }

  async syncPendingChanges(): Promise<number> { return 0; }
}

export const api = new WortSchatzApi();
export const OFFLINE_STORAGE_KEY = WORDS_STORAGE_KEY;
export const LEGACY_OFFLINE_STORAGE_KEY = LEGACY_WORDS_STORAGE_KEY;
export function getReviewsToday(): number { const current = readReviewSummary(); return current.date === new Date().toISOString().slice(0, 10) ? current.count : 0; }

function legacyRating(quality: 0 | 1 | 2 | 3): ReviewRating {
  return quality === 0 ? 'again' : quality === 1 ? 'hard' : quality === 2 ? 'good' : 'easy';
}
