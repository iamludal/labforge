import type { Element, Root } from "hast";
import { toString } from "hast-util-to-string";
import {
  bundledLanguages,
  createHighlighter,
  type BundledLanguage,
  type Highlighter,
} from "shiki";
import type { Plugin } from "unified";
import { SKIP, visit } from "unist-util-visit";

const THEMES = { light: "github-light", dark: "github-dark" } as const;

let highlighterPromise: Promise<Highlighter> | undefined;

function getHighlighter(): Promise<Highlighter> {
  highlighterPromise ??= createHighlighter({
    themes: Object.values(THEMES),
    langs: [],
  });
  return highlighterPromise;
}

function languageOf(code: Element): string | undefined {
  const classes = code.properties.className;
  if (!Array.isArray(classes)) return undefined;
  const cls = classes.find(
    (c): c is string => typeof c === "string" && c.startsWith("language-"),
  );
  return cls?.slice("language-".length);
}

export const rehypeShiki: Plugin<[], Root> = function () {
  return async (tree) => {
    const highlighter = await getHighlighter();
    const blocks: { pre: Element; code: Element; lang: string }[] = [];

    visit(tree, "element", (node) => {
      if (node.tagName !== "pre") return;
      const code = node.children[0];
      if (code?.type !== "element" || code.tagName !== "code") return;
      const lang = languageOf(code);
      blocks.push({
        pre: node,
        code,
        lang: lang && lang in bundledLanguages ? lang : "text",
      });
      return SKIP;
    });

    const toLoad = new Set(
      blocks.map((b) => b.lang).filter((l) => l !== "text"),
    );
    const loaded = new Set(highlighter.getLoadedLanguages());
    for (const lang of toLoad) {
      if (!loaded.has(lang))
        await highlighter.loadLanguage(lang as BundledLanguage);
    }

    for (const { pre, code, lang } of blocks) {
      const highlighted = highlighter.codeToHast(
        toString(code).replace(/\n$/, ""),
        {
          lang,
          themes: THEMES,
          defaultColor: "light",
        },
      );
      const newPre = highlighted.children[0];
      if (newPre?.type === "element") Object.assign(pre, newPre);
    }
  };
};
