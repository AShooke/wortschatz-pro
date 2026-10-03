import { useEffect, useState } from 'react';

import { api, getReviewsToday, subscribeToLearnerData, type Word } from '../api/client';

interface LearnerData {
  words: Word[];
  reviewsToday: number;
  isLoading: boolean;
  error: string | null;
}

const initialData: LearnerData = { words: [], reviewsToday: 0, isLoading: true, error: null };

export function useLearnerData(): LearnerData {
  const [data, setData] = useState(initialData);

  useEffect(() => {
    let active = true;
    let requestId = 0;

    const refresh = async () => {
      const currentRequest = ++requestId;
      try {
        const words = await api.getWords();
        if (!active || currentRequest !== requestId) return;
        setData({ words, reviewsToday: getReviewsToday(), isLoading: false, error: null });
      } catch {
        if (!active || currentRequest !== requestId) return;
        setData((current) => ({ ...current, isLoading: false, error: 'Не удалось загрузить данные.' }));
      }
    };

    const unsubscribe = subscribeToLearnerData(() => { void refresh(); });
    void refresh();
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  return data;
}