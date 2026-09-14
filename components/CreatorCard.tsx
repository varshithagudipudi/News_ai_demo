import { directoryTopics, type CreatorProfile } from '@/lib/creators/directory';

export function CreatorAvatar({ creator }: { creator: CreatorProfile }) {
  const tone = creator.id.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0) % 4;
  return <span aria-hidden="true" data-tone={tone} className="creator-avatar">
    {creator.name.split(/\s+/).slice(0, 2).map((word) => word[0]).join('')}
  </span>;
}

export function CreatorSaveButton({ creator, saved, onToggle }: { creator: CreatorProfile; saved: boolean; onToggle: () => void }) {
  return (
    <button type="button" aria-label={`${saved ? 'Unsave' : 'Save'} ${creator.name}`} aria-pressed={saved} onClick={onToggle}
      className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition-colors ${saved ? 'border-accent/30 bg-accent-soft text-accent' : 'border-border text-fg-muted hover:border-accent hover:text-accent'}`}>
      <svg aria-hidden="true" viewBox="0 0 24 24" fill={saved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" className="h-4 w-4"><path d="M6 4h12v16l-6-4-6 4z" /></svg>
    </button>
  );
}

export function CreatorCard({ creator, saved, onToggle, onOpen }: {
  creator: CreatorProfile; saved: boolean; onToggle: () => void; onOpen: () => void;
}) {
  const topics = directoryTopics.filter((topic) => creator.topics.includes(topic.slug));
  return (
    <article className="creator-card" data-creator-id={creator.id}>
      <div className="flex items-start justify-between gap-3">
        <CreatorAvatar creator={creator} />
        <CreatorSaveButton creator={creator} saved={saved} onToggle={onToggle} />
      </div>
      <div className="mt-4">
        <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-fg-muted">{creator.type}</p>
        <h3 className="font-display text-lg font-semibold leading-snug tracking-tight text-fg">
          <button type="button" onClick={onOpen} className="text-left hover:text-accent">{creator.name}</button>
        </h3>
      </div>
      <p className="mb-4 mt-3 text-sm leading-relaxed text-fg-muted">{creator.description}</p>
      <div className="mt-auto flex flex-wrap gap-1.5">
        {topics.slice(0, 2).map((topic) => <span key={topic.slug} className="creator-tag">{topic.label}</span>)}
        {topics.length > 2 && <span className="creator-tag" title={topics.slice(2).map((topic) => topic.label).join(', ')}>+{topics.length - 2}</span>}
      </div>
      <div className="mt-5 flex items-center justify-between gap-3 border-t border-border pt-4 text-xs font-semibold">
        <button type="button" onClick={onOpen} className="text-accent hover:underline">View profile <span aria-hidden="true">→</span><span className="sr-only"> for {creator.name}</span></button>
        <a href={creator.url} target="_blank" rel="noopener noreferrer" className="text-fg-muted hover:text-accent">Visit site <span aria-hidden="true">↗</span><span className="sr-only"> for {creator.name} (opens in a new tab)</span></a>
      </div>
    </article>
  );
}
