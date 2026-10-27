// Captures authentic screenshots of the PUBLISHED SAYR app along ONE reproducible path:
//   seed 7 · Staff unavailability (Clinician B, 10:30-13:30) · clock 10:50 · Reflow profile "Fewest waiting minutes" · approve · Ledger.
// Also writes the visible text of the decisive screens so two runs can be diffed (determinism check).
import { launch } from './browser.mjs';
import { mkdirSync, writeFileSync } from 'node:fs';

const BASE = process.env.SAYR_URL ?? 'https://maymourad.github.io/SAYR-AI-Care-In-Motion';
const TAG = process.env.TAG ?? 'A';
const SHOTS = process.env.NOSHOTS !== '1';
const root = (p) => new URL(p, import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const OUT = root('../../docs/presentation/screenshots/');
const TXT = root('./out/');
mkdirSync(OUT, { recursive: true });
mkdirSync(TXT, { recursive: true });

const browser = await launch();
const ctx = await browser.newContext({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
const errors = [];
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
page.on('pageerror', (e) => errors.push(String(e)));
const blobs = {};

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
const hideT = () => page.addStyleTag({ content: '.transport{visibility:hidden !important}' });
const shot = async (name) => {
  if (!SHOTS) return;
  await page.waitForTimeout(400);
  await page.screenshot({ path: OUT + name + '.png' });
  console.log('shot', name);
};
// crop to the smallest element matching `sel` whose text contains `text`
const crop = async (name, text, sel = 'section.panel, .panel') => {
  if (!SHOTS) return;
  const h = await hideT();
  const handle = await page.evaluateHandle(
    ([text, sel]) => {
      const c = [...document.querySelectorAll(sel)].filter((e) => e.innerText.includes(text));
      const area = (e) => e.getBoundingClientRect().width * e.getBoundingClientRect().height;
      c.sort((a, b) => area(a) - area(b));
      return c[0] ?? null;
    },
    [text, sel],
  );
  const el = handle.asElement();
  if (!el) throw new Error('no panel for ' + text);
  await el.scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  await el.screenshot({ path: OUT + name + '.png' });
  await h.evaluate((e) => e.remove());
  console.log('crop', name);
};
const text = () => page.evaluate(() => document.querySelector('.page, main')?.innerText ?? document.body.innerText);
const pause = async () => {
  const b = page.locator('button[aria-label="Pause"]');
  if (await b.count()) await b.click();
};

// ---------- 1. Normal operations ----------
await page.goto(BASE + '/#/motion');
await page.waitForTimeout(1500);
await pause();
await setRange('Simulation time', 150);
await shot('01-motion');
await go('control');
await setRange('Simulation time', 170);
await page.waitForTimeout(300);
await shot('02-control-normal-1050');
await crop('c-control-normal-1050', 'REGISTRATION', '.panel.flush');

// ---------- 2. Disrupt: Staff unavailability ----------
await go('stress');
await shot('05-stress-before');
await page.getByRole('radio', { name: /Staff unavailability/ }).click();
await page.waitForTimeout(700);
await shot('05-stress-staff');
await crop('c-stress-impact', 'DISRUPTION IMPACT');
await go('control');
await page.waitForTimeout(500);
await pause();
blobs.clock = await page.evaluate(() => (document.body.innerText.match(/\d\d:\d\d\s*SIMULATION TIME/) || [''])[0].replace(/\s+/g, ' '));
await shot('02-control-staff-1050');
await crop('c-control-staff-1050', 'REGISTRATION', '.panel.flush');
blobs.control = await text();
await go('journeys');
await page.locator('.jl').first().click();
await shot('03-journeys');

// ---------- 3. Ripple Trace ----------
await go('ripple');
await page.getByRole('button', { name: 'Play the ripple' }).click();
await page.waitForTimeout(10000);
await setRange('Hops shown', 26);
await page.waitForTimeout(500);
await shot('07-ripple-full');
await setRange('Hops shown', 6);
await page.waitForTimeout(500);
await shot('07-ripple-6hops');
blobs.ripple = await text();

// ---------- 4. Reflow ----------
await go('control');
await page.getByRole('button', { name: /^Reflow$/ }).click();
await page.waitForSelector('text=Proposed adjustment', { timeout: 90000 });
await page.waitForTimeout(5500);
await setRange('Scrub between the current plan and the proposal', 0);
await page.waitForTimeout(600);
await shot('06-reflow-before');
await crop('c-reflow-before', 'REGISTRATION', '.panel.flush');
await setRange('Scrub between the current plan and the proposal', 0.5);
await page.waitForTimeout(600);
await crop('c-reflow-mid', 'REGISTRATION', '.panel.flush');
await setRange('Scrub between the current plan and the proposal', 1);
await page.waitForTimeout(700);
await shot('06-reflow-after');
await crop('c-reflow-after', 'REGISTRATION', '.panel.flush');
await crop('c-reflow-constraints', 'Constraints preserved');
await crop('c-reflow-why', 'Why this proposal');
blobs.reflow = await text();

// ---------- 5. Action Desk: the human decision ----------
await go('desk');
await page.waitForTimeout(500);
await shot('08-desk-pending');
await crop('c-desk-card', 'WHY THIS PROPOSAL', '.card.open');
blobs.deskPending = await text();
await go('reflow');
await page.getByRole('button', { name: 'Accept in the simulation' }).click();
await page.waitForTimeout(800);
await go('desk');
await shot('08-desk-approved');
await crop('c-desk-audit', 'Audit trail');
blobs.deskApproved = await text();

// ---------- 6. Minutes Ledger ----------
await go('ledger');
await page.waitForTimeout(1500);
await shot('09-ledger');
await crop('c-ledger-waterfall', 'Where the minutes went');
await crop('c-ledger-balance', 'The balance');
await crop('c-ledger-worse', 'Patients made worse off');
await crop('c-ledger-distribution', 'Distribution of patient waiting');
await crop('c-ledger-policies', 'Scheduling policies, same day');
await crop('c-ledger-method', 'Dataset and scenario');
blobs.ledger = await text();
await page.getByRole('button', { name: /Run 8 seeds/ }).click();
await page.waitForFunction(() => /Improved on \d+ of 8/.test(document.body.innerText), null, { timeout: 180000 });
await page.waitForTimeout(500);
await crop('c-ledger-seeds', 'Evidence across seeds');
blobs.seeds = await text();

// ---------- 7. Patient view, About, Resource Board ----------
await go('my');
await shot('10-my-journey');
await page.locator('button', { hasText: 'About, methods & credits' }).click();
await page.waitForTimeout(600);
await shot('11-about');
await page.keyboard.press('Escape');
await go('board');
await page.waitForTimeout(600);
await shot('04-board');

writeFileSync(TXT + `run-${TAG}.json`, JSON.stringify(blobs, null, 1));
console.log('console errors:', errors.length ? errors : 'none');
await browser.close();
