// Load smoothness on a simulated low-end device: CPU slowed down, slow 4G network.
// Records every main-thread long task and every frame from navigation until the page
// has been revealed for a few seconds, so choppy loading shows up as numbers.
import { chromium } from "playwright";

const URL = process.env.URL || "http://localhost:5190/";
const CPU = Number(process.env.CPU || 6);
const RUNS = Number(process.env.RUNS || 2);
const MOBILE = process.env.MOBILE === "1";

const GPU = process.env.GPU !== "0";
const browser = await chromium.launch({ args: GPU ? ["--use-angle=d3d11", "--enable-gpu", "--ignore-gpu-blocklist"] : [] });
const results = [];
for (let run = 0; run < RUNS; run++) {
  const ctx = await browser.newContext(MOBILE
    ? { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true }
    : { viewport: { width: 1366, height: 768 } });
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);
  await cdp.send("Network.enable");
  await cdp.send("Network.emulateNetworkConditions", {
    offline: false, latency: 150, downloadThroughput: (4 * 1024 * 1024) / 8, uploadThroughput: (1024 * 1024) / 8,
  });
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: CPU });

  await page.addInitScript(() => {
    const q = (window.__qa = { long: [], frames: [], readyAt: 0, t0: performance.now() });
    new PerformanceObserver((l) => {
      for (const e of l.getEntries()) q.long.push({ at: Math.round(e.startTime), ms: Math.round(e.duration) });
    }).observe({ type: "longtask", buffered: true });
    let last = performance.now();
    requestAnimationFrame(function f(t) {
      q.frames.push([Math.round(t), +(t - last).toFixed(1)]); last = t;
      if (!q.readyAt && document.documentElement?.classList.contains("is-ready")) q.readyAt = Math.round(t);
      requestAnimationFrame(f);
    });
  });

  await page.goto(URL, { waitUntil: "commit" });
  await page.waitForFunction(() => document.documentElement.classList.contains("is-ready"), null, { timeout: 60000, polling: 250 });
  await page.waitForTimeout(300);
  await page.waitForTimeout(4500);
  const q = await page.evaluate(() => window.__qa);
  const glb = await page.evaluate(() => {
    const e = performance.getEntriesByType("resource").find((r) => r.name.includes(".glb"));
    return e ? { done_ms: Math.round(e.responseEnd), kb: Math.round(e.transferSize / 1024) } : null;
  });

  const window_ = (a, b) => q.frames.filter(([t]) => t >= a && t < b).map(([, d]) => d);
  const stat = (f) => {
    if (!f.length) return {};
    const s = [...f].sort((x, y) => x - y);
    return { frames: f.length, p95: s[Math.floor(s.length * 0.95)], worst: s[s.length - 1], hitches_over_50ms: f.filter((d) => d > 50).length };
  };
  results.push({
    run,
    ready_ms: q.readyAt,
    model: glb,
    long_tasks: { count: q.long.length, total_ms: q.long.reduce((a, b) => a + b.ms, 0), worst_ms: Math.max(0, ...q.long.map((l) => l.ms)), list: q.long.filter((l) => l.ms > 80) },
    intro_frames: stat(window_(300, q.readyAt)),
    reveal_frames: stat(window_(q.readyAt, q.readyAt + 4000)),
  });
  await ctx.close();
}
await browser.close();
console.log(JSON.stringify({ gpu: GPU ? "hardware" : "software (no GPU)", cpu_slowdown: CPU + "x", mobile: MOBILE, results }, null, 1));
