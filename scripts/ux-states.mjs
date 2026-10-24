// Screenshots of the tool states that normally need the live agent (agent working, confirm, your own result),
// with /api/resolve and /api/analyze mocked from a precomputed example: no Qloo or Gemini call.
// Also measures the contrast of every visible text on each band, compositing translucent backgrounds.
// Run: node scripts/ux-states.mjs [baseUrl] [outDir]
import { chromium } from "playwright-core";
import { mkdirSync, readFileSync } from "node:fs";

const base = process.argv[2] || "http://localhost:3410";
const out = process.argv[3] || "screenshots/ux-states";
mkdirSync(out, { recursive: true });

const farm = JSON.parse(readFileSync("data/examples/cozy-farm.json", "utf8"));
const nd = (events) => events.map((e) => JSON.stringify(e)).join("\n") + "\n";
const resolveSteps = [
  { ms: 0, kind: "think", text: "Looking up 2 titles in Qloo" },
  { ms: 900, kind: "search", text: "Search \"Stardew Valey\": 4 games found", detail: "Typo fixed: Stardew Valley" },
  { ms: 1500, kind: "search", text: "Search \"Animal Crossing\": 4 games found" },
];
const matches = farm.audience.map((g, i) => ({
  typed: i === 0 ? "Stardew Valey" : "Animal Crossing",
  candidates: [
    { id: g.id, name: g.name, type: "urn:entity:videogame", image: g.image, releaseDate: `${g.year}-01-01`, developer: i === 0 ? "ConcernedApe" : "Nintendo" },
    { id: `${g.id}-b`, name: `${g.name} (Collector's Edition)`, type: "urn:entity:videogame", releaseDate: `${g.year}-06-01` },
  ],
  pickedId: g.id,
  note: i === 0 ? "Corrected the typo to Stardew Valley." : "",
  audienceData: true,
}));

