# ADR-003: Search Metadata, Accessibility Fixes and Automated Site Checks

- Status: Accepted
- Date: 2026-10-23

## Context

A review of the site against its primary reader (senior engineering leaders, executive search and partner institutions judging credibility) found gaps that no build step caught:

- No Open Graph or Twitter card tags, no canonical URL, no structured data and no sitemap, so shared links showed no preview and search engines had no profile data.
- `AGENTS.md`, `README.md` and the ADRs in `docs/` were published as public pages, because the GitHub Pages build turns Markdown files without front matter into pages.
- An axe-core scan (WCAG 2.2 AA plus best practices) found 117 colour contrast failures across 19 pages, missing or skipped heading levels, an empty heading on the 404 page, and code blocks that could not be scrolled with a keyboard.
- Homepage "Featured Work" was picked by sorting the `timeline` text, not chosen on purpose.

## Decision

- Enable `jekyll-seo-tag` and `jekyll-sitemap`. Both ship with the `github-pages` gem, so the site stays buildable by GitHub Pages without Actions. Metadata comes from `_config.yml` (`tagline`, `author`, `twitter`, `social`, `defaults`).
- Add `ProfilePage` structured data with a `Person` entity on the homepage (`_includes/profile-jsonld.html`, data in `profile:` in `_config.yml`).
- Add a 1200x630 social preview image and favicons, rendered from `.github/scripts/social-card.html` with Figtree (SIL Open Font License). Perfectly Nineties is not used in images because only its web font files are in the repository.
- Exclude repository documents from the published site with an explicit `exclude:` list. Jekyll 3 replaces its default list when the key is set, so the defaults are repeated.
- Fix the accessibility findings: stronger pill text colour, two Molokai colour adjustments (see the ADR-001 amendment), correct heading levels, a skip link, visible focus outlines, `scroll-padding-top` for the sticky header, and keyboard focus on scrollable code blocks.
- Choose homepage work explicitly with a `featured: <order>` key in `_projects/` front matter.
- Add optional, cookieless GoatCounter analytics, off until `goatcounter_code` is set, and only in production builds.
- Add a `Site checks` GitHub Actions workflow that builds the site, runs `html-proofer` (internal links, images, scripts, Open Graph, favicon) and runs axe-core on every page. It fails on serious or critical accessibility violations.

## Consequences

Benefits:

- Shared links show a title, description and preview image; search engines get a canonical URL, sitemap and profile data.
- Internal repository documents are no longer public pages.
- Accessibility and link regressions fail the PR instead of reaching the live site.

Trade-offs:

- The social card and favicons are static images. Re-render them with `npm run social-card` in `.github/scripts/` when the name, role or position line changes.
- The workflow skips external link checks to avoid failures caused by third-party outages.
- GitHub Pages still builds and deploys the site itself; the workflow only checks it.
