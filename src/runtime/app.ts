type Progress = { current: string; completed: string[]; tasks: string[] };
type StoredProgress = {
  current?: string | number;
  completed?: (string | number)[];
  tasks?: unknown;
};

const THEME_KEY = "labforge:theme";

const progressKey = (labId: string) => `labforge:progress:${labId}`;

// Older versions stored 1-based step numbers instead of step keys.
function stepIndex(keys: string[], value: unknown): number {
  if (typeof value === "string") return keys.indexOf(value);
  if (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= 1 &&
    value <= keys.length
  )
    return value - 1;
  return -1;
}

function completedSteps(keys: string[], saved?: StoredProgress): Set<number> {
  return new Set(
    (Array.isArray(saved?.completed) ? saved.completed : [])
      .map((value) => stepIndex(keys, value))
      .filter((i) => i >= 0),
  );
}

function readProgress(key: string): StoredProgress | undefined {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as StoredProgress) : undefined;
  } catch {
    return undefined;
  }
}

function writeProgress(key: string, value: Progress): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage can be unavailable (private mode, file:// in some browsers).
  }
}

// Lets readers toggle a task by clicking its text, and gives it an accessible name.
function wrapInLabel(input: HTMLInputElement): void {
  const label = document.createElement("label");
  input.before(label);
  let node: ChildNode | null = input;
  while (
    node &&
    !(node instanceof HTMLUListElement || node instanceof HTMLOListElement)
  ) {
    const next: ChildNode | null = node.nextSibling;
    label.append(node);
    node = next;
  }
}

const ICON_ATTRS =
  'xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class="size-4"';
const COPY_ICON = `<svg ${ICON_ATTRS}><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`;
const COPIED_ICON = `<svg ${ICON_ATTRS} stroke-width="2.5"><path d="M5 12l5 5L20 7"/></svg>`;

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // The Clipboard API is unavailable outside secure contexts, e.g. file://.
    const active = document.activeElement as HTMLElement | null;
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.append(area);
    area.select();
    const ok = document.execCommand("copy");
    area.remove();
    active?.focus();
    return ok;
  }
}

function initCopyButtons(): void {
  document
    .querySelectorAll<HTMLPreElement>("[data-step] pre")
    .forEach((pre) => {
      const wrapper = document.createElement("div");
      wrapper.className = "code-block group/code";
      pre.before(wrapper);

      const button = document.createElement("button");
      button.type = "button";
      button.className =
        "absolute right-2 top-2 inline-flex size-8 items-center justify-center rounded-md border border-slate-200 bg-white/90 text-slate-500 opacity-0 shadow-sm transition hover:text-slate-900 focus-visible:opacity-100 group-hover/code:opacity-100 data-[copied]:text-emerald-600 data-[copied]:opacity-100 motion-reduce:transition-none [@media(hover:none)]:opacity-100 dark:border-slate-700 dark:bg-slate-800/90 dark:text-slate-400 dark:hover:text-white dark:data-[copied]:text-emerald-400";
      button.setAttribute("aria-label", "Copy code");
      button.innerHTML = COPY_ICON;

      const status = document.createElement("span");
      status.className = "sr-only";
      status.setAttribute("role", "status");

      let timer: number | undefined;
      button.addEventListener("click", async () => {
        if (!(await copyText(pre.textContent ?? ""))) return;
        button.innerHTML = COPIED_ICON;
        button.toggleAttribute("data-copied", true);
        status.textContent = "Code copied to clipboard";
        clearTimeout(timer);
        timer = window.setTimeout(() => {
          button.innerHTML = COPY_ICON;
          button.removeAttribute("data-copied");
          status.textContent = "";
        }, 2000);
      });

      wrapper.append(pre, button, status);
    });
}

const EXPAND_ICON = `<svg ${ICON_ATTRS}><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>`;

function initLightbox(): void {
  const dialog = document.querySelector<HTMLDialogElement>("[data-lightbox]");
  const preview = dialog?.querySelector("img");
  if (!dialog || !preview) return;

  document
    .querySelectorAll<HTMLImageElement>("[data-step] img")
    .forEach((img) => {
      if (img.closest("a, button")) return;
      const button = document.createElement("button");
      button.type = "button";
      button.className = "zoomable group/zoom";
      button.setAttribute(
        "aria-label",
        img.alt ? `Enlarge image: ${img.alt}` : "Enlarge image",
      );
      img.before(button);
      button.append(img);
      button.insertAdjacentHTML(
        "beforeend",
        `<span class="pointer-events-none absolute right-3 top-3 grid size-9 place-items-center rounded-lg bg-slate-900/70 text-white opacity-0 shadow-sm backdrop-blur-sm transition group-hover/zoom:opacity-100 group-focus-visible/zoom:opacity-100 motion-reduce:transition-none">${EXPAND_ICON}</span>`,
      );
      button.addEventListener("click", () => {
        preview.src = img.currentSrc || img.src;
        preview.alt = img.alt;
        dialog.showModal();
      });
    });

  dialog.addEventListener("click", () => dialog.close());
}

