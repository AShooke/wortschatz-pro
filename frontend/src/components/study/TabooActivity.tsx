import { Eye, EyeOff, Volume2 } from 'lucide-react';
import { useState } from 'react';

import type { Word } from '../../api/client';
import type { ReviewRating } from '../../lib/scheduling';
import { speakGerman } from '../../utils/speech';
import { RatingButtons } from './RatingButtons';

interface TabooActivityProps {
  word: Word;
  onRate: (rating: ReviewRating) => void;
  disabled?: boolean;
}

export function TabooActivity({ word, onRate, disabled = false }: TabooActivityProps) {
  const [revealed, setRevealed] = useState(false);
  const [showTranslation, setShowTranslation] = useState(false);
  const german = word.article ? `${word.article} ${word.german.replace(/^(der|die|das)\s+/i, '')}` : word.german;

  return (
    <div className="space-y-5">
      <article className="rounded-2xl border border-slate-700/60 bg-slate-800/50 p-6 text-center shadow-xl shadow-black/20">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Объясните слово по-немецки</p>
        <h2 className="mt-8 break-words text-4xl font-semibold text-white">{german}</h2>
        <p className="mx-auto mt-4 max-w-sm text-sm leading-6 text-slate-400">Назовите слово своими словами, не используя его напрямую.</p>
        <button type="button" onClick={() => speakGerman(german)} className="mx-auto mt-5 inline-flex min-h-touch items-center gap-2 rounded-touch px-4 text-sm font-semibold text-slate-300 hover:text-sky-100">
          <Volume2 size={17} /> Произнести
        </button>
        <button type="button" onClick={() => setShowTranslation((current) => !current)} className="mx-auto mt-2 flex min-h-touch items-center gap-2 rounded-touch border border-slate-700 px-4 text-sm font-semibold text-slate-300 transition hover:border-sky-300/60 hover:text-sky-100">
          {showTranslation ? <EyeOff size={17} /> : <Eye size={17} />}
          {showTranslation ? word.russian : 'Показать перевод'}
        </button>
      </article>

      {!revealed ? (
        <button type="button" onClick={() => setRevealed(true)} className="min-h-touch w-full rounded-touch bg-sky-300 px-5 text-sm font-bold text-slate-950 transition hover:bg-sky-200">
          Показать объяснения
        </button>
      ) : (
        <>
          <div className="rounded-touch border border-sky-300/30 bg-sky-400/10 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-sky-200">Возможные объяснения</p>
            <ul className="mt-3 list-disc space-y-3 pl-5 text-sm leading-6 text-slate-200">
              {word.tabooExplanations?.map((explanation) => <li key={explanation}>{explanation}</li>)}
            </ul>
          </div>
          <RatingButtons onRate={onRate} disabled={disabled} />
        </>
      )}
    </div>
  );
}