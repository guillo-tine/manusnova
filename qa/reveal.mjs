// Hidden-content audit: walks the page in quarter-screen steps and, at every stop, checks
// that each reveal-on-arrival block a reader can actually see has been revealed.
// "Can see" = at least 60% of it is inside the viewport.
import { chromium, webkit } from "playwright";
import { firefox } from "./pw-shim.mjs";

const URL = process.env.URL || "http://localhost:5190/";
const engines = { chromium, firefox, webkit };
const pick = (process.env.ENGINES || "chromium,firefox,webkit").split(",");
const sizes = (process.env.SIZES || "390x844,768x1024,1440x900").split(",").map((s) => s.split("x").map(Number));

let failures = 0;
for (const name of pick) {
  const browser = await engines[name].launch();
  for (const [w, h] of sizes) {
    const page = await browser.newPage({ viewport: { width: w, height: h } });
    await page.goto(URL, { waitUntil: "networkidle" });
    await page.waitForFunction(() => document.documentElement.classList.contains("is-ready"), null, { timeout: 30000 });
    await page.waitForTimeout(1200);
    const max = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
    const misses = new Set();
    for (let y = 0; y <= max; y += Math.round(h / 4)) {
      await page.evaluate((y) => window.scrollTo(0, y), y);
      await page.waitForTimeout(350);
      const hidden = await page.evaluate(() => {
        const out = [];
        for (const el of document.querySelectorAll("[data-reveal],[data-reveal-stagger]")) {
          const r = el.getBoundingClientRect();
          const seen = Math.max(0, Math.min(r.bottom, innerHeight) - Math.max(r.top, 0)) / Math.max(1, r.height);
          if (seen >= 0.6 && !el.classList.contains("is-in")) out.push(el.textContent.trim().slice(0, 30));
        }
        return out;
      });
      hidden.forEach((t) => misses.add(`"${t}" @y=${y}`));
    }
    if (misses.size) failures++;
    console.log(`${misses.size ? "FAIL" : "ok  "} ${name.padEnd(8)} ${w}x${h}` + (misses.size ? `  visible but hidden: ${[...misses].slice(0, 4).join(", ")}` : ""));
    await page.close();
  }
  await browser.close();
}
console.log(failures ? `\n${failures} failing combinations` : "\nall clear");
process.exit(failures ? 1 : 0);
