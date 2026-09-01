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
        'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold',
        getCategoryBadgeClass(slug),
        className,
      )}
    >
      {getCategoryName(slug)}
    </span>
  );
}
