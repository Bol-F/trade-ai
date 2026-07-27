import { cpSync, existsSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";

const projectRoot = process.cwd();
const standaloneRoot = resolve(projectRoot, ".next", "standalone");
const serverPath = resolve(standaloneRoot, "server.js");

if (!existsSync(serverPath)) {
  throw new Error(
    "Standalone build not found. Run `npm run build` before `npm run start`.",
  );
}

const publicSource = resolve(projectRoot, "public");
if (existsSync(publicSource)) {
  cpSync(publicSource, resolve(standaloneRoot, "public"), { recursive: true });
}

cpSync(
  resolve(projectRoot, ".next", "static"),
  resolve(standaloneRoot, ".next", "static"),
  {
    recursive: true,
  },
);

process.chdir(standaloneRoot);
await import(pathToFileURL(serverPath).href);
