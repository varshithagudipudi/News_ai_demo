# Creator directory

The six categories each contain 50 distinct entries (300 category listings).
Profiles can appear in multiple categories where relevant. This is a directory
of individuals, publications, communities and official educational channels;
it is not a list of 300 separate people or social-platform verification badges.

- `lib/config/creatorProfiles.json` contains names, direct public links and short original descriptions.
- `lib/config/creatorMemberships.json` controls the ordered category membership.
- `docs/creator-link-audit.json` records the checked primary destinations and dates.
- `lib/creators/directory.ts` presents one profile per ID, with all its topic memberships.
  It classifies profile types editorially and extracts content-format labels from
  the existing descriptions. These labels do not claim platform certification or rankings.
- `components/CreatorDirectory.tsx` shows 12 unique profiles initially. Load more
  adds 12 at a time. Search, topic, type, format, saved view, and sort are combined.
  Filters live in `creator*` URL parameters and work with browser Back/Forward.
- The directory provides its own inline search and omits the news intro, ticker,
  category bar, and floating article search. Header search focuses the directory input.
- Saved creator IDs use `ai-pulse-saved-creators` in localStorage, independently of
  saved news articles. A storage failure keeps the current selection in memory
  and displays a message. Changes in other tabs are synchronized.
- Compact monograms are used until authentic portraits and channel logos are sourced.
  Platform and experience filters are deferred until supported metadata is available.
  Profile dialogs expose the existing destination and all topics; there are no invented
  social links, popularity scores, or recommended starting resources.

Link verification means the public destination was retrieved and its page title
reviewed for the named creator or publication. It does not imply endorsement,
an identity investigation, platform certification, or a guarantee of future availability.
The Bishop book page rejected the automated fetch but was opened through browser
retrieval. The TLDR newsletter page was also reviewed through browser retrieval.
Several broken or retired destinations were excluded or replaced during review.

Descriptions are concise editorial summaries. Category placement, focus labels
and suggested skill levels are directory guidance, not creator-claimed credentials.
Research includes foundational educational work as well as current writing.

To recheck links (network required):

```powershell
node scripts/verifyCreatorLinks.mjs
node scripts/buildCreatorAudit.mjs
```

Review failures, unexpected redirects and changed titles before publishing a
fresh audit. A successful HTTP response alone is not proof of identity. The
scripts never contact creators or subscribe to their publications.
