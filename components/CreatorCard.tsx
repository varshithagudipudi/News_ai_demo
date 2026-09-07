import { getSkillLevelBadgeClass, type Creator } from '@/lib/config/creators';
import { cn } from '@/lib/utils/cn';

interface CreatorCardProps {
  creator: Creator;
}

export function CreatorCard({ creator }: CreatorCardProps) {
  return (
    <article className="flex h-full flex-col gap-3 rounded-none border border-border bg-surface p-4 transition-colors hover:border-fg">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h4 className="truncate text-base font-extrabold leading-snug text-fg">
            {creator.name}
          </h4>
          <p className="truncate text-xs text-fg-muted">
            by {creator.realName}
          </p>
          <p className="mt-0.5 text-xs font-bold uppercase tracking-wide text-fg-muted">
            {creator.platform}
          </p>
        </div>
        <span
          className={cn(
            'shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold',
            getSkillLevelBadgeClass(creator.skillLevel),
          )}
        >
          {creator.skillLevel}
        </span>
      </div>

      <p className="line-clamp-3 text-sm leading-relaxed text-fg-muted">
        {creator.description}
      </p>

      <div className="flex flex-wrap gap-1.5">
        {creator.focusAreas.map((area) => (
          <span
            key={area}
            className="inline-flex items-center rounded-full bg-surface-muted px-2 py-0.5 text-xs font-medium text-fg-muted"
          >
            {area}
          </span>
        ))}
      </div>

      <p className="text-xs leading-relaxed text-fg-muted">
        <span className="font-medium text-fg">Best for: </span>
        {creator.bestFor}
      </p>

      <a
        href={creator.url}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-auto inline-flex items-center gap-1.5 self-start text-sm font-bold text-accent hover:underline"
      >
        Visit
        <span className="sr-only"> {creator.name}</span>
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="h-3.5 w-3.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M7 17 17 7M9 7h8v8" />
        </svg>
      </a>
    </article>
  );
}
