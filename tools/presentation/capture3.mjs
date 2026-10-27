// A tall, uncropped capture of Stress Controls with Staff unavailability selected (the page is longer than one viewport).
import { launch } from './browser.mjs';

const BASE = process.env.SAYR_URL ?? 'https://maymourad.github.io/SAYR-AI-Care-In-Motion';
const OUT = new URL('../../docs/presentation/screenshots/', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const browser = await launch();
const page = await (await browser.newContext({ viewport: { width: 1600, height: 1900 }, deviceScaleFactor: 2 })).newPage();
await page.goto(BASE + '/#/stress');
await page.waitForTimeout(1500);
await page.getByRole('radio', { name: /Staff unavailability/ }).click();
await page.waitForTimeout(800);
await page.addStyleTag({ content: '.transport{visibility:hidden !important}' });
const b = await page.evaluate(() => {
  const el = document.querySelector('.page');
  const last = [...el.children].pop().getBoundingClientRect();
  return { bottom: Math.ceil(last.bottom), scroll: el.scrollHeight };
});
console.log(JSON.stringify(b));
const h = Math.min(1850, b.bottom + 24);
await page.screenshot({ path: OUT + 'pg-05-stress-tall.png', clip: { x: 236, y: 0, width: 1340, height: h } });
console.log('shot pg-05-stress-tall', h);
await browser.close();
