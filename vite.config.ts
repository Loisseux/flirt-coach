// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, cloudflare (build-only),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... } }) if needed.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { loadEnv, type Plugin } from "vite";

/** Directory containing this config file — stable even when `vite dev` is run from another cwd. */
const projectRoot = path.dirname(fileURLToPath(import.meta.url));

/**
 * Lovable's preset loads `.env` via `loadEnv(mode, process.cwd(), ...)`. If the shell cwd is not
 * the project root, `import.meta.env.VITE_*` stays empty. Reload from `projectRoot` and merge `define`
 * so client/server bundles match Vite's usual envDir behavior (next to vite.config).
 */
function viteEnvFromProjectRoot(): Plugin {
  return {
    name: "vite-env-from-project-root",
    config(_cfg, { mode }) {
      const loaded = loadEnv(mode, projectRoot, "VITE_");
      const dotEnvPath = path.join(projectRoot, ".env");

      const loadedSummary = Object.fromEntries(
        Object.entries(loaded).map(([key, value]) => [
          key,
          typeof value === "string"
            ? { length: value.length, prefix: value.length ? `${value.slice(0, 4)}…` : "(empty)" }
            : { value },
        ]),
      );

      console.log("[vite-env-from-project-root] config()", {
        projectRoot,
        mode,
        dotEnvPath,
        dotEnvExists: fs.existsSync(dotEnvPath),
        loadedKeys: Object.keys(loaded).sort(),
        loadedSummary,
      });

      return {
        define: Object.fromEntries(
          Object.entries(loaded).map(([key, value]) => [
            `import.meta.env.${key}`,
            JSON.stringify(value),
          ]),
        ),
      };
    },
  };
}

// Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
// @cloudflare/vite-plugin builds from this — wrangler.jsonc main alone is insufficient.
export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
  },
  vite: {
    envDir: projectRoot,
    plugins: [viteEnvFromProjectRoot()],
  },
});
