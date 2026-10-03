export type GermanArticle = 'der' | 'die' | 'das';

export const articleBadgeStyles: Record<GermanArticle, string> = {
  der: 'border-sky-300/35 bg-sky-400/15 text-sky-200',
  die: 'border-rose-300/35 bg-rose-400/15 text-rose-200',
  das: 'border-emerald-300/35 bg-emerald-400/15 text-emerald-200',
};

export const articleChoiceStyles: Record<GermanArticle, string> = {
  der: 'border-sky-300/40 bg-sky-400/10 text-sky-200',
  die: 'border-rose-300/40 bg-rose-400/10 text-rose-200',
  das: 'border-emerald-300/40 bg-emerald-400/10 text-emerald-200',
};