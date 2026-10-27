// Captures real screenshots of the running SAYR app (npm run preview) for the deck and docs.
// It follows the recommended three-minute demo route.
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';

const BASE = process.env.SAYR_URL ?? 'http://localhost:4173';
const OUT = new URL('../docs/screenshots/', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ channel: 'msedge' });
const ctx = await browser.newContext({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 1.5 });
const page = await ctx.newPage();
const errors = [];
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
page.on('pageerror', (e) => errors.push(String(e)));

const setRange = (label, v) =>
  page.evaluate(
    ([label, v]) => {
      const el = document.querySelector(`input[aria-label="${label}"]`);
      const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
      set.call(el, String(v));
      el.dispatchEvent(new Event('input', { bubbles: true }));
    },
    [label, v],
  );
const shot = async (name, opts = {}) => {
  await page.waitForTimeout(opts.wait ?? 350);
  await page.screenshot({ path: OUT + name + '.png', fullPage: false });
  console.log('shot', name);
};
const hide = () => page.addStyleTag({ content: '.transport{visibility:hidden !important}' }).then((h) => h.evaluate((el) => el.setAttribute('id', 'hide-transport')));
const unhide = () => page.evaluate(() => document.getElementById('hide-transport')?.remove());
const panel = async (name, sel = '.panel.flush') => {
  await hide();
  await page.locator(sel).first().screenshot({ path: OUT + 'c-' + name + '.png' });
  await unhide();
  console.log('panel', name);
};
const zoom = async (name) => {
  await hide();
  const b = await page.locator('.flow').first().boundingBox();
  await page.screenshot({ path: OUT + 'c-' + name + '.png', clip: { x: b.x, y: b.y, width: b.width * 0.66, height: b.height } });
  await unhide();
  console.log('zoom', name);
};
const go = async (id) => {
  await page.evaluate((id) => (window.location.hash = '#/' + id), id);
  await page.waitForTimeout(350);
};
const pause = async () => {
  const b = page.locator('button[aria-label="Pause"]');
  if (await b.count()) await b.click();
};

// 1. The clinic is moving (normal operations)
await page.goto(BASE + '/#/motion');
await page.waitForTimeout(700);
await pause();
await setRange('Simulation time', 150);
await shot('01-motion');
await panel('motion');
await go('control');
await shot('02-control-normal');

// 2. Disrupt the system: staff unavailability at 10:30
await go('stress');
await page.getByRole('radio', { name: /Staff unavailability/ }).click();
await shot('05-stress');
await go('control');
await page.waitForTimeout(400);
await pause();
await shot('02-control');
await panel('control');
await go('journeys');
await page.locator('.jl').first().click();
await shot('03-journeys');

// 3. Reflow
await go('control');
await page.getByRole('button', { name: /^Reflow$/ }).click();
await page.waitForSelector('text=Proposed adjustment', { timeout: 90000 });
await page.waitForTimeout(5200);
await setRange('Scrub between the current plan and the proposal', 0);
await shot('06-reflow-before', { wait: 500 });
await panel('reflow-before');
await zoom('reflow-before-zoom');
await setRange('Scrub between the current plan and the proposal', 0.45);
await shot('06-reflow-mid', { wait: 500 });
await panel('reflow-mid');
await setRange('Scrub between the current plan and the proposal', 1);
await shot('06-reflow-after', { wait: 500 });
await panel('reflow-after');
await zoom('reflow-after-zoom');

// Resource board: a consultation appointment dragged onto a registration desk is refused
await go('board');
await page.waitForTimeout(600);
await shot('04-board');
const handles = page.locator('.flow-svg rect[style*="grab"]');
const n = await handles.count();
console.log('board handles', n);
{
  const mid = async (id) => {
    const b = await page.locator('.flow-svg text.lane-id', { hasText: id }).first().boundingBox();
    return b.y + b.height / 2;
  };
  const gpY = await mid('GP-1');
  const regY = await mid('REG-1');
  let bb = null;
  for (let i = 0; i < n; i++) {
    const b = await handles.nth(i).boundingBox();
    if (b && Math.abs(b.y + b.height / 2 - gpY) < 8 && b.x > 360 && b.width > 20) {
      bb = b;
      break;
    }
  }
  if (!bb) throw new Error('no GP-1 appointment found to drag');
  await page.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2);
  await page.mouse.down();
  await page.mouse.move(bb.x + bb.width / 2 + 40, regY, { steps: 14 });
  await shot('04-board-reject-drag', { wait: 250 });
  await panel('board-drag');
  await page.mouse.up();
  await shot('04-board-rejected', { wait: 300 });
}

// Ripple Trace
await go('ripple');
await page.getByRole('button', { name: 'Play the ripple' }).click();
await page.waitForTimeout(10000);
await setRange('Hops shown', 6);
await shot('07-ripple-pre');
await panel('ripple');

// Action Desk with the pending, recommended proposal expanded
await go('desk');
await page.waitForTimeout(400);
await shot('08-desk-pending');
await panel('desk', '.deck .card.open');

// 4. Human approval, then measure
await go('reflow');
await page.getByRole('button', { name: 'Accept in the simulation' }).click();
await page.waitForTimeout(600);
await shot('06-reflow-accepted');
await go('desk');
await shot('08-desk');
await go('ledger');
await page.waitForTimeout(800);
await shot('09-ledger', { wait: 600 });
await panel('ledger-waterfall', 'section.panel');
await panel('ledger-balance', '.grid > section.panel:nth-child(2)');
await go('my');
await shot('10-my-journey');
await panel('my-journey', '.page .grid');

// About: transparency and responsible AI
await page.locator('button', { hasText: 'About, methods & credits' }).click();
await shot('11-about');
await page.keyboard.press('Escape');

// Arabic, right-to-left
await page.getByRole('button', { name: 'العربية' }).click();
await go('ledger');
await shot('12-ledger-ar', { wait: 600 });
await go('stress');
await shot('12-stress-ar');
await go('motion');
await shot('12-motion-ar');

console.log('console errors:', errors.length ? errors : 'none');
await browser.close();
