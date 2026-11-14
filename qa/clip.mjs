// Text-clipping audit across engines and widths.
// Gradient text (background-clip: text) only paints inside its own box, so any glyph ink
// that pokes outside the box silently disappears. To find that, each gradient headline is
// re-rendered in solid red with no clipping, and red pixels outside the element's box are
// counted. Any non-zero count is text a visitor can't see.
// Also checks every visible text element for horizontal overflow and the page for sideways scroll.
import { chromium, webkit } from "playwright";
import { firefox } from "./pw-shim.mjs";

const URL = process.env.URL || "http://localhost:5190/";
const engines = { chromium, firefox, webkit };
const widths = (process.env.WIDTHS || "320,375,414,768,1024,1280,1408,1440,1680,1920,2560").split(",").map(Number);
const pick = (process.env.ENGINES || "chromium,firefox,webkit").split(",");

let failures = 0;
for (const name of pick) {
  const browser = await engines[name].launch();
  for (const w of widths) {
    const page = await browser.newPage({ viewport: { width: w, height: Math.round(Math.max(640, w * 0.62)) } });
    await page.goto(URL, { waitUntil: "networkidle" });
    await page.waitForFunction(() => document.documentElement.classList.contains("is-ready"), null, { timeout: 15000 });
    // show every reveal-on-arrival block and kill the blur so geometry is final
    await page.addStyleTag({ content: `[data-reveal],[data-reveal-stagger]>*{opacity:1!important;transform:none!important;filter:none!important;transition:none!important}` });

    const targets = await page.$$eval(".free-word", (els) => els.map((_, i) => i));
    const problems = [];
    for (const i of targets) {
      const el = (await page.$$(".free-word"))[i];
      await el.scrollIntoViewIfNeeded();
      await page.waitForTimeout(150);
      const box = await el.boundingBox();
      const text = await el.innerText();
      // solid red, nothing clipped, nothing else on screen that's red
      await el.evaluate((n) => {
        n.dataset.qa = "1";
        n.style.cssText += ";background:none!important;-webkit-text-fill-color:#ff0000!important;color:#ff0000!important;overflow:visible!important";
      });
      await page.addStyleTag({ content: `canvas{visibility:hidden!important}` });
      const pad = 80;
      const clip = {
        x: Math.max(0, box.x - pad), y: Math.max(0, box.y - pad),
        width: Math.min(w - Math.max(0, box.x - pad), box.width + pad * 2),
        height: box.height + pad * 2,
      };
      const png = await page.screenshot({ clip });
      const outside = await page.evaluate(async ({ b64, box, clip }) => {
        const img = new Image();
        img.src = "data:image/png;base64," + b64;
        await img.decode();
        const c = document.createElement("canvas");
        c.width = img.width; c.height = img.height;
        const g = c.getContext("2d");
        g.drawImage(img, 0, 0);
        const d = g.getImageData(0, 0, c.width, c.height).data;
        const sx = img.width / clip.width, sy = img.height / clip.height;
        const L = (box.x - clip.x) * sx, R = (box.x + box.width - clip.x) * sx;
        const T = (box.y - clip.y) * sy, B = (box.y + box.height - clip.y) * sy;
        let n = 0, minX = 1e9, maxX = -1, maxY = -1;
        for (let y = 0; y < c.height; y++) for (let x = 0; x < c.width; x++) {
          const k = (y * c.width + x) * 4;
          if (d[k] > 180 && d[k + 1] < 90 && d[k + 2] < 90) {
            if (x < L - 1 || x > R + 1 || y < T - 1 || y > B + 1) { n++; minX = Math.min(minX, x); maxX = Math.max(maxX, x); maxY = Math.max(maxY, y); }
          }
        }
        return { n, right_overhang_px: Math.max(0, Math.round((maxX - R) / sx)), bottom_overhang_px: Math.max(0, Math.round((maxY - B) / sy)) };
      }, { b64: png.toString("base64"), box, clip });
      if (outside.n > 0) problems.push({ text, ...outside });
      await page.reload({ waitUntil: "networkidle" });
      await page.waitForFunction(() => document.documentElement.classList.contains("is-ready"), null, { timeout: 15000 });
      await page.addStyleTag({ content: `[data-reveal],[data-reveal-stagger]>*{opacity:1!important;transform:none!important;filter:none!important;transition:none!important}` });
    }

    const layout = await page.evaluate(() => {
      const de = document.documentElement;
      const over = [];
      for (const el of document.querySelectorAll("h1,h2,h3,p,li,a,button,span")) {
        const r = el.getBoundingClientRect();
        if (!r.width || el.closest("[aria-hidden='true'],.intro")) continue;
        if (el.scrollWidth > el.clientWidth + 1 && getComputedStyle(el).overflow !== "visible") over.push(el.textContent.trim().slice(0, 40));
        if (r.right > de.clientWidth + 1) over.push("off-screen: " + el.textContent.trim().slice(0, 40));
      }
      return { sideways_scroll: de.scrollWidth > de.clientWidth, overflow: [...new Set(over)].slice(0, 6) };
    });

    const bad = problems.length || layout.sideways_scroll || layout.overflow.length;
    if (bad) failures++;
    console.log(`${bad ? "FAIL" : "ok  "} ${name.padEnd(8)} ${String(w).padStart(4)}px` +
      (problems.length ? `  clipped: ${JSON.stringify(problems)}` : "") +
      (layout.sideways_scroll ? "  SIDEWAYS-SCROLL" : "") +
      (layout.overflow.length ? `  overflow: ${JSON.stringify(layout.overflow)}` : ""));
    await page.close();
  }
  await browser.close();
}
console.log(failures ? `\n${failures} failing combinations` : "\nall clear");
process.exit(failures ? 1 : 0);
