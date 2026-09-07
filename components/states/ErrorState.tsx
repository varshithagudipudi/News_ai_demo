interface ErrorStateProps {
  message: string;
  onRetry: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center rounded-none border border-dashed border-border bg-surface px-6 py-16 text-center"
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="mb-4 h-10 w-10 text-fg-muted"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 3 2 20h20L12 3z" />
        <path d="M12 10v4M12 17.5v.01" />
      </svg>
      <h2 className="text-lg font-semibold text-fg">
        We couldn&rsquo;t load the news
      </h2>
      <p className="mt-2 max-w-md text-sm text-fg-muted">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-6 inline-flex h-10 items-center rounded-none bg-fg px-4 text-sm font-bold uppercase tracking-wide text-bg transition-colors hover:bg-accent hover:text-accent-fg"
      >
        Retry
      </button>
    </div>
  );
}
