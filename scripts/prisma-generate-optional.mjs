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

console.warn(
  "\n[prisma-generate-optional] prisma generate failed (often EPERM on Windows when the query engine DLL is locked).",
);
console.warn("Stop dev servers / Prisma Studio / IDEs, then run: npx prisma generate\n");
process.exit(0);
