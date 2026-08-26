import path from "node:path";

// __dirname is set by esbuild banner to the dist/ directory at runtime:
// dist/ → ../ api-server/ → ../ artifacts/ → ../ workspace root
export const UPLOADS_DIR =
  process.env["UPLOADS_DIR"] ??
  path.join(__dirname, "..", "..", "..", "uploads");

// The built frontend. In production one service serves both the site and the
// API, so the API process serves these files.
export const STATIC_DIR =
  process.env["STATIC_DIR"] ??
  path.join(__dirname, "..", "..", "movability-site", "dist", "public");

// Content shipped with the repo, copied to CMS_DB_PATH the first time the app
// boots on an empty disk (e.g. a fresh Render deploy).
export const SEED_DB_PATH =
  process.env["SEED_DB_PATH"] ??
  path.join(__dirname, "..", "..", "..", "seed", "database.sqlite");
