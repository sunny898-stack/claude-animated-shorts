import {existsSync, readFileSync} from "node:fs";
import {spawnSync} from "node:child_process";
import path from "node:path";

const strict = process.argv.includes("--strict");
const config = JSON.parse(readFileSync("short.config.json", "utf8"));
const failures = [];
const warnings = [];

for (const file of [
  "AGENTS.md",
  ".agents/skills/cartoon-3d-short/SKILL.md",
  config.paths.entryPoint,
  "src/Root.tsx",
  "templates/bridge/Bridge.tsx",
  "templates/audio/mix.py",
]) {
  if (!existsSync(file)) failures.push(`missing project file: ${file}`);
}

const commandWorks = (command, args) => spawnSync(command, args, {encoding: "utf8"}).status === 0;
for (const [tool, args] of [["ffmpeg", ["-version"]], ["ffprobe", ["-version"]], ["python3", ["--version"]]]) {
  if (!commandWorks(tool, args)) failures.push(`required executable not available: ${tool}`);
}
const venvPython = process.platform === "win32" ? ".venv/Scripts/python.exe" : ".venv/bin/python";
if (!existsSync(venvPython)) failures.push(`project virtual environment is missing: ${venvPython}`);
else if (!commandWorks(venvPython, ["-c", "import numpy, scipy, PIL"])) failures.push("Python audio/image dependencies are not importable from .venv");

const browserCandidates = [
  process.env.REMOTION_BROWSER_EXECUTABLE,
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
  "/usr/bin/google-chrome",
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
].filter(Boolean);
const browser = browserCandidates.find((candidate) => existsSync(candidate));
if (!browser) failures.push("Chrome/Chromium not found; set REMOTION_BROWSER_EXECUTABLE");

const missingModels = config.assets.kenneyModels
  .map((name) => path.join(config.paths.kenneyDir, `${name}.glb`))
  .filter((file) => !existsSync(file));
if (missingModels.length) warnings.push(`missing Kenney GLBs (${missingModels.length}): ${missingModels.join(", ")}`);

const voiceFiles = [
  path.join(config.paths.workDir, "voice", "voice.wav"),
  path.join(config.paths.workDir, "voice", "words.json"),
];
const missingVoice = voiceFiles.filter((file) => !existsSync(file));
if (missingVoice.length) warnings.push(`missing per-short voice inputs: ${missingVoice.join(", ")}`);

console.log(`Project structure: ${failures.length ? "FAIL" : "OK"}`);
console.log(`Browser: ${browser ?? "not found"}`);
for (const warning of warnings) console.warn(`WARN ${warning}`);
for (const failure of failures) console.error(`ERROR ${failure}`);

if (strict && warnings.length) {
  console.error(`ERROR strict runtime check treats ${warnings.length} warning group(s) as blockers`);
  failures.push(...warnings);
}
if (failures.length) process.exitCode = 1;
else console.log(strict ? "Strict runtime check OK" : "Project check OK (warnings are non-blocking until render)");