async function contrast(page, tag) {
  return page.evaluate((tag) => {
    const parse = (c) => {
      const m = c.match(/rgba?\(([^)]+)\)/);
      if (!m) return null;
      const p = m[1].split(/[ ,/]+/).filter(Boolean).map(Number);
      return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
    };
    const over = (top, under) => ({
      r: top.r * top.a + under.r * (1 - top.a),
      g: top.g * top.a + under.g * (1 - top.a),
      b: top.b * top.a + under.b * (1 - top.a),
      a: 1,
    });
    const lum = ({ r, g, b }) => {
      const f = (v) => ((v /= 255) <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
      return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
    };
    const ratio = (x, y) => {
      const [a, b] = [lum(x), lum(y)].sort((m, n) => n - m);
      return (a + 0.05) / (b + 0.05);
    };
    function bgOf(el) {
      const layers = [];
      for (let e = el; e; e = e.parentElement) {
        const c = parse(getComputedStyle(e).backgroundColor);
        if (c && c.a > 0) layers.push(c);
        if (c && c.a === 1) break;
      }
      let col = { r: 255, g: 255, b: 255, a: 1 };
      for (let i = layers.length - 1; i >= 0; i--) col = over(layers[i], col);
      return col;
    }
    const res = { tag, checked: 0, fails: [], min: {} };
    const els = [...document.querySelectorAll("body *")].filter((e) => {
      if (e.closest(".sr-only, [hidden], .skip")) return false;
      const own = [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
      if (!own) return false;
      const r = e.getBoundingClientRect();
      return r.width > 0 && r.height > 0;
    });
    for (const e of els) {
      const cs = getComputedStyle(e);
      if (cs.visibility === "hidden" || Number(cs.opacity) === 0) continue;
      const fg = parse(cs.color);
      const bg = bgOf(e);
      const c = ratio(over(fg, bg), bg);
      const size = parseFloat(cs.fontSize);
      const large = size >= 24 || (size >= 18.66 && Number(cs.fontWeight) >= 700);
      const need = large ? 3 : 4.5;
      const band = e.closest(".band-dark") ? (e.closest(".fig") ? "dark>fig" : "dark") : e.closest(".band-ref") ? "ref" : "light";
      const kind = e.closest("a, button, summary, [role=tab]") ? "action" : "text";
      const k = `${band}/${kind}`;
      res.checked++;
      if (!res.min[k] || c < res.min[k].c) res.min[k] = { c: Math.round(c * 100) / 100, text: e.textContent.trim().slice(0, 30) };
      if (c < need) res.fails.push(`${k} ${c.toFixed(2)} < ${need}: "${e.textContent.trim().slice(0, 40)}"`);
    }
    // Filled buttons against their band (non-text contrast, 3:1)
    res.buttonEdges = [...document.querySelectorAll(".band-dark .btn:not(.btn-quiet)")].map((b) => {
      const fill = parse(getComputedStyle(b).backgroundColor);
      const band = bgOf(b.parentElement);
      return Math.round(ratio(fill, band) * 100) / 100;
    });
    res.fails = res.fails.slice(0, 12);
    return res;
  }, tag);
}

const browser = await chromium.launch({ channel: "chrome", headless: true });
const report = [];

for (const [tag, w, h] of [["d", 1440, 900], ["m", 390, 844]]) {
  const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: w < 500 ? 2 : 1 });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  let resolveMode = "partial";
  let analyzeMode = "partial";
  await page.route("**/api/resolve", (route) =>
    route.fulfill({
      contentType: "application/x-ndjson",
      body: nd([...resolveSteps.map((step) => ({ type: "step", step })), ...(resolveMode === "full" ? [{ type: "result", data: { matches } }] : [])]),
    }),
  );
  await page.route("**/api/analyze", (route) =>
    route.fulfill({
      contentType: "application/x-ndjson",
      body: nd([
        ...farm.steps.slice(0, 9).map((step) => ({ type: "step", step })),
        ...(analyzeMode === "full" ? [{ type: "result", data: { ...farm, mode: "live", id: "live-mock", label: "Lantern Keeper" } }] : []),
      ]),
    }),
  );

  // Landing and result contrast
  for (const url of ["/", "/check?example=action-western", "/check?example=cozy-farm"]) {
    await page.goto(`${base}${url}`, { waitUntil: "networkidle" });
    report.push(await contrast(page, `${tag} ${url}`));
  }

  // Step 1 -> agent working (stream ends without a result, so the screen stays on the progress view)
  await page.goto(`${base}/check`, { waitUntil: "networkidle" });
  report.push(await contrast(page, `${tag} step1`));
  await page.getByLabel(/^Game 1/).fill("Stardew Valey");
  await page.getByLabel(/^Game 2/).fill("Animal Crossing");
  await page.getByRole("button", { name: /Find these games/ }).click();
  await page.waitForSelector(".working .steps .step");
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${out}/${tag}-03-agent-resolving.png` });

  // Confirm
  resolveMode = "full";
  await page.goto(`${base}/check`, { waitUntil: "networkidle" });
  await page.getByLabel(/^Game 1/).fill("Stardew Valey");
  await page.getByRole("button", { name: /Find these games/ }).click();
  await page.waitForSelector("text=Are these the right games?");
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${out}/${tag}-04-confirm.png`, fullPage: true });
  report.push(await contrast(page, `${tag} confirm`));

  // Measuring
  await page.getByRole("button", { name: /Measure my launch window/ }).click();
  await page.waitForSelector(".working .steps .step");
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${out}/${tag}-04b-agent-measuring.png` });

  // Your own result ("Try other games" closing band)
  analyzeMode = "full";
  await page.goto(`${base}/check`, { waitUntil: "networkidle" });
  await page.getByLabel(/^Game 1/).fill("Stardew Valey");
  await page.getByRole("button", { name: /Find these games/ }).click();
  await page.waitForSelector("text=Are these the right games?");
  await page.getByRole("button", { name: /Measure my launch window/ }).click();
  await page.waitForSelector("#answer-title");
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${out}/${tag}-05-result-live.png` });
  await page.locator(".res-next").screenshot({ path: `${out}/${tag}-05b-result-live-next.png` });
  report.push(await contrast(page, `${tag} result live`));
  report.push({ tag: `${tag} overflow live`, overflowX: await page.evaluate(() => document.documentElement.scrollWidth - innerWidth) });

  // Hover and focus on the dark band: the filled button and a link
  await page.goto(`${base}/`, { waitUntil: "networkidle" });
  await page.locator(".hero .btn-quiet").hover();
  await page.waitForTimeout(250);
  await page.locator(".hero-actions").screenshot({ path: `${out}/${tag}-09-hero-hover.png` });
  await page.locator(".hero .btn").first().focus();
  await page.keyboard.press("Shift+Tab");
  await page.keyboard.press("Tab");
  await page.waitForTimeout(150);
  report.push({
    tag: `${tag} dark focus ring`,
    outline: await page.evaluate(() => getComputedStyle(document.activeElement).outlineColor),
  });

  if (errors.length) report.push({ tag: `${tag} errors`, errors: errors.slice(0, 5) });
  await page.close();
}

await browser.close();
for (const r of report) console.log(JSON.stringify(r));
