---
name: website-clone
description: Rebuild a reference website as an original site that matches its look and behaviour 1:1 (layout, type scale, colours, animations, interactions, responsive states) using real-browser recon, measured styles, and side-by-side verification. Use when the user asks to clone, replicate, recreate or pixel-match a website's design with new copy, brand and assets.
license: MIT
---

# Website Clone (1:1 look and behaviour)

Rebuild a reference site as an **original** site: same look and behaviour, new text, brand, media and code.

## Gather inputs first
Ask for anything missing: reference URL, new brand name (or "pick one"), tagline/city/email (or placeholders), output stack (native HTML/CSS/JS, Astro, ...), viewports (default 1440x900 and 390x844), image/video/audio sources (e.g. Unsplash, Pexels, Mixkit, or the user's own assets), copy language.
Reply in the user's language. If the user says to work to completion without approval, skip the checkpoints below.

## Rules
- MATCH: site map, templates, section order, grid, spacing, font family/weight/size/line-height/tracking, colours, borders, radii, intro sequence and timing, hover/click/scroll/drag behaviour, page transitions, cursor, responsive behaviour, empty/error/modal/expanded states, single (detail) pages.
- KEEP ORIGINAL: all text (same length/tone/structure), logos (draw a new glyph), photos/video, partner/client names (fictional), and source code (write your own from measurements; never copy the reference's CSS/JS/shaders). Use the same font only if freely licensed, else the closest free alternative and say so.
- NEVER submit forms, sign up, log in, buy, or write anything on the reference site. Never use its name, domain or logo in the output. Be polite: sequential requests, short waits.
- Download assets locally and verify HTTP 200.

## Tooling
`scripts/` (Playwright + Pillow, read-only) holds the helpers; see `scripts/README.md`. Copy it into the project (e.g. `./clone-kit`), `npm install`, copy `clone.config.example.json` to `clone.config.json`. If unavailable, write equivalent playwright-core scripts. On Git Bash/Windows `export MSYS_NO_PATHCONV=1`.

## Phases
1. **Recon (read-only).** Site map from every `<a>` and nav `<button>` (use rendered DOM; client routes). Per page and viewport: load-sequence frames (~150 ms for 1 s, then ~400 ms to 7 s), dismiss cookie banner, full-page + scroll screenshots, rendered HTML, `document.fonts`, `getAnimations()`, canvas/WebGL/video/smooth-scroll library detection, computed-style type scale with positions, section boxes, CSS custom properties and `@font-face`. Slice full-page shots (~1800 px) and actually look at each one.
2. **Interaction probing (read-only).** Burst screenshots (4-12 frames, 100-400 ms) after each action: cursor, hover on every interactive element, clicks on nav/tabs/sliders/accordions/dropdowns/chips, drag/swipe, wheel/keys, mobile burger, theme toggle, video play, form focus/typing/validation (never submit). For canvas/WebGL, screenshot sequences to infer behaviour. If the site has sound, turn audio on and identify which elements trigger which sounds. Record trigger, change, timing/easing, end state.
3. **Spec.** Write `docs/RESEARCH.md`: site map, tokens, header/footer, per-section layout, measured sizes, type styles, interactions, load timeline, and anything not reproducible exactly. **Checkpoint 1:** show a short summary and wait (unless told to proceed autonomously).
4. **Build.** Shared chrome first (tokens, header, nav effects, cursor, footer, transitions), then home. Use measured numbers. Write effects yourself in vanilla JS/own shaders; respect `prefers-reduced-motion`. Keep copy in one data file.
5. **Verify loop.** For each page and viewport: screenshot reference and build with the same script, place side by side (reference left), list every difference, fix, repeat. Target: positions within ~8 px, identical type styles and interaction behaviour. Also check: no JS errors, no broken links/images, no horizontal overflow at 390 px, keyboard reachability. **Checkpoint 2:** after home passes, show comparisons and remaining gaps (unless autonomous), then build the remaining pages, detail pages, modals and states with the same loop.
6. **Delivery.** `docs/compare/` side-by-sides, README (run, structure, edit copy, placeholders), and a final message: what matches, what differs and why, what the user must still replace.

## Known traps
Headless captures mid-animation (wait longer or force reduced motion); `--disable-gpu` hides `-webkit-text-stroke`; `hidden` overridden by `display:grid` (add `[hidden]{display:none!important}`); z-index/stacking contexts hiding the header; state-class specificity; lazy images in full-page shots; cookie banners; client routes returning raw-HTML 404s.

## Lessons
Web-fetch summaries are not enough: use a real browser, screenshots and computed styles. Measure before building; one guessed font ruins fidelity. Compare per section, not per page. Chase the character of special effects (WebGL), not pixel perfection, and say so honestly.

More detail and a paste-ready prompt: `references/prompt-template.md`. Example request: `examples/example-request.txt`.
