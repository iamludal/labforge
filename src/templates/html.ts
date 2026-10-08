const ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

// Keep in sync with the [data-accent] rules of src/styles/app.css.
export const ACCENTS = [
  "blue",
  "indigo",
  "teal",
  "green",
  "orange",
  "rose",
  "violet",
] as const;

export type Accent = (typeof ACCENTS)[number];

export function e(value: string): string {
  return value.replace(/[&<>"']/g, (c) => ESCAPES[c]);
}

export function formatDuration(seconds: number): string {
  return seconds > 0 ? `${Math.ceil(seconds / 60)} min` : "";
}

// Runs before first paint to avoid a theme flash and to enable JS-only styles.
const BOOT_SCRIPT = `<script>(function(){var d=document.documentElement;d.classList.add('js');var t;try{t=localStorage.getItem('labforge:theme')}catch(_){}if(t==='dark'||(!t&&matchMedia('(prefers-color-scheme: dark)').matches))d.classList.add('dark')})()</script>`;

export function head({
  title,
  description,
  assetsPath,
}: {
  title: string;
  description?: string;
  assetsPath: string;
}): string {
  return `<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="generator" content="labforge">
<title>${e(title)}</title>
${description ? `<meta name="description" content="${e(description)}">` : ""}
<link rel="stylesheet" href="${assetsPath}/app.css">
${BOOT_SCRIPT}
<script src="${assetsPath}/app.js" defer></script>
</head>`;
}

const iconAttrs =
  'xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"';

export const icons = {
  menu: `<svg ${iconAttrs} class="size-5"><path d="M4 6h16M4 12h16M4 18h16"/></svg>`,
  back: `<svg ${iconAttrs} class="size-5"><path d="M15 18l-6-6 6-6"/></svg>`,
  check: `<svg ${iconAttrs} class="hidden size-3.5 group-data-[done]:block" stroke-width="3"><path d="M5 12l5 5L20 7"/></svg>`,
  clock: `<svg ${iconAttrs} class="size-4"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>`,
  reset: `<svg ${iconAttrs} class="size-4"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/></svg>`,
  arrowLeft: `<svg ${iconAttrs} class="size-4"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>`,
  arrowRight: `<svg ${iconAttrs} class="size-4 group-data-[last]/next:hidden"><path d="M5 12h14M12 5l7 7-7 7"/></svg>`,
  flag: `<svg ${iconAttrs} class="hidden size-4 group-data-[last]/next:block"><path d="M4 22V4"/><path d="M4 4h13l-2.5 4.5L17 13H4"/></svg>`,
  home: `<svg ${iconAttrs} class="size-4"><path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/><path d="M10 21v-6h4v6"/></svg>`,
  close: `<svg ${iconAttrs} class="size-5"><path d="M18 6 6 18M6 6l12 12"/></svg>`,
  checkCircle: `<svg ${iconAttrs} class="hidden size-4 group-data-[state=done]:block"><circle cx="12" cy="12" r="9"/><path d="M8.5 12.5l2.5 2.5 4.5-5"/></svg>`,
  sun: `<svg ${iconAttrs} class="hidden size-5 dark:block"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>`,
  moon: `<svg ${iconAttrs} class="size-5 dark:hidden"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>`,
};

export const themeToggle = `<button type="button" data-theme-toggle aria-label="Toggle dark mode" class="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white">${icons.moon}${icons.sun}</button>`;
