# ADR-002: Use Perfectly Nineties for Headings and Proxima Nova for Body Text

- Status: Accepted
- Date: 2026-10-23

## Context

The site used Inter from Google Fonts for every piece of text. The requested change was to use Perfectly Nineties for headings and Proxima Nova for the body of the blog.

The two fonts come with different delivery options:

- Perfectly Nineties (Jen Wagner Co.) was supplied as licensed `.ttf` and `.otf` files. It is not on any public font CDN, so the site has to host it.
- Proxima Nova (Mark Simonson Studio) is a commercial font. Adobe Fonts serves it to Creative Cloud subscribers through a web project embed code, but Adobe does not allow self-hosting the files it provides. Self-hosting needs a separate web license from the foundry.

## Decision

- Convert Perfectly Nineties Semibold (600) and Bold (700) to WOFF2, store them in `assets/fonts/perfectly-nineties/`, and load them with `@font-face` in `assets/main.css`. These are the only weights the heading styles use. Both files are preloaded in `_layouts/default.html` because every page shows a heading and the site title.
- Apply the heading font to `h1` to `h6` and `.site-title` through a `--font-heading` variable.
- Load Proxima Nova through an Adobe Fonts web project. The project ID lives in `adobe_fonts_kit_id` in `_config.yml`, and the layout only adds the Adobe Fonts stylesheet when that value is set.
- While `adobe_fonts_kit_id` is empty, load Figtree from Google Fonts instead. The body stack is `proxima-nova`, `Proxima Nova`, `Figtree`, then system fonts, so readers with Proxima Nova installed locally also get it.
- Remove Inter, since nothing uses it anymore.

## Consequences

Benefits:

- Headings render in Perfectly Nineties on every page without a third-party request.
- The WOFF2 files are about 18 KB each, smaller than the 47 KB `.ttf` sources.
- Turning on Proxima Nova is a one-line config change, and the site never loads both Proxima Nova and Figtree.
- The setup stays compatible with GitHub Pages, with no new plugins or build steps.

Trade-offs:

- Until an Adobe Fonts project ID is set, body text is Figtree, not Proxima Nova.
- Adobe Fonts adds a request to `use.typekit.net`, and web projects are tied to an allowed-domain list, so local previews show the fallback unless `localhost` is allowed.
- The Perfectly Nineties files are publicly downloadable from the site, as with any web font. The owner's license must cover web use.
- Headings that need italics or a weight other than 600 or 700 will be synthesized by the browser until the matching WOFF2 file is added.
