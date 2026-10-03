import { ArrowLeft, LoaderCircle, RotateCcw } from 'lucide-react';
import { useEffect, useState } from 'react';

import { api, type Word } from '../../api/client';
import { buildStudyQueue, type StudyQueueItem } from '../../lib/studySession';
import type { ReviewRating } from '../../lib/scheduling';
import { ArticleActivity } from './ArticleActivity';
import { MatchingActivity } from './MatchingActivity';
import { RecallActivity } from './RecallActivity';
import { TabooActivity } from './TabooActivity';

interface StudySessionProps {
  onExit: () => void;
}

export function StudySession({ onExit }: StudySessionProps) {
  const [words, setWords] = useState<Word[]>([]);
  const [queue, setQueue] = useState<StudyQueueItem[]>([]);
  const [position, setPosition] = useState(0);
  const [reviewed, setReviewed] = useState(0);
  const [isLoading, setLoading] = useState(true);
  const [isSubmitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSession = async () => {
    setLoading(true);
    setError(null);
    try {
      const loadedWords = await api.getWords();
      setWords(loadedWords);
      setQueue(buildStudyQueue(loadedWords));
      setPosition(0);
      setReviewed(0);
    } catch {
      setError('Не удалось загрузить занятие. Проверьте сохранённые данные и попробуйте ещё раз.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    void api.getWords().then((loadedWords) => {
      if (!active) return;
      setWords(loadedWords);
      setQueue(buildStudyQueue(loadedWords));
      setLoading(false);
    }).catch(() => {
      if (active) {
        setError('Не удалось загрузить занятие. Проверьте сохранённые данные и попробуйте ещё раз.');
        setLoading(false);
      }
    });
    return () => { active = false; };
  }, []);

  const currentItem = queue[position];
  const currentWord = currentItem ? words.find((word) => word.id === currentItem.wordId) : undefined;
  const progress = queue.length ? Math.round((position / queue.length) * 100) : 0;

  const submitRating = async (rating: ReviewRating) => {
    if (!currentItem || isSubmitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const updatedWord = await api.reviewWord({ word_id: currentItem.wordId, rating });
      setWords((current) => current.map((word) => word.id === updatedWord.id ? updatedWord : word));
      setReviewed((count) => count + 1);
      setPosition((index) => index + 1);
    } catch {
      setError('Не удалось сохранить ответ. Повторите оценку.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderActivity = (item: StudyQueueItem, word: Word) => {
    if (item.activity === 'taboo') return <TabooActivity word={word} onRate={(rating) => void submitRating(rating)} disabled={isSubmitting} />;
    if (item.activity === 'article') return <ArticleActivity word={word} onRate={(rating) => void submitRating(rating)} disabled={isSubmitting} />;
    if (item.activity === 'matching') return <MatchingActivity word={word} wordPool={words} onRate={(rating) => void submitRating(rating)} disabled={isSubmitting} />;
    return <RecallActivity word={word} onRate={(rating) => void submitRating(rating)} disabled={isSubmitting} />;
  };

  return (
    <section className="space-y-5" aria-labelledby="study-session-heading">
      <header className="flex items-center gap-3">
        <button type="button" aria-label="Завершить занятие" onClick={onExit} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-touch border border-slate-700 text-slate-300 transition hover:border-sky-300 hover:text-white">
          <ArrowLeft size={19} />
        </button>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-sky-300">Ежедневная практика</p>
          <h1 id="study-session-heading" className="mt-0.5 text-2xl font-semibold text-white">Занятие</h1>
        </div>
        {!isLoading && queue.length > 0 && position < queue.length && <span className="shrink-0 text-sm font-semibold tabular-nums text-slate-300">{position + 1} / {queue.length}</span>}
      </header>

      {!isLoading && queue.length > 0 && (
        <div aria-label="Прогресс занятия" role="progressbar" aria-valuemin={0} aria-valuemax={queue.length} aria-valuenow={position} className="h-2 overflow-hidden rounded-full bg-slate-800">
          <div className="h-full rounded-full bg-accent transition-[width] duration-300" style={{ width: `${progress}%` }} />
        </div>
      )}

      {error && <p role="alert" className="rounded-touch border border-rose-300/30 bg-rose-400/10 p-3 text-sm text-rose-100">{error}</p>}

      {isLoading ? (
        <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-slate-400">
          <LoaderCircle className="animate-spin text-sky-300" />
          <p className="text-sm">Подготавливаем занятие...</p>
        </div>
      ) : error && queue.length === 0 ? (
        <button type="button" onClick={() => void loadSession()} className="min-h-touch w-full rounded-touch bg-sky-300 px-4 text-sm font-bold text-slate-950">Повторить загрузку</button>
      ) : !currentItem || !currentWord ? (
        <div className="rounded-2xl border border-slate-700/60 bg-slate-800/50 p-7 text-center">
          <p className="text-lg font-semibold text-white">{reviewed ? 'Занятие завершено' : 'Пока нечего повторять'}</p>
          <p className="mt-2 text-sm leading-6 text-slate-400">{reviewed ? `Карточек пройдено: ${reviewed}` : 'Все слова пока ждут следующего повторения.'}</p>
          <div className="mt-5 flex flex-col gap-2">
            <button type="button" onClick={() => void loadSession()} className="inline-flex min-h-touch items-center justify-center gap-2 rounded-touch bg-sky-300 px-4 text-sm font-bold text-slate-950">
              <RotateCcw size={16} /> Проверить снова
            </button>
            <button type="button" onClick={onExit} className="min-h-touch rounded-touch border border-slate-700 px-4 text-sm font-semibold text-slate-200">Выйти</button>
          </div>
        </div>
      ) : (
        <div key={currentItem.id} className="space-y-5">
          {renderActivity(currentItem, currentWord)}
          {isSubmitting && <p className="text-center text-xs text-slate-400">Сохраняем ответ...</p>}
        </div>
      )}
    </section>
  );
}