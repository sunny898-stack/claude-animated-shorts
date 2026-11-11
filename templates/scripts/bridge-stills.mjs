// usage: node templates/scripts/bridge-stills.mjs <outPrefix> <frame,frame,...> [scale]
// BRIDGE_ENTRY=src/sandboxes/<name>/index.tsx renders a sandbox copy instead of the main project entry.
import fs from "node:fs";
// Remotion bundles can be large: set REMOTION_TMP to a folder on a large drive.
if (process.env.REMOTION_TMP) { fs.mkdirSync(process.env.REMOTION_TMP, { recursive: true }); process.env.TEMP = process.env.TMP = process.env.REMOTION_TMP; }
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import path from "node:path";
const [prefix, frames, scale = "0.5"] = process.argv.slice(2);
if (!prefix || !frames) throw new Error("usage: npm run stills -- <outPrefix> <frame,frame,...> [scale]");
const config = JSON.parse(fs.readFileSync("short.config.json", "utf8"));
const browserExecutable = [
  process.env.REMOTION_BROWSER_EXECUTABLE,
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
  "/usr/bin/google-chrome",
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
].filter(Boolean).find((candidate) => fs.existsSync(candidate));
const chromiumOptions = { gl: process.env.REMOTION_GL || (process.platform === "win32" ? "angle" : "angle-egl") };
const publicDir = path.resolve(config.paths.publicDir);
fs.mkdirSync(path.dirname(prefix), { recursive: true });
const serveUrl = await bundle({ entryPoint: path.resolve(process.env.BRIDGE_ENTRY || config.paths.entryPoint), ...(fs.existsSync(publicDir) ? { publicDir } : {}) });
const browser = browserExecutable ? { browserExecutable } : {};
const composition = await selectComposition({ serveUrl, id: process.env.REMOTION_COMPOSITION || config.composition.id, ...browser, chromiumOptions });
const onBrowserLog = (l) => { if (l.type === "error" || l.type === "warning") console.log(`[${l.type}]`, l.text.slice(0, 300)); };
for (const f of frames.split(",").map(Number)) {
  const t0 = Date.now();
  await renderStill({ composition, serveUrl, frame: f, output: `${prefix}${f}.jpg`, imageFormat: "jpeg", jpegQuality: 88, scale: Number(scale),
    ...browser, chromiumOptions, timeoutInMilliseconds: 180000, onBrowserLog });
  console.log("still", f, ((Date.now() - t0) / 1000).toFixed(1) + "s");
}
