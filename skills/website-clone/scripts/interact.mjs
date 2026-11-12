// INTERACT — generic read-only interaction probe with burst screenshots.
// Hovers every visible link/button in the header, nav and main content (capped), clicks each header/nav
// link and records where it goes, then tries wheel + arrow keys, and on mobile the burger menu.
// It NEVER submits forms or clicks anything that looks like submit/buy/sign-up/login/delete.
// Usage: node interact.mjs [path ...] [--vp 1440x900] [--target ref|local] [--max 25]
// Output: <out>/interact/<target>/<page>-<w>/  (+ log.json)
import { writeFileSync } from "node:fs";
import { launch, pages, viewports, urlOf, tagOf, outDir, acceptCookies, flag, config } from "./config.mjs";

const target = flag("--target") ?? "ref";
const MAX = Number(flag("--max") ?? 25);
const UNSAFE = /submit|send|buy|checkout|pay|order|sign ?up|register|log ?in|sign ?in|subscribe|delete|remove|apply now|book now|kirim|daftar|masuk|beli|bayar/i;

const browser = await launch();
for (const path of pages()) {
  for (const [w, h] of viewports()) {
    const dir = outDir("interact", target, `${tagOf(path)}-${w}`);
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, isMobile: w < 768, hasTouch: w < 768 });
    const page = await ctx.newPage();
    const log = [];
    const shot = (n) => page.screenshot({ path: `${dir}/${n}.png` }).catch(() => {});
    const burst = async (name, n = 4, gap = 200) => { for (let i = 0; i < n; i++) { await shot(`${name}-${i}`); await page.waitForTimeout(gap); } };
    const open = async () => { await page.goto(urlOf(target, path), { waitUntil: "load", timeout: 60000 }); await page.waitForTimeout(config.settle); await acceptCookies(page); };

    await open();
    await shot("00-idle");

    // custom cursor
    await page.mouse.move(w * 0.2, h * 0.3); await page.mouse.move(w * 0.5, h * 0.5, { steps: 20 }); await burst("cursor", 3, 100);

    // hover candidates: visible links/buttons, header first, safe labels only
    const targets = await page.evaluate((max) => {
      const els = [...document.querySelectorAll("header a, header button, nav a, nav button, main a, main button, [role=button], [class*=card], li a")];
      const seen = new Set(), out = [];
      for (const el of els) {
        const r = el.getBoundingClientRect();
        if (!r.width || !r.height || r.top < 0 || r.top > innerHeight * 3) continue;
        const key = Math.round(r.left) + ":" + Math.round(r.top + scrollY); if (seen.has(key)) continue; seen.add(key);
        out.push({ x: r.left + r.width / 2, y: r.top + scrollY + r.height / 2, label: (el.innerText || el.getAttribute("aria-label") || el.tagName).trim().slice(0, 40), inHeader: !!el.closest("header, nav"), href: el.getAttribute("href") });
        if (out.length >= max) break;
      }
      return out;
    }, MAX);

    for (const [i, t] of targets.entries()) {
      await page.evaluate((y) => scrollTo(0, Math.max(0, y - innerHeight / 2)), t.y);
      await page.waitForTimeout(500);
      const sy = await page.evaluate(() => scrollY);
      await page.mouse.move(t.x, t.y - sy, { steps: 8 });
      await burst(`hover-${String(i).padStart(2, "0")}`, 3, 250);
      log.push({ action: "hover", label: t.label });
    }

    // wheel + keys (does scroll move content? scroll-jacking? slide changes?)
    await page.evaluate(() => scrollTo(0, 0)); await page.mouse.move(w / 2, h / 2);
    await page.mouse.wheel(0, h * 0.7); await burst("wheel", 6, 250);
    await page.keyboard.press("ArrowDown"); await burst("key-down", 4, 250);
    log.push({ action: "wheel/keys", scrollY: await page.evaluate(() => scrollY) });

    // mobile menu
    if (w < 768) {
      await open();
      const burger = page.locator("button[aria-label*=menu i], button[aria-controls*=menu i], .burger, .hamburger, [class*=menu-toggle]").first();
      if (await burger.count()) { await burger.click().catch(() => {}); await burst("menu", 5, 250); log.push({ action: "burger" }); }
    }

    // click header/nav links one by one (fresh load each time), record destination + transition
    const navTargets = targets.filter((t) => t.inHeader && !UNSAFE.test(t.label)).slice(0, 10);
    for (const [i, t] of navTargets.entries()) {
      await open();
      await page.mouse.click(t.x, t.y).catch(() => {});
      await burst(`click-${String(i).padStart(2, "0")}`, 8, 250);
      log.push({ action: "click", label: t.label, href: t.href, landed: page.url() });
    }

    writeFileSync(`${dir}/log.json`, JSON.stringify(log, null, 2));
    console.log(`${target} ${path} @${w}: ${targets.length} hovers, ${navTargets.length} clicks → ${dir}`);
    await ctx.close();
  }
}
await browser.close();
