# 🚚 Migrating from claat

This guide helps you move codelabs written for Google's [`claat`](https://github.com/googlecodelabs/tools) to labforge.

- [Why migrate?](#-why-migrate)
- [What stays the same](#-what-stays-the-same)
- [Step 1: get Markdown sources](#-step-1-get-markdown-sources)
- [Step 2: convert the metadata](#-step-2-convert-the-metadata)
- [Step 3: adapt the content](#-step-3-adapt-the-content)
- [Step 4: build and check](#-step-4-build-and-check)
- [Feature mapping](#-feature-mapping)
- [Migration checklist](#-migration-checklist)

## 🤔 Why migrate?

- **claat is no longer maintained.** The `googlecodelabs/tools` repository was archived in December 2025 and is now read-only: no bug fixes, no security updates.
- **Markdown in Git is the source of truth.** No Google Docs round trips: write in your editor, review in pull requests, publish from CI.
- **Everything is included.** labforge generates the lab catalog, ships a live-reload dev server, and needs nothing but Node.js.
- **Self-contained output.** claat pages load web components, fonts and scripts from Google domains at runtime. labforge pages only load their own CSS and a small script, and still display every step when JavaScript is disabled.
- **A modern reading experience.** Dark mode, a progress bar, remaining time, per-step completion, shareable step URLs, a mobile drawer and keyboard navigation.
- **Large labs stay manageable.** Split a lab into one file per chapter, with links between chapters that also work on GitHub.

## ✅ What stays the same

Most of your content carries over as is:

| claat Markdown                       | labforge                                            |
| ------------------------------------ | --------------------------------------------------- |
| `# Title`                            | Same (optional, the title comes from the metadata). |
| `## Step title` starts a step        | Same.                                               |
| `Duration: mm:ss` below a step title | Same.                                               |
| Fenced code blocks with a language   | Same, highlighted at build time.                    |
| Images with relative paths           | Same, copied to the output.                         |
| Output in `<id>/index.html`          | Same: published lab URLs do not change.             |

## 📥 Step 1: get Markdown sources

If your codelabs are already written in claat Markdown, skip to the next step.

If they live in Google Docs, export them to Markdown with claat one last time:

```bash
claat export -f md <google-doc-id>
```

Then move each codelab into your labs directory, ideally one folder per lab with its images:

```text
labs/
└── my-codelab/
    ├── my-codelab.md
    └── img/
```

## 🔄 Step 2: convert the metadata

claat reads its metadata from a block of `key: value` lines at the top of the file. labforge uses a standard YAML frontmatter, delimited by `---` lines.

**Before (claat):**

```text
summary: Build your first web app
id: first-web-app
categories: Web, Cloud
tags: beginner
status: Published
authors: Jane Doe
feedback link: https://github.com/acme/codelabs/issues
analytics account: UA-12345678-1

# Build your first web app

<!-- ------------------------ -->
## Overview
Duration: 2:00
```

**After (labforge):**

```markdown
---
id: first-web-app
title: Build your first web app
summary: Build your first web app
categories: [Web, Cloud]
tags: [beginner]
status: published
authors: [Jane Doe]
feedback: https://github.com/acme/codelabs/issues
---

# Build your first web app

## Overview
Duration: 2:00
```

Field by field:

| claat               | labforge     | Notes                                                                                           |
| ------------------- | ------------ | ----------------------------------------------------------------------------------------------- |
| `id`                | `id`         | Required. Lowercase letters, digits and dashes only: replace underscores and uppercase letters. |
| `# Title`           | `title`      | Required in the frontmatter. You can keep the `#` heading too.                                  |
| `summary`           | `summary`    | Quote it if it contains `: `.                                                                   |
| `authors`           | `authors`    | A string or a list.                                                                             |
| `categories`        | `categories` | Use a YAML list: `[Web, Cloud]`. A comma-separated string would be a single category.           |
| `tags`              | `tags`       | Use a YAML list.                                                                                |
| `status`            | `status`     | `published` or `draft`, in lowercase. See below.                                                |
| `feedback link`     | `feedback`   | Must be an `http(s)` URL.                                                                       |
| `environments`      | (none)       | Remove it.                                                                                      |
| `analytics account` | (none)       | Remove it.                                                                                      |

Status values:

| claat status | labforge status                                                     |
| ------------ | ------------------------------------------------------------------- |
| `Published`  | `published`                                                         |
| `Draft`      | `draft`                                                             |
| `Hidden`     | `draft`: built and reachable by URL, but not listed in the catalog. |
| `Deprecated` | `draft` to hide it, or remove the lab.                              |

Unknown fields are ignored, so leftover claat keys do not break the build, but they have no effect either.

## 🧩 Step 3: adapt the content

labforge uses standard Markdown and does not render raw HTML. A few claat-specific constructs need a small change:

| claat                                                              | labforge                                                                                    |
| ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------- |
| `Duration: 5` (minutes only) or `Duration: 1:05:00`                | Use `mm:ss`: `Duration: 5:00`, `Duration: 65:00`. Other formats are rendered as plain text. |
| `<!-- ---- -->` separators between steps                           | Remove them. They are not rendered, but labforge warns about content before the first step. |
| Info boxes: `<aside class="positive">`, `<aside class="negative">` | Use a blockquote: `> **Tip:** …` or `> **Warning:** …`.                                     |
| Buttons: `<button>[Download](url)</button>`                        | Use a regular link: `[Download the sample](url)`.                                           |
| YouTube videos: `<video id="…">`                                   | Use a link, or an image linking to the video.                                               |
| `Environment:` lines and conditional steps                         | Remove them, or maintain separate labs.                                                     |
| Fragment imports (`<<file.md>>`)                                   | Use [chapters](authoring.md#-multi-chapter-labs) to split a lab into several files.         |
| Inline surveys                                                     | Not supported. Link to an external form if needed.                                          |
| "What you'll learn" check lists                                    | Use a regular list or a task list (`- [ ] …`).                                              |
| Links to steps by number (`#3`)                                    | Link to the step title: `[Setup](#set-up-the-environment)`.                                 |

> [!IMPORTANT]
> Step URLs change: claat uses step numbers (`/my-codelab/#3`), labforge uses step titles (`/my-codelab/#deploy-the-app`). Links to a lab's root URL keep working; deep links to a specific step open the lab on the reader's last step, or the first one.

## 🧪 Step 4: build and check

Start the dev server and review each lab:

```bash
npx labforge serve labs
```

labforge validates the metadata of every lab and stops with an explicit message if something is wrong:

```text
error: Invalid frontmatter in /home/jane/my-labs/labs/first-web-app/first-web-app.md:
  - status: Invalid option: expected one of "draft"|"published"
```

Fix the reported issues, check the warnings, then deploy the output as described in the [deployment guide](deployment.md).

## 🔀 Feature mapping

| Feature                              | claat                           | labforge                                          |
| ------------------------------------ | ------------------------------- | ------------------------------------------------- |
| Source format                        | Google Docs, claat Markdown     | Markdown (GFM) + YAML frontmatter                 |
| Installation                         | Go binary                       | npm package, Node.js ≥ 20.12                      |
| Lab catalog                          | Separate project                | Built in                                          |
| Dev server                           | Static server                   | Live reload                                       |
| Syntax highlighting                  | In the browser                  | At build time, light and dark themes              |
| Dark mode                            | No                              | Yes                                               |
| Progress                             | Resume last step                | Resume last step, completed steps, remaining time |
| Multi-file labs                      | Fragment imports (content only) | Chapters with cross-file links                    |
| Footnotes, task lists, strikethrough | No                              | Yes                                               |
| Works without JavaScript             | No                              | Yes                                               |
| Third-party requests                 | Google CDN, fonts and scripts   | None                                              |
| Google Docs source                   | Yes                             | No                                                |
| Analytics, surveys, environments     | Yes                             | No                                                |
| Info boxes, buttons, embedded videos | Yes                             | No (use blockquotes and links)                    |

## 📋 Migration checklist

- [ ] Each lab has a YAML frontmatter with a valid `id` and a `title`.
- [ ] `categories`, `tags` and `authors` are YAML lists.
- [ ] `status` is `published` or `draft`; `feedback link` is renamed to `feedback`.
- [ ] Durations use the `mm:ss` format.
- [ ] Raw HTML (`<aside>`, `<button>`, `<video>`, comments) is replaced or removed.
- [ ] Images are inside the lab folder.
- [ ] `npx labforge build labs` succeeds without warnings.
- [ ] Every lab has been reviewed in the browser.
