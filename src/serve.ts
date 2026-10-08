import { watch } from "node:fs";
import { readFile, stat } from "node:fs/promises";
import { createServer, type ServerResponse } from "node:http";
import { extname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { build, type BuildOptions } from "./build/index.js";

const RELOAD_PATH = "/__labforge/reload";
const RELOAD_SCRIPT = `<script>new EventSource('${RELOAD_PATH}').onmessage=()=>location.reload()</script>`;

const MIME_TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
};

export async function serve(
  options: BuildOptions & { port: number },
): Promise<void> {
  const root = resolve(options.output);
  const inputDir = resolve(options.input);
  const relOutput = relative(inputDir, root);
  if (
    relOutput === "" ||
    (!relOutput.startsWith("..") && !isAbsolute(relOutput))
  ) {
    throw new Error(
      "The output directory must not be inside the input directory",
    );
  }

  const clients = new Set<ServerResponse>();
  let queue = Promise.resolve();

  const rebuild = () =>
    (queue = queue.then(async () => {
      const started = performance.now();
      try {
        const labs = await build(options);
        console.log(
          `built ${labs.length} lab(s) in ${Math.round(performance.now() - started)} ms`,
        );
        for (const client of clients) client.write("data: reload\n\n");
      } catch (err) {
        console.error(`error: ${(err as Error).message}`);
      }
    }));

  await rebuild();

  let timer: NodeJS.Timeout | undefined;
  watch(inputDir, { recursive: true }, () => {
    clearTimeout(timer);
    timer = setTimeout(rebuild, 100);
  });

  const server = createServer(async (req, res) => {
    let pathname: string;
    try {
      pathname = decodeURIComponent(
        new URL(req.url ?? "/", "http://localhost").pathname,
      );
    } catch {
      res.writeHead(400).end("Bad request");
      return;
    }

    if (pathname === RELOAD_PATH) {
      res.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      });
      clients.add(res);
      req.on("close", () => clients.delete(res));
      return;
    }

    let filePath = join(root, pathname);
    if (filePath !== root && !filePath.startsWith(root + sep)) {
      res.writeHead(403).end("Forbidden");
      return;
    }

    try {
      if ((await stat(filePath)).isDirectory()) {
        if (!pathname.endsWith("/")) {
          res.writeHead(301, { Location: `${pathname}/` }).end();
          return;
        }
        filePath = join(filePath, "index.html");
      }
      const ext = extname(filePath);
      let body: Buffer | string = await readFile(filePath);
      if (ext === ".html")
        body = body
          .toString("utf8")
          .replace("</body>", `${RELOAD_SCRIPT}</body>`);
      res.writeHead(200, {
        "Content-Type": MIME_TYPES[ext] ?? "application/octet-stream",
        "Cache-Control": "no-store",
      });
      res.end(body);
    } catch {
      res.writeHead(404).end("Not found");
    }
  });

  server.listen(options.port, "127.0.0.1", () => {
    console.log(
      `serving ${options.output} at http://localhost:${options.port}`,
    );
  });
}
