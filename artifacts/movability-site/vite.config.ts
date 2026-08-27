import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

const rawPort = process.env.PORT;
const port = Number(rawPort);

// `vite build` does not start a server, so it does not need a port — only the
// dev and preview servers do. Requiring PORT at build time breaks CI and
// hosting providers that only set it at runtime.
const isServing = process.argv.includes("serve") || process.argv.includes("preview");

if (isServing && (!rawPort || Number.isNaN(port) || port <= 0)) {
  throw new Error(
    `PORT environment variable is required to serve the site (got: "${rawPort ?? ""}").`,
  );
}

// Served from the domain root unless told otherwise.
const basePath = process.env.BASE_PATH || "/";

export default defineConfig({
  base: basePath,
  plugins: [
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
          await import("@replit/vite-plugin-dev-banner").then((m) =>
            m.devBanner(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      "@assets": path.resolve(import.meta.dirname, "..", "..", "attached_assets"),
    },
    dedupe: ["react", "react-dom"],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    // Keep the big, rarely-changing libraries in their own files so a content
    // or copy change doesn't force everyone to re-download React as well.
    rollupOptions: {
      output: {
        manualChunks: {
          react: ["react", "react-dom", "wouter"],
          motion: ["framer-motion"],
        },
      },
    },
  },
  server: {
    port: port || 5173,
    strictPort: true,
    // In dev the API runs as a separate process; forward /api to it so the
    // site and the CMS talk to each other on one origin.
    proxy: {
      "/api": {
        target: `http://127.0.0.1:${process.env.API_PORT ?? 8080}`,
        changeOrigin: true,
      },
    },
    host: "0.0.0.0",
    allowedHosts: true,
    fs: {
      strict: true,
    },
  },
  preview: {
    port: port || 4173,
    host: "0.0.0.0",
    allowedHosts: true,
  },
});
