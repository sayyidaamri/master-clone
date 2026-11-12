// Shared config for every clone-kit script.
// Reads clone.config.json from the current folder (or the file named by --config <path> / CLONE_CONFIG),
// then lets environment variables override it. Nothing project-specific is hard-coded here.
import { existsSync, readFileSync, mkdirSync } from "node:fs";
import { resolve, join } from "node:path";
import { platform } from "node:os";

function argValue(name) {
  const i = process.argv.indexOf(name);
  return i > -1 ? process.argv[i + 1] : undefined;
}

const configPath = resolve(argValue("--config") ?? process.env.CLONE_CONFIG ?? "clone.config.json");
const file = existsSync(configPath) ? JSON.parse(readFileSync(configPath, "utf8")) : {};

const BROWSER_CANDIDATES = {
  win32: [
    "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
    "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
    "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
    `${process.env.LOCALAPPDATA ?? ""}/Google/Chrome/Application/chrome.exe`,
  ],
  darwin: [
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
  ],
  linux: ["/usr/bin/google-chrome", "/usr/bin/google-chrome-stable", "/usr/bin/chromium", "/usr/bin/chromium-browser", "/usr/bin/microsoft-edge"],
};

function detectBrowser() {
  const given = process.env.CLONE_BROWSER ?? file.browser;
  if (given) {
    if (!existsSync(given)) throw new Error(`browser not found at "${given}" (set "browser" in clone.config.json or CLONE_BROWSER)`);
    return given;
  }
  const found = (BROWSER_CANDIDATES[platform()] ?? []).find((p) => p && existsSync(p));
  if (!found) throw new Error(`no Chrome/Edge found — set "browser" in clone.config.json or CLONE_BROWSER to its executable path`);
  return found;
}

const trimSlash = (u) => (u ? String(u).replace(/\/+$/, "") : u);

export const config = {
  configPath,
  browser: detectBrowser(),
  /** The site being studied, e.g. "https://example.com". */
  reference: trimSlash(process.env.CLONE_REF ?? file.reference),
  /** Your build: "http://localhost:4321" or "file:///C:/path/to/site" (no trailing slash). */
  local: trimSlash(process.env.CLONE_LOCAL ?? file.local),
  /** Paths to visit, e.g. ["/", "/about"]. For a file:// build use file names, e.g. ["/index.html"]. */
  pages: file.pages ?? ["/"],
  /** Optional map reference path → local path when they differ, e.g. { "/": "/index.html" }. */
  localPaths: file.localPaths ?? {},
  /** [[width, height], ...] */
  viewports: file.viewports ?? [[1440, 900], [390, 844]],
  /** Where screenshots / JSON go (relative to the current folder). */
  out: resolve(process.env.CLONE_OUT ?? file.out ?? "clone-output"),
  /** ms to wait after load before measuring (intros, fonts, WebGL). */
  settle: file.settleMs ?? 5000,
  /** Text of the cookie-banner button to click before shooting (regex source, case-insensitive). */
  cookieButton: file.cookieButton ?? "accept all|accept|agree|allow all|ok, got it",
};

export function need(key) {
  if (!config[key]) throw new Error(`"${key}" is not set — add it to ${config.configPath} (see clone.config.example.json)`);
  return config[key];
}

/** Make (and return) a folder under the output dir. */
export function outDir(...parts) {
  const dir = join(config.out, ...parts);
  mkdirSync(dir, { recursive: true });
  return dir;
}

/** "/pillars/think" → "pillars_think", "/" → "home". */
export const tagOf = (path) => (path === "/" || path === "" ? "home" : path.replace(/^\/+|\/+$/g, "").replace(/[^\w.-]+/g, "_").slice(0, 60) || "home");

/** URL of a page on the reference or on your build. */
export function urlOf(target, path) {
  if (target === "ref") return need("reference") + path;
  const p = config.localPaths[path] ?? path;
  return need("local") + p;
}

/** CLI helpers: positional args (anything not starting with "--" and not a flag value). */
export function positional() {
  const out = [];
  for (let i = 2; i < process.argv.length; i++) {
    const a = process.argv[i];
    if (a.startsWith("--")) { i++; continue; }
    out.push(a);
  }
  return out;
}
export const flag = argValue;

/** Launch the configured browser (file:// access allowed for local builds). */
export async function launch() {
  const { chromium } = await import("playwright-core");
  return chromium.launch({ executablePath: config.browser, args: ["--allow-file-access-from-files"] });
}

/** Click the cookie banner's accept button if one is visible. */
export async function acceptCookies(page) {
  try {
    const btn = page.getByRole("button", { name: new RegExp(config.cookieButton, "i") }).first();
    if (await btn.isVisible({ timeout: 500 })) { await btn.click(); await page.waitForTimeout(500); }
  } catch { /* none */ }
}

/** Selected viewports: --vp 1440x900 picks one; default all from config. */
export function viewports() {
  const v = flag("--vp");
  if (!v) return config.viewports;
  const [w, h] = v.split("x").map(Number);
  return [[w, h]];
}

/** Selected pages: positional args, else config.pages. */
export function pages() {
  const p = positional();
  return p.length ? p : config.pages;
}
