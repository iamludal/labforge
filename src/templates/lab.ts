import type { Chapter, Lab, Step } from "../build/types.js";
import {
  e,
  formatDuration,
  head,
  icons,
  themeToggle,
  type Accent,
} from "./html.js";

function sidebarItem(step: Step): string {
  return `<li>
  <a href="#${e(step.key)}" data-step-link="${e(step.key)}" class="group flex items-start gap-3 rounded-lg px-3 py-2 text-sm text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 aria-[current=step]:bg-accent-50 aria-[current=step]:font-medium aria-[current=step]:text-accent-700 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-slate-100 dark:aria-[current=step]:bg-accent-500/10 dark:aria-[current=step]:text-accent-300">
    <span class="grid size-6 shrink-0 place-items-center rounded-full border border-slate-300 text-xs font-medium transition-colors group-aria-[current=step]:border-accent-600 group-aria-[current=step]:bg-accent-600 group-aria-[current=step]:text-white group-data-[done]:border-emerald-500 group-data-[done]:bg-emerald-500 group-data-[done]:text-white dark:border-slate-700">
      <span class="group-data-[done]:hidden">${step.index}</span>${icons.check}
    </span>
    <span class="flex-1 pt-0.5 leading-5">${e(step.title)}</span>
    ${step.durationSec ? `<span class="pt-0.5 text-xs text-slate-400 tabular-nums dark:text-slate-500">${formatDuration(step.durationSec)}</span>` : ""}
  </a>
</li>`;
}

function sidebarChapter(chapter: Chapter, i: number): string {
  return `<li data-chapter="${i}" class="group/chapter">
  <div class="flex items-baseline gap-2 px-3 pb-1 pt-4 text-xs font-semibold uppercase tracking-wide text-slate-500 group-first/chapter:pt-0 group-data-[active]/chapter:text-accent-700 dark:text-slate-400 dark:group-data-[active]/chapter:text-accent-300">
    <span class="flex-1">${e(chapter.title)}</span>
    <span data-chapter-progress class="font-normal normal-case tabular-nums text-slate-400 dark:text-slate-500">${chapter.steps.length} steps</span>
  </div>
  <ol class="space-y-1">
${chapter.steps.map(sidebarItem).join("\n")}
  </ol>
</li>`;
}

function section(
  step: Step,
  chapter: Chapter,
  chapterIndex: number,
  showChapter: boolean,
): string {
  const key = e(step.key);
  return `<section id="${key}" data-step="${key}" data-chapter="${chapterIndex}" data-duration="${step.durationSec}" aria-labelledby="${key}--title">
${showChapter ? `<p class="not-prose mb-2 text-xs font-semibold uppercase tracking-wide text-accent-600 dark:text-accent-400">Chapter ${chapterIndex + 1} · ${e(chapter.title)}</p>` : ""}
<h2 id="${key}--title" tabindex="-1" class="focus:outline-none${showChapter ? " mt-0" : ""}">${step.index}. ${e(step.title)}</h2>
${step.html}
</section>`;
}

