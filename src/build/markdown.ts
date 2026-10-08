import type { Element, Root as HastRoot } from "hast";
import type { Root, RootContent } from "mdast";
import rehypeSanitize from "rehype-sanitize";
import rehypeStringify from "rehype-stringify";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified, type Plugin } from "unified";
import { visit } from "unist-util-visit";
import { rehypeShiki } from "./highlight.js";

const parser = unified().use(remarkParse).use(remarkGfm);

const CLOBBER_PREFIX = "user-content-";
const ID_LIST_PROPS = ["ariaDescribedBy", "ariaLabelledBy"] as const;

// Steps are rendered separately but live on one page, so ids (e.g. footnotes)
// get a per-step namespace, and in-page links follow sanitize's id prefix.
const rehypeScopeIds: Plugin<[string], HastRoot> = (scope) => (tree) => {
  const ids = new Set<string>();
  const rename = (value: string) =>
    value.startsWith(CLOBBER_PREFIX)
      ? `${CLOBBER_PREFIX}${scope}-${value.slice(CLOBBER_PREFIX.length)}`
      : value;

  visit(tree, "element", (node: Element) => {
    const { id } = node.properties;
    if (typeof id === "string" && id.startsWith(CLOBBER_PREFIX)) {
      ids.add(id.slice(CLOBBER_PREFIX.length));
      node.properties.id = rename(id);
    }
    for (const prop of ID_LIST_PROPS) {
      const value = node.properties[prop];
      if (Array.isArray(value))
        node.properties[prop] = value.map((v) =>
          typeof v === "string" ? rename(v) : String(v),
        );
    }
  });

  visit(tree, "element", (node: Element) => {
    const { href } = node.properties;
    if (typeof href !== "string" || !href.startsWith("#")) return;
    const target = href.slice(1);
    if (ids.has(target))
      node.properties.href = `#${CLOBBER_PREFIX}${scope}-${target}`;
  });
};

export function parseMarkdown(body: string): Root {
  return parser.parse(body);
}

export async function nodesToHtml(
  nodes: RootContent[],
  scope: string,
): Promise<string> {
  // Sanitize before highlighting so Shiki's inline styles are kept.
  const toHtml = unified()
    .use(remarkRehype, { clobberPrefix: "" })
    .use(rehypeSanitize)
    .use(rehypeScopeIds, scope)
    .use(rehypeShiki)
    .use(rehypeStringify);
  const hast = await toHtml.run({ type: "root", children: nodes });
  return toHtml.stringify(hast);
}
