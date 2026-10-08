#!/usr/bin/env node
import { parseArgs } from "node:util";
import { build } from "./build/index.js";
import { serve } from "./serve.js";
import { ACCENTS, type Accent } from "./templates/html.js";

const HELP = `Usage: labforge <command> [input-dir] [options]

Commands:
  build [dir]   Build all labs found in dir (default: labs)
  serve [dir]   Build, watch and serve with live reload

Options:
  -o, --out <dir>       Output directory (default: dist)
  -p, --port <port>     Dev server port (default: 4000)
      --accent <color>  Accent color: ${ACCENTS.join(", ")} (default: blue)
  -h, --help            Show this help
`;

async function main(): Promise<void> {
  const { positionals, values } = parseArgs({
    allowPositionals: true,
    options: {
      out: { type: "string", short: "o", default: "dist" },
      port: { type: "string", short: "p", default: "4000" },
      accent: { type: "string", default: "blue" },
      help: { type: "boolean", short: "h", default: false },
    },
  });

  const [command, input = "labs"] = positionals;
  if (values.help || !command) {
    console.log(HELP);
    return;
  }

  if (!(ACCENTS as readonly string[]).includes(values.accent))
    throw new Error(
      `Invalid accent: ${values.accent} (expected one of: ${ACCENTS.join(", ")})`,
    );
  const accent = values.accent as Accent;

  switch (command) {
    case "build": {
      const started = performance.now();
      const labs = await build({ input, output: values.out, accent });
      console.log(
        `built ${labs.length} lab(s) into ${values.out} in ${Math.round(performance.now() - started)} ms`,
      );
      break;
    }
    case "serve": {
      const port = Number(values.port);
      if (!Number.isInteger(port) || port < 1 || port > 65535)
        throw new Error(`Invalid port: ${values.port}`);
      await serve({ input, output: values.out, port, accent });
      break;
    }
    default:
      throw new Error(`Unknown command "${command}"\n\n${HELP}`);
  }
}

main().catch((err: Error) => {
  console.error(`error: ${err.message}`);
  process.exit(1);
});
