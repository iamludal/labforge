import {
  copyFile,
  mkdir,
  readdir,
  readFile,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import {
  basename,
  dirname,
  isAbsolute,
  join,
  relative,
  resolve,
  sep,
} from "node:path";
import type { Root } from "mdast";
import { visit } from "unist-util-visit";
import { ASSETS_DIR } from "../paths.js";
import { renderCatalog } from "../templates/catalog.js";
import type { Accent } from "../templates/html.js";
import { renderLab } from "../templates/lab.js";
import { nodesToHtml, parseMarkdown } from "./markdown.js";
import { parseChapterMeta, parseLabMeta, readFrontmatter } from "./parse.js";
import { slugify, splitSteps, type RawStep } from "./steps.js";
import type { Chapter, Lab } from "./types.js";

export type BuildOptions = {
  input: string;
  output: string;
  accent?: Accent;
};

type SourceFile = { path: string; data: Record<string, unknown>; body: string };

type LinkTarget = { first: string; bySlug: Map<string, string> };

const OUTPUT_MARKER = ".labforge";
const RUNTIME_ASSETS = ["app.js", "app.css"];
// Element ids used by the lab page itself.
const RESERVED_KEYS = ["content", "sidebar"];
const EXTERNAL_URL_RE = /^([a-z][a-z0-9+.-]*:|\/)/i;

async function findMarkdownFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { recursive: true });
  return entries
    .filter(
      (p) => p.endsWith(".md") && !p.split(/[\\/]/).includes("node_modules"),
    )
    .filter((p) => !/(^|[\\/])README\.md$/i.test(p))
    .sort()
    .map((p) => join(dir, p));
}

function isInside(dir: string, path: string): boolean {
  const rel = relative(dir, path);
  return rel !== ".." && !rel.startsWith(`..${sep}`) && !isAbsolute(rel);
}

function uniqueKey(base: string, used: Set<string>): string {
  let key = base;
  for (let n = 2; used.has(key); n++) key = `${base}-${n}`;
  used.add(key);
  return key;
}

// "02-deploy-the-app.md" -> "deploy-the-app"
function chapterName(filePath: string): string {
  return basename(filePath, ".md").replace(/^\d+[-_. ]*/, "");
}

