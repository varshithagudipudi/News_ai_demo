interface EmptyStateProps {
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  title,
  message,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-none border border-dashed border-border bg-surface px-6 py-16 text-center">
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="mb-4 h-10 w-10 text-fg-muted"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </svg>
      <h2 className="text-lg font-semibold text-fg">{title}</h2>
      <p className="mt-2 max-w-md text-sm text-fg-muted">{message}</p>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-6 inline-flex h-10 items-center rounded-none bg-fg px-4 text-sm font-bold uppercase tracking-wide text-bg transition-colors hover:bg-accent hover:text-accent-fg"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
