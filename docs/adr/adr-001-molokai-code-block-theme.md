# ADR-001: Use Molokai for Code Blocks

- Status: Accepted
- Date: 2026-03-19

## Context

The site uses a custom stylesheet in `assets/main.css` on top of the GitHub Pages-compatible `minima` theme. Code snippets are rendered through Jekyll and Rouge, but the existing styling only applied a generic dark background to `pre` blocks and did not define token-level syntax colors.

The requested change was to adopt a Molokai-style code block theme without replacing the broader site theme.

## Decision

Apply Molokai-inspired syntax highlighting in the local stylesheet by:

- Styling site-wide block code containers rendered by Rouge
- Mapping Rouge token classes to Molokai color values
- Keeping inline code on the existing light surface so prose remains visually consistent

## Consequences

Benefits:

- Syntax-highlighted code blocks now have a recognizable Molokai palette
- The change stays compatible with GitHub Pages and the current `minima` setup
- The rest of the site theme remains unchanged

Trade-offs:

- Syntax highlighting colors are maintained locally in CSS rather than imported from an external theme package
- Future theme changes need to preserve the Rouge class mappings in `assets/main.css`

## Amendment (2026-10-23): contrast

Two Molokai colours failed the WCAG 2.2 AA minimum of 4.5:1 on the `#272822` code background, found by an axe-core scan of the built site. They were adjusted within the same hue so code stays recognisably Molokai:

| Tokens | Molokai | Now | Contrast on `#272822` |
| --- | --- | --- | --- |
| Comments (`.c`, `.c1`, `.cm`, `.cp`, `.cs`) | `#75715e` (3.0:1) | `#9a957c` | 4.9:1 |
| Keywords and operators (`.k*`, `.nt`, `.o`) | `#f92672` (3.9:1) | `#ff4b8b` | 4.7:1 |

Keep any future palette change at or above 4.5:1; the `Site checks` workflow fails on contrast violations. See [ADR-003](adr-003-metadata-and-site-checks.md).
