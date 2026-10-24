// Screenshots of interactive states: verdict section, a clicked week, the live agent flow.
// Run: node scripts/shots-flow.mjs
import { chromium } from "playwright-core";
import { mkdirSync } from "node:fs";

const url = "http://localhost:3410/";
mkdirSync("screenshots", { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: true });

// 1. Desktop: verdict section of the farming example, then a clicked week.
{
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(url, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /Cozy farming game/ }).first().click();
  await page.locator("#verdict").scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  await page.locator("#verdict").screenshot({ path: "screenshots/flow-verdict-farm.png" });
  await page.locator("#calendar").scrollIntoViewIfNeeded();
  await page.getByRole("radio", { name: /Week of Mar 8/ }).click();
  await page.waitForTimeout(300);
  await page.locator("#calendar").screenshot({ path: "screenshots/flow-calendar-farm-mar8.png" });
  await page.close();
}

// 2. Mobile: the live flow with the agent journal.
{
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  await page.goto(url, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Test your own game" }).first().click();
  await page.getByLabel("Game name").fill("Lantern Keeper");
  await page.getByLabel(/One sentence/).fill("A cozy lighthouse sim about keeping a coastal village safe.");
  await page.getByLabel("Comparable game 1").fill("Stardew Valey");
  await page.getByLabel("Comparable game 2").fill("Spiritfarer");
  await page.getByRole("button", { name: "Find these games in Qloo" }).click();
  await page.waitForSelector(".confirm", { timeout: 60000 });
  await page.locator("#try").screenshot({ path: "screenshots/flow-confirm-mobile.png" });
  await page.getByRole("button", { name: /Measure against/ }).click();
  await page.waitForTimeout(2500);
  await page.locator("#try").screenshot({ path: "screenshots/flow-agent-working-mobile.png" });
  await page.waitForSelector("#game-title:has-text('Lantern Keeper')", { timeout: 90000 });
  await page.waitForTimeout(500);
  await page.screenshot({ path: "screenshots/flow-live-result-mobile.png" });
  const t = await page.evaluate(() => ({
    gta: document.querySelector(".gta-num")?.textContent,
    summary: document.querySelector(".summary-text")?.textContent,
    overflowX: document.documentElement.scrollWidth - window.innerWidth,
  }));
  console.log("live result:", JSON.stringify(t));
  await page.close();
}
await browser.close();
