---
id: deploy-to-github-pages
title: Publish your labs on GitHub Pages
summary: Build your labs in GitHub Actions and publish them on GitHub Pages on every push.
authors: [Ludal]
categories: [deployment]
tags: [ci, github]
feedback: https://github.com/iamludal/labforge/issues
---

# Publish your labs on GitHub Pages

## Overview
Duration: 1:00

labforge generates a plain static site, so any static host can serve it. In this lab, you will publish your labs on **GitHub Pages**, rebuilt automatically on every push.

What you will learn:

- How to prepare a repository for labforge
- How to build your labs in GitHub Actions
- How to deploy the result to GitHub Pages

What you need:

- [x] A GitHub account
- [x] A repository containing a `labs/` folder
- [ ] Ten minutes

## Prepare the repository
Duration: 2:00

Add labforge as a development dependency, so the build uses a fixed version:

```bash
npm install --save-dev labforge
```

Then make sure the build works locally:

```bash
npx labforge build labs -o dist
```

The `dist` folder is generated on each build: add it to your `.gitignore`.

```text
node_modules/
dist/
```

## Add the workflow
Duration: 3:00

Create `.github/workflows/labs.yml`:

```yaml
name: Deploy labs

on:
  push:
    branches: [main]

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - uses: actions/checkout@v7
      - uses: actions/setup-node@v7
        with:
          node-version: lts/*
      - run: npm ci
      - run: npx labforge build labs -o dist
      - uses: actions/upload-pages-artifact@v5
        with:
          path: dist
      - id: deployment
        uses: actions/deploy-pages@v5
```

## Enable GitHub Pages
Duration: 1:00

In your repository, open **Settings → Pages** and set **Source** to **GitHub Actions**.

> **Note:** this setting is only needed once per repository.

## Publish and share
Duration: 2:00

Commit and push the workflow:

```bash
git add .github/workflows/labs.yml package.json package-lock.json .gitignore
git commit -m "ci: deploy labs to GitHub Pages"
git push
```

Follow the run in the **Actions** tab. Once it succeeds, your labs are online at `https://<user>.github.io/<repository>/`.

Every step has its own URL, so you can share a link to a precise step of a lab, for example `…/my-lab/#install-the-cli`.

## Congratulations
Duration: 0:30

Your labs are now published automatically: write, push, and readers get the new version a minute later.
