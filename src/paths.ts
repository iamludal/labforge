import { fileURLToPath } from "node:url";

export const ASSETS_DIR = fileURLToPath(new URL("../assets/", import.meta.url));
