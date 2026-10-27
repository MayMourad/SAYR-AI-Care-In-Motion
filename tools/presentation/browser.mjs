// Edge 156 no longer starts under Playwright's pipe transport here, so attach over CDP to a headless Edge we start ourselves.
import { chromium } from 'playwright-core';
import { spawn } from 'node:child_process';

const PORT = 9333;
const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function launch() {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const browser = await chromium.connectOverCDP(`http://127.0.0.1:${PORT}`);
      const realClose = browser.close.bind(browser);
      browser.close = async () => realClose().catch(() => {});
      return browser;
    } catch {
      spawn(EDGE, ['--headless=new', `--remote-debugging-port=${PORT}`, '--user-data-dir=' + process.env.TEMP + '\\sayr-edge-prof', '--no-first-run', '--disable-gpu', 'about:blank'], { detached: true, stdio: 'ignore' }).unref();
      await sleep(5000);
    }
  }
  throw new Error('could not reach Edge on the debugging port');
}
