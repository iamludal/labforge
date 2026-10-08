# 🚀 Deployment

`labforge build` produces a plain static site. It needs no server-side logic, no rewrites and no environment variables, so it can be hosted anywhere that serves files.

```bash
npx labforge build labs -o dist
```

Good to know:

- **All URLs are relative**, so the site works at the root of a domain, under a sub-path (`https://example.com/labs/`), or opened directly from disk.
- **Step navigation uses URL fragments** (`#install-the-cli`): no rewrite rule is needed.
- `assets/app.css` and `assets/app.js` keep the same names between releases. If your host caches them aggressively, configure a short cache duration or purge the cache after upgrading labforge.

The examples below assume your labs are in `labs/` and labforge is a dev dependency of your project. If you prefer not to add a `package.json`, replace `npm ci` + `npx labforge` with `npx --yes labforge@latest`.

## 🐙 GitHub Pages

1. In your repository, open **Settings → Pages** and set **Source** to **GitHub Actions**.
2. Add `.github/workflows/labs.yml`:

```yaml
name: Deploy labs

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
      - uses: actions/setup-node@v7
        with:
          node-version: lts/*
          cache: npm
      - run: npm ci
      - run: npx labforge build labs -o dist
      - uses: actions/upload-pages-artifact@v5
        with:
          path: dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v5
```

Your labs are published at `https://<user>.github.io/<repository>/`. This is how the [labforge demo](https://iamludal.github.io/labforge/) is deployed, see [`.github/workflows/pages.yml`](../.github/workflows/pages.yml).

## 🦊 GitLab Pages

Add `.gitlab-ci.yml`:

```yaml
pages:
  image: node:lts
  script:
    - npm ci
    - npx labforge build labs -o public
  artifacts:
    paths:
      - public
  rules:
    - if: $CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH
```

> [!NOTE]
> labforge refuses to write into a non-empty directory it did not create. If your repository already has a `public/` folder, build into another folder and point GitLab Pages to it.

## 🌐 Netlify

Add `netlify.toml`:

```toml
[build]
  command = "npx labforge build labs -o dist"
  publish = "dist"
```

## 🌍 Vercel, Cloudflare Pages and similar hosts

Configure the project with:

| Setting          | Value                             |
| ---------------- | --------------------------------- |
| Build command    | `npx labforge build labs -o dist` |
| Output directory | `dist`                            |
| Node.js version  | 20.12 or later                    |

## 🪣 Any web server or object storage

Copy the content of `dist/` to your server (nginx, Apache, Caddy…) or to an object storage bucket configured for static website hosting (Amazon S3, Google Cloud Storage, Azure Storage…). No specific configuration is required.

To check a build locally before publishing, serve the folder with any static server, for example:

```bash
npx serve dist
```