function initThemeToggle(): void {
  document
    .querySelectorAll<HTMLButtonElement>("[data-theme-toggle]")
    .forEach((button) => {
      button.addEventListener("click", () => {
        const dark = document.documentElement.classList.toggle("dark");
        try {
          localStorage.setItem(THEME_KEY, dark ? "dark" : "light");
        } catch {
          // Ignore: theme just won't persist.
        }
      });
    });
}

function initLab(labId: string): void {
  const sections = Array.from(
    document.querySelectorAll<HTMLElement>("[data-step]"),
  );
  const links = Array.from(
    document.querySelectorAll<HTMLAnchorElement>("[data-step-link]"),
  );
  const prevButton = document.querySelector<HTMLButtonElement>("[data-prev]")!;
  const nextButton = document.querySelector<HTMLButtonElement>("[data-next]")!;
  const nextLabel = nextButton.querySelector<HTMLElement>("[data-next-label]")!;
  const progressBar = document.querySelector<HTMLElement>("[data-progress]")!;
  const timeLeft = document.querySelector<HTMLElement>(
    "[data-time-left] > span:last-child",
  );
  const sidebar = document.querySelector<HTMLElement>("[data-sidebar]")!;
  const backdrop = document.querySelector<HTMLElement>(
    "[data-drawer-backdrop]",
  )!;
  const drawerToggle = document.querySelector<HTMLButtonElement>(
    "[data-drawer-toggle]",
  )!;
  const resetButton = document.querySelector<HTMLButtonElement>("[data-reset]");
  const catalogLink = document.querySelector<HTMLAnchorElement>(
    "[data-catalog-link]",
  );

  const total = sections.length;
  const keys = sections.map((s) => s.dataset.step ?? "");
  const chapterOf = sections.map((s) => Number(s.dataset.chapter) || 0);
  const chapterItems = Array.from(
    sidebar.querySelectorAll<HTMLElement>("[data-chapter]"),
  );
  const durations = sections.map((s) => Number(s.dataset.duration) || 0);
  const storageKey = progressKey(labId);
  const saved = readProgress(storageKey);

  const toIndex = (value: unknown) => stepIndex(keys, value);
  const completed = completedSteps(keys, saved);
  let current = 0;

  // Unticked task list items become checkboxes the reader can tick.
  const savedTasks = Array.isArray(saved?.tasks) ? saved.tasks : [];
  const tasks = sections.flatMap((section) =>
    Array.from(
      section.querySelectorAll<HTMLInputElement>(
        'input[type="checkbox"][disabled]:not([checked])',
      ),
      (input, n) => ({ input, id: `${section.dataset.step}:${n}` }),
    ),
  );
  for (const { input, id } of tasks) {
    input.disabled = false;
    input.checked = savedTasks.includes(id);
    wrapInLabel(input);
    input.addEventListener("change", () => render());
  }

  const stepFromHash = (): number | undefined => {
    let hash: string;
    try {
      hash = decodeURIComponent(location.hash.slice(1));
    } catch {
      return undefined;
    }
    let i = keys.indexOf(hash);
    const legacy = /^step-(\d+)$/.exec(hash);
    if (i === -1 && legacy) i = toIndex(Number(legacy[1]));
    return i >= 0 ? i : undefined;
  };

  function setDrawer(open: boolean): void {
    sidebar.toggleAttribute("data-open", open);
    backdrop.toggleAttribute("data-open", open);
    drawerToggle.setAttribute("aria-expanded", String(open));
  }

  function render(): void {
    sections.forEach((s, i) => s.toggleAttribute("data-active", i === current));
    links.forEach((link) => {
      const i = keys.indexOf(link.dataset.stepLink ?? "");
      if (i === current) link.setAttribute("aria-current", "step");
      else link.removeAttribute("aria-current");
      link.toggleAttribute("data-done", completed.has(i));
    });
    chapterItems.forEach((item) => {
      const chapter = Number(item.dataset.chapter);
      let count = 0;
      let done = 0;
      chapterOf.forEach((c, i) => {
        if (c !== chapter) return;
        count++;
        if (completed.has(i)) done++;
      });
      item.toggleAttribute("data-active", chapterOf[current] === chapter);
      const label = item.querySelector<HTMLElement>("[data-chapter-progress]");
      if (label) label.textContent = `${done}/${count}`;
    });

    const percent = Math.round((completed.size / total) * 100);
    progressBar.style.width = `${percent}%`;
    progressBar.setAttribute("aria-valuenow", String(percent));

    if (timeLeft) {
      const remaining = durations.reduce(
        (sum, d, i) => (completed.has(i) ? sum : sum + d),
        0,
      );
      timeLeft.textContent =
        completed.size === total
          ? "Completed"
          : remaining > 0
            ? `${Math.ceil(remaining / 60)} min left`
            : "";
    }

    prevButton.disabled = current === 0;
    const last = current === total - 1;
    nextButton.toggleAttribute("data-last", last);
    nextLabel.textContent = last
      ? "Finish"
      : chapterOf[current + 1] !== chapterOf[current]
        ? "Next chapter"
        : "Next";

    const finished = current === total - 1 && completed.size === total;
    nextButton.hidden = finished;
    if (catalogLink) catalogLink.hidden = !finished;

    if (resetButton)
      resetButton.hidden =
        completed.size === 0 &&
        current === 0 &&
        !tasks.some((t) => t.input.checked);

    writeProgress(storageKey, {
      current: keys[current],
      completed: [...completed].map((i) => keys[i]),
      tasks: tasks.filter((t) => t.input.checked).map((t) => t.id),
    });
  }

  function show(i: number, focus: boolean): void {
    current = i;
    render();
    setDrawer(false);
    if (focus) {
      window.scrollTo({ top: 0 });
      sections[i]
        .querySelector<HTMLElement>("h2")
        ?.focus({ preventScroll: true });
    }
  }

  // Changing the hash pushes a history entry, so the browser back button works.
  const navigate = (i: number) => {
    if (i >= 0 && i < total) location.hash = keys[i];
  };

  function goNext(): void {
    completed.add(current);
    if (current < total - 1) navigate(current + 1);
    else {
      render();
      // The focused Next button is now hidden.
      if (catalogLink && !catalogLink.hidden) catalogLink.focus();
    }
  }

  window.addEventListener("hashchange", () => {
    const i = stepFromHash();
    if (i === undefined) return;
    if (location.hash !== `#${keys[i]}`)
      history.replaceState(null, "", `#${keys[i]}`);
    show(i, true);
  });

  prevButton.addEventListener("click", () => navigate(current - 1));
  nextButton.addEventListener("click", goNext);
  drawerToggle.addEventListener("click", () =>
    setDrawer(!sidebar.hasAttribute("data-open")),
  );
  backdrop.addEventListener("click", () => setDrawer(false));
  resetButton?.addEventListener("click", () => {
    if (!confirm("Reset your progress in this lab?")) return;
    completed.clear();
    for (const { input } of tasks) input.checked = false;
    if (current === 0) show(0, true);
    else navigate(0);
  });

  document.addEventListener("keydown", (event) => {
    if (
      event.defaultPrevented ||
      event.altKey ||
      event.ctrlKey ||
      event.metaKey ||
      event.shiftKey ||
      document.querySelector("dialog[open]")
    )
      return;
    if (
      (event.target as HTMLElement).closest(
        "input, textarea, select, [contenteditable]",
      )
    )
      return;
    if (event.key === "ArrowRight" && current < total - 1) goNext();
    else if (event.key === "ArrowLeft") navigate(current - 1);
    else if (event.key === "Escape") setDrawer(false);
  });

  const savedIndex = toIndex(saved?.current);
  const initial = stepFromHash() ?? (savedIndex >= 0 ? savedIndex : 0);
  history.replaceState(null, "", `#${keys[initial]}`);
  show(initial, false);
}

