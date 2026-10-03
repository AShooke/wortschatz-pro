import { Activity, BookOpenCheck, CheckCircle2, Clock3, RotateCcw, Target } from 'lucide-react';

import { formatStability, summarizeLearning } from '../lib/learningStats';
import { useLearnerData } from '../lib/useLearnerData';

export function StatsPage() {
  const { words, reviewsToday, isLoading, error } = useLearnerData();
  const summary = summarizeLearning(words);
  const mastery = summary.total ? Math.round((summary.mastered / summary.total) * 100) : 0;

  return (
    <section className="space-y-6" aria-labelledby="stats-heading">
      <div>
        <p className="text-sm font-semibold text-sky-300">Ваш прогресс</p>
        <h1 id="stats-heading" className="mt-1 text-3xl font-semibold tracking-tight text-white">Статистика</h1>
      </div>
      {error && <p role="alert" className="rounded-touch border border-rose-300/30 bg-rose-400/10 p-3 text-sm text-rose-100">{error}</p>}
      <div className="grid grid-cols-2 gap-3">
        <Metric icon={<CheckCircle2 size={18} />} value={isLoading ? '—' : reviewsToday} label="повторений сегодня" tone="text-emerald-300" />
        <Metric icon={<RotateCcw size={18} />} value={isLoading ? '—' : summary.due} label="готовы к повторению" tone="text-sky-200" />
        <Metric icon={<BookOpenCheck size={18} />} value={isLoading ? '—' : summary.mastered} label="устойчивых слов" tone="text-accent" />
        <Metric icon={<Activity size={18} />} value={isLoading ? '—' : summary.lapses} label="сбросов интервала" tone="text-rose-200" />
      </div>
      <section aria-labelledby="memory-heading" className="rounded-2xl border border-slate-700/60 bg-slate-800/40 p-5 shadow-xl shadow-black/20 backdrop-blur-md">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-sky-200"><Clock3 size={17} /><h2 id="memory-heading" className="text-sm font-semibold">Память словаря</h2></div>
            <p className="mt-2 text-xs leading-5 text-slate-400">Освоено при 5+ повторах и устойчивости от 14 дней</p>
          </div>
          <span className="shrink-0 text-2xl font-semibold tabular-nums text-accent">{isLoading ? '—' : formatStability(summary.averageStabilityDays)}</span>
        </div>
        <div className="mt-5 h-2.5 overflow-hidden rounded-full bg-slate-950/70">
          <div className="h-full rounded-full bg-accent transition-[width] duration-500" style={{ width: `${mastery}%` }} />
        </div>
        <div className="mt-3 flex items-center justify-between gap-3 text-xs text-slate-400">
          <span>{isLoading ? 'Загружаем...' : `${summary.mastered} освоено`}</span>
          <span>{isLoading ? '—' : `${summary.learning} в изучении`}</span>
        </div>
      </section>
      <p className="flex items-center gap-2 text-xs leading-5 text-slate-500"><Target size={15} className="shrink-0 text-sky-300" />Сложные ответы возвращают слова раньше, а уверенные постепенно увеличивают интервал.</p>
    </section>
  );
}

function Metric({ icon, value, label, tone }: { icon: React.ReactNode; value: string | number; label: string; tone: string }) {
  return (
    <div className="rounded-2xl border border-slate-700/50 bg-slate-800/35 p-4">
      <div className={tone}>{icon}</div>
      <p className="mt-3 text-2xl font-semibold tabular-nums text-white">{value}</p>
      <p className="mt-1 text-xs leading-4 text-slate-400">{label}</p>
    </div>
  );
}
