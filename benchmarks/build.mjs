import * as esbuild from "esbuild";
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.join(ROOT, "dist");
fs.mkdirSync(DIST, { recursive: true });

export const ENTRIES = [
  { id: "react-markdown", file: "src/entry-react-markdown.jsx" },
  { id: "streamdown", file: "src/entry-streamdown.jsx" },
  { id: "ai-markdown", file: "src/entry-ai-markdown.jsx" },
  { id: "stream-md", file: "src/entry-stream-md.jsx" },
  { id: "incremark", file: "src/entry-incremark.jsx" },
  { id: "react-plain", file: "src/entry-react-plain.jsx" },
  { id: "react-eco", file: "src/entry-react-eco.jsx" },
  { id: "vanilla-eco", file: "src/entry-vanilla-eco.js" },
];

const sizes = {};

for (const entry of ENTRIES) {
  const outfile = path.join(DIST, `${entry.id}.bundle.js`);
  await esbuild.build({
    entryPoints: [path.join(ROOT, entry.file)],
    bundle: true,
    minify: true,
    jsx: "automatic",
    format: "iife",
    outfile,
    define: { "process.env.NODE_ENV": '"production"' },
  });
  const raw = fs.readFileSync(outfile);
  const gz = zlib.gzipSync(raw);
  sizes[entry.id] = {
    rawKB: +(raw.length / 1024).toFixed(1),
    gzipKB: +(gz.length / 1024).toFixed(1),
  };
}

fs.writeFileSync(path.join(DIST, "bundle-sizes.json"), JSON.stringify(sizes, null, 2));
console.log(JSON.stringify(sizes, null, 2));
