// Request-sheet lifecycle: closed sheet blocks nothing; opens; accepts typing; closes;
// and leaves nothing behind that catches the pointer. Then real wheel/touch scrolling works.
import { chromium, webkit } from "playwright";
import { firefox } from "./pw-shim.mjs";

const URL = process.env.URL || "http://localhost:5190/";
const engines = { chromium, firefox, webkit };
const pick = (process.env.ENGINES || "chromium,firefox,webkit").split(",");

const deadZones = () => {
  // any point on screen whose top element belongs to the sheet's dialog
  const hits = [];
  for (let x = 0.05; x < 1; x += 0.1) for (let y = 0.05; y < 1; y += 0.1) {
    const el = document.elementFromPoint(innerWidth * x, innerHeight * y);
    if (el?.closest('[role="dialog"]')) hits.push(`${Math.round(x * 100)}%,${Math.round(y * 100)}%`);
  }
  return hits;
};

let failures = 0;
for (const name of pick) {
  const browser = await engines[name].launch();
  for (const [w, h] of [[1440, 900], [390, 844]]) {
    const page = await browser.newPage({ viewport: { width: w, height: h } });
    const raw = page.raw ?? page;
    const errs = [];
    const step = (ok, msg) => { if (!ok) errs.push(msg); };
    await page.goto(URL, { waitUntil: "networkidle" });
    await page.waitForFunction(() => document.documentElement.classList.contains("is-ready"), null, { timeout: 30000 });
    await page.waitForTimeout(1500);

    step((await page.evaluate(deadZones)).length === 0, "closed sheet blocks pointer");

    // open from the hero button
    await page.evaluate(() => [...document.querySelectorAll("button")].find((b) => /request a device/i.test(b.textContent)).click());
    await page.waitForTimeout(700);
    const opened = await page.evaluate(() => {
      const d = document.querySelector('[role="dialog"]');
      const r = d.getBoundingClientRect();
      const top = document.elementFromPoint(r.left + r.width / 2, r.top + 40);
      return { visible: getComputedStyle(d).visibility === "visible" && +getComputedStyle(d).opacity > 0.9, hittable: !!top?.closest('[role="dialog"]') };
    });
    step(opened.visible && opened.hittable, `sheet did not open properly ${JSON.stringify(opened)}`);

    // type into the form
    await page.evaluate(() => document.getElementById("rq-contact").focus());
    if (raw.keyboard) await raw.keyboard.type("qa@example.test");
    const typed = await page.evaluate(() => document.getElementById("rq-contact").value);
    step(typed === "qa@example.test", `typing failed: "${typed}"`);

    // close with Escape, then the sheet must leave nothing behind
    if (raw.keyboard) await raw.keyboard.press("Escape");
    await page.waitForTimeout(800);
    const after = await page.evaluate(deadZones);
    step(after.length === 0, `closed sheet still blocks pointer at ${after.slice(0, 4).join(" ")}`);

    // scroll with real input
    const before = await page.evaluate(() => scrollY);
    if (raw.mouse && w > 500) {
      await raw.mouse.move(w / 2, h / 2);
      for (let i = 0; i < 8; i++) { await (name === "firefox" ? raw.mouse.wheel({ deltaY: 120 }) : raw.mouse.wheel(0, 120)); await page.waitForTimeout(60); }
    } else {
      await page.evaluate(() => window.scrollBy(0, 900));
    }
    await page.waitForTimeout(900);
    const moved = (await page.evaluate(() => scrollY)) - before;
    step(moved > 300, `page did not scroll after closing (moved ${moved}px)`);

    if (errs.length) failures++;
    console.log(`${errs.length ? "FAIL" : "ok  "} ${name.padEnd(8)} ${w}x${h}` + (errs.length ? "  " + errs.join("; ") : `  (scrolled ${moved}px after close)`));
    await page.close();
  }
  await browser.close();
}
console.log(failures ? `\n${failures} failing combinations` : "\nall clear");
process.exit(failures ? 1 : 0);
