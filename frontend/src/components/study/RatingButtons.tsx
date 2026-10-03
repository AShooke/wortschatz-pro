import type { ReviewRating } from '../../lib/scheduling';

const ratings: Array<{ value: ReviewRating; label: string; className: string }> = [
  { value: 'again', label: 'Снова', className: 'border-rose-300/40 bg-rose-400/10 text-rose-200 hover:bg-rose-400/20' },
  { value: 'hard', label: 'Трудно', className: 'border-amber-300/40 bg-amber-400/10 text-amber-100 hover:bg-amber-400/20' },
  { value: 'good', label: 'Хорошо', className: 'border-emerald-300/40 bg-emerald-400/10 text-emerald-100 hover:bg-emerald-400/20' },
  { value: 'easy', label: 'Легко', className: 'border-sky-300/40 bg-sky-400/10 text-sky-100 hover:bg-sky-400/20' },
];

interface RatingButtonsProps {
  onRate: (rating: ReviewRating) => void;
  disabled?: boolean;
}

export function RatingButtons({ onRate, disabled = false }: RatingButtonsProps) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4" aria-label="Оцените, насколько легко вспомнили">
      {ratings.map(({ value, label, className }) => (
        <button
          key={value}
          type="button"
          disabled={disabled}
          onClick={() => onRate(value)}
          className={`min-h-touch rounded-touch border px-3 text-sm font-semibold transition disabled:cursor-wait disabled:opacity-60 ${className}`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}