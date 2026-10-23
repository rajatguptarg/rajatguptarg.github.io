# ADR-004: Editorial Redesign Built From a Brief and Measurements

- Status: Accepted
- Date: 2026-10-23

## Context

The request was to make the site "visually appealing, modern, minimalistic and suited to my personality", with better-looking blog posts. Those words cannot be tested, so the work started from a brief and from measurements of the built site instead of from other people's portfolios.

### Brief

- **Readers** (from ADR-003): senior engineering leaders, executive search, and partner institutions judging credibility.
- **Their job in 30 seconds:** know what Rajat does and where, then take one step: read a post, get the CV, or send an email.
- **Should feel:** direct, editorial, credible.
- **Should not feel:** trendy, startup-like, salesy.

Personality, as stated by the owner, turned into design rules:

| Trait | Rule |
| --- | --- |
| Direct | Nothing decorative that carries no meaning: no cards, shadows, gradients, pills or motion. One accent colour, used sparingly. |
| Data-backed | Numbers carry the claim. Case-study impact lines lead each entry, dates and reading times use tabular figures, and infographic alt text carries the data shown in the image. |
| Removes ambiguity | One obvious next step per page, short and stable URLs, and the same heading pattern everywhere (kicker, title, dek, meta). |
| Clear ownership | Every strength on the About page links to the case study that proves it. |

### Baseline (built from `gh-pages` at `adc517e`, measured in Chromium)

- Body text was 15px on a 390px phone and 16px on a 1440px laptop.
- The homepage intro ran 104 characters per line on a laptop. Butterick's range is 45 to 90.
- On a phone, the sticky header was 147px tall, 17% of the screen, and card padding took a quarter of the width.
- The GitOps post downloaded 2,970 KB, mostly five 600 KB PNGs loaded eagerly. Their alt text was "Image 1" to "Image 5".
- Post URLs contained every category, for example `/gitops/kubernetes/devops/argocd/flux/cncf/cd/2026/03/25/gitops/`.
- Body text rendered in the Figtree stand-in from Google Fonts, because no Adobe Fonts kit ID was ever set.
- The colours were Tailwind defaults (`#2563eb`, `#e5e7eb`, `#6b7280`), and there was no dark mode.
- Posts had no descriptions. Builds ran in UTC, so a post dated `00:00 +0100` showed the previous day.

A content inventory of the 8 posts found h2 to h4 headings, many bullet lists, bold lead-in paragraphs, 14 code blocks in 7 languages, 2 blockquotes, horizontal rules, and 9 data infographics. There are no tables, footnotes or source sections, so no components were built for them.

## Decision

**Type.** Body text is 18px on phones and 19px from about 700px wide (`clamp()`), with a line height of 1.6. The reading column is 40rem, which gives 73 to 75 characters per line on a laptop. Headings stay in Perfectly Nineties with tighter tracking (-0.015em to -0.02em), as the foundry suggests for display sizes.

**Colour.** Warm paper (`#fbfaf7`), near-black ink, and one brick accent (`#b23a1c`), with a matching dark palette through `prefers-color-scheme`. Every text colour is at least 4.5:1 on its background in both themes. The Molokai code theme (ADR-001) is unchanged; in dark mode, code blocks get a border because the Molokai background is close to the page colour.

**Layout.**

- The header is one row, 61px tall, and not sticky. On phones the links sit behind a Menu button. Without JavaScript they wrap below the name instead.
- No cards on reading pages.
- Figures can widen to 58rem so the small labels in diagrams stay legible.
- Transitions are switched off under `prefers-reduced-motion`.

**Posts.**

- Each post opens with a kicker of at most 3 topics (labels in `_data/topics.yml`), the title, a description as the dek, the date, and a reading time at 230 words a minute.
- Posts over 1,500 words get an "In this post" list built from their h2 headings (`_includes/toc.html`).
- Each post ends with an author line and older and newer links.

