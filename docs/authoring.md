# 📝 Authoring guide

This guide covers everything you need to write labs with labforge: file layout, metadata, steps, chapters, links, images and code.

- [Project layout](#-project-layout)
- [Lab file](#-lab-file)
- [Frontmatter reference](#-frontmatter-reference)
- [Steps and durations](#-steps-and-durations)
- [Markdown support](#-markdown-support)
- [Code blocks](#-code-blocks)
- [Images](#-images)
- [Links](#-links)
- [Multi-chapter labs](#-multi-chapter-labs)
- [Step URLs and saved progress](#-step-urls-and-saved-progress)
- [Drafts and the catalog](#-drafts-and-the-catalog)
- [Errors and warnings](#-errors-and-warnings)

## 📁 Project layout

labforge reads a single input directory (`labs` by default) and scans it recursively for Markdown files. A layout with one folder per lab keeps images and chapters close to their text:

```text
labs/
├── getting-started/
│   ├── getting-started.md
│   └── img/
│       └── architecture.svg
└── kubernetes-101/
    ├── index.md            # lab file: frontmatter + list of chapters
    ├── 01-setup.md
    └── chapters/
        ├── 02-deploy.md
        ├── 03-scale.md
        └── img/
            └── pods.png
```

Every `.md` file found in the input directory must be either a **lab** (it has an `id` in its frontmatter) or a **chapter** listed by a lab. Two exceptions are skipped: files named `README.md` (case-insensitive) and anything under `node_modules`. Keep other notes outside the input directory.

## 📄 Lab file

A lab is a Markdown file that starts with a YAML frontmatter block. Every `##` heading starts a new step:

````markdown
---
id: getting-started
title: Getting started with labforge
summary: Write your first step-by-step lab in Markdown.
authors: [Jane Doe]
categories: [tooling]
tags: [beginner, markdown]
feedback: https://github.com/acme/labs/issues
---

# Getting started with labforge

## Overview
Duration: 2:00

In this lab you will learn how to write a lab.

## Install the CLI
Duration: 3:00

```bash
npm install --save-dev labforge
```
````

The `# Title` heading is optional and is not rendered: the page title comes from the `title` field. Any other content placed before the first `##` heading is ignored, with a warning.

## 🧾 Frontmatter reference

| Field        | Type                         | Default     | Description                                                                                                                                              |
| ------------ | ---------------------------- | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`         | string                       | (required)  | Unique lab identifier, used as the output folder name and in saved progress. Lowercase letters, digits and dashes only, starting with a letter or digit. |
| `title`      | string                       | (required)  | Lab title, shown in the header, the browser tab and the catalog.                                                                                         |
| `summary`    | string                       |             | Short description shown in the catalog and used as the page `<meta name="description">`.                                                                 |
| `authors`    | string or list of strings    | `[]`        | Shown on the catalog card.                                                                                                                               |
| `categories` | string or list of strings    | `[]`        | Shown as tags on the catalog card.                                                                                                                       |
| `tags`       | string or list of strings    | `[]`        | Shown as tags on the catalog card.                                                                                                                       |
| `status`     | `published` or `draft`       | `published` | Drafts are built but not listed in the catalog.                                                                                                          |
| `feedback`   | `http(s)` URL                |             | Adds a "Report issue" link to the lab header.                                                                                                            |
| `chapters`   | list of relative `.md` paths |             | Turns the lab into a [multi-chapter lab](#-multi-chapter-labs).                                                                                          |

Unknown fields are ignored.

> [!TIP]
> A string such as `tags: a, b` is a single tag named `a, b`. Use a YAML list to declare several values: `tags: [a, b]`.

> [!TIP]
> Quote values that contain `: ` or start with a special YAML character, for example `summary: "Kubernetes: the basics"`.

## ⏳ Steps and durations

- Each `##` heading starts a step. Its text is the step title, shown in the sidebar and above the step content.
- Use `###` and deeper headings to structure the content of a step.
- To set the estimated time of a step, write `Duration: mm:ss` as the **first line right below the heading**:

  ```markdown
  ## Deploy the app
  Duration: 5:00
  ```

  Minutes can have any number of digits (`90:00`), seconds go from `00` to `59`. The keyword is case-insensitive.
- Steps without a duration simply show no time. The lab duration is the sum of its steps, rounded up to the minute when displayed.
- Readers see the remaining time in the header, based on the steps they have not completed yet.

## ✨ Markdown support

labforge supports [CommonMark](https://commonmark.org) and [GitHub Flavored Markdown](https://github.github.com/gfm/):

- emphasis, lists, blockquotes, horizontal rules, inline code;
- tables;
- task lists (`- [ ]` / `- [x]`): readers can tick unticked items, and their choices are saved with their progress;
- strikethrough (`~~text~~`);
- autolinks (`https://example.com`);
- footnotes (`[^1]`), which can be defined anywhere in the file;
- reference-style links and images.

For security, **raw HTML is not rendered** and all generated HTML is sanitized. Use Markdown constructs instead, for example a blockquote for a callout:

```markdown
> **Note:** this command needs administrator rights.
```

## 💻 Code blocks

Fenced code blocks are highlighted at build time with [Shiki](https://shiki.style), using the GitHub light and dark themes. Specify the language after the opening fence:

````markdown
```python
print("Hello, labforge")
```
````

Every language bundled with Shiki is supported (`bash`, `yaml`, `json`, `typescript`, `python`, `go`, `java`, `dockerfile`, `hcl`, and many more). Blocks without a language, or with an unknown one, are rendered as plain text. No JavaScript is needed to display highlighted code. Every code block also gets a button to copy its content, in its upper right corner.

## 📸 Images

Use regular Markdown images with a path relative to the Markdown file:

```markdown
![Architecture diagram](img/architecture.svg)
```

- Local images are copied to the output next to the lab page, preserving their relative path.
- Readers can click any image (unless it is inside a link) to view it full screen.
- They must live **inside the lab folder** (the folder containing the lab file). A missing image fails the build.
- Absolute URLs (`https://…`) and root-relative paths (`/…`) are kept as they are.

## 🔗 Links

External links work as usual. labforge also understands links between the files and steps of a lab, written exactly as you would on GitHub, so they work both in your repository and in the published lab:

| Link                                             | Result                                               |
| ------------------------------------------------ | ---------------------------------------------------- |
| `[Install](#install-the-cli)`                    | Step "Install the CLI" of the current file.          |
| `[Setup](01-setup.md)`                           | First step of the chapter `01-setup.md`.             |
| `[Deploy](chapters/02-deploy.md#push-the-image)` | Step "Push the image" of that chapter.               |
| `[Start](index.md)`                              | First step of the lab, when linking to the lab file. |

Fragments are matched against step titles using GitHub-style anchors: lowercase, punctuation removed, spaces replaced with dashes. When a chapter link has a fragment that matches no step, labforge prints a warning and links to the start of the chapter.

To link to another lab, link to its published page, for example `[Next lab](../kubernetes-101/index.html)`.

## 📚 Multi-chapter labs

Long labs are easier to write and review when split into several files. Declare the chapter files in the lab frontmatter, in reading order:

```yaml
---
id: kubernetes-101
title: Kubernetes 101
summary: Deploy and scale your first application on Kubernetes.
chapters:
  - 01-setup.md
  - chapters/02-deploy.md
  - chapters/03-scale.md
---

# Kubernetes 101
```

Rules:

- Chapter paths are relative to the lab file and must stay **inside the lab folder**.
- A chapter can only belong to one lab, and can only be listed once.
- Chapter files must not declare `id` or `chapters`. Every Markdown file that is not listed as a chapter is built as a standalone lab.
- Apart from its `#` title, the content of the lab file is ignored, with a warning.

Each chapter is a regular Markdown file whose `##` headings are steps. Its title comes from, in order:

1. a `title` field in its frontmatter,
2. its `#` heading,
3. its file name, without the numeric prefix (`02-deploy-the-app.md` becomes "Deploy the app").

```markdown
---
title: Deploy the application
---

## Build the image
Duration: 3:00

…
```

In the published lab, the sidebar groups steps by chapter and shows each chapter's progress, steps are numbered per chapter, and the "Next" button becomes "Next chapter" at the end of a chapter.

## 💾 Step URLs and saved progress

Each step has its own URL, built from its title: `/getting-started/#install-the-cli`. In multi-chapter labs, the chapter name is prepended: `/kubernetes-101/#deploy/build-the-image`, where `deploy` comes from the file name `02-deploy.md` without its numeric prefix. Duplicate titles get a numeric suffix (`#setup-2`).

Readers' progress (current step and completed steps) is saved in their browser's `localStorage`, using these step identifiers, and can be cleared with the **Reset progress** button at the bottom of the sidebar. As a result:

- adding, removing or reordering steps **does not reset** the progress of other steps;
- renumbering chapter files (`02-deploy.md` → `03-deploy.md`) keeps their URLs;
- renaming a step title or a chapter file changes its URL, and that step is no longer marked as completed.

## 📂 Drafts and the catalog

The build generates a catalog page (`index.html`) listing every **published** lab, sorted by title, with its summary, categories, tags, duration, number of chapters and steps, and authors. Each card also shows the reader's progress, read from their browser: **Not started**, **In progress** with the number of completed steps, or **Completed**.

Labs with `status: draft` are built like any other lab and are reachable at `/<id>/`, but are not listed in the catalog. Use them to share a work in progress with reviewers.

## 🚨 Errors and warnings

labforge validates your labs before writing anything, and fails with a message pointing to the faulty file:

```text
error: Invalid frontmatter in /home/jane/my-labs/labs/demo/demo.md:
  - id: must contain only lowercase letters, digits and dashes
```

Common errors:

| Message                                   | Fix                                                     |
| ----------------------------------------- | ------------------------------------------------------- |
| `Invalid frontmatter … id: …`             | Add an `id`, or list the file as a chapter of its lab.  |
| `no steps found`                          | Add at least one `##` heading.                          |
| `Duplicate lab id`                        | Give each lab a unique `id`.                            |
| `image "…" must be inside the lab folder` | Move the image into the lab folder.                     |
| `image not found`                         | Check the image path, relative to the Markdown file.    |
| `chapter not found`                       | Check the path in `chapters`, relative to the lab file. |

Warnings do not stop the build. They flag content that is ignored (text before the first step, content of a lab file that has chapters) and links to steps that do not exist.
