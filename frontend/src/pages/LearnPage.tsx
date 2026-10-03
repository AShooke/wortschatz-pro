import { ArrowRight, CalendarCheck, LoaderCircle, Target } from 'lucide-react';
import { useLearnerData } from '../lib/useLearnerData';

import { isDue } from '../lib/scheduling';

const DAILY_GOAL = 10;

interface LearnPageProps {
  onStartSession: () => void;
}

export function LearnPage({ onStartSession }: LearnPageProps) {
  const { words, reviewsToday, isLoading, error } = useLearnerData();

  const dueCount = words.filter((word) => isDue(word.srs?.dueAt ?? word.next_review_at)).length;
  const completedGoal = Math.min(reviewsToday, DAILY_GOAL);
  const goalProgress = Math.round((completedGoal / DAILY_GOAL) * 100);

  return (
    <section className="space-y-6 pb-3" aria-labelledby="today-heading">
      <header className="pt-2">
        <p className="text-sm font-semibold text-sky-300">WortSchatz Pro</p>
        <h1 id="today-heading" className="mt-1 text-3xl font-semibold tracking-tight text-white">Сегодня</h1>
        <p className="mt-2 text-sm leading-6 text-slate-400">Небольшая практика сегодня приближает к свободной речи.</p>
      </header>

      <section aria-labelledby="daily-goal-heading" className="overflow-hidden rounded-2xl border border-slate-700/60 bg-slate-800/50 p-5 shadow-xl shadow-black/20">
        <div className="flex items-center gap-2 text-sky-200">
          <Target size={18} />
          <h2 id="daily-goal-heading" className="text-sm font-semibold">Цель на сегодня</h2>
        </div>
        <div className="mt-5 flex items-end justify-between gap-4">
          <div>
            <p className="text-4xl font-semibold tabular-nums text-white">{isLoading ? '—' : dueCount}</p>
            <p className="mt-1 text-sm text-slate-400">слов ждут повторения</p>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-2xl font-semibold tabular-nums text-sky-200">{isLoading ? '—' : `${completedGoal}/${DAILY_GOAL}`}</p>
            <p className="mt-1 text-xs text-slate-500">повторений сегодня</p>
          </div>
        </div>
        <div className="mt-5">
          <div aria-label="Прогресс дневной цели" role="progressbar" aria-valuemin={0} aria-valuemax={DAILY_GOAL} aria-valuenow={completedGoal} className="h-2.5 overflow-hidden rounded-full bg-slate-950/70">
            <div className="h-full rounded-full bg-sky-300 transition-[width] duration-500" style={{ width: `${goalProgress}%` }} />
          </div>
          <p className="mt-2 text-xs text-slate-500">{reviewsToday >= DAILY_GOAL ? 'Цель выполнена. Отличная работа!' : `Ещё ${DAILY_GOAL - completedGoal} до дневной цели`}</p>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-slate-700/50 bg-slate-800/30 p-4">
          <CalendarCheck size={18} className="text-emerald-300" />
          <p className="mt-3 text-xl font-semibold tabular-nums text-white">{isLoading ? '—' : reviewsToday}</p>
          <p className="mt-1 text-xs text-slate-400">повторено сегодня</p>
        </div>
        <div className="rounded-2xl border border-slate-700/50 bg-slate-800/30 p-4">
          <Target size={18} className="text-amber-200" />
          <p className="mt-3 text-xl font-semibold tabular-nums text-white">{isLoading ? '—' : dueCount}</p>
          <p className="mt-1 text-xs text-slate-400">к повторению</p>
        </div>
      </div>

      {error && <p role="alert" className="rounded-touch border border-rose-300/30 bg-rose-400/10 p-3 text-sm text-rose-100">{error}</p>}

      <button
        type="button"
        onClick={onStartSession}
        disabled={isLoading}
        className="flex min-h-[4.25rem] w-full items-center justify-between rounded-2xl bg-accent px-5 text-base font-bold text-ink shadow-lg shadow-black/20 transition hover:bg-accent/90 disabled:cursor-wait disabled:opacity-70"
      >
        <span className="flex items-center gap-3">
          {isLoading ? <LoaderCircle size={20} className="animate-spin" /> : null}
          Начать занятие
        </span>
        {!isLoading && <ArrowRight size={21} />}
      </button>
    </section>
  );
}