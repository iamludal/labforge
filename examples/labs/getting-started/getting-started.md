---
id: getting-started
title: Getting started with labforge
summary: Write your first step-by-step lab in Markdown and publish it as a static site.
authors: [Ludal]
categories: [tooling]
tags: [beginner, markdown]
feedback: https://github.com/iamludal/labforge/issues
---

# Getting started with labforge

## Overview
Duration: 2:00

In this lab you will learn how to write a **labforge** lab and turn it into a static website.

What you will learn:

- How a lab file is structured
- How steps and durations work
- How to build and preview your labs

![Architecture](img/architecture.svg)

## Write the frontmatter
Duration: 3:00

Each lab starts with a YAML frontmatter block:

```yaml
---
id: my-first-lab
title: My first lab
summary: A short description shown in the catalog.
authors: [Jane Doe]
tags: [beginner]
---
```

The `id` becomes the folder name of the lab in the output directory.

## Add steps
Duration: 4:00

Every `##` heading starts a new step. Put a `Duration: mm:ss` line right below it to set the estimated time:

```markdown
## Create a cluster
Duration: 5:00

Run the following command...
```

| Element       | Meaning                     |
| ------------- | --------------------------- |
| `## Title`    | Starts a new step           |
| `Duration: …` | Estimated time for the step |

## Build and preview
Duration: 3:00

Build the site:

```bash
npx labforge build labs -o dist
```

Or start the dev server with live reload:

```bash
npx labforge serve labs
```

Then open `http://localhost:4000`.

## Congratulations
Duration: 1:00

You have written your first lab. Use the arrow keys `←` and `→` to move between steps.
