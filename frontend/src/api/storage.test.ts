import { afterEach, describe, expect, it, vi } from 'vitest';

import { LEGACY_WORDS_STORAGE_KEY, WORDS_STORAGE_KEY } from './storage';
import { subscribeToLearnerData, WortSchatzApi } from './client';

function makeStorage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value); },
    values,
  };
}

describe('word storage migration', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('migrates legacy word records and retains their data and old key', async () => {
    const storage = makeStorage();
    const legacyWord = {
      id: 9000,
      german: 'der Beispielbegriff',
      russian: 'примерное слово',
      article: 'der',
      category: 'Мои слова',
      part_of_speech: 'noun',
      plural: 'die Beispielbegriffe',
      example: 'Das ist ein Beispiel.',
      stage: 3,
      interval_hours: 168,
      mistakes: 2,
      next_review_at: null,
    };
    storage.setItem(LEGACY_WORDS_STORAGE_KEY, JSON.stringify([legacyWord]));
    vi.stubGlobal('window', { localStorage: storage });

    const words = await new WortSchatzApi().getWords();
    const migrated = words.find((word) => word.id === legacyWord.id);
    const saved = JSON.parse(storage.getItem(WORDS_STORAGE_KEY) ?? '[]') as Array<{ id: number }>;

    expect(migrated).toMatchObject({
      german: legacyWord.german,
      russian: legacyWord.russian,
      stage: 3,
      interval_hours: 168,
      mistakes: 2,
      srs: { algorithmVersion: 1, stabilityDays: 7, lapses: 2, dueAt: null },
    });
    expect(saved.some((word) => word.id === legacyWord.id)).toBe(true);
    expect(storage.getItem(LEGACY_WORDS_STORAGE_KEY)).toBe(JSON.stringify([legacyWord]));
  });

  it('accepts both new ratings and the existing numeric review contract', async () => {
    const storage = makeStorage();
    vi.stubGlobal('window', { localStorage: storage });
    const api = new WortSchatzApi();
    const [word] = await api.getWords();

    const again = await api.reviewWord({ word_id: word.id, rating: 'again' });
    expect(again.interval_hours).toBe(4);
    expect(again.mistakes).toBe(1);

    const good = await api.reviewWord({ word_id: word.id, quality: 2 });
    expect(good.interval_hours).toBeGreaterThan(again.interval_hours);
    expect(good.srs?.repetitions).toBe(1);
  });

  it('notifies active views after a dictionary mutation', async () => {
    const storage = makeStorage();
    vi.stubGlobal('window', {
      localStorage: storage,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
    const listener = vi.fn();
    const unsubscribe = subscribeToLearnerData(listener);

    await new WortSchatzApi().createWord({ german: 'die Probe', russian: 'проверка', part_of_speech: 'noun' });

    expect(listener).toHaveBeenCalledTimes(1);
    unsubscribe();
  });
});