// Rewrites image URLs relative to the lab folder, which mirrors the output.
function collectLocalImages(
  tree: Root,
  filePath: string,
  labDir: string,
): string[] {
  const images: string[] = [];
  visit(tree, "image", (node) => {
    if (/^([a-z][a-z0-9+.-]*:|\/|#)/i.test(node.url)) return;
    const abs = resolve(
      dirname(filePath),
      decodeURI(node.url.split(/[?#]/)[0]),
    );
    if (!isInside(labDir, abs)) {
      throw new Error(
        `${filePath}: image "${node.url}" must be inside the lab folder`,
      );
    }
    const rel = relative(labDir, abs);
    images.push(rel);
    node.url = encodeURI(rel.split(sep).join("/"));
  });
  return images;
}

// Turns links to chapter files and step headings into in-page step links.
function rewriteLinks(
  tree: Root,
  filePath: string,
  targets: Map<string, LinkTarget>,
): void {
  visit(tree, ["link", "definition"], (node) => {
    if (node.type !== "link" && node.type !== "definition") return;
    const { url } = node;
    if (!url || EXTERNAL_URL_RE.test(url)) return;

    const hashAt = url.indexOf("#");
    const path = (hashAt === -1 ? url : url.slice(0, hashAt)).split("?")[0];
    const fragment = hashAt === -1 ? "" : url.slice(hashAt + 1);

    let target: LinkTarget | undefined;
    if (path === "") {
      target = targets.get(filePath);
    } else if (/\.md$/i.test(path)) {
      try {
        target = targets.get(resolve(dirname(filePath), decodeURI(path)));
      } catch {
        return;
      }
    }
    if (!target) return;

    if (fragment) {
      let decoded = fragment;
      try {
        decoded = decodeURIComponent(fragment);
      } catch {
        // Keep the raw fragment.
      }
      const key = target.bySlug.get(slugify(decoded));
      if (key) {
        node.url = `#${key}`;
        return;
      }
      if (path === "") return;
      console.warn(
        `warn: ${filePath}: no step matches "${url}", linking to the start of the chapter`,
      );
    }
    node.url = `#${target.first}`;
  });
}

async function loadSources(files: string[]): Promise<Map<string, SourceFile>> {
  const entries = await Promise.all(
    files.map(async (path) => {
      const { data, body } = readFrontmatter(await readFile(path, "utf8"));
      return [path, { path, data, body }] as const;
    }),
  );
  return new Map(entries);
}

// Maps every chapter file to the lab file that lists it.
function findChapterOwners(
  sources: Map<string, SourceFile>,
): Map<string, string> {
  const owners = new Map<string, string>();
  for (const src of sources.values()) {
    const { chapters } = src.data;
    if (!Array.isArray(chapters)) continue;
    for (const rel of chapters) {
      if (typeof rel !== "string") continue;
      const abs = resolve(dirname(src.path), rel);
      if (abs === src.path)
        throw new Error(`${src.path}: a lab cannot list itself as a chapter`);
      const other = owners.get(abs);
      if (other && other !== src.path) {
        throw new Error(
          `${abs} is listed as a chapter by both ${other} and ${src.path}`,
        );
      }
      owners.set(abs, src.path);
    }
  }
  for (const path of owners.keys()) {
    const data = sources.get(path)?.data;
    if (data && ("id" in data || "chapters" in data))
      throw new Error(
        `${path}: chapter files cannot declare "id" or "chapters"`,
      );
  }
  return owners;
}

function resolveChapterFiles(
  entry: SourceFile,
  chapterPaths: string[],
  sources: Map<string, SourceFile>,
): SourceFile[] {
  const labDir = dirname(entry.path);
  const files = chapterPaths.map((rel) => {
    const abs = resolve(labDir, rel);
    if (!isInside(labDir, abs))
      throw new Error(
        `${entry.path}: chapter "${rel}" must be inside the lab folder`,
      );
    const src = sources.get(abs);
    if (!src) throw new Error(`${entry.path}: chapter not found: ${rel}`);
    return src;
  });
  if (new Set(files).size !== files.length)
    throw new Error(`${entry.path}: a chapter is listed more than once`);

  const ignored = parseMarkdown(entry.body).children.some(
    (n) => !(n.type === "heading" && n.depth === 1),
  );
  if (ignored)
    console.warn(
      `warn: ${entry.path}: content is ignored because the lab has "chapters"`,
    );
  return files;
}

async function loadLab(
  entry: SourceFile,
  sources: Map<string, SourceFile>,
): Promise<Lab> {
  const { chapters: chapterPaths, ...meta } = parseLabMeta(
    entry.data,
    entry.path,
  );
  const labDir = dirname(entry.path);
  const files = chapterPaths
    ? resolveChapterFiles(entry, chapterPaths, sources)
    : [entry];

  const usedChapterKeys = new Set<string>();
  const targets = new Map<string, LinkTarget>();
  const parsed = files.map((src) => {
    const tree = parseMarkdown(src.body);
    const { title: heading, steps } = splitSteps(tree, src.path);
    const name = chapterName(src.path);
    const title = chapterPaths
      ? (parseChapterMeta(src.data, src.path).title ??
        heading ??
        name.replace(/[-_]+/g, " ").replace(/^./, (c) => c.toUpperCase()))
      : meta.title;

    // Keys must stay stable when steps are added or reordered elsewhere.
    const prefix = chapterPaths
      ? `${uniqueKey(slugify(name) || slugify(title) || "chapter", usedChapterKeys)}/`
      : "";
    const usedStepKeys = new Set(chapterPaths ? [] : RESERVED_KEYS);
    const bySlug = new Map<string, string>();
    const keys = steps.map((step) => {
      const slug = slugify(step.title) || "step";
      const unique = uniqueKey(slug, usedStepKeys);
      const key = prefix + unique;
      if (!bySlug.has(slug)) bySlug.set(slug, key);
      bySlug.set(unique, key);
      return key;
    });
    targets.set(src.path, { first: keys[0], bySlug });
    return { src, tree, title, steps, keys };
  });
  if (!targets.has(entry.path))
    targets.set(entry.path, { first: parsed[0].keys[0], bySlug: new Map() });

  const images = new Set<string>();
  for (const { src, tree } of parsed) {
    rewriteLinks(tree, src.path, targets);
    for (const image of collectLocalImages(tree, src.path, labDir))
      images.add(image);
  }

  let ordinal = 0;
  const renderStep = (step: RawStep, i: number, key: string) =>
    nodesToHtml(step.nodes, `s${++ordinal}`).then((html) => ({
      key,
      index: i + 1,
      title: step.title,
      durationSec: step.durationSec,
      html,
    }));

  const chapters: Chapter[] = [];
  for (const { title, steps, keys } of parsed) {
    const rendered = await Promise.all(
      steps.map((step, i) => renderStep(step, i, keys[i])),
    );
    chapters.push({
      title,
      steps: rendered,
      durationSec: rendered.reduce((sum, s) => sum + s.durationSec, 0),
    });
  }

  return {
    ...meta,
    sourceDir: labDir,
    images: [...images],
    chapters,
    steps: chapters.flatMap((c) => c.steps),
    totalDurationSec: chapters.reduce((sum, c) => sum + c.durationSec, 0),
  };
}

// Only wipe directories that labforge created itself.
async function prepareOutput(output: string): Promise<void> {
  const exists = await stat(output).then(
    () => true,
    () => false,
  );
  if (exists) {
    const entries = await readdir(output);
    if (entries.length > 0 && !entries.includes(OUTPUT_MARKER)) {
      throw new Error(
        `Refusing to write into "${output}": it is not empty and was not created by labforge`,
      );
    }
    await rm(output, { recursive: true, force: true });
  }
  await mkdir(output, { recursive: true });
  await writeFile(join(output, OUTPUT_MARKER), "");
}

export async function build({
  input,
  output,
  accent = "blue",
}: BuildOptions): Promise<Lab[]> {
  const inputDir = resolve(input);
  const outputDir = resolve(output);

  const files = await findMarkdownFiles(inputDir);
  if (files.length === 0)
    throw new Error(`No Markdown files found in "${input}"`);

  const sources = await loadSources(files);
  const chapterOwners = findChapterOwners(sources);

  const labs: Lab[] = [];
  const seen = new Map<string, string>();
  for (const src of sources.values()) {
    if (chapterOwners.has(src.path)) continue;
    const lab = await loadLab(src, sources);
    const other = seen.get(lab.id);
    if (other)
      throw new Error(
        `Duplicate lab id "${lab.id}" in ${src.path} and ${other}`,
      );
    seen.set(lab.id, src.path);
    labs.push(lab);
  }

  await prepareOutput(outputDir);

  await mkdir(join(outputDir, "assets"), { recursive: true });
  for (const asset of RUNTIME_ASSETS) {
    await copyFile(join(ASSETS_DIR, asset), join(outputDir, "assets", asset));
  }

  for (const lab of labs) {
    const labDir = join(outputDir, lab.id);
    await mkdir(labDir, { recursive: true });
    await writeFile(join(labDir, "index.html"), renderLab(lab, accent));
    for (const image of lab.images) {
      const dest = join(labDir, image);
      await mkdir(dirname(dest), { recursive: true });
      await copyFile(join(lab.sourceDir, image), dest).catch(() => {
        throw new Error(
          `${lab.id}: image not found: ${join(lab.sourceDir, image)}`,
        );
      });
    }
  }

  await writeFile(
    join(outputDir, "index.html"),
    renderCatalog(
      labs.filter((l) => l.status === "published"),
      accent,
    ),
  );
  return labs;
}
