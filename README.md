# Tech Leadership Chronicles

This is the repository for "Tech Leadership Chronicles" - a blog exploring the art and science of building reliable systems, scaling engineering teams, and mastering technical leadership. The blog is hosted on GitHub Pages using https://squidfunk.github.io/mkdocs-material/.

## Repository Overview

This is a personal blog/documentation site built with MkDocs Material. The repository contains:

- Documentation content in Markdown format stored in the `docs/` directory
- MkDocs configuration in `mkdocs.yml`
- GitHub Actions workflow for automatic deployment to GitHub Pages

## Key Commands

### Development
- `mkdocs serve` - Start the live-reloading development server (usually runs on http://127.0.0.1:8000)
- `mkdocs build` - Build the static documentation site
- `mkdocs new [dir-name]` - Create a new MkDocs project
- `mkdocs -h` - Show help and available commands

### Dependencies
- `pip install -r requirements.txt` - Install Python dependencies (currently only mkdocs-material)
- `pip install mkdocs-material` - Install the MkDocs Material theme directly

## Project Structure

```
blog-rg/
├── docs/           # Markdown content files
│   └── index.md    # Homepage content
├── mkdocs.yml      # MkDocs configuration
├── requirements.txt # Python dependencies
└── .github/
    └── workflows/
        └── ci.yml  # GitHub Actions deployment workflow
```

## Architecture

This is a static site generator setup using:

- **MkDocs**: Static site generator for project documentation
- **Material Theme**: Modern responsive theme for MkDocs
- **GitHub Actions**: Automated deployment pipeline that builds and deploys to GitHub Pages on pushes to main/master branches

## Content Management

- All content lives in the `docs/` directory as Markdown files
- The site configuration is managed through `mkdocs.yml`
- The theme is Material with dark/light mode toggle configured

## Deployment

The site automatically deploys to GitHub Pages via GitHub Actions when changes are pushed to the main or master branch. The workflow:

1. Sets up Python 3.x
2. Installs mkdocs-material
3. Runs `mkdocs gh-deploy --force` to build and deploy

No manual deployment steps are required.

## Claude Code Instructions
When working on this blog project:

- Always check current structure before making changes
- Test locally before committing changes
- Follow the content guidelines for consistency
- Optimize for performance and accessibility
- Maintain SEO best practices for better discoverability
- Use metric measurements in all content
- Consider the German/Berlin context when relevant
- Respect the vegetarian lifestyle in food-related content
