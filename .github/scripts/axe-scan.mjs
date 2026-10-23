// Scans every HTML page in a built Jekyll site with axe-core (WCAG 2.2 AA plus best practices),
// once in the light colour scheme and once in the dark one.
// Usage: node axe-scan.mjs <site-dir> <base-url>
// Serve the site first, for example: python3 -m http.server 4000 -d _site
// Exits with 1 when any serious or critical violation is found.
import { chromium } from 'playwright';
import { AxeBuilder } from '@axe-core/playwright';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const [siteDir, baseUrl] = process.argv.slice(2);
const paths = [];
(function walk(dir) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full);
    // Redirect pages from jekyll-redirect-from point at the live site, so they are not scanned.
    else if (name.endsWith('.html') && !readFileSync(full, 'utf8').includes('http-equiv="refresh"'))
      paths.push('/' + relative(siteDir, full).replace(/index\.html$/, ''));
  }
})(siteDir);

const browser = await chromium.launch();
const found = {};
for (const colorScheme of ['light', 'dark']) {
  const context = await browser.newContext({ colorScheme });
  for (const path of paths.sort()) {
    const page = await context.newPage();
    await page.goto(baseUrl + path, { waitUntil: 'networkidle' });
    const result = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'])
      .analyze();
    for (const v of result.violations) {
      found[v.id] ??= { impact: v.impact, help: v.help, nodes: [] };
      for (const node of v.nodes) found[v.id].nodes.push(`${path} [${colorScheme}] ${node.target.join(' ')}`);
    }
    await page.close();
  }
  await context.close();
}
await browser.close();

console.log(`Scanned ${paths.length} pages in light and dark`);
let blocking = 0;
for (const [id, v] of Object.entries(found)) {
  console.log(`\n[${v.impact}] ${id}: ${v.help} (${v.nodes.length})`);
  for (const node of v.nodes.slice(0, 10)) console.log(`  ${node}`);
  if (v.impact === 'serious' || v.impact === 'critical') blocking += v.nodes.length;
}
if (!Object.keys(found).length) console.log('No violations');
process.exit(blocking ? 1 : 0);
