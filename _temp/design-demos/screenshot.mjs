import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const html = `file://${__dirname}/live-band-combobox.html`;

const browser = await chromium.launch();
const page = await browser.newPage();
await page.setViewportSize({ width: 900, height: 560 });
await page.goto(html);
await page.waitForTimeout(1200);

// State 1 — test mode off
await page.screenshot({ path: `${__dirname}/shot-1-off.png` });

// State 2 — toggle on
await page.click('button[role=switch]');
await page.waitForTimeout(400);
await page.screenshot({ path: `${__dirname}/shot-2-on.png` });

// State 3 — dropdown open (full list)
await page.click('input[placeholder="Search bands…"]');
await page.waitForTimeout(300);
await page.screenshot({ path: `${__dirname}/shot-3-dropdown.png` });

// State 4 — filtered by "meta"
await page.keyboard.type('meta');
await page.waitForTimeout(200);
await page.screenshot({ path: `${__dirname}/shot-4-filter.png` });

// State 5 — band selected + "Set Band" clicked
await page.keyboard.press('Enter');
await page.waitForTimeout(200);
await page.click('button.btn-primary');
await page.waitForTimeout(400);
await page.screenshot({ path: `${__dirname}/shot-5-saved.png` });

await browser.close();
console.log('done');
