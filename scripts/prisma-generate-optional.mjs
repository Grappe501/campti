/**
 * Runs `prisma generate` but does not fail the npm lifecycle when Windows holds a lock
 * on `query_engine-windows.dll.node` (EPERM). CI/Linux should succeed; devs should retry
 * after stopping `next dev`, Prisma Studio, and IDE processes using the client.
 */
import { spawnSync } from "node:child_process";

const r = spawnSync("npx", ["prisma", "generate"], {
  stdio: "inherit",
  shell: true,
  env: process.env,
});

if (r.status === 0) {
  process.exit(0);
}

const isWindows = process.platform === "win32";

console.warn(
  "\n[prisma-generate-optional] prisma generate failed (often EPERM on Windows when the query engine DLL is locked).",
);
console.warn("Stop dev servers / Prisma Studio / IDEs, then run: npx prisma generate\n");

// Netlify/Linux CI must fail the build if the client is not generated; Windows may still hit DLL locks.
if (!isWindows) {
  process.exit(r.status ?? 1);
}

process.exit(0);
