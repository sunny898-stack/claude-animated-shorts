---
name: cartoon-3d-short
description: Build, adapt, preview, render, and QA an original 55-70 second vertical cartoon story short with flat 2D characters in a painted 3D Three.js world using Remotion.
---

# Cartoon 3D short for Codex

Use this project skill when the user asks for a short like the bridge example, a history or science story in this visual style, or changes to the included bridge template.

## Sources of truth

Read these before changing the visual pipeline:

1. `../../../AGENTS.md` for project rules.
2. `../../../references/STYLE_BIBLE.md` for format and storytelling measurements.
3. The relevant sections of `../../../SKILL.md` for the proven visual constants and implementation gotchas.
4. The relevant report under `../../../references/reports/` when changing motion, depth, textures, characters, lighting, outlines, or grade.

The root `SKILL.md` was written for Claude Code. Keep its technical values, but ignore instructions tied to Claude-specific paths, Opus, SendMessage, SendUserFile, memory, or autonomous sub-agents. This file defines the Codex workflow.

## Preconditions

From the repository root, run:

```bash
npm install
python3 -m venv .venv
.venv/bin/python -m pip install -r requirements.txt
npm run check
```

Run `npm run check:runtime` before rendering. It must identify the browser, FFmpeg, the 26 Kenney CC0 models, and the current short's voice inputs. Missing licensed assets are a blocker to a faithful render; do not replace them without the user's direction.

## Workflow

1. **Facts and script.** Choose one visual cause-and-effect story. Record facts and sources at the top of `work/<slug>/SCRIPT.md`. Use the hook, setting, escalation, snap, explanation, consequence, and callback structure from the style bible. Keep the script original.
2. **Voice.** Create or receive `work/<slug>/voice/voice.wav` at 48 kHz and `words.json` with hand-checked word timings.
3. **Visual source.** Copy `templates/bridge/` to `src/videos/<slug>/`. Register a composition at 1080x1920, 30 fps. Update story timing, roles, layout, and props while preserving the post-processing order and exported contracts.
4. **Timeline.** Make every reaction land zero to three frames before its word. Keep picture and audio timing synchronized; if picture timing changes, regenerate audio.
5. **World and cast.** Keep procedural painted textures, two-tone lighting, plum character ink, character cards on the `NOINK` layer, real shadows, and camera-relative/frozen per-shot sun behavior.
6. **Post.** Preserve the order: world ink, lens pre-pass, lens main pass, bloom, neutral tone map, grade. Keep pixel parameters scaled from 1920 output height.
7. **Audio.** Copy `templates/audio/` to `work/<slug>/audio/` and run `.venv/bin/python work/<slug>/audio/mix.py`. It writes the mix, stems, cache, and cue sheet beside the audio sources.
8. **Preview.** Use `npm run studio` for interactive inspection and `npm run stills -- out/<slug>/x_ <frames> 0.5` for deterministic stills. Set `BRIDGE_ENTRY` and `REMOTION_BROWSER_EXECUTABLE` when using a sandbox or nonstandard browser.
9. **Visual review.** Use `templates/scripts/sbs_sheet.py` to compare local frames with the permitted reference material. Inspect images locally and report concrete issues by frame and subsystem. Do not send reference images to an external verifier.
10. **Render and mux.** Run `npm run render -- --output out/<slug>/video.mp4`, then `npm run mux -- out/<slug>/video.mp4 work/<slug>/audio/mix.wav out/<slug>/final.mp4`.
11. **QA and delivery.** Generate shot metadata, run `short_qa.py`, inspect its report and contact sheets, fix material failures, and provide the final file from `out/<slug>/` with a concise validation report.

## Visual requirements

- Default composition: 1080x1920, 30 fps; final scale 1.3333 for 1440x2560.
- Use hard cuts for large reframes and 18-40 frame smootherstep glides otherwise. Every hold must creep.
- Apply depth of field mainly to close-ups, medium shots, and inserts; keep establishing wides sharp.
- Keep day shadows coloured and lifted. Golden-hour shadows are violet-blue with a peach horizon and a low backlight.
- World ink is near black and distance-aware. Character ink remains dark plum and is drawn into the cards.
- Film grain stays off unless the user explicitly requests it.
- No captions or labels unless requested.

## Codex operating rules

- Continue through authorized implementation and verification without stopping for routine choices.
- Use one agent by default. Delegate only when the user explicitly requests sub-agents or parallel work.
- Prefer deterministic scripts and local image inspection over model-specific scoring.
- Keep intermediate work under `work/` and user-facing renders under `out/`.
- Report missing inputs, platform constraints, render time, and any checks that could not be completed.