**Images.** The 9 post PNGs became WebP: 5,000 KB down to 566 KB, with no visible loss on small text. They render through `_includes/figure.html` with width and height set (no layout shift), lazy loading after the first image, alt text that carries the data, and a caption.

**URLs.** Posts move to `/posts/:title/`. Every old URL is listed in that post's `redirect_from` and served by `jekyll-redirect-from`, which ships with the `github-pages` gem. Builds use `timezone: Asia/Kolkata`, so dates match what the posts say.

**Content.**

- Every post has a description and at most 3 categories.
- The About page's tag cloud of self-applied labels ("Visionary Leadership", "Emotional Intelligence") is replaced by "Strengths, with evidence". Each strength cites a number that already appears in a case study or on the experience page.
- A stray U+FFFC character was removed from a heading.
- Pages share one `page` layout.
- The navigation drops the redundant Home link and renames Posts to Writing (the URL stays `/posts/`).

**Fonts.** See the ADR-002 amendment: Figtree is now self-hosted and is the deliberate body font.

**Checks.** The axe scan now runs every page in both the light and the dark colour scheme, and skips redirect pages, which would otherwise send the scanner to the live site.

### A corrected target

The planning brief set two phone targets: at least 18px body text, and at least 45 characters per line. They conflict. Figtree averages about 0.53em per character, so 18px text on a 390px phone with 16px side margins fits about 38 characters. Mobile guidance puts comfortable phone lines at 30 to 50 characters, and major reading sites use about 18px on phones. Text size won; the phone target is now 30 to 50 characters.

## Consequences

Measured after the change, with the same scripts as the baseline:

| Measure | Before | After | Target |
| --- | --- | --- | --- |
| Body text, phone / laptop | 15px / 16px | 18px / 19px | 18 to 20px |
| Characters per line, post on a laptop | 60 | 73 to 75 | 60 to 75 |
| Characters per line, homepage intro on a laptop | 104 | 63 | 45 to 90 |
| Characters per line, post on a phone | 37 at 15px | 37 to 41 at 18px | 30 to 50 |
| Header on a phone | 147px, sticky | 61px, not sticky | 64px or less |
| GitOps post, first load / after scrolling to the end | 2,970 KB / 2,970 KB | 148 KB / 426 KB | under 1 MB |
| Layout shift (CLS), homepage, throttled phone | 0.081 | 0 | 0.1 or less |
| Largest paint (LCP), throttled phone, local server | 0.8 to 1.2 s | 0.9 to 1.1 s | 2.5 s or less |
| axe violations, light and dark | not checked in dark | none of any severity | no serious or critical |
| Old post URLs that still work | n/a | 8 of 8 | 8 of 8 |

Throttling followed Lighthouse's mobile profile (1.6 Mbps, 150 ms latency, 4x CPU slowdown). Each figure is the median of three runs against a local server. The old site's Google Fonts request is cross-origin, so its bytes are missing from the "before" download numbers, and the local server hides its extra DNS and TLS cost.

Trade-offs:

- **Redirects are client-side.** GitHub Pages cannot send HTTP 301s, so old URLs are HTML pages with an instant meta refresh and a canonical link. Google treats an instant meta refresh as a permanent redirect, but other crawlers may take longer to update.
- **Feed readers may show old posts again.** RSS entry IDs follow the URL, so the 8 posts may appear as new once.
- **Images are still pictures of text.** The infographics carry their numbers in the image; alt text repeats the data, but the numbers cannot be searched or selected. Future posts should prefer real charts or text.
- **No theme toggle.** The theme follows the reader's system setting.
- **The contents list is open by default.** On phones it is compacted rather than hidden. Set `toc: false` in a post's front matter to turn it off.
- **Perfectly Nineties has no italic** in the repository, so italic headings would be synthesized.

To check a change against these numbers, see "Run And Test" in the README. Screenshots of every page at 390px and 1440px, light and dark, are attached to the pull request.
