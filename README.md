# Repository Guidelines

## Project Structure & Module Organization
Content lives under `_posts/` using the standard `YYYY-MM-DD-title.md` pattern; each file needs front matter declaring `layout`, `title`, and any custom metadata used by Minima. Global settings (site metadata, navigation toggles, plugin list) sit in `_config.yml`. Pages such as `index.markdown` and `about.markdown` provide standalone sections, while generated output resides in `_site/`—do not edit that directory, it is overwritten by every build.

## Build, Test, and Development Commands
Run `bundle install` after updating gems to keep the locked GitHub Pages environment consistent. `bundle exec jekyll serve --livereload` builds the site in memory, watches `_posts/` and assets, and serves on `http://localhost:4000`. Use `bundle exec jekyll build --trace` for a clean production build into `_site/`; inspect warnings before pushing. `bundle exec jekyll doctor` highlights configuration mistakes (missing front matter, invalid includes) early in review.

## Coding Style & Naming Conventions
Use Markdown with fenced code blocks and prefer descriptive link text. YAML front matter and `_config.yml` should be indented with two spaces and use kebab-case keys (`permalink_style`, `social_links`). Post filenames must remain lowercase with hyphens, while collection names (e.g., `layout: post`) stay singular to match Minima defaults. When embedding assets, store them under `assets/` and reference via site-relative paths (`/assets/img/heroes.jpg`) so GitHub Pages can rewrite URLs correctly.

## Testing Guidelines
Before any PR, run `bundle exec jekyll build` to ensure the content compiles without Liquid errors. For drafts, append `--drafts --future` to preview scheduled posts and verify dates render correctly. Manually review the generated `_site/` for layout regressions and broken links; capture a screenshot if visual changes are involved. Keep regressions low by testing in both default and production configuration (with `JEKYLL_ENV=production bundle exec jekyll build`) when adding plugins or config switches.

## Commit & Pull Request Guidelines
Follow the concise, imperative style seen in `git log` (e.g., “Initial GitHub pages site with Jekyll”): start with a capital verb and stay under ~60 characters. Group related Markdown, config, and asset updates into a single commit to simplify review. Pull requests must describe the reader-facing change, list key commands used for validation, and link any tracking issue. Include screenshots or GIFs for visual tweaks, and confirm that `_site/` output is excluded from the diff.

## Security & Configuration Tips
Avoid checking credentials or tokens into `_config.yml`; use environment variables for secrets referenced in Liquid templates. When modifying plugin lists, ensure the gems are supported by GitHub Pages or document local-only needs in the PR description. Keep `bundle update` changes scoped and mention compatibility notes so other contributors can repeat the setup reliably.


# Jekyll Portfolio Guide

This guide walks you through creating your portfolio using Jekyll and GitHub Pages. It includes setup steps, directory structure, and content layout so you can build a clean, maintainable portfolio.

---

## 1. Overview

Jekyll is a static site generator that GitHub Pages supports natively. You write Markdown, store your content in a GitHub repository, and GitHub Pages builds and hosts it for free.

Your portfolio will include:

* A homepage summarizing who you are
* About page
* Experience page
* Projects (with individual project pages)
* Writing or blog (optional)
* CV page with downloadable PDF
* Contact page

---

## 2. Initial Setup

### Step 1: Create the GitHub repository

* Create a new repo named `rajatgupta.work`.
* Set visibility to Public.
* Clone it locally.

### Step 2: Install Jekyll locally (optional but helpful)

If you want to preview your site locally, install Ruby and Jekyll:

```
gem install jekyll bundler
```

### Step 3: Initialize a Jekyll site

Run inside the repo:

```
jekyll new . --force
```

This creates the default Jekyll structure.

### Step 4: Choose a theme

GitHub Pages supports many Jekyll themes. Examples:

* minima (default)
* cayman
* slate
* modernist

Set your theme in `_config.yml`:

```
theme: minima
```

### Step 5: Push to GitHub

Push your files. GitHub Pages will automatically build them.

---

## 3. Recommended Directory Structure

Your repo will look like this:

```
/
  _config.yml
  _layouts/
    default.html
    project.html
  _includes/
    header.html
    footer.html
  _projects/
    payment-failover.md
    sre-platform.md
    security-program.md
  assets/
    cv.pdf
    img/
      profile.jpg
  index.md
  about.md
  experience.md
  projects.md
  cv.md
  contact.md
```

### Key folders

* `_layouts/`: HTML layouts shared across pages.
* `_includes/`: Reusable components like header and footer.
* `_projects/`: Each project as a Markdown file with front matter.
* `assets/`: Images, PDFs, diagrams.

---

## 4. Configuring `_config.yml`

Add metadata so your site has a title and links:

```
title: Rajat Gupta
description: Engineering Manager · SRE · Security · Platform
baseurl: ""
url: "https://rajatgupta.work"
markdown: kramdown
collections:
  projects:
    output: true
    permalink: /projects/:name/
```

---

## 5. Page Structure

### Homepage: `index.md`

Keep it simple:

* Name
* Role
* One paragraph summary
* Links to projects, CV, GitHub, LinkedIn

### About page: `about.md`

Include your story, interests, and values.

### Experience page: `experience.md`

Timeline format with roles, teams, outcomes, numbers.

### Projects page: `projects.md`

List all your projects using:

```
{% for project in site.projects %}
  - [{{ project.title }}]({{ project.url }})
{% endfor %}
```

### Project pages: `_projects/*.md`

Example:

```
---
title: Payment Failover and Resilience
role: Lead, SRE and Platform
impact: "Reduced incident impact and MTTR, improved SLO compliance"
---

Describe context, what you did, and outcomes.
```

### CV page: `cv.md`

Embed PDF:

```
[Download CV](../assets/cv.pdf)
```

### Contact page: `contact.md`

Include email and links.

---

## 6. Navigation

Create a header include at `_includes/header.html` and link pages:

```
<nav>
  <a href="/">Home</a>
  <a href="/about">About</a>
  <a href="/experience">Experience</a>
  <a href="/projects">Projects</a>
  <a href="/cv">CV</a>
  <a href="/contact">Contact</a>
</nav>
```

Include it in layout:

```
{% include header.html %}
```

---

## 7. Deploying to GitHub Pages

In your GitHub repository:

1. Go to Settings
2. Pages
3. Select branch: `main`, folder: `/` or `/docs` depending on your setup
4. Save

Your portfolio will be live at:

```
https://rajatgupta.work
```

---

## 8. Tips for a Clean Portfolio

* Keep descriptions short and focused on outcomes.
* Use metrics where possible.
* Avoid cluttered navigation.
* Add only high impact projects.
* Keep CV updated and link both HTML and PDF versions.
* Add a profile photo for personality.

---

## 9. Continuous Steps

* Add a blog using Jekyll posts (`_posts/` folder).
* Customize styling with a theme or custom CSS.
* Add social preview image for better link sharing.
