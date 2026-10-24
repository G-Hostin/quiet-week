// Screenshots + layout checks with the installed Chrome (headless).
// Run: node scripts/shots.mjs [name] [url]
import { chromium } from "playwright-core";
import { mkdirSync } from "node:fs";

const name = process.argv[2] || "home";
const url = process.argv[3] || "http://localhost:3410/";
const out = "screenshots";
mkdirSync(out, { recursive: true });

const browser = await chromium.launch({ channel: "chrome", headless: true });
const sizes = [
  { tag: "desktop", width: 1440, height: 900 },
  { tag: "mobile", width: 390, height: 844 },
  { tag: "narrow", width: 320, height: 640 },
];
for (const s of sizes) {
  const page = await browser.newPage({ viewport: { width: s.width, height: s.height }, deviceScaleFactor: s.tag === "desktop" ? 1 : 2 });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  await page.goto(url, { waitUntil: "networkidle" });
  await page.waitForTimeout(400);
  const check = await page.evaluate(() => {
    const over = document.documentElement.scrollWidth - window.innerWidth;
    const outside = [];
    for (const el of document.querySelectorAll("body *")) {
      const r = el.getBoundingClientRect();
      if (r.width === 0 || getComputedStyle(el).position === "fixed") continue;
      if (el.closest(".cal-scroll, .table-wrap")) continue;
      if (r.right > window.innerWidth + 1) outside.push(`${el.tagName.toLowerCase()}.${String(el.className).slice(0, 40)} right=${Math.round(r.right)}`);
    }
    return { overflowX: over, outside: outside.slice(0, 8), height: document.documentElement.scrollHeight };
  });
  console.log(`${s.tag}: overflowX=${check.overflowX} height=${check.height} outside=${JSON.stringify(check.outside)} errors=${JSON.stringify(errors.slice(0, 3))}`);
  await page.screenshot({ path: `${out}/${name}-${s.tag}-top.png` });
  if (s.tag !== "narrow") {
    const total = Math.min(check.height, 7200);
    const slice = 2400;
    for (let y = 0, i = 1; y < total; y += slice, i++) {
      await page.screenshot({ path: `${out}/${name}-${s.tag}-full-${i}.png`, clip: { x: 0, y, width: s.width, height: Math.min(slice, total - y) }, fullPage: true });
    }
  }
  await page.close();
}
await browser.close();
