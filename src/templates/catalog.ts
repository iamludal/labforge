import type { Lab } from "../build/types.js";
import {
  e,
  formatDuration,
  head,
  icons,
  themeToggle,
  type Accent,
} from "./html.js";

function card(lab: Lab): string {
  const tags = [...lab.categories, ...lab.tags];
  return `<li>
  <a href="${e(lab.id)}/index.html" data-lab="${e(lab.id)}" data-steps="${e(lab.steps.map((s) => s.key).join(" "))}" class="group flex h-full flex-col rounded-2xl border-2 border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-accent-300 hover:shadow-md motion-reduce:transition-none dark:border-slate-800 dark:bg-slate-900 dark:hover:border-accent-500/50">
    <h2 class="text-lg font-semibold text-slate-900 transition-colors group-hover:text-accent-600 motion-reduce:transition-none dark:text-white dark:group-hover:text-accent-400">${e(lab.title)}</h2>
    ${lab.summary ? `<p class="mt-2 line-clamp-3 text-sm text-slate-600 dark:text-slate-400">${e(lab.summary)}</p>` : ""}
    ${tags.length ? `<ul class="mt-4 flex flex-wrap gap-1.5">${tags.map((t) => `<li class="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">${e(t)}</li>`).join("")}</ul>` : ""}
    <div class="mt-auto flex items-center gap-4 pt-6 text-xs text-slate-500 dark:text-slate-400">
      ${lab.totalDurationSec ? `<span class="inline-flex items-center gap-1">${icons.clock}${formatDuration(lab.totalDurationSec)}</span>` : ""}
      ${lab.chapters.length > 1 ? `<span>${lab.chapters.length} chapters</span>` : ""}
      <span>${lab.steps.length} steps</span>
      ${lab.authors.length ? `<span class="ml-auto truncate">${e(lab.authors.join(", "))}</span>` : ""}
    </div>
    <div class="mt-4 hidden border-t border-slate-100 pt-4 js:block dark:border-slate-800">
      <div class="flex items-center text-xs font-medium">
        <span class="inline-flex items-center gap-1.5 text-slate-500 group-data-[state=done]:text-emerald-600 group-data-[state=progress]:text-accent-600 dark:text-slate-400 dark:group-data-[state=done]:text-emerald-400 dark:group-data-[state=progress]:text-accent-400">${icons.checkCircle}<span data-status-text>Not started</span></span>
        <span data-status-count class="ml-auto tabular-nums text-slate-500 dark:text-slate-400"></span>
      </div>
      <div class="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
        <div data-status-bar class="h-full w-0 rounded-full bg-gradient-to-r from-accent-500 to-accent-alt group-data-[state=done]:from-emerald-500 group-data-[state=done]:to-emerald-500"></div>
      </div>
    </div>
  </a>
</li>`;
}

export function renderCatalog(labs: Lab[], accent: Accent): string {
  const sorted = [...labs].sort((a, b) => a.title.localeCompare(b.title));
  return `<!doctype html>
<html lang="en" data-accent="${accent}">
${head({ title: "Labs", assetsPath: "assets" })}
<body class="min-h-screen bg-slate-50 text-slate-800 antialiased dark:bg-slate-950 dark:text-slate-200">
<header class="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
  <div class="mx-auto flex h-14 max-w-6xl items-center px-4 sm:px-6">
    <span class="text-base font-semibold">Labs</span>
    <div class="ml-auto">${themeToggle}</div>
  </div>
</header>
<main class="mx-auto max-w-6xl px-4 py-10 sm:px-6">
  ${sorted.length ? `<ul class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">${sorted.map(card).join("\n")}</ul>` : '<p class="text-slate-500">No published labs yet.</p>'}
</main>
</body>
</html>
`;
}
