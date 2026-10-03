import type { GermanArticle } from '../lib/articleStyles';
import { articleBadgeStyles } from '../lib/articleStyles';

interface ArticleBadgeProps {
  article: GermanArticle;
  className?: string;
}

export function ArticleBadge({ article, className = '' }: ArticleBadgeProps) {
  return <span className={`inline-flex shrink-0 items-center rounded-full border px-2.5 py-1 text-xs font-bold ${articleBadgeStyles[article]} ${className}`}>{article}</span>;
}