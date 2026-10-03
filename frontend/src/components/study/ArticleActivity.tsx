import { Check, Volume2 } from 'lucide-react';
import { useState } from 'react';

import type { Word } from '../../api/client';
import { articleChoiceStyles, type GermanArticle } from '../../lib/articleStyles';
import type { ReviewRating } from '../../lib/scheduling';
import { speakGerman } from '../../utils/speech';
import { RatingButtons } from './RatingButtons';

interface ArticleActivityProps {
  word: Word;
  onRate: (rating: ReviewRating) => void;
  disabled?: boolean;
}

const articles = ['der', 'die', 'das'] as const;

export function ArticleActivity({ word, onRate, disabled = false }: ArticleActivityProps) {
  const [chosen, setChosen] = useState<(typeof articles)[number] | null>(null);
  const correct = chosen === word.article;
  const german = word.german.replace(/^(der|die|das)\s+/i, '');

  return (
    <div className="space-y-5">
      <article className={`rounded-2xl border p-6 text-center transition ${chosen ? (correct ? 'border-emerald-300/50 bg-emerald-400/10' : 'border-rose-300/50 bg-rose-400/10') : 'border-slate-700/60 bg-slate-800/50'}`}>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Выберите артикль</p>
        <h2 className="mt-8 break-words text-4xl font-semibold text-white">{german}</h2>
        <p className="mt-3 text-base text-slate-400">{word.russian}</p>
        {chosen && (
          <div className="mt-6 flex items-center justify-center gap-2 text-sm font-semibold">
            {correct ? <Check className="text-emerald-300" size={18} /> : <span className="text-rose-300">Правильный ответ:</span>}
            <span className={correct ? 'text-emerald-200' : 'text-slate-100'}>{word.article}{word.plural ? ` · ${word.plural}` : ''}</span>
          </div>
        )}
      </article>

      <div className="grid grid-cols-3 gap-3">
        {articles.map((article) => (
          <button
            key={article}
            type="button"
            disabled={Boolean(chosen) || disabled}
            onClick={() => {
              setChosen(article);
              if (article !== word.article) navigator.vibrate?.([40, 30, 40]);
            }}
            className={`min-h-[5rem] rounded-2xl border text-xl font-bold transition disabled:opacity-75 ${articleClass(article, chosen, word.article)}`}
          >
            {article}
          </button>
        ))}
      </div>

      {chosen && (
        <>
          <button type="button" onClick={() => speakGerman(word.german)} className="mx-auto flex min-h-touch items-center gap-2 rounded-touch px-4 text-sm font-semibold text-slate-400 hover:text-sky-100">
            <Volume2 size={17} /> Послушать слово
          </button>
          <RatingButtons onRate={onRate} disabled={disabled} />
        </>
      )}
    </div>
  );
}

function articleClass(article: GermanArticle, chosen: GermanArticle | null, correct: GermanArticle | null): string {
  const base = articleChoiceStyles[article];
  if (!chosen) return `${base} hover:-translate-y-0.5`;
  if (article === correct) return `${base} article-correct`;
  if (article === chosen) return 'border-rose-300/60 bg-rose-400/20 text-rose-100';
  return `${base} opacity-40`;
}