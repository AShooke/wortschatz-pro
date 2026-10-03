import { Check } from 'lucide-react';
import { useState } from 'react';

import type { Word } from '../../api/client';
import type { ReviewRating } from '../../lib/scheduling';
import { RatingButtons } from './RatingButtons';

interface MatchingActivityProps {
  word: Word;
  wordPool: Word[];
  onRate: (rating: ReviewRating) => void;
  disabled?: boolean;
}

export function MatchingActivity({ word, wordPool, onRate, disabled = false }: MatchingActivityProps) {
  const [choices] = useState(() => makeChoices(word, wordPool));
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const selected = choices.find((choice) => choice.id === selectedId);
  const correct = selected?.id === word.id;

  return (
    <div className="space-y-5">
      <article className="rounded-2xl border border-slate-700/60 bg-slate-800/50 p-6 text-center shadow-xl shadow-black/20">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Найдите перевод</p>
        <h2 className="mt-8 break-words text-3xl font-semibold text-white">{word.german}</h2>
      </article>
      <div className="grid gap-2">
        {choices.map((choice) => {
          const isSelected = choice.id === selectedId;
          const isAnswer = Boolean(selectedId) && choice.id === word.id;
          return (
            <button
              key={choice.id}
              type="button"
              disabled={Boolean(selected) || disabled}
              onClick={() => setSelectedId(choice.id)}
              className={`min-h-touch rounded-touch border px-4 py-3 text-left text-sm font-semibold transition ${isAnswer ? 'border-emerald-300/40 bg-emerald-400/10 text-emerald-100' : isSelected ? 'border-rose-300/50 bg-rose-400/10 text-rose-100' : 'border-slate-700 bg-slate-900/70 text-slate-200 hover:border-slate-500'}`}
            >
              <span className="flex items-center justify-between gap-3">{choice.russian}{isAnswer && <Check size={17} />}</span>
            </button>
          );
        })}
      </div>
      {selected && (
        <>
          <p className={`text-center text-sm font-semibold ${correct ? 'text-emerald-200' : 'text-rose-200'}`}>
            {correct ? 'Верно' : `Правильный перевод: ${word.russian}`}
          </p>
          <RatingButtons onRate={onRate} disabled={disabled} />
        </>
      )}
    </div>
  );
}

function makeChoices(word: Word, words: Word[]): Word[] {
  const distractors = words.filter((candidate) => candidate.id !== word.id);
  for (let index = distractors.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [distractors[index], distractors[swapIndex]] = [distractors[swapIndex], distractors[index]];
  }
  const choices = [word, ...distractors.slice(0, 3)];
  for (let index = choices.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [choices[index], choices[swapIndex]] = [choices[swapIndex], choices[index]];
  }
  return choices;
}