export function renderLab(lab: Lab, accent: Accent): string {
  const grouped = lab.chapters.length > 1;
  const sidebar = grouped
    ? lab.chapters.map(sidebarChapter).join("\n")
    : lab.steps.map(sidebarItem).join("\n");
  const sections = lab.chapters
    .flatMap((chapter, ci) =>
      chapter.steps.map((step) => section(step, chapter, ci, grouped)),
    )
    .join("\n");
  return `<!doctype html>
<html lang="en" data-accent="${accent}" class="scroll-pt-20">
${head({ title: lab.title, description: lab.summary, assetsPath: "../assets" })}
<body class="min-h-screen bg-white text-slate-800 antialiased dark:bg-slate-950 dark:text-slate-200" data-lab-id="${e(lab.id)}">
<a href="#content" class="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-accent-600 focus:px-4 focus:py-2 focus:text-white">Skip to content</a>

<header class="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
  <div class="flex h-14 items-center gap-2 px-3 sm:px-4">
    <button type="button" data-drawer-toggle aria-controls="sidebar" aria-expanded="false" aria-label="Show steps" class="hidden rounded-lg p-2 text-slate-500 hover:bg-slate-100 max-lg:js:inline-flex dark:hover:bg-slate-800">${icons.menu}</button>
    <a href="../index.html" aria-label="All labs" class="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white">${icons.back}</a>
    <h1 class="truncate text-base font-semibold">${e(lab.title)}</h1>
    <div class="ml-auto flex shrink-0 items-center gap-1 sm:gap-3">
      <span data-time-left class="hidden items-center gap-1.5 text-sm text-slate-500 tabular-nums sm:inline-flex dark:text-slate-400">${icons.clock}<span>${formatDuration(lab.totalDurationSec)}</span></span>
      ${lab.feedback ? `<a href="${e(lab.feedback)}" target="_blank" rel="noopener noreferrer" class="hidden rounded-lg px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 sm:inline-block dark:text-slate-300 dark:hover:bg-slate-800">Report issue</a>` : ""}
      ${themeToggle}
    </div>
  </div>
  <div class="h-1 bg-slate-100 dark:bg-slate-800">
    <div data-progress role="progressbar" aria-label="Lab progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" class="h-full w-0 bg-gradient-to-r from-accent-500 to-accent-alt transition-[width] duration-500 ease-out motion-reduce:transition-none"></div>
  </div>
</header>

<div class="flex">
  <div data-drawer-backdrop class="fixed inset-x-0 bottom-0 top-[3.75rem] z-30 hidden bg-slate-900/40 backdrop-blur-sm data-[open]:max-lg:block"></div>
  <nav id="sidebar" data-sidebar aria-label="Steps" class="hidden w-72 shrink-0 overflow-y-auto border-r border-slate-200 bg-white transition-transform motion-reduce:transition-none js:block lg:sticky lg:top-[3.75rem] lg:block lg:h-[calc(100vh-3.75rem)] max-lg:js:fixed max-lg:js:bottom-0 max-lg:js:left-0 max-lg:js:top-[3.75rem] max-lg:js:z-40 max-lg:js:-translate-x-full data-[open]:translate-x-0 data-[open]:shadow-xl dark:border-slate-800 dark:bg-slate-950">
    <ol class="space-y-1 p-4">
${sidebar}
    </ol>
    <div class="hidden border-t border-slate-200 p-4 js:block dark:border-slate-800">
      <button type="button" data-reset hidden class="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-slate-100">${icons.reset}Reset progress</button>
    </div>
  </nav>

  <main id="content" class="min-w-0 flex-1 px-5 py-10 sm:px-8 lg:px-12">
    <article class="prose prose-slate mx-auto max-w-3xl dark:prose-invert prose-headings:scroll-mt-20 prose-a:text-accent-600 prose-pre:rounded-xl prose-pre:border prose-pre:border-slate-200 prose-img:rounded-xl dark:prose-a:text-accent-400 dark:prose-pre:border-slate-800">
${sections}
    </article>
    <nav aria-label="Step navigation" class="mx-auto mt-12 hidden max-w-3xl items-center justify-between border-t border-slate-200 pt-6 js:flex dark:border-slate-800">
      <button type="button" data-prev class="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:invisible dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-900">${icons.arrowLeft}Back</button>
      <button type="button" data-next class="group/next inline-flex items-center gap-1.5 rounded-lg bg-accent-600 px-5 py-2 text-sm font-medium text-white shadow-sm hover:bg-accent-500">${icons.flag}<span data-next-label>Next</span>${icons.arrowRight}</button>
      <a href="../index.html" data-catalog-link hidden class="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-5 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-500">${icons.home}Back to all labs</a>
    </nav>
  </main>
</div>
<dialog data-lightbox aria-label="Image viewer" class="h-dvh max-h-none w-screen max-w-none cursor-zoom-out items-center justify-center bg-transparent p-4 open:flex backdrop:bg-slate-950/85 backdrop:backdrop-blur-sm sm:p-10">
  <img alt="" class="max-h-full max-w-full rounded-xl object-contain shadow-2xl">
  <button type="button" aria-label="Close" class="fixed right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20">${icons.close}</button>
</dialog>
</body>
</html>
`;
}
