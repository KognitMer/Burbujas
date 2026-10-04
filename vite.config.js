import { defineConfig } from "vite";
import { readFileSync } from "node:fs";

const pkg = JSON.parse(readFileSync(new URL("./package.json", import.meta.url), "utf8"));

// base "./" => la carpeta dist funciona en cualquier ruta (GitHub Pages, WebView, iframe)
export default defineConfig({
  base: "./",
  define: { __APP_VERSION__: JSON.stringify(pkg.version) },
  build: { target: "es2020", sourcemap: true },
  test: { environment: "node", include: ["tests/**/*.test.js"] }
});
