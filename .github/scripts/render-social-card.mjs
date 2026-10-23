// Renders social-card.html into the social preview image and favicons under assets/img/.
// Usage (from the repository root): node .github/scripts/render-social-card.mjs
import { chromium } from 'playwright';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const source = pathToFileURL(join(here, 'social-card.html')).href;
const out = join(here, '..', '..', 'assets', 'img');

const browser = await chromium.launch();

async function render(width, height, file, iconSize) {
  const page = await browser.newPage({ viewport: { width, height } });
  await page.goto(source, { waitUntil: 'networkidle' });
  if (iconSize) {
    await page.evaluate((size) => {
      document.body.classList.add('icon-mode');
      document.body.style.setProperty('--size', `${size}px`);
    }, iconSize);
  }
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: join(out, file), omitBackground: Boolean(iconSize) });
  await page.close();
}

await render(1200, 630, 'social-card.png');
await render(180, 180, 'apple-touch-icon.png', 180);
await render(32, 32, 'favicon-32.png', 32);
await browser.close();
