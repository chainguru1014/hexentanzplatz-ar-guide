/**
 * Flattens Next.js static export (out/) into a single folder with no subfolders.
 * Rewrites all asset paths in HTML, JS, and manifest so Mattercraft-friendly export works.
 *
 * Usage: node scripts/flatten-build.mjs [sourceDir] [targetDir]
 * Default: sourceDir=out, targetDir=out-flat
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const sourceDir = path.resolve(rootDir, process.argv[2] || "out");
const targetDir = path.resolve(rootDir, process.argv[3] || "out-flat");

if (!fs.existsSync(sourceDir)) {
  console.error("Source directory not found:", sourceDir);
  process.exit(1);
}

/** Collect all files recursively; returns array of relative paths (forward slashes). */
function collectFiles(dir, base = dir, list = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    const rel = path.relative(base, full).replace(/\\/g, "/");
    if (e.isDirectory()) {
      collectFiles(full, base, list);
    } else {
      list.push(rel);
    }
  }
  return list;
}

/** Path as used in browser (leading slash). */
function toBrowserPath(rel) {
  return "/" + rel;
}

/** Flat filename: no subfolders, slashes → underscores. */
function toFlatName(rel) {
  return rel.replace(/\//g, "_");
}

// Collect files and build path mappings (longest first so specific paths win).
const files = collectFiles(sourceDir);
const pathMap = new Map();

for (const rel of files) {
  const flat = toFlatName(rel);
  pathMap.set(toBrowserPath(rel), "/" + flat);
  // Inline payloads sometimes use paths without leading slash.
  pathMap.set(rel, flat);
  // Next.js RSC payload uses paths relative to _next/static/ (e.g. "static/chunks/app/page-x.js").
  if (rel.startsWith("_next/static/")) {
    const payloadPath = rel.slice("_next/static/".length);
    pathMap.set(payloadPath, flat);
  }
}

// Sort by key length descending so e.g. /_next/static/chunks/app/page-x.js before /_next/static/chunks/
const sortedEntries = [...pathMap.entries()].sort((a, b) => b[0].length - a[0].length);

function rewriteContent(content) {
  let out = content;
  for (const [from, to] of sortedEntries) {
    out = out.split(from).join(to);
  }
  return out;
}

// Ensure target is empty or create it.
if (fs.existsSync(targetDir)) {
  fs.rmSync(targetDir, { recursive: true });
}
fs.mkdirSync(targetDir, { recursive: true });

// Copy every file to flat name.
for (const rel of files) {
  const flat = toFlatName(rel);
  const src = path.join(sourceDir, rel);
  const dest = path.join(targetDir, flat);
  fs.copyFileSync(src, dest);
}

// Rewrite paths in HTML, JS, and manifest.
const textExtensions = new Set([".html", ".js", ".webmanifest", ".json", ".txt"]);
for (const rel of files) {
  const flat = toFlatName(rel);
  const ext = path.extname(flat);
  if (!textExtensions.has(ext)) continue;

  const dest = path.join(targetDir, flat);
  let content = fs.readFileSync(dest, "utf8");
  const rewritten = rewriteContent(content);
  if (rewritten !== content) {
    fs.writeFileSync(dest, rewritten, "utf8");
  }
}

console.log("Flattened", files.length, "files into", targetDir);
console.log("Single-folder export ready for Mattercraft:", path.relative(rootDir, targetDir));
