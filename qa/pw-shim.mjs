// Wraps puppeteer-core (driving the installed Firefox over WebDriver BiDi) in just enough of
// Playwright's API for the QA scripts to run unchanged against real Firefox.
import puppeteer from "puppeteer-core";

const FIREFOX = process.env.FIREFOX_PATH || "C:\\Program Files\\Mozilla Firefox\\firefox.exe";

function wrapEl(el) {
  return {
    boundingBox: () => el.boundingBox(),
    innerText: () => el.evaluate((n) => n.innerText),
    evaluate: (fn, arg) => el.evaluate(fn, arg),
    scrollIntoViewIfNeeded: () => el.evaluate((n) => n.scrollIntoView({ block: "center" })),
  };
}

function wrapPage(p) {
  const ready = (o = {}) => ({ waitUntil: o.waitUntil === "networkidle" ? "networkidle0" : o.waitUntil || "load", timeout: 60000 });
  return {
    raw: p,
    goto: (u, o) => p.goto(u, ready(o)),
    reload: (o) => p.reload(ready(o)),
    waitForFunction: (fn, arg, o) => p.waitForFunction(fn, { timeout: o?.timeout ?? 30000 }, arg),
    waitForTimeout: (ms) => new Promise((r) => setTimeout(r, ms)),
    addStyleTag: (o) => p.addStyleTag(o),
    evaluate: (fn, arg) => p.evaluate(fn, arg),
    $$eval: (sel, fn) => p.$$eval(sel, fn),
    $$: async (sel) => (await p.$$(sel)).map(wrapEl),
    screenshot: async (o) => Buffer.from(await p.screenshot({ ...o, encoding: "binary" })),
    on: (ev, fn) => p.on(ev, fn),
    close: () => p.close(),
  };
}

export const firefox = {
  async launch() {
    const b = await puppeteer.launch({ browser: "firefox", executablePath: FIREFOX, headless: true, protocolTimeout: 180000 });
    return {
      async newPage({ viewport } = {}) {
        const p = await b.newPage();
        if (viewport) await p.setViewport(viewport);
        return wrapPage(p);
      },
      close: () => b.close(),
    };
  },
};
