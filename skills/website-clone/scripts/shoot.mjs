// SHOOT — identical screenshots of the reference and/or your build, for side-by-side comparison.
// Scrolls through first (lazy images, reveal-on-scroll), then takes the first viewport and the full page.
// Usage: node shoot.mjs [path ...] [--vp 1440x900] [--target ref|local|both] [--reduced]
//   --reduced  forces prefers-reduced-motion (stable frames, no mid-animation captures)
// Output: <out>/shots/<target>/<page>-<w>-top.png and -full.png
// Then:   python side.py <ref-full.png> <local-full.png> <out-prefix>
import { launch, pages, viewports, urlOf, tagOf, outDir, acceptCookies, flag, config } from "./config.mjs";

const which = flag("--target") ?? "both";
const targets = which === "both" ? ["ref", "local"] : [which];
const reduced = process.argv.includes("--reduced");
const browser = await launch();
for (const target of targets) {
  const dir = outDir("shots", target);
  for (const path of pages()) {
    for (const [w, h] of viewports()) {
      const ctx = await browser.newContext({ viewport: { width: w, height: h }, isMobile: w < 768, hasTouch: w < 768, reducedMotion: reduced ? "reduce" : "no-preference" });
      const page = await ctx.newPage();
      const errors = []; page.on("pageerror", (e) => errors.push(e.message));
      await page.goto(urlOf(target, path), { waitUntil: "load", timeout: 60000 });
      await page.waitForTimeout(config.settle);
      await acceptCookies(page);
      const name = `${dir}/${tagOf(path)}-${w}`;
      await page.screenshot({ path: `${name}-top.png` });
      const total = await page.evaluate(() => document.documentElement.scrollHeight);
      for (let y = 0; y < total; y += Math.round(h / 2)) { await page.evaluate((y) => scrollTo(0, y), y); await page.waitForTimeout(150); }
      // force reveal-on-scroll elements visible for the layout shot (common class names)
      await page.evaluate(() => { document.querySelectorAll("[data-reveal], .reveal, [data-aos]").forEach((e) => e.classList.add("is-in", "is-visible", "aos-animate")); scrollTo(0, 0); });
      await page.waitForTimeout(1200);
      await page.screenshot({ path: `${name}-full.png`, fullPage: true });
      console.log(`${target} ${path} @${w}: h=${total}${errors.length ? "  JS errors: " + errors.length : ""} → ${name}-*.png`);
      await ctx.close();
    }
  }
}
await browser.close();
