import { DatabaseSync } from "node:sqlite";
import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import { SEED_DB_PATH } from "./config";
import { logger } from "./logger";

const DB_PATH =
  process.env["CMS_DB_PATH"] ??
  path.join(__dirname, "..", "..", "..", "database.sqlite");

let _db: DatabaseSync | null = null;

/**
 * On a fresh persistent disk there is no database yet. If the repo ships a
 * seed database, copy it once so a new deployment starts with the existing
 * blog posts, articles, case studies and reports instead of nothing.
 * An existing database is never touched.
 */
function seedIfMissing(): void {
  if (existsSync(DB_PATH)) return;

  mkdirSync(path.dirname(DB_PATH), { recursive: true });

  if (!existsSync(SEED_DB_PATH)) {
    logger.info({ path: DB_PATH }, "No database and no seed — starting empty.");
    return;
  }

  try {
    copyFileSync(SEED_DB_PATH, DB_PATH);
    logger.info({ from: SEED_DB_PATH, to: DB_PATH }, "Seeded a new CMS database.");
  } catch (err) {
    logger.error({ err }, "Could not seed the database — starting empty.");
  }
}

export function getDb(): DatabaseSync {
  if (_db) return _db;
  seedIfMissing();
  _db = new DatabaseSync(DB_PATH);
  _db.exec("PRAGMA journal_mode = WAL");
  _db.exec("PRAGMA foreign_keys = ON");
  migrate(_db);
  return _db;
}

function migrate(db: DatabaseSync) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS blog (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      name          TEXT    NOT NULL,
      slug          TEXT    NOT NULL UNIQUE,
      status        TEXT    NOT NULL DEFAULT 'draft',
      date          TEXT    NOT NULL,
      categories    TEXT    NOT NULL DEFAULT '[]',
      content       TEXT    NOT NULL DEFAULT '',
      feature_image TEXT    NOT NULL DEFAULT '',
      created_at    TEXT    NOT NULL DEFAULT (datetime('now')),
      updated_at    TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS articles (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      name          TEXT    NOT NULL,
      slug          TEXT    NOT NULL UNIQUE,
      status        TEXT    NOT NULL DEFAULT 'draft',
      date          TEXT    NOT NULL,
      categories    TEXT    NOT NULL DEFAULT '[]',
      content       TEXT    NOT NULL DEFAULT '',
      feature_image TEXT    NOT NULL DEFAULT '',
      created_at    TEXT    NOT NULL DEFAULT (datetime('now')),
      updated_at    TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS case_studies (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      name          TEXT    NOT NULL,
      slug          TEXT    NOT NULL UNIQUE,
      status        TEXT    NOT NULL DEFAULT 'draft',
      date          TEXT    NOT NULL,
      categories    TEXT    NOT NULL DEFAULT '[]',
      content       TEXT    NOT NULL DEFAULT '',
      feature_image TEXT    NOT NULL DEFAULT '',
      created_at    TEXT    NOT NULL DEFAULT (datetime('now')),
      updated_at    TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS reports (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      title         TEXT    NOT NULL,
      slug          TEXT    NOT NULL UNIQUE,
      subtitle      TEXT    NOT NULL DEFAULT '',
      image         TEXT    NOT NULL DEFAULT '',
      download_url  TEXT    NOT NULL DEFAULT '',
      status        TEXT    NOT NULL DEFAULT 'draft',
      created_at    TEXT    NOT NULL DEFAULT (datetime('now')),
      updated_at    TEXT    NOT NULL DEFAULT (datetime('now'))
    );
  `);

  // Add feature_image to tables created before this migration (idempotent)
  for (const table of ["blog", "articles", "case_studies"]) {
    try {
      db.exec(
        `ALTER TABLE ${table} ADD COLUMN feature_image TEXT NOT NULL DEFAULT ''`,
      );
    } catch {
      // Column already exists — safe to ignore
    }
  }

  // Optional link to a piece published elsewhere (e.g. Zag Daily). When set,
  // the site links straight out instead of opening an empty detail page.
  for (const table of ["blog", "articles", "case_studies"]) {
    try {
      db.exec(
        `ALTER TABLE ${table} ADD COLUMN external_url TEXT NOT NULL DEFAULT ''`,
      );
    } catch {
      // Column already exists — safe to ignore
    }
  }

  // Short introduction shown under the title on /blog and /articles list pages.
  // When empty the site falls back to the first part of the body text.
  for (const table of ["blog", "articles", "case_studies"]) {
    try {
      db.exec(
        `ALTER TABLE ${table} ADD COLUMN summary TEXT NOT NULL DEFAULT ''`,
      );
    } catch {
      // Column already exists — safe to ignore
    }
  }

  // Add date to reports table (idempotent — table may have been created without it)
  try {
    db.exec(`ALTER TABLE reports ADD COLUMN date TEXT NOT NULL DEFAULT ''`);
  } catch {
    // Column already exists — safe to ignore
  }

  // Authentication state: session revocation watermark, credential fingerprint
  db.exec(`
    CREATE TABLE IF NOT EXISTS auth_state (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  // Editable site content: singleton sections (hero, story, cta …)
  db.exec(`
    CREATE TABLE IF NOT EXISTS site_content (
      key        TEXT PRIMARY KEY,
      data       TEXT NOT NULL DEFAULT '{}',
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  // Editable site collections: testimonials, logos, verticals, services …
  db.exec(`
    CREATE TABLE IF NOT EXISTS site_items (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      collection TEXT    NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0,
      visible    INTEGER NOT NULL DEFAULT 1,
      data       TEXT    NOT NULL DEFAULT '{}',
      created_at TEXT    NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT    NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_site_items_collection
      ON site_items (collection, sort_order);
  `);

  // Contact form submissions table
  db.exec(`
    CREATE TABLE IF NOT EXISTS contact_submissions (
      id               INTEGER PRIMARY KEY AUTOINCREMENT,
      name             TEXT    NOT NULL,
      email            TEXT    NOT NULL,
      company          TEXT    NOT NULL DEFAULT '',
      country          TEXT    NOT NULL DEFAULT '',
      industry         TEXT    NOT NULL DEFAULT '',
      primary_objective TEXT   NOT NULL DEFAULT '',
      project_overview TEXT    NOT NULL DEFAULT '',
      created_at       TEXT    NOT NULL DEFAULT (datetime('now'))
    );
  `);
}
