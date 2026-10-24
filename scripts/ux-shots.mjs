// Screenshots of every UI state + layout checks (overflow, elements outside the viewport, overlaps, console errors).
// Uses the installed Chrome (headless) and the precomputed examples only: no Qloo or Gemini call.
// Run: node scripts/ux-shots.mjs [baseUrl] [outDir]
import { chromium } from "playwright-core";
import { mkdirSync } from "node:fs";

const base = process.argv[2] || "http://localhost:3410";
const out = process.argv[3] || "screenshots/ux-v2";
mkdirSync(out, { recursive: true });

const browser = await chromium.launch({ channel: "chrome", headless: true });
const report = [];

async function checks(page, tag) {
  return page.evaluate((tag) => {
    const W = window.innerWidth;
    const over = document.documentElement.scrollWidth - W;
    const outside = [];
    for (const el of document.querySelectorAll("body *")) {
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      if (el.closest(".cal-scroll, .table-wrap, .tabs, .sr-only, .skip, .log")) continue;
      if (r.right > W + 1 || r.left < -1) outside.push(`${el.tagName.toLowerCase()}.${String(el.className).slice(0, 30)} [${Math.round(r.left)},${Math.round(r.right)}]`);
    }
    // Overlapping text leaves (siblings inside the same block) — catches text spilling out.
    const leaves = [...document.querySelectorAll("p, h1, h2, h3, span, a, button, strong, li, dt, dd, label")].filter((e) => {
      const r = e.getBoundingClientRect();
      return r.width > 0 && r.height > 0 && e.children.length === 0 && e.textContent.trim() && !e.closest(".sr-only, .cal-scroll, .scale, .fig-axis");
    });
    const overlaps = [];
    for (let i = 0; i < leaves.length && overlaps.length < 6; i++) {
      const a = leaves[i].getBoundingClientRect();
      for (let j = i + 1; j < Math.min(leaves.length, i + 40); j++) {
        const b = leaves[j].getBoundingClientRect();
        if (leaves[i].contains(leaves[j]) || leaves[j].contains(leaves[i])) continue;
        const x = Math.min(a.right, b.right) - Math.max(a.left, b.left);
        const y = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
        if (x > 3 && y > 3) overlaps.push(`"${leaves[i].textContent.trim().slice(0, 20)}" x "${leaves[j].textContent.trim().slice(0, 20)}"`);
      }
    }
    return { tag, overflowX: over, outside: outside.slice(0, 6), overlaps, height: document.documentElement.scrollHeight };
  }, tag);
}

async function shoot(page, name, { full = false } = {}) {
  const vp = page.viewportSize();
  if (!full) return page.screenshot({ path: `${out}/${name}.png` });
  const H = await page.evaluate(() => document.documentElement.scrollHeight);
  const slice = 2400;
  for (let y = 0, i = 1; y < H; y += slice, i++) {
    await page.screenshot({ path: `${out}/${name}-${i}.png`, clip: { x: 0, y, width: vp.width, height: Math.min(slice, H - y) }, fullPage: true });
  }
}

async function newPage(width, height) {
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: width < 500 ? 2 : 1 });
  page.errors = [];
  page.on("pageerror", (e) => page.errors.push(e.message));
  page.on("console", (m) => m.type() === "error" && page.errors.push(m.text()));
  return page;
}

