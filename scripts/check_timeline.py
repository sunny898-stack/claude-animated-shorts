import ast
import re
from pathlib import Path


def match(pattern: str, text: str, label: str) -> re.Match[str]:
    found = re.search(pattern, text, re.S | re.M)
    if not found:
        raise SystemExit(f"Could not parse {label}")
    return found


def main() -> None:
    story = Path("templates/bridge/story.ts").read_text(encoding="utf-8")
    audio = Path("templates/audio/timeline.py").read_text(encoding="utf-8")

    ts_fps = int(match(r"export const FPS = (\d+)", story, "TypeScript FPS").group(1))
    py_fps = int(match(r"^FPS = (\d+)", audio, "Python FPS").group(1))
    ts_total = int(match(r"export const TOTAL = (\d+)", story, "TypeScript TOTAL").group(1))
    py_total = int(match(r"^TOTAL = (\d+)", audio, "Python TOTAL").group(1))

    ts_events = tuple(
        float(value)
        for value in match(
            r"export const SNAP = ([\d.]+), DROP0 = ([\d.]+), DROP1 = ([\d.]+)",
            story,
            "TypeScript collapse events",
        ).groups()
    )
    py_events = tuple(
        float(value)
        for value in match(
            r"^SNAP, DROP0, DROP1 = ([\d.]+), ([\d.]+), ([\d.]+)",
            audio,
            "Python collapse events",
        ).groups()
    )
    ts_flash = int(match(r"export const FLASH_AT = (\d+)", story, "TypeScript flash").group(1))
    py_flash = int(match(r"^FLASH = fr\((\d+)\)", audio, "Python flash").group(1))

    ts_xfade_text = match(r"export const XFADE[^=]*= \{([^}]*)\}", story, "TypeScript XFADE").group(1)
    ts_xfade = {int(k): int(v) for k, v in re.findall(r"(\d+):\s*(\d+)", ts_xfade_text)}
    py_xfade = ast.literal_eval(match(r"^XFADE = (\{[^\n]+\})", audio, "Python XFADE").group(1))

    pairs = {
        "FPS": (ts_fps, py_fps),
        "TOTAL": (ts_total, py_total),
        "collapse events": (ts_events, py_events),
        "FLASH": (ts_flash, py_flash),
        "XFADE": (ts_xfade, py_xfade),
    }
    mismatches = [f"{name}: TypeScript={left!r}, Python={right!r}" for name, (left, right) in pairs.items() if left != right]
    if mismatches:
        raise SystemExit("Timeline mismatch:\n" + "\n".join(mismatches))
    print(f"Timeline parity OK: {ts_total} frames at {ts_fps} fps ({ts_total / ts_fps:.3f} s)")


if __name__ == "__main__":
    main()
