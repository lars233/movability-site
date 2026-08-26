import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import { mockupPreviewPlugin } from "./mockupPreviewPlugin";

const rawPort = process.env.PORT;
const port = Number(rawPort);

// `vite build` does not start a server, so it does not need a port — only the
// dev and preview servers do. Requiring PORT at build time breaks CI and
// hosting providers that only set it at runtime.
const isServing = process.argv.includes("serve") || process.argv.includes("preview") || process.argv.includes("dev");

if (isServing && (!rawPort || Number.isNaN(port) || port <= 0)) {
  throw new Error(
    `PORT environment variable is required to serve the sandbox (got: "${rawPort ?? ""}").`,
  );
}

const basePath = process.env.BASE_PATH || "/";

export default defineConfig({
  base: basePath,
  plugins: [
    mockupPreviewPlugin(),
    react(),
    tailwindcss(),
    runtimeErrorOverlay(),
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer({
              root: path.resolve(import.meta.dirname, ".."),
            }),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
    },
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist"),
    emptyOutDir: true,
  },
  server: {
    port: port || 5174,
    host: "0.0.0.0",
    allowedHosts: true,
    fs: {
      strict: true,
    },
  },
  preview: {
    port: port || 4174,
    host: "0.0.0.0",
    allowedHosts: true,
  },
});
