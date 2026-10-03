import { useEffect } from 'react';
import { X } from 'lucide-react';

import type { Word } from '../api/client';
import { ArticleBadge } from './ArticleBadge';
import { formatStability } from '../lib/learningStats';

interface WordDetailsModalProps {
  word: Word;
  onClose: () => void;
}

export function WordDetailsModal({ word, onClose }: WordDetailsModalProps) {
  const examples = word.examples?.length ? word.examples : word.example ? [word.example] : [];
  const nextReviewAt = word.srs?.dueAt ?? word.next_review_at;
  const german = word.article
    ? word.german.replace(new RegExp(`^${word.article}\\s+`, 'i'), '')
    : word.german;

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="word-details-heading"
        className="flex max-h-[min(88svh,48rem)] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-slate-600/70 bg-slate-900/95 shadow-2xl shadow-black/50 backdrop-blur-xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-700/70 p-5">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase text-sky-300">Словарная карточка</p>
            <div className="mt-2 flex flex-wrap items-baseline gap-2">
              {word.article && <ArticleBadge article={word.article} className="px-2.5 py-1 text-sm" />}
              <h2 id="word-details-heading" className="break-words text-2xl font-semibold leading-8 text-white">{german}</h2>
            </div>
            <p className="mt-2 text-base leading-6 text-slate-300">{word.russian}</p>
          </div>
          <button type="button" aria-label="Закрыть" onClick={onClose} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-touch text-slate-400 transition hover:bg-slate-800 hover:text-white"><X size={20} /></button>
        </div>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-5">
          <section aria-labelledby="word-schedule-heading" className="rounded-xl border border-slate-700/60 bg-slate-800/40 p-4">
            <div className="flex items-center justify-between gap-3">
              <h3 id="word-schedule-heading" className="text-sm font-semibold text-white">Интервальный повтор</h3>
              <span className="text-right text-xs font-medium text-sky-200">{formatReviewDate(nextReviewAt)}</span>
            </div>
            <dl className="mt-4 grid grid-cols-3 gap-3">
              <ScheduleMetric label="Повторы подряд" value={String(word.srs?.repetitions ?? 0)} />
              <ScheduleMetric label="Сложность" value={word.srs ? `${word.srs.difficulty.toFixed(1)} / 10` : '—'} />
              <ScheduleMetric label="Устойчивость" value={formatStability(word.srs?.stabilityDays ?? word.interval_hours / 24)} />
            </dl>
          </section>

          {(word.category || word.tags?.length) && (
            <div className="flex flex-wrap gap-2" aria-label="Категории и темы">
              {word.category && <span className="rounded-full border border-sky-300/20 bg-sky-400/10 px-2.5 py-1 text-xs font-semibold text-sky-200">{word.category}</span>}
              {word.tags?.map((tag) => <span key={tag} className="rounded-full border border-slate-600 bg-slate-800 px-2.5 py-1 text-xs font-medium text-slate-300">{tag}</span>)}
            </div>
          )}

          <section aria-labelledby="word-examples-heading">
            <h3 id="word-examples-heading" className="text-sm font-semibold text-white">Примеры</h3>
            {examples.length ? (
              <ul className="mt-2 space-y-2">
                {examples.map((example, index) => <li key={`${index}-${example}`} className="rounded-xl border border-slate-700/60 bg-slate-800/50 p-3 text-sm leading-6 text-slate-300">{example}</li>)}
              </ul>
            ) : <p className="mt-2 text-sm text-slate-500">Примеров пока нет.</p>}
          </section>
        </div>

        <div className="border-t border-slate-700/70 p-4">
          <button type="button" onClick={onClose} className="min-h-touch w-full rounded-touch bg-accent px-4 text-sm font-bold text-ink transition hover:bg-accent/90">Закрыть</button>
        </div>
      </section>
    </div>
  );
}

function ScheduleMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-[10px] leading-4 text-slate-500">{label}</dt>
      <dd className="mt-1 break-words text-sm font-semibold tabular-nums text-slate-100">{value}</dd>
    </div>
  );
}

function formatReviewDate(value: string | null): string {
  if (!value) return 'Ожидает первого ответа';
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) return 'Дата не задана';
  if (timestamp <= Date.now()) return 'Пора повторить';
  return new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(timestamp);
}