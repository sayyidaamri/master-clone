# website-clone

An agent skill that rebuilds a reference website as an **original** site matching its look and behaviour 1:1: real-browser recon, measured type scale and tokens, interaction probing, and side-by-side verification. Text, brand, media and code are always new.

It uses the open Agent Skills format (`SKILL.md` with frontmatter), so it works in Claude Code and in any tool that reads `SKILL.md` or `AGENTS.md`.

## Layout
```
.claude-plugin/plugin.json       Claude Code plugin manifest
skills/website-clone/
  SKILL.md                       the skill (workflow, rules, phases)
  references/prompt-template.md  paste-ready prompt for tools without skill support
  examples/example-request.txt   sample request
  scripts/                       Playwright/Pillow helpers (recon, styles, interact, shoot, audit, side, montage, slice)
```

## Install
- **Claude Code:** copy `skills/website-clone` to `~/.claude/skills/`, or publish this repo as a plugin marketplace entry.
- **Other tools (Codex, Cursor, Gemini CLI, etc.):** copy `skills/website-clone` to the tool's skills folder, or paste `references/prompt-template.md` into the chat / rules file.

## Requirements
Node 18+, Chrome or Edge, Python 3 + Pillow. See `skills/website-clone/scripts/README.md`.

## Use responsibly
Only clone designs you have the right to reference. The skill never copies text, logos, media or source code, and never submits forms on the reference site.

## License
MIT
