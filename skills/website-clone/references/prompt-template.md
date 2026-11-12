# Prompt Master — Clone Website (fidelity 1:1)

## Cara pakai (baca dulu)
1. Salin semua isi blok **PROMPT** di bawah ke sesi Claude Code baru, di folder kosong untuk proyek itu.
2. Isi bagian `INPUT` (URL, nama brand pengganti, stack, dll.).
3. Agen akan berhenti di **2 checkpoint** (setelah riset, dan setelah homepage) untuk minta persetujuanmu.
4. Skrip bantu ada di `scripts/`: salin ke proyek baru, `npm install`, lalu isi `clone.config.json` (URL referensi, URL build-mu, daftar halaman). Tidak ada path yang perlu diubah di dalam skrip. Detail: `scripts/README.md`.

Prompt ditulis dalam bahasa Inggris karena instruksi teknis untuk agen lebih konsisten diikuti; agen tetap
akan menjawab dalam bahasa Indonesia (sudah diminta di dalam prompt).

---

## PROMPT

```text
You are rebuilding a reference website as an original site that matches it 1:1 in LOOK and BEHAVIOUR.
Reply to me in Indonesian. Work autonomously, but stop at the two checkpoints below.

=== INPUT ===
Reference URL: <https://example.com>
New brand name: <BRAND.>            (replaces the reference brand everywhere)
Brand tagline / city / email: <...>  (or "placeholder")
Output stack: <native HTML/CSS/JS | Astro | other>
Viewports to match: 1440x900 desktop, 390x844 mobile
Images: Unsplash (download, verify HTTP 200, store locally) | my own assets in <folder>
Language of the copy: <English/Indonesian>

=== WHAT "1:1" MEANS HERE (and what it does not) ===
MATCH EXACTLY: site map and page templates, section order, grid, spacing, sizes, font families/weights/
sizes/line-heights/letter-spacing, colours, borders, radii, the load/intro sequence and its timing, every
hover/click/scroll/drag interaction, page transitions, cursor, responsive behaviour, empty/error states.
KEEP ORIGINAL (never copy): all text (write new copy with the same length, tone and structure), logos and
brand marks (draw a new simple glyph), photos/videos (Unsplash or mine), client/partner names (invent
fictional ones), and source code (write your own HTML/CSS/JS/shaders from the measurements — do not copy
the reference's CSS, JS bundles or shaders). Fonts: use the same family only if it is freely licensed
(e.g. Google Fonts); otherwise use the closest free alternative and tell me.
NEVER: submit forms, sign up, log in, add to cart, or trigger any write on the reference site; use the
reference's name, domain or logo in the output; hammer the server (sequential requests, short waits).

=== PHASE 1 — RECON (read-only) ===
Tooling: if ./scripts exists, use it (fill scripts/clone.config.json, then recon.mjs, styles.mjs,
interact.mjs, shoot.mjs, audit.mjs, side.py, montage.py — see its README). Otherwise write equivalent
Playwright (playwright-core + the installed Chrome/Edge) scripts. Python + Pillow for montages.
On Git Bash/Windows set MSYS_NO_PATHCONV=1 before passing "/" paths.
1. Site map: load the home page, collect every <a href> AND every nav <button> (click each, record the
   resulting URL). Note client-rendered routes (raw HTML may be empty — always use the rendered DOM).
2. For EVERY page, at BOTH viewports:
   a. Load sequence: screenshot every ~150 ms for the first 1 s, then every ~400 ms until 7 s.
   b. Accept/close the cookie banner (do not let it cover screenshots), wait for networkidle.
   c. Full-page screenshot + viewport screenshots while scrolling (smooth-scroll libs make step frames
      unreliable — rely on the full-page shot for layout, scroll frames for motion).
   d. Rendered HTML, document.fonts (loaded families/weights), document.getAnimations(), detection of
      canvas/WebGL (e.g. data-engine="three.js"), <video>, smooth-scroll/animation libraries.
   e. Computed styles of every visible text node grouped by (font-family, size, weight, line-height,
      letter-spacing, colour, text-transform) with one sample text and its x/y/width — this is the type
      scale. Plus section boxes (y, height, background).
   f. Design tokens: download the site's CSS and grep custom properties (--color-*, --font-*, --tracking-*,
      --ease-*, --radius-*) and @font-face rules.
3. Slice full-page shots into ~1800 px segments and LOOK at every one; build montages to compare frames.

=== PHASE 2 — INTERACTION PROBING (read-only) ===
With burst screenshots (4–12 frames, 100–400 ms apart) after each action, probe on every page:
- cursor movement (custom cursor?), hover on every nav item, button, card, list row, image, footer link;
- click every nav item, tab, slider arrow, accordion, dropdown, chip, "next" link (record URL changes and
  transitions, e.g. colour morphs between pages); drag/swipe on sliders and heroes; wheel and arrow keys;
- mobile: burger menu open/close, any mobile-only controls; theme toggle; video play buttons;
- form fields: focus, typing, validation styling — but NEVER press submit.
Note for each interaction: trigger, what changes, timing/easing, and the end state.

=== PHASE 3 — SPEC (then CHECKPOINT 1) ===
Write docs/RESEARCH.md: site map; global tokens (fonts, tracking, colours, easing); header/footer specs;
per page and per section: layout, measured sizes/positions, type styles, interactions, load timeline.
Then STOP and show me a short summary (pages found, fonts, key effects, anything you cannot reproduce
exactly, e.g. a proprietary shader or video) and wait for my go.

=== PHASE 4 — BUILD ===
- Shared chrome first (tokens, header, nav hover effects, cursor, footer, page transitions), then the HOME
  page only. Use the measured numbers, not "close enough" values.
- Write effects yourself: WebGL backgrounds as your own shader tuned until the look matches; scramble/
  typewriter text, marquees, parallax, custom cursor, smooth scroll in vanilla JS; respect
  prefers-reduced-motion.
- Keep copy in one place (a small generator or data file) so pages stay consistent.

=== PHASE 5 — VERIFY LOOP (repeat until matched) ===
For each page and viewport: screenshot yours and the reference with the SAME script and settings, place
them side by side (reference left), list every visible difference (position, size, weight, colour,
spacing, missing element, behaviour), fix, re-shoot. Target: positions within ~8 px, identical type
styles, identical interaction behaviour. Also run automated checks: no JS errors, no broken links or
images, no horizontal overflow at 390 px, all interactions reachable by keyboard where relevant.
Known traps: headless captures mid-animation (wait longer or force reduced motion); --disable-gpu hides
-webkit-text-stroke; `hidden` is overridden by display:grid (add [hidden]{display:none!important});
overlay z-index/stacking contexts hiding the header; CSS specificity of state classes; lazy images in
full-page shots; cookie banners; client-side routes returning raw-HTML 404s.

CHECKPOINT 2: after the home page passes, show me the side-by-side images and the remaining gaps, and
wait for my go before building the other pages. Then build the rest with the same loop.

=== PHASE 6 — DELIVERY ===
- docs/compare/: side-by-side images per page (desktop + mobile).
- README: how to run, structure, how to edit copy, what is placeholder.
- Final message: what matches 1:1, what differs and why (e.g. own shader, no video source, licensed font
  replaced), and what I still need to replace (brand, email, address, client names).
```

---

## Catatan dari proyek VOXA. (pelajaran yang sudah terbukti)
- Ringkasan teks dari web fetch **tidak cukup**: selalu riset dengan browser sungguhan + screenshot + computed style.
- Ukur dulu, baru bangun. Satu angka yang ditebak (mis. font Krona One vs DM Mono) membuat hasil "jauh".
- Bandingkan berdampingan **per section**, jangan per halaman sekaligus.
- Efek khusus (WebGL fluid) dikejar karakternya, bukan pixel-perfect — sebutkan ini jujur ke klien.
- Jangan pernah klik submit/beli di situs referensi; probing interaksi cukup hover/focus/typing.
