# Merge the five look sandboxes back into the main video folder, by owned files.
# Backs up main first (backup/bridge_<time>/), copies each sandbox's owned files, reports which owned files are
# missing or unchanged.
import argparse
import filecmp
import os
import shutil
import time

OWN = {  # round 2 ownership (round 1: world also owned paint/build, post owned grade)
    "cam": ["story.ts"],
    "world": ["world.ts", "lights.ts", "shade.ts", "grade.ts"],
    "mat": ["paint.ts", "build.ts"],
    "char": ["toon.ts", "cast.ts", "cardshade.ts"],
    "post": ["ink.ts", "Bridge.tsx", "lensblur.ts"],
}
parser = argparse.ArgumentParser()
parser.add_argument("boxes", nargs="?", default=",".join(OWN), help="comma-separated owners")
parser.add_argument("--root", default=".", help="Remotion project root")
parser.add_argument("--name", default="bridge", help="video folder name under src/videos")
args = parser.parse_args()
root = os.path.abspath(os.path.expanduser(args.root))
main = os.path.join(root, "src", "videos", args.name)
which = args.boxes.split(",")
unknown = [box for box in which if box not in OWN]
if unknown:
    raise SystemExit(f"unknown owners: {', '.join(unknown)}")
if not os.path.isdir(main):
    raise SystemExit(f"main video folder does not exist: {main}")
bak = os.path.join(root, "backup", time.strftime(f"{args.name}_%Y%m%d_%H%M%S"))
shutil.copytree(main, bak)
print("backup ->", bak)
for box in which:
    src = os.path.join(root, "src", "videos", f"{args.name}_{box}")
    for f in OWN[box]:
        a, b = os.path.join(src, f), os.path.join(main, f)
        if not os.path.exists(a):
            print(f"  {box}: {f} not in sandbox (skipped)")
            continue
        if os.path.exists(b) and filecmp.cmp(a, b, shallow=False):
            print(f"  {box}: {f} unchanged")
            continue
        shutil.copy2(a, b)
        print(f"  {box}: {f} -> main")
