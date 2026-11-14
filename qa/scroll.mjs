// Frame pacing while a real (trusted) mouse wheel scrolls the whole page, on a slowed CPU.
import { chromium } from "playwright";
const CPU = Number(process.env.CPU || 6);
const b = await chromium.launch({ args: ["--use-angle=d3d11", "--enable-gpu", "--ignore-gpu-blocklist"] });
const ctx = await b.newContext({ viewport: { width: 1366, height: 768 } });
const p = await ctx.newPage();
await p.goto("http://localhost:5190/", { waitUntil: "networkidle" });
await p.waitForFunction(() => document.documentElement.classList.contains("is-ready"));
await p.waitForTimeout(2500);
const cdp = await ctx.newCDPSession(p);
await cdp.send("Emulation.setCPUThrottlingRate", { rate: CPU });
await p.evaluate(() => { const q = (window.__f = []); let l = performance.now(); requestAnimationFrame(function f(t) { q.push(t - l); l = t; requestAnimationFrame(f); }); });
await p.mouse.move(683, 400);
for (let i = 0; i < 60; i++) { await p.mouse.wheel(0, 100); await p.waitForTimeout(60); }
await p.waitForTimeout(800);
const f = (await p.evaluate(() => window.__f)).slice(3).sort((a, b) => a - b);
const y = await p.evaluate(() => scrollY);
console.log(JSON.stringify({ cpu: CPU + "x", scrolled_px: Math.round(y), frames: f.length, median: +f[f.length >> 1].toFixed(1), p95: +f[Math.floor(f.length * 0.95)].toFixed(1), worst: +f[f.length - 1].toFixed(1), over_50ms: f.filter((d) => d > 50).length }));
await b.close();
