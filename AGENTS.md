# Project rules for Codex

This repository is both a reusable animation skill and a minimal Remotion host for the included bridge example.

## Start here

- For a new animated short or a change to the bridge look, read `.agents/skills/cartoon-3d-short/SKILL.md` first.
- Treat the root `SKILL.md` as the original technical record. The project-scoped Codex skill overrides its Claude-specific tool, model, memory, and delivery instructions.
- Read `references/STYLE_BIBLE.md` and only the topic reports needed for the current change.

## Boundaries

- Keep stories, scripts, characters, voices, and shot designs original.
- The reference frames and sheets are for local style study. Do not upload, publish, or send them to external services.
- Do not edit `references/` unless the user explicitly asks to update the research material.
- Keep the default video free of captions and labels unless the user asks for them. Voice-over is English and uses one steady narrator.
- Preserve the visual contracts between `story.ts`, `world.ts`, `cast.ts`, `lights.ts`, `ink.ts`, `lensblur.ts`, and `Bridge.tsx`.
- Do not silently substitute missing Kenney models. Run the asset check and report missing files.
- Do not spawn sub-agents unless the user explicitly requests delegation or parallel agent work.

## Working layout

- `templates/bridge/`: canonical visual implementation.
- `templates/audio/`: canonical synthesized audio implementation.
- `templates/scripts/`: reusable render and QA helpers.
- `src/`: minimal Remotion host for previewing the canonical bridge template.
- `work/<slug>/`: per-short script, voice, timing, and copied audio sources; ignored by Git.
- `out/<slug>/`: stills, renders, QA reports, and final deliverables; ignored by Git.

For a new short, copy `templates/bridge/` to `src/videos/<slug>/` and copy `templates/audio/` to `work/<slug>/audio/`. Put `voice.wav` and `words.json` in `work/<slug>/voice/`. Register the new composition in `src/Root.tsx` or a project-specific root.

## Required checks

Run these from the repository root:

```bash
npm install
python3 -m venv .venv
.venv/bin/python -m pip install -r requirements.txt
npm run check
npm run check:runtime
```

`npm run check` validates TypeScript, Python syntax, timeline parity, tools, and project structure. `npm run check:runtime` is intentionally strict and fails until licensed Kenney GLBs and per-short voice inputs are present.

Before delivery, render representative stills, render the final video, mux the generated mix, and run frame-by-frame QA. Store all generated files under `out/`.

## Safety and repository hygiene

- Keep Node packages in `node_modules/` and Python packages in `.venv/`.
- Set `REMOTION_TMP` to a large writable directory for repeated renders.
- Set `REMOTION_GL` only when the automatic backend (`angle` on Windows, `angle-egl` elsewhere) does not work; `swangle` is the CPU fallback.
- Never delete Remotion bundle or Chromium profile folders while a render is running.
- Preserve unrelated user changes and avoid destructive Git commands.
