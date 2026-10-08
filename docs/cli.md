# 💻 CLI reference

```text
Usage: labforge <command> [input-dir] [options]
```

Run it with `npx labforge` when installed in a project, or `labforge` when installed globally (`npm install --global labforge`). labforge requires Node.js 20.12 or later.

## 🧰 Commands

### `labforge build [input-dir]`

Builds every lab found in `input-dir` (default: `labs`) into the output directory.

```bash
npx labforge build labs -o dist
# built 2 lab(s) into dist in 412 ms
```

### `labforge serve [input-dir]`

Builds the labs, serves the output directory and rebuilds on every change in `input-dir`. Open pages reload automatically after each rebuild.

```bash
npx labforge serve labs --port 4000
# built 2 lab(s) in 398 ms
# serving dist at http://localhost:4000
```

- The server listens on `127.0.0.1` only. It is meant for local authoring, not for production.
- Build errors are printed in the terminal and the server keeps running: fix the file and save to rebuild.
- The output directory must not be inside the input directory.

## 🔧 Options

| Option              | Default | Description                       |
| ------------------- | ------- | --------------------------------- |
| `-o, --out <dir>`   | `dist`  | Output directory.                 |
| `-p, --port <port>` | `4000`  | Port of the dev server (`serve`). |
| `--accent <color>`  | `blue`  | Accent color (see below).         |
| `-v, --version`     |         | Show the version.                 |
| `-h, --help`        |         | Show the help.                    |

## 🎨 Accent color

The accent color is used for links, buttons, the current step and progress bars. Pick one of `blue` (default), `indigo`, `teal`, `green`, `orange`, `rose` or `violet`:

```bash
npx labforge build labs --accent orange
```

The color applies to the catalog and every lab, in both light and dark mode. Completed steps always stay green.

## 🔍 Lab discovery

labforge scans the input directory recursively for `.md` files, skipping `README.md` files and `node_modules` folders. Each file must be either a lab (with an `id` in its frontmatter) or a chapter listed in the `chapters` field of a lab. See the [authoring guide](authoring.md).

## 📦 Output layout

```text
dist/
├── .labforge             # marker: this folder is managed by labforge
├── index.html            # catalog of published labs
├── assets/
│   ├── app.css
│   └── app.js
├── getting-started/
│   ├── index.html
│   └── img/
│       └── architecture.svg
└── kubernetes-101/
    └── index.html
```

- Each lab is written to `<id>/index.html`, with its local images next to it.
- All URLs are relative: the site can be hosted under any path, or opened directly from disk.
- The output directory is **emptied before each build**. To protect your files, labforge refuses to write into a non-empty directory that does not contain the `.labforge` marker.

## 🚦 Exit codes

| Code | Meaning                                                                           |
| ---- | --------------------------------------------------------------------------------- |
| `0`  | Success.                                                                          |
| `1`  | Invalid arguments, invalid lab, or build failure. The error is printed on stderr. |

## 📜 npm scripts

Add scripts to your `package.json` so everyone uses the same commands:

```json
{
  "scripts": {
    "labs:dev": "labforge serve labs",
    "labs:build": "labforge build labs -o dist"
  }
}
```
