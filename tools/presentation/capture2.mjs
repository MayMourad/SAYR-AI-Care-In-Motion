// Extra captures for "WOW 1: the system breaks": the Control Room at 11:45, normal day vs staff-unavailability day (same seed 7).
import { launch } from './browser.mjs';
import { mkdirSync, writeFileSync } from 'node:fs';

const BASE = process.env.SAYR_URL ?? 'https://maymourad.github.io/SAYR-AI-Care-In-Motion';
const root = (p) => new URL(p, import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const OUT = root('../../docs/presentation/screenshots/');
mkdirSync(OUT, { recursive: true });
const browser = await launch();
const page = await (await browser.newContext({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 2 })).newPage();
const setRange = (label, v) =>
  page.evaluate(
    ([label, v]) => {
      const el = document.querySelector(`input[aria-label="${label}"]`);
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, String(v));
      el.dispatchEvent(new Event('input', { bubbles: true }));
    },
    [label, v],
  );
const go = async (id) => {
  await page.evaluate((id) => (window.location.hash = '#/' + id), id);
  await page.waitForTimeout(600);
};
const pause = async () => {
  const b = page.locator('button[aria-label="Pause"]');
  if (await b.count()) await b.click();
};
const pageShot = async (name) => {
  await page.addStyleTag({ content: '.transport{visibility:hidden !important}' });
  await page.waitForTimeout(500);
  await page.screenshot({ path: OUT + name + '.png', clip: { x: 236, y: 0, width: 1364, height: 930 } });
  console.log('shot', name);
};
const facts = {};
const grab = async (k) => {
  facts[k] = (await page.evaluate(() => document.querySelector('.page, main').innerText))
    .split('\n')
    .join(' | ')
    .match(/SIMULATION TIME.*?(?=REGISTRATION)/)?.[0];
};

await page.goto(BASE + '/#/control');
await page.waitForTimeout(1500);
await pause();
await setRange('Simulation time', 225);
await page.waitForTimeout(500);
await grab('normal_1145');
await pageShot('pg-control-normal-1145');

await go('stress');
await page.getByRole('radio', { name: /Staff unavailability/ }).click();
await page.waitForTimeout(600);
await go('control');
await pause();
await setRange('Simulation time', 225);
await page.waitForTimeout(500);
await grab('staff_1145');
await pageShot('pg-control-staff-1145');
await go('stress');
await page.waitForTimeout(500);
await page.addStyleTag({ content: '.transport{visibility:hidden !important}' });
const h = await page.evaluateHandle(() => {
  const c = [...document.querySelectorAll('section.panel, .panel')].filter((e) => e.innerText.includes('Queue pressure through the day'));
  c.sort((a, b) => a.getBoundingClientRect().width * a.getBoundingClientRect().height - b.getBoundingClientRect().width * b.getBoundingClientRect().height);
  return c[0];
});
await h.asElement().scrollIntoViewIfNeeded();
await h.asElement().screenshot({ path: OUT + 'c-stress-queue-pressure.png' });
console.log(JSON.stringify(facts, null, 1));
writeFileSync(root('./out/control-1145.json'), JSON.stringify(facts, null, 1));
await browser.close();
