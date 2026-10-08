---
id: migrate-from-claat
title: Migrate a codelab from claat
summary: Convert an existing claat codelab to labforge in a few minutes, without changing its URL.
authors: [Ludal]
categories: [migration]
tags: [claat, intermediate]
feedback: https://github.com/iamludal/labforge/issues
---

# Migrate a codelab from claat

## Overview
Duration: 1:00

claat, Google's codelab tool, is archived and no longer maintained. Good news: labforge reads almost the same Markdown, and publishes each lab at the same `/<id>/` URL.

In this lab, you will migrate a claat codelab step by step.

## Get the Markdown source
Duration: 2:00

If your codelab is already written in claat Markdown, copy it into your labs folder:

```text
labs/
└── first-web-app/
    ├── first-web-app.md
    └── img/
```

If it lives in Google Docs, export it one last time with claat:

```bash
claat export -f md <google-doc-id>
```

## Convert the metadata
Duration: 3:00

claat reads its metadata from `key: value` lines at the top of the file:

```text
summary: Build your first web app
id: first-web-app
categories: Web, Cloud
status: Published
authors: Jane Doe
feedback link: https://github.com/acme/codelabs/issues
```

labforge uses a YAML frontmatter instead. Wrap the block between `---` lines and adjust a few fields:

```yaml
---
id: first-web-app
title: Build your first web app
summary: Build your first web app
categories: [Web, Cloud]
status: published
authors: [Jane Doe]
feedback: https://github.com/acme/codelabs/issues
---
```

| claat           | labforge       |
| --------------- | -------------- |
| `Web, Cloud`    | `[Web, Cloud]` |
| `Published`     | `published`    |
| `feedback link` | `feedback`     |
| `# Title` only  | `title` field  |

## Adapt the content
Duration: 3:00

Steps (`## Title`) and `Duration: mm:ss` lines work as they are. labforge does not render raw HTML, so replace claat's info boxes with blockquotes:

```markdown
> **Tip:** run the tests before deploying.
```

Also remove the `<!-- ---- -->` separators between steps, and rewrite durations given in minutes only: `Duration: 5` becomes `Duration: 5:00`.

## Preview and fix
Duration: 2:00

Start the dev server:

```bash
npx labforge serve labs
```

labforge validates every lab and points to the exact field to fix:

```text
error: Invalid frontmatter in …/first-web-app.md:
  - status: Invalid option: expected one of "draft"|"published"
```

Fix the reported issues: the page reloads on every save.

## Wrap up
Duration: 0:30

Your codelab now builds with labforge, keeps its URL, and gains dark mode, saved progress and a catalog for free. Repeat for your other codelabs, then deploy.
