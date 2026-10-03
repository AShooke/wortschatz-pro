import { Volume2 } from 'lucide-react';
import { useRef, useState, type PointerEvent } from 'react';

import type { Word } from '../../api/client';
import { ArticleBadge } from '../ArticleBadge';
import type { ReviewRating } from '../../lib/scheduling';
import { speakGerman } from '../../utils/speech';
import { RatingButtons } from './RatingButtons';

interface RecallActivityProps {
  word: Word;
  onRate: (rating: ReviewRating) => void;
  disabled?: boolean;
}

export function RecallActivity({ word, onRate, disabled = false }: RecallActivityProps) {
  const [revealed, setRevealed] = useState(false);
  const [deltaX, setDeltaX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const startX = useRef(0);
  const currentDelta = useRef(0);
  const didSwipe = useRef(false);

  const handlePointerDown = (event: PointerEvent<HTMLElement>) => {
    if (disabled || (event.target as HTMLElement).closest('button')) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    startX.current = event.clientX;
    currentDelta.current = 0;
    setDeltaX(0);
    setDragging(true);
  };

  const handlePointerMove = (event: PointerEvent<HTMLElement>) => {
    if (!dragging) return;
    const nextDelta = event.clientX - startX.current;
    currentDelta.current = nextDelta;
    setDeltaX(nextDelta);
  };

  const handlePointerEnd = (event: PointerEvent<HTMLElement>, cancelled = false) => {
    if (!dragging) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    setDragging(false);
    const distance = currentDelta.current;
    if (cancelled || Math.abs(distance) < 88) {
      currentDelta.current = 0;
      setDeltaX(0);
      return;
    }
    didSwipe.current = true;
    onRate(distance < 0 ? 'again' : 'good');
  };

  const toggleReveal = () => {
    if (didSwipe.current) {
      didSwipe.current = false;
      return;
    }
    setRevealed((current) => !current);
  };

  return (
    <div className="space-y-5">
      <article
        role="button"
        tabIndex={0}
        aria-label={revealed ? 'Показать немецкое слово' : 'Показать перевод'}
        onClick={toggleReveal}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={(event) => handlePointerEnd(event, true)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            setRevealed((current) => !current);
          }
        }}
        style={{ transform: `translateX(${deltaX}px) rotate(${deltaX * 0.035}deg)`, touchAction: 'pan-y' }}
        className={`relative min-h-[24rem] rounded-2xl border border-slate-700/60 bg-slate-800/50 p-6 text-left shadow-xl shadow-black/20 ${dragging ? '' : 'transition-transform duration-200 ease-out'} ${disabled ? 'pointer-events-none opacity-70' : ''}`}
      >
        <span aria-hidden="true" className="pointer-events-none absolute left-5 top-5 rounded-full border border-rose-300/40 bg-slate-950/70 px-3 py-1 text-xs font-bold text-rose-200" style={{ opacity: Math.min(Math.max(-deltaX / 88, 0), 1) }}>Снова</span>
        <span aria-hidden="true" className="pointer-events-none absolute right-5 top-5 rounded-full border border-emerald-300/40 bg-slate-950/70 px-3 py-1 text-xs font-bold text-emerald-100" style={{ opacity: Math.min(Math.max(deltaX / 88, 0), 1) }}>Хорошо</span>
        {!revealed ? (
          <div className="flex min-h-[20rem] flex-col items-center justify-center text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Немецкое слово</p>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              {word.article && <ArticleBadge article={word.article} className="px-3 py-1 text-sm" />}
              <h2 className="break-words text-3xl font-semibold text-white">{stripArticle(word.german)}</h2>
            </div>
            <button
              type="button"
              aria-label={`Произнести ${word.german}`}
              onClick={(event) => { event.stopPropagation(); speakGerman(word.german); }}
              className="mt-8 inline-flex min-h-touch items-center gap-2 rounded-touch border border-slate-600 px-4 text-sm font-semibold text-slate-200 transition hover:border-sky-300 hover:text-sky-100"
            >
              <Volume2 size={17} /> Произнести
            </button>
            <p className="mt-6 text-xs text-slate-500">Нажмите, чтобы открыть перевод, или проведите карточку</p>
          </div>
        ) : (
          <div className="flex min-h-[20rem] flex-col justify-center">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-300">Перевод</p>
            <h2 className="mt-4 break-words text-2xl font-semibold text-white">{word.russian}</h2>
            {word.grammarInfo && <p className="mt-2 w-fit rounded-full border border-slate-600/70 bg-slate-900/70 px-3 py-1 text-xs font-medium text-slate-400">{word.grammarInfo}</p>}
            {word.plural && <p className="mt-5 text-sm text-slate-300">Множественное число: <span className="font-semibold text-white">{word.plural}</span></p>}
            {word.example && <p className="mt-5 border-t border-slate-700 pt-4 text-sm leading-6 text-slate-300">{word.example}</p>}
          </div>
        )}
      </article>
      {revealed && <RatingButtons onRate={onRate} disabled={disabled} />}
    </div>
  );
}

function stripArticle(german: string): string {
  return german.replace(/^(der|die|das)\s+/i, '');
}