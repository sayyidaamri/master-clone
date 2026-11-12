// AUDIT — health check of YOUR build (the "local" target): JS errors, failed requests,
// broken internal links and images, horizontal overflow — at every configured viewport.
// Usage: node audit.mjs [path ...] [--vp 390x844]
// Exit code 1 when any page has an issue (handy in CI).
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { launch, pages, viewports, urlOf, config, need } from "./config.mjs";

need("local");
const isFile = config.local.startsWith("file:");
const browser = await launch();
let bad = 0;
for (const [w, h] of viewports()) {
  const page = await browser.newPage({ viewport: { width: w, height: h }, isMobile: w < 768, hasTouch: w < 768 });
  for (const path of pages()) {
    const errors = [], failed = [];
    const onErr = (e) => errors.push(e.message.slice(0, 120));
    const onRes = (r) => { if (r.status() >= 400) failed.push(`${r.status()} ${r.url().slice(0, 100)}`); };
    page.on("pageerror", onErr); page.on("response", onRes);
    await page.goto(urlOf("local", path), { waitUntil: "load", timeout: 60000 });
    await page.waitForTimeout(2000);
    const info = await page.evaluate(() => ({
      links: [...document.querySelectorAll("a[href]")].map((a) => a.href),
      brokenImgs: [...document.images].filter((i) => i.complete && i.naturalWidth === 0 && i.src).map((i) => i.src.slice(0, 100)),
      overflow: document.documentElement.scrollWidth > innerWidth + 1,
    }));
    // file:// builds: check internal link targets exist on disk (servers report 404s via `failed` instead)
    const missing = isFile
      ? [...new Set(info.links.filter((u) => u.startsWith("file:")).map((u) => u.replace(/[?#].*$/, "")))].filter((u) => !existsSync(fileURLToPath(u)))
      : [];
    page.off("pageerror", onErr); page.off("response", onRes);
    const issues = errors.length + failed.length + missing.length + info.brokenImgs.length + (info.overflow ? 1 : 0);
    if (issues) bad++;
    console.log(`${String(w).padEnd(5)} ${path.padEnd(40)} js:${errors.length} failed:${failed.length} missing:${missing.length} imgs:${info.brokenImgs.length} overflow:${info.overflow}` +
      (issues ? "\n      " + [...errors, ...failed, ...missing, ...info.brokenImgs].slice(0, 4).join("\n      ") : ""));
  }
  await page.close();
}
console.log(bad ? `\n${bad} page/viewport combination(s) with issues` : "\nALL CLEAN");
await browser.close();
process.exit(bad ? 1 : 0);
