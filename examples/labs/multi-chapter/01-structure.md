---
title: Structure a multi-file lab
---

## Create the lab file
Duration: 2:00

The lab file holds the frontmatter and lists its chapters, in reading order:

```yaml
---
id: my-lab
title: My lab
chapters:
  - 01-setup.md
  - chapters/02-deploy.md
---
```

Chapter files must live inside the lab folder. Any content below the lab file's frontmatter, apart from its `#` title, is ignored.

## Write the chapters
Duration: 3:00

Each chapter is a regular Markdown file whose `##` headings are steps. Its title comes from, in order:

1. a `title` in its frontmatter,
2. its `#` heading,
3. its file name (`01-setup.md` becomes "Setup").

Chapter files must not declare an `id`: they are part of a lab, not labs of their own[^own].

[^own]: Every Markdown file that is not listed as a chapter is still built as a standalone lab.
