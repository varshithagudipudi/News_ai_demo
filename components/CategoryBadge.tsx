import {
  getCategoryBadgeClass,
  getCategoryName,
} from '@/lib/config/categories';
import { cn } from '@/lib/utils/cn';

export function CategoryBadge({
  slug,
  className,
}: {
  slug: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center text-xs font-bold uppercase tracking-wide',
        getCategoryBadgeClass(slug),
        className,
      )}
    >
      {getCategoryName(slug)}
    </span>
  );
}
