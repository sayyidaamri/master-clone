// STYLES — the type scale and section boxes of each page: computed style of every visible text node,
// grouped by (family, size, weight, line-height, letter-spacing, colour, transform), plus section boxes.
// Usage: node styles.mjs [path ...] [--vp 1440x900] [--target ref|local]
// Output: <out>/styles/<target>/<page>-<w>.json  and a printed summary.
import { writeFileSync } from "node:fs";
import { launch, pages, viewports, urlOf, tagOf, outDir, acceptCookies, flag, config } from "./config.mjs";

const target = flag("--target") ?? "ref";
const dir = outDir("styles", target);
const browser = await launch();
for (const path of pages()) {
  for (const [w, h] of viewports()) {
    const page = await browser.newPage({ viewport: { width: w, height: h } });
    await page.goto(urlOf(target, path), { waitUntil: "load", timeout: 60000 });
    await page.waitForTimeout(config.settle);
    await acceptCookies(page);
    // scroll through so lazy / revealed content is rendered
    const total = await page.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < total; y += 400) { await page.evaluate((y) => scrollTo(0, y), y); await page.waitForTimeout(120); }
    await page.evaluate(() => scrollTo(0, 0)); await page.waitForTimeout(800);

    const data = await page.evaluate(() => {
      const texts = [], seen = new Set();
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      while (walker.nextNode()) {
        const t = walker.currentNode.textContent.trim(); if (t.length < 2) continue;
        const el = walker.currentNode.parentElement; if (seen.has(el)) continue; seen.add(el);
        const cs = getComputedStyle(el), r = el.getBoundingClientRect(); if (!r.width) continue;
        texts.push({ text: t.slice(0, 50), tag: el.tagName.toLowerCase(), ff: cs.fontFamily.split(",")[0].replace(/"/g, ""), fs: cs.fontSize, fw: cs.fontWeight, lh: cs.lineHeight, ls: cs.letterSpacing, color: cs.color, tt: cs.textTransform, x: Math.round(r.left), y: Math.round(r.top + scrollY), w: Math.round(r.width) });
      }
      const sections = [...document.querySelectorAll("header, main > *, section, footer")].slice(0, 80).map((s) => {
        const cs = getComputedStyle(s), r = s.getBoundingClientRect();
        return { tag: s.tagName.toLowerCase(), cls: (s.className?.toString() || "").slice(0, 120), y: Math.round(r.top + scrollY), h: Math.round(r.height), bg: cs.backgroundColor, pad: cs.padding };
      });
      return { bodyBg: getComputedStyle(document.body).backgroundColor, texts, sections };
    });
    const file = `${dir}/${tagOf(path)}-${w}.json`;
    writeFileSync(file, JSON.stringify(data, null, 1));

    const groups = new Map();
    for (const t of data.texts) { const k = [t.ff, t.fs, t.fw, t.lh, t.ls, t.color, t.tt].join(" | "); if (!groups.has(k)) groups.set(k, []); groups.get(k).push(t); }
    console.log(`\n=== ${target} ${path} @${w}  (body ${data.bodyBg})`);
    for (const [k, v] of groups) console.log(`${k}  x${v.length}  e.g. "${v[0].text.slice(0, 30)}" @${v[0].x},${v[0].y} w${v[0].w}`);
    await page.close();
  }
}
await browser.close();
