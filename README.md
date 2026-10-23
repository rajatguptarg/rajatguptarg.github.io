# Rajat Gupta Portfolio

Personal portfolio and writing site built with Jekyll and GitHub Pages. The site combines long-form posts, project case studies, career history, and a downloadable CV behind a lightweight custom presentation layer on top of the GitHub Pages-compatible `minima` theme.

## About The Project

This repository powers `https://rajatgupta.work` and contains:

- A homepage and static pages for about, experience, contact, posts, projects, and CV
- Blog content under `_posts/`
- Project case studies under `_projects/`
- A custom layout and stylesheet layer in `_layouts/`, `_includes/`, and `assets/main.css`
- GitHub Pages-compatible Jekyll configuration in `_config.yml`

The design is editorial and minimal: one reading column, warm paper and ink colours with a single accent, light and dark themes that follow the reader's system setting, and no cards, shadows or animation. The brief behind it, the rules it follows and the measurements that back it are in [ADR-004](docs/adr/adr-004-editorial-redesign.md).

Code blocks use a Molokai-inspired syntax highlighting palette implemented locally in `assets/main.css`.

Headings and the site title use Perfectly Nineties and body text uses Figtree, both self-hosted from `assets/fonts/`. See [Fonts](#fonts).

## Architecture

The site is structured as a standard Jekyll app:

- `_config.yml`: Site metadata, navigation, collections, plugins, and GitHub Pages-compatible settings
- `_layouts/`: Shared HTML layouts for pages, posts, and projects
- `_includes/`: Reusable fragments: header, footer, `figure.html` (post images), `toc.html` (contents list for long posts), `reading-time.html` and `topics.html`
- `_data/topics.yml`: Display labels for post categories
- `_posts/`: Blog posts named with the `YYYY-MM-DD-title.md` convention
- `_projects/`: Project collection items rendered as standalone pages
- `assets/`: CSS, font, PDF, and image assets
- `docs/adr/`: Architecture Decision Records for notable project decisions (not published on the site)
- `_latex/`: LaTeX source for the downloadable CV in `assets/cv.pdf`
- `.github/workflows/site-checks.yml`: CI that builds the site and checks links, metadata and accessibility
- `.github/scripts/`: The axe-core accessibility scan and the source for the social preview image and favicons

Rendering flow:

1. Markdown content is converted by Jekyll with `kramdown`
2. Rouge generates syntax highlighting markup for fenced code blocks
3. Layouts and includes assemble the final pages
4. `jekyll-redirect-from` writes a redirect page for every old URL listed in a post's `redirect_from`
5. `jekyll-seo-tag` adds the page title, description, canonical URL, Open Graph, Twitter card and JSON-LD; `jekyll-sitemap` writes `sitemap.xml` and `robots.txt`
6. `assets/main.css` applies the site design, including the fonts, the light and dark palettes and the Molokai code block theme

`AGENTS.md`, `README.md` and `docs/` are listed under `exclude:` in `_config.yml` so they are not published as pages.

## Install

Prerequisites:

- Ruby and Bundler installed locally

Install dependencies:

```bash
bundle install
```

## Develop Locally

Start the local Jekyll server with live reload:

```bash
bundle exec jekyll serve --livereload
```

Open `http://localhost:4000`.

## Run And Test

Use these commands during development and before opening a PR:

```bash
bundle exec jekyll doctor
bundle exec jekyll build --trace
JEKYLL_ENV=production bundle exec jekyll build
```

Check the built site the same way CI does. Node.js 22 is needed for the accessibility scan:

```bash
LC_ALL=C.UTF-8 bundle exec htmlproofer ./_site --disable-external --checks Links,Images,Scripts,OpenGraph,Favicon

cd .github/scripts && npm ci && npx playwright install chromium && cd ../..
python3 -m http.server 4000 -d _site &
node .github/scripts/axe-scan.mjs _site http://localhost:4000
```

The axe scan covers WCAG 2.2 AA plus best practices on every page, once in the light colour scheme and once in the dark one, and fails on serious or critical violations. Redirect pages are skipped. Text needs a contrast of at least 4.5:1 against its background in both themes.

For content scheduled in the future or drafts:

```bash
bundle exec jekyll serve --drafts --future --livereload
```

Validation expectations:

- The site builds without Liquid or configuration errors
- Pages render correctly in the generated `_site/` output
- Code blocks render with the expected Molokai styling
- Pages read well at 390px and 1440px wide, in light and dark mode: body text 18px on phones and 19px on laptops, 60 to 75 characters per line on a laptop, no sideways scrolling
- `html-proofer` and the axe scan pass
- Visual regressions are checked manually for layout changes

## Search, Sharing And Analytics

- Page titles, descriptions, canonical URLs, Open Graph and Twitter card tags come from `jekyll-seo-tag`. Site-wide values (`tagline`, `description`, `author`, `twitter`, `social`) live in `_config.yml`; a page overrides them with its own `title`, `description` or `image`.
- Every page falls back to `assets/img/social-card.png` as its preview image. To change the card or the favicons, edit `.github/scripts/social-card.html` and run `npm run social-card` in `.github/scripts/`.
- The homepage carries `ProfilePage` structured data (`_includes/profile-jsonld.html`), filled from `profile:` in `_config.yml`. Validate it with Google's Rich Results Test after changes.
- To verify the site in Google Search Console, uncomment `webmaster_verifications` in `_config.yml` and paste the verification code.
- Analytics is off by default. To turn on cookieless page view counts, create a GoatCounter site and set `goatcounter_code` in `_config.yml`. The script loads only in production builds.

## Update The CV

The CV is written in LaTeX at `_latex/cv.tex` and published as `assets/cv.pdf`. Its content mirrors `experience.md`, `about.markdown` and `_projects/`, so update them together.

Rebuild it with a TeX Live install that includes `latexmk` and the `XCharter` font (`texlive-fonts-extra` on Debian and Ubuntu):

```bash
latexmk -pdf -cd _latex/cv.tex
cp _latex/cv.pdf assets/cv.pdf
```

Jekyll skips the `_latex/` directory because its name starts with an underscore, and Git ignores its build output.

## Fonts

| Use | Font | Source |
| --- | --- | --- |
| Headings (`h1` to `h6`) and site title | Perfectly Nineties (Jen Wagner Co.), weights 600 and 700 | Self-hosted WOFF2 in `assets/fonts/perfectly-nineties/` |
| Body text | Figtree (SIL Open Font License), variable, normal and italic, Latin subset | Self-hosted WOFF2 in `assets/fonts/figtree/` |
| Body text, optional | Proxima Nova (Mark Simonson Studio) | Adobe Fonts web project, only when `adobe_fonts_kit_id` is set |

The font stacks live in the `--font-heading` and `--font-body` variables in `assets/main.css`.

Figtree is the deliberate body font and the type sizes were measured with it (see the amendment in ADR-002). To switch to Proxima Nova:

1. In Adobe Fonts, create a web project that includes Proxima Nova at weights 400, 500, 600 and 700, and add `rajatgupta.work` (and `localhost` if you want it locally) to its allowed domains.
2. Copy the project ID, the part before `.css` in `https://use.typekit.net/<id>.css`.
3. Set `adobe_fonts_kit_id` in `_config.yml` to that ID.

When the ID is set, the layout loads the Adobe Fonts stylesheet and `proxima-nova` takes over the body text. Re-check line lengths afterwards. Do not self-host Proxima Nova: the Adobe Fonts license only covers its embed code, and self-hosting needs a separate web license from Mark Simonson Studio.

To add another Perfectly Nineties weight, convert the licensed `.ttf` to WOFF2 (for example with `fontTools`), place it in `assets/fonts/perfectly-nineties/`, and add a matching `@font-face` rule. Only commit WOFF2 files, never the desktop `.ttf` or `.otf` files.

## Content And Style Conventions

- Use Markdown with descriptive headings and fenced code blocks
- Keep YAML front matter indented with two spaces
- Store reusable images and downloadable files under `assets/`
- Keep post filenames lowercase with hyphens. Posts are published at `/posts/<filename-slug>/`, so renaming a file changes its URL; add the old URL to `redirect_from` when you do
- Give every post a `description` (one or two sentences, shown under the title, in lists and in link previews) and at most 3 `categories`. Add a label to `_data/topics.yml` for a new category
- Add post images with `{% include figure.html src="/assets/img/<post>/<name>.webp" alt="..." caption="..." %}`. Save them as WebP, and write alt text that says what the image shows, including any numbers in it. Add `eager=true` only to an image in the first screen of the post
- Posts over 1,500 words get a contents list from their `##` headings automatically; set `toc: false` to turn it off
- Choose homepage "Selected Work" with `featured: <order>` in a project's front matter (1 shows first); projects without the key are only listed on `/projects/`
- Give every number in a case study a baseline, a period and a source you could show if asked, and keep it the same on the site, the CV and LinkedIn
- Do not edit `_site/`; it is generated output

## Contributing

1. Create a branch named `<type>/<jira-ticket>-short-description`
2. Make one logical change at a time
3. Update documentation for the change, including `README.md` and an ADR when the change is architectural
4. Run the local validation commands
5. Open a PR with the required description, testing notes, and checklist items

## Commit And PR Rules

Commits must follow:

```text
type(scope?): subject [XYZ-123]
```

Examples:

```text
feat(blog): add featured post layout [BLOG-88]
fix(styles): update code block palette [WEB-101]
docs(readme): refresh setup guide [DOCS-12]
```

PRs should:

- Clearly describe the reader-facing change
- Include the Jira ticket in the title
- State how the change was tested
- Avoid unrelated edits in the same branch

## ADRs

Architecture decisions live in `docs/adr/` using the naming convention `adr-xxx-title`. The Molokai code block theme decision is documented in `docs/adr/adr-001-molokai-code-block-theme.md`, the font choices in `docs/adr/adr-002-heading-and-body-fonts.md`, the search metadata, accessibility fixes and CI checks in `docs/adr/adr-003-metadata-and-site-checks.md`, and the editorial redesign in `docs/adr/adr-004-editorial-redesign.md`.

## Deployment

The site is intended for GitHub Pages deployment using the repository root as the published Jekyll source. Keep plugins and configuration compatible with GitHub Pages unless a local-only requirement is explicitly documented.
