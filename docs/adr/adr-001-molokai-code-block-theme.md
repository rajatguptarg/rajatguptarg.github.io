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