function initCatalog(): void {
  const cards = Array.from(
    document.querySelectorAll<HTMLElement>("[data-lab]"),
  );
  if (cards.length === 0) return;

  const render = () => {
    for (const card of cards) {
      const keys = (card.dataset.steps ?? "").split(" ").filter(Boolean);
      const done = completedSteps(
        keys,
        readProgress(progressKey(card.dataset.lab ?? "")),
      ).size;
      const state =
        done === 0 ? "new" : done === keys.length ? "done" : "progress";
      card.dataset.state = state;
      card.querySelector("[data-status-text]")!.textContent =
        state === "new"
          ? "Not started"
          : state === "done"
            ? "Completed"
            : "In progress";
      card.querySelector("[data-status-count]")!.textContent =
        state === "progress" ? `${done}/${keys.length} steps` : "";
      card.querySelector<HTMLElement>("[data-status-bar]")!.style.width =
        `${keys.length ? Math.round((done / keys.length) * 100) : 0}%`;
    }
  };

  render();
  // Pages restored from the back/forward cache do not rerun scripts.
  window.addEventListener("pageshow", (event) => {
    if (event.persisted) render();
  });
  window.addEventListener("storage", render);
}

initThemeToggle();
const labId = document.body.dataset.labId;
if (labId) {
  initCopyButtons();
  initLightbox();
  initLab(labId);
} else initCatalog();
