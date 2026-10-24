// One full live flow through /check (real Qloo + Gemini calls), with screenshots of each live state.
// Run: node scripts/ux-live.mjs <tag> <width> "<title1>|<title2>" "<name>" [baseUrl] [outDir]
import { chromium } from "playwright-core";
import { mkdirSync } from "node:fs";

const [tag = "live", width = "1440", titles = "Stardew Valey|Spiritfarer", name = "Lantern Keeper"] = process.argv.slice(2);
const base = process.argv[6] || "http://localhost:3410";
const out = process.argv[7] || "screenshots/ux-v2";
mkdirSync(out, { recursive: true });
const w = Number(width);

const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({ viewport: { width: w, height: w < 500 ? 844 : 900 }, deviceScaleFactor: w < 500 ? 2 : 1 });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
const t0 = Date.now();
const log = (s) => console.log(`${((Date.now() - t0) / 1000).toFixed(1)}s ${s}`);

await page.goto(`${base}/check`, { waitUntil: "networkidle" });
const list = titles.split("|");
for (let i = 0; i < list.length; i++) await page.getByLabel(new RegExp(`^Game ${i + 1}`)).fill(list[i]);
await page.getByLabel("Name").fill(name);
await page.getByLabel("One sentence about it").fill("A cozy lighthouse sim by the sea.");
await page.getByRole("button", { name: /Find these games/ }).click();
log("resolve started");
await page.waitForSelector(".working .steps .step", { timeout: 30000 }).catch(() => {});
await page.waitForTimeout(600);
await page.screenshot({ path: `${out}/${tag}-03-agent-resolving.png` });

await page.waitForSelector("text=Are these the right games?", { timeout: 90000 });
log("confirm shown");
await page.waitForTimeout(500);
await page.screenshot({ path: `${out}/${tag}-04-confirm.png`, fullPage: true });
const picks = await page.evaluate(() => [...document.querySelectorAll(".match")].map((m) => ({
  typed: m.querySelector("legend")?.textContent,
  picked: m.querySelector(".cand.is-on .cand-name")?.textContent,
  note: m.querySelector(".match-note")?.textContent,
})));
log(`matches ${JSON.stringify(picks)}`);

await page.getByRole("button", { name: /Measure my launch window/ }).click();
log("analyze started");
await page.waitForTimeout(2500);
await page.screenshot({ path: `${out}/${tag}-04b-agent-measuring.png` });
await page.waitForSelector("#answer-title", { timeout: 120000 });
log("result shown");
await page.waitForTimeout(700);
await page.screenshot({ path: `${out}/${tag}-05-result-live.png` });
const res = await page.evaluate(() => ({
  url: location.pathname + location.search,
  title: document.title,
  answer: document.querySelector("#answer-title")?.textContent,
  lede: [...document.querySelectorAll(".answer-lede")].map((p) => p.textContent),
  ctx: document.querySelector(".ctx-what")?.textContent,
  scrollY: window.scrollY,
  focused: document.activeElement?.id,
  overflowX: document.documentElement.scrollWidth - window.innerWidth,
}));
log(JSON.stringify(res));

// Reload keeps the result (sessionStorage); back goes to the confirm step.
await page.reload({ waitUntil: "networkidle" });
await page.waitForSelector("#answer-title", { timeout: 10000 });
log(`after reload: ${await page.locator("#answer-title").textContent()}`);
await page.goBack();
await page.waitForTimeout(400);
log(`after back: ${await page.locator("h2#step-title").textContent().catch(() => "none")}`);
log(`errors ${JSON.stringify(errors.slice(0, 5))}`);
await browser.close();
