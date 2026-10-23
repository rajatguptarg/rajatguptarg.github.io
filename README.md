# Rajat Gupta Portfolio

Personal portfolio and writing site built with Jekyll and GitHub Pages. The site combines long-form posts, project case studies, career history, and a downloadable CV behind a lightweight custom presentation layer on top of the GitHub Pages-compatible `minima` theme.

## About The Project

This repository powers `https://rajatgupta.work` and contains:

- A homepage and static pages for about, experience, contact, posts, projects, and CV
- Blog content under `_posts/`
- Project case studies under `_projects/`
- A custom layout and stylesheet layer in `_layouts/`, `_includes/`, and `assets/main.css`
- GitHub Pages-compatible Jekyll configuration in `_config.yml`

Code blocks use a Molokai-inspired syntax highlighting palette implemented locally in `assets/main.css` so the rest of the site can keep the existing visual design.

Headings and the site title use Perfectly Nineties, self-hosted from `assets/fonts/`. Body text uses Proxima Nova from Adobe Fonts, with Figtree from Google Fonts as a stand-in until an Adobe Fonts kit ID is configured. See [Fonts](#fonts).

## Architecture

The site is structured as a standard Jekyll app:

- `_config.yml`: Site metadata, navigation, collections, plugins, and GitHub Pages-compatible settings
- `_layouts/`: Shared HTML layouts for pages, posts, and projects
- `_includes/`: Reusable UI fragments such as the header and footer
- `_posts/`: Blog posts named with the `YYYY-MM-DD-title.md` convention
- `_projects/`: Project collection items rendered as standalone pages
- `assets/`: CSS, font, PDF, and image assets
- `docs/adr/`: Architecture Decision Records for notable project decisions
- `_latex/`: LaTeX source for the downloadable CV in `assets/cv.pdf`

Rendering flow:

1. Markdown content is converted by Jekyll with `kramdown`
2. Rouge generates syntax highlighting markup for fenced code blocks
3. Layouts and includes assemble the final pages
4. `assets/main.css` applies the site design, including the fonts and the Molokai code block theme

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

For content scheduled in the future or drafts:

```bash
bundle exec jekyll serve --drafts --future --livereload
```

Validation expectations:

- The site builds without Liquid or configuration errors
- Pages render correctly in the generated `_site/` output
- Code blocks render with the expected Molokai styling
- Visual regressions are checked manually for layout changes

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
| Body text | Proxima Nova (Mark Simonson Studio) | Adobe Fonts web project |
| Body text fallback | Figtree | Google Fonts, loaded only while no Adobe Fonts kit ID is set |

The font stacks live in the `--font-heading` and `--font-body` variables in `assets/main.css`.

To turn on Proxima Nova:

1. In Adobe Fonts, create a web project that includes Proxima Nova at weights 400, 500, 600 and 700, and add `rajatgupta.work` (and `localhost` if you want it locally) to its allowed domains.
2. Copy the project ID, the part before `.css` in `https://use.typekit.net/<id>.css`.
3. Set `adobe_fonts_kit_id` in `_config.yml` to that ID.

When the ID is set, the layout loads the Adobe Fonts stylesheet and skips Figtree. Do not self-host Proxima Nova: the Adobe Fonts license only covers its embed code, and self-hosting needs a separate web license from Mark Simonson Studio.

To add another Perfectly Nineties weight, convert the licensed `.ttf` to WOFF2 (for example with `fontTools`), place it in `assets/fonts/perfectly-nineties/`, and add a matching `@font-face` rule. Only commit WOFF2 files, never the desktop `.ttf` or `.otf` files.

## Content And Style Conventions

- Use Markdown with descriptive headings and fenced code blocks
- Keep YAML front matter indented with two spaces
- Store reusable images and downloadable files under `assets/`
- Keep post filenames lowercase with hyphens
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

Architecture decisions live in `docs/adr/` using the naming convention `adr-xxx-title`. The Molokai code block theme decision is documented in `docs/adr/adr-001-molokai-code-block-theme.md`, and the font choices in `docs/adr/adr-002-heading-and-body-fonts.md`.

## Deployment

The site is intended for GitHub Pages deployment using the repository root as the published Jekyll source. Keep plugins and configuration compatible with GitHub Pages unless a local-only requirement is explicitly documented.