for (const [tag, w, h] of [["d", 1440, 900], ["m", 390, 844]]) {
  const page = await newPage(w, h);

  // 1. Landing
  await page.goto(`${base}/`, { waitUntil: "networkidle" });
  await page.waitForTimeout(400);
  await shoot(page, `${tag}-01-landing`);
  await shoot(page, `${tag}-01-landing-full`, { full: true });
  report.push(await checks(page, `${tag} landing`));

  // 2. Tool step 1
  await page.goto(`${base}/check`, { waitUntil: "networkidle" });
  await page.waitForTimeout(300);
  await shoot(page, `${tag}-02-step1`);
  report.push(await checks(page, `${tag} step1`));
  // Validation error
  await page.getByRole("button", { name: /Find these games/ }).click();
  await page.waitForTimeout(150);
  await shoot(page, `${tag}-02b-step1-error`, { full: true });

  // 3. Example result (from step 1)
  await page.getByRole("button", { name: /Action western/ }).first().click();
  await page.waitForSelector("#answer-title");
  await page.waitForTimeout(400);
  await shoot(page, `${tag}-05-result-example`);
  await shoot(page, `${tag}-05-result-example-full`, { full: true });
  report.push(await checks(page, `${tag} result example`));

  // 4. Week selected (click "See this week" on a best week)
  await page.locator(".wrow").first().click();
  await page.waitForTimeout(700);
  await shoot(page, `${tag}-07-week-selected`);
  report.push(await checks(page, `${tag} week selected`));

  // 5. Sources expanded, calls tab
  await page.getByRole("button", { name: /Show every release/ }).click();
  await page.locator("#sources").scrollIntoViewIfNeeded();
  await page.waitForTimeout(200);
  await page.locator("#sources").screenshot({ path: `${out}/${tag}-08-sources-releases.png` });
  await page.getByRole("tab", { name: "Qloo calls" }).click();
  await page.waitForTimeout(200);
  await page.locator("#sources").screenshot({ path: `${out}/${tag}-08b-sources-calls.png` });
  await page.getByRole("tab", { name: "Agent steps" }).click();
  await page.waitForTimeout(200);
  report.push(await checks(page, `${tag} sources`));

  // Farm example directly by URL
  await page.goto(`${base}/check?example=cozy-farm`, { waitUntil: "networkidle" });
  await page.waitForTimeout(300);
  await shoot(page, `${tag}-06-result-farm`);
  report.push(await checks(page, `${tag} farm`));

  if (page.errors.length) report.push({ tag: `${tag} errors`, errors: page.errors.slice(0, 5) });
  await page.close();
}

// Narrow widths: overflow only
for (const w of [360, 320]) {
  const page = await newPage(w, 700);
  for (const url of ["/", "/check", "/check?example=action-western", "/check?example=metroidvania"]) {
    await page.goto(`${base}${url}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(250);
    if (url.includes("example")) {
      await page.getByRole("button", { name: /Show every release/ }).click();
      await page.getByRole("tab", { name: "Qloo calls" }).click();
    }
    report.push(await checks(page, `${w} ${url}`));
  }
  await shoot(page, `n${w}-result-sources`);
  await page.goto(`${base}/check`, { waitUntil: "networkidle" });
  await shoot(page, `n${w}-step1`);
  await page.goto(`${base}/check?example=action-western`, { waitUntil: "networkidle" });
  await shoot(page, `n${w}-result`);
  await page.close();
}

// Keyboard: tab order on the landing, focus visible on first control
{
  const page = await newPage(1440, 900);
  await page.goto(`${base}/check?example=action-western`, { waitUntil: "networkidle" });
  const seen = [];
  for (let i = 0; i < 14; i++) {
    await page.keyboard.press("Tab");
    seen.push(
      await page.evaluate(() => {
        const e = document.activeElement;
        const cs = getComputedStyle(e);
        return `${e.tagName.toLowerCase()}:${(e.getAttribute("aria-label") || e.textContent || "").trim().slice(0, 28)} [outline ${cs.outlineStyle} ${cs.outlineColor}${cs.boxShadow !== "none" ? " +shadow" : ""}]`;
      }),
    );
  }
  // Arrow keys in the calendar
  await page.locator(".bar-btn[aria-checked=true]").focus();
  await page.keyboard.press("ArrowRight");
  const after = await page.evaluate(() => document.activeElement.getAttribute("aria-label"));
  await page.keyboard.press("Tab");
  await page.locator(".bar-btn[aria-checked=true]").screenshot({ path: `${out}/d-focus-bar.png` }).catch(() => {});
  report.push({ tag: "keyboard", seen, calendarArrowRight: after });
  await page.close();
}

// Reduced motion + resize from desktop to mobile (no stuck layout)
{
  const page = await newPage(1440, 900);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(`${base}/check?example=metroidvania`, { waitUntil: "networkidle" });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(300);
  report.push(await checks(page, "resize 1440->390"));
  await page.close();
}

await browser.close();
for (const r of report) console.log(JSON.stringify(r));
