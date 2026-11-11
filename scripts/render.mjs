import {existsSync, mkdirSync, readFileSync} from "node:fs";
import {spawnSync} from "node:child_process";
import path from "node:path";

const config = JSON.parse(readFileSync("short.config.json", "utf8"));
const userArgs = process.argv.slice(2);
const takeOption = (name, fallback) => {
  const exact = userArgs.findIndex((arg) => arg === name);
  if (exact >= 0) {
    const value = userArgs[exact + 1];
    if (value === undefined) throw new Error(`${name} requires a value`);
    userArgs.splice(exact, 2);
    return value;
  }
  const prefix = `${name}=`;
  const inline = userArgs.findIndex((arg) => arg.startsWith(prefix));
  if (inline >= 0) return userArgs.splice(inline, 1)[0].slice(prefix.length);
  return fallback;
};
const output = takeOption("--output", config.paths.defaultVideo);
const composition = takeOption("--composition", config.composition.id);
const entryPoint = takeOption("--entry", config.paths.entryPoint);
const codec = takeOption("--codec", config.render.codec);
const crf = takeOption("--crf", String(config.render.crf));
const scale = takeOption("--scale", String(config.render.scale));
const timeout = takeOption("--timeout", "180000");
const browserExecutable = takeOption("--browser-executable", [
  process.env.REMOTION_BROWSER_EXECUTABLE,
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
  "/usr/bin/google-chrome",
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
].filter(Boolean).find((candidate) => existsSync(candidate)));
mkdirSync(path.dirname(output), {recursive: true});

if (process.env.REMOTION_TMP) {
  mkdirSync(process.env.REMOTION_TMP, {recursive: true});
  process.env.TEMP = process.env.REMOTION_TMP;
  process.env.TMP = process.env.REMOTION_TMP;
}

const executable = process.platform === "win32" ? "npx.cmd" : "npx";
const args = [
  "--no-install", "remotion", "render",
  entryPoint, composition, output,
  "--codec", codec,
  "--crf", crf,
  "--scale", scale,
  "--timeout", timeout,
  "--gl", process.env.REMOTION_GL || (process.platform === "win32" ? "angle" : "angle-egl"),
  ...(browserExecutable ? ["--browser-executable", browserExecutable] : []),
  ...userArgs,
];
const result = spawnSync(executable, args, {stdio: "inherit", env: process.env});
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
