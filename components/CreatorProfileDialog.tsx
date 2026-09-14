'use client';

import { useEffect, useRef } from 'react';
import { CreatorAvatar, CreatorSaveButton } from '@/components/CreatorCard';
import { directoryTopics, type CreatorProfile } from '@/lib/creators/directory';

export function CreatorProfileDialog({ creator, saved, onToggle, onClose }: {
  creator: CreatorProfile; saved: boolean; onToggle: () => void; onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    const overflow = document.body.style.overflow;
    dialog?.showModal();
    document.body.style.overflow = 'hidden';
    return () => { dialog?.close(); document.body.style.overflow = overflow; };
  }, []);
  return (
    <dialog ref={ref} aria-labelledby="creator-profile-name" className="creator-dialog" onClose={() => { if (!ref.current?.open) onClose(); }}
      onClick={(event) => { if (event.target === event.currentTarget) ref.current?.close(); }}>
      <div className="p-6 sm:p-8">
        <div className="mb-6 flex items-center justify-between gap-3">
          <span className="section-eyebrow">Meet the voice</span>
          <button type="button" autoFocus aria-label="Close creator profile" onClick={() => ref.current?.close()} className="flex h-10 w-10 items-center justify-center rounded-full border border-border text-fg-muted hover:text-fg">✕</button>
        </div>
        <div className="flex items-start justify-between gap-3"><CreatorAvatar creator={creator} /><CreatorSaveButton creator={creator} saved={saved} onToggle={onToggle} /></div>
        <p className="mb-2 mt-5 text-xs text-accent">{creator.type}</p>
        <h2 id="creator-profile-name" className="text-2xl font-bold tracking-tight text-fg">{creator.name}</h2>
        <p className="mt-4 text-base leading-relaxed text-fg-muted">{creator.description}</p>
        <h3 className="mb-3 mt-7 text-xs font-semibold uppercase tracking-wider text-fg-muted">Explore with this creator</h3>
        <div className="flex flex-wrap gap-2">{directoryTopics.filter((topic) => creator.topics.includes(topic.slug)).map((topic) => <span key={topic.slug} className="creator-tag">{topic.label}</span>)}</div>
        {creator.formats.length > 0 && <p className="mt-5 text-sm leading-relaxed text-fg-muted"><span className="font-medium text-fg">What you’ll find: </span>{creator.formats.join(' · ')}</p>}
        <div className="mt-7 border-t border-border pt-5">
          <p className="mb-3 text-sm text-fg-muted">Start with their writing, learning resources, and channel links.</p>
          <a href={creator.url} target="_blank" rel="noopener noreferrer" className="flex min-h-11 items-center justify-between gap-3 rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-accent-fg hover:bg-accent/90">Visit {new URL(creator.url).hostname.replace(/^www\./, '')}<span aria-hidden="true">↗</span><span className="sr-only"> (opens in a new tab)</span></a>
        </div>
      </div>
    </dialog>
  );
}
