// RECON — read-only study of the reference site, per page and viewport:
// load-sequence frames, full-page shot, scroll frames, rendered HTML, fonts, animations, links.
// Usage: node recon.mjs [path ...] [--vp 1440x900] [--target ref|local]
// Output: <out>/recon/<target>/<page>-<w>/
import { writeFileSync } from "node:fs";
import { config, launch, pages, viewports, urlOf, tagOf, outDir, acceptCookies, flag } from "./config.mjs";

const target = flag("--target") ?? "ref";
const browser = await launch();
for (const path of pages()) {
  for (const [w, h] of viewports()) {
    const dir = outDir("recon", target, `${tagOf(path)}-${w}`);
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, isMobile: w < 768, hasTouch: w < 768 });
    const page = await ctx.newPage();
    const url = urlOf(target, path);

    // 1. load sequence: ~150 ms frames for the first second, then ~400 ms up to ~7 s
    const t0 = Date.now();
    page.goto(url, { waitUntil: "commit", timeout: 60000 }).catch(() => {});
    for (let i = 0; i < 14; i++) {
      await page.waitForTimeout(i < 6 ? 150 : 400);
      try { await page.screenshot({ path: `${dir}/load-${String(i).padStart(2, "0")}-${Date.now() - t0}ms.png` }); } catch {}
    }
    await page.waitForLoadState("networkidle", { timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(1500);
    await acceptCookies(page);

    // 2. what the page is made of
    const info = await page.evaluate(() => ({
      title: document.title,
      height: document.documentElement.scrollHeight,
      links: [...document.querySelectorAll("a[href]")].map((a) => ({ text: a.innerText.trim().slice(0, 50), href: a.getAttribute("href") })),
      navButtons: [...document.querySelectorAll("header button, nav button")].map((b) => b.innerText.trim().slice(0, 40)).filter(Boolean),
      fonts: [...new Set([...document.fonts].filter((f) => f.status === "loaded").map((f) => `${f.family} ${f.weight} ${f.style}`))],
      animations: document.getAnimations().map((a) => ({ name: a.animationName || a.constructor.name, target: a.effect?.target?.className?.toString().slice(0, 80), duration: a.effect?.getTiming().duration })).slice(0, 60),
      canvas: [...document.querySelectorAll("canvas")].map((c) => ({ engine: c.getAttribute("data-engine"), w: c.width, h: c.height })),
      videos: [...document.querySelectorAll("video")].map((v) => v.currentSrc || v.querySelector("source")?.src || ""),
      libraries: Object.keys(window).filter((k) => /^(gsap|ScrollTrigger|Lenis|lenis|THREE|Swiper|barba|locomotive|anime|Splitting)$/i.test(k)),
    }));
    writeFileSync(`${dir}/info.json`, JSON.stringify(info, null, 2));
    writeFileSync(`${dir}/rendered.html`, await page.content());

    // 3. full page (layout) + scroll frames (motion)
    await page.screenshot({ path: `${dir}/full.png`, fullPage: true });
    const steps = Math.ceil(info.height / h);
    for (let i = 0; i <= steps; i++) {
      await page.mouse.wheel(0, h * 0.9);
      await page.waitForTimeout(900);
      await page.screenshot({ path: `${dir}/scroll-${String(i).padStart(2, "0")}.png` });
    }
    console.log(`${target} ${path} @${w}: h=${info.height} fonts=${info.fonts.length} anims=${info.animations.length} canvas=${info.canvas.length} libs=${info.libraries.join(",") || "-"} → ${dir}`);
    await ctx.close();
  }
}
await browser.close();
