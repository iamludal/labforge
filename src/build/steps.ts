import type { Root, RootContent } from "mdast";
import { toString } from "mdast-util-to-string";

export type RawStep = {
  title: string;
  durationSec: number;
  nodes: RootContent[];
};

const DURATION_RE = /^Duration:\s*(\d+):([0-5]\d)$/i;

// Close to GitHub's heading anchors so authors can reuse them in links.
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s_-]/gu, "")
    .trim()
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function splitSteps(
  tree: Root,
  filePath: string,
): { title?: string; steps: RawStep[] } {
  const steps: RawStep[] = [];
  // Rendered with every step so references resolve wherever they are defined.
  const definitions: RootContent[] = [];
  let title: string | undefined;
  let current: RawStep | undefined;
  let warnedOrphan = false;

  for (const node of tree.children) {
    if (node.type === "definition" || node.type === "footnoteDefinition") {
      definitions.push(node);
      continue;
    }

    if (node.type === "heading" && node.depth === 2) {
      current = { title: toString(node), durationSec: 0, nodes: [] };
      steps.push(current);
      continue;
    }

    if (!current) {
      const isTitle = node.type === "heading" && node.depth === 1;
      if (isTitle) title ??= toString(node);
      else if (!warnedOrphan) {
        console.warn(
          `warn: ${filePath}: content before the first "## " heading is ignored`,
        );
        warnedOrphan = true;
      }
      continue;
    }

    if (
      current.nodes.length === 0 &&
      current.durationSec === 0 &&
      node.type === "paragraph"
    ) {
      const match = DURATION_RE.exec(toString(node).trim());
      if (match) {
        current.durationSec = Number(match[1]) * 60 + Number(match[2]);
        continue;
      }
    }

    current.nodes.push(node);
  }

  if (steps.length === 0) {
    throw new Error(
      `${filePath}: no steps found (each step must start with a "## " heading)`,
    );
  }
  for (const step of steps) step.nodes.push(...definitions);
  return { title, steps };
}
