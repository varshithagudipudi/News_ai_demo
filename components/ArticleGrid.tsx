import type { Article } from '@/lib/types/article';
import { ArticleCard } from '@/components/ArticleCard';

interface ArticleGridProps {
  articles: Article[];
  onRemove?: (id: string) => void;
  /** Labels the grid for screen readers. */
  label: string;
}

/** One column on phones, two on tablets, three on large screens. */
export function ArticleGrid({ articles, onRemove, label }: ArticleGridProps) {
  return (
    <ul
      aria-label={label}
      className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
    >
      {articles.map((article) => (
        <li key={article.id} className="h-full">
          <ArticleCard article={article} onRemove={onRemove} />
        </li>
      ))}
    </ul>
  );
}
