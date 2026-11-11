import {existsSync, mkdirSync, readFileSync} from "node:fs";
import {spawnSync} from "node:child_process";
import path from "node:path";

const config = JSON.parse(readFileSync("short.config.json", "utf8"));
const [video = config.paths.defaultVideo, audio = path.join(config.paths.workDir, "audio", "mix.wav"), output = config.paths.defaultFinal] = process.argv.slice(2);

for (const file of [video, audio]) {
  if (!existsSync(file)) throw new Error(`Missing mux input: ${file}`);
}
mkdirSync(path.dirname(output), {recursive: true});

const args = [
  "-y", "-i", video, "-i", audio,
  "-map", "0:v:0", "-map", "1:a:0",
  "-c:v", "copy", "-c:a", "aac", "-b:a", "320k", "-shortest", output,
];
const result = spawnSync("ffmpeg", args, {stdio: "inherit"});
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
