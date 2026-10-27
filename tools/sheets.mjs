// QA helper: tile exported slide PNGs into 2x2 contact sheets.
import { chromium } from 'playwright-core';
import { pathToFileURL } from 'node:url';
import { writeFileSync } from 'node:fs';

const DIR = new URL('../docs/deck-qa/', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const browser = await chromium.launch({ channel: 'msedge' });
const page = await browser.newPage({ viewport: { width: 1920, height: 1090 } });
const total = 15;
for (let s = 0; s < total; s += 4) {
  const ids = [s + 1, s + 2, s + 3, s + 4].filter((i) => i <= total);
  const html = `<body style="margin:0;background:#888;display:grid;grid-template-columns:1fr 1fr;gap:6px">${ids
    .map((i) => `<img style="width:100%;display:block" src="${pathToFileURL(DIR + 'Slide' + i + '.PNG').href}">`)
    .join('')}</body>`;
  const file = DIR + 'sheet.html';
  writeFileSync(file, html);
  await page.goto(pathToFileURL(file).href);
  await page.waitForTimeout(500);
  await page.screenshot({ path: DIR + `sheet-${s / 4 + 1}.png` });
}
await browser.close();
console.log('sheets done');

