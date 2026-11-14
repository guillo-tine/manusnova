// Screenshots of every section, per engine and viewport, after the reveal settles.
// Section offsets come from the live layout so the shots land where a reader would be.
import { chromium, webkit } from "playwright";
import { firefox } from "./pw-shim.mjs";

const URL = process.env.URL || "http://localhost:5190/";
const OUT = process.env.OUT || "shots";
const engines = { chromium, firefox, webkit };
const pick = (process.env.ENGINES || "chromium").split(",");
const sizes = (process.env.SIZES || "1440x900,390x844").split(",").map((s) => s.split("x").map(Number));
const { mkdirSync } = await import("node:fs");
mkdirSync(OUT, { recursive: true });

for (const name of pick) {
  const browser = name === "chromium"
    ? await chromium.launch({ args: ["--use-angle=d3d11", "--enable-gpu", "--ignore-gpu-blocklist"] })
    : await engines[name].launch();
  for (const [w, h] of sizes) {
    const page = await browser.newPage({ viewport: { width: w, height: h } });
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (m) => { if (m.type?.() === "error" || m.type === "error") errors.push(m.text?.() ?? String(m)); });
    await page.goto(URL, { waitUntil: "networkidle" });
    await page.waitForFunction(() => document.documentElement.classList.contains("is-ready"), null, { timeout: 30000 });
    await page.waitForTimeout(2500);
    const info = await page.evaluate(() => {
      const abs = (el) => { let y = 0; for (let e = el; e; e = e.offsetParent) y += e.offsetTop; return y; };
      const at = (sel, extra = 0) => { const el = document.querySelector(sel); return el ? abs(el) + extra : null; };
      const c = document.querySelector("canvas");
      return {
        canvas: !!c, lite: document.documentElement.classList.contains("is-lite"),
        stops: {
          hero: 0,
          design: at('[data-pose="design"]', innerHeight * 0.6),
          mission: at("#mission", 60),
          count: at('[data-pose="count"]'),
          how: at("#how", 60),
          free: at("#free"),
          team: at("#team", 40),
          request: at("#request"),
        },
      };
    });
    for (const [label, y] of Object.entries(info.stops)) {
      if (y == null) continue;
      await page.evaluate((y) => window.scrollTo(0, y), y);
      await page.waitForTimeout(1800);
      await page.screenshot({ path: `${OUT}/${name}-${w}-${label}.png` });
    }
    console.log(`${name} ${w}x${h}: canvas=${info.canvas} lite=${info.lite} errors=${JSON.stringify(errors.slice(0, 3))}`);
    await page.close();
  }
  await browser.close();
}
