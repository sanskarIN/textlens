import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const host = process.env.TAURI_DEV_HOST;

const portableAliases = {
  "@tauri-apps/api/core": fileURLToPath(new URL("./src/platform/web-tauri-core.ts", import.meta.url)),
  "@tauri-apps/api/app": fileURLToPath(new URL("./src/platform/web-app.ts", import.meta.url)),
  "@tauri-apps/plugin-dialog": fileURLToPath(new URL("./src/platform/web-dialog.ts", import.meta.url)),
  "@tauri-apps/plugin-opener": fileURLToPath(new URL("./src/platform/web-opener.ts", import.meta.url)),
};

export default defineConfig(({ mode }) => ({
  clearScreen: false,
  base: mode === "web" ? "./" : undefined,
  resolve: {
    alias: mode === "web" || mode === "mobile" ? portableAliases : {},
  },
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host ? { protocol: "ws", host, port: 1421 } : undefined,
    watch: { ignored: ["**/src-tauri/**"] },
  },
  envPrefix: ["VITE_", "TAURI_"],
  build: {
    target: ["es2021", "chrome105", "safari13"],
    minify: "esbuild",
    sourcemap: false,
  },
}));
