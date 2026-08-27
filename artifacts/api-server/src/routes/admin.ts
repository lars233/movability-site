import { Router, type NextFunction, type Request, type Response } from "express";
import { readFileSync, mkdirSync, renameSync, unlinkSync, openSync, readSync, closeSync } from "node:fs";
import { randomBytes } from "node:crypto";
import path from "node:path";
import multer from "multer";
import { getDb } from "../lib/cms-db";
import { UPLOADS_DIR } from "../lib/config";
import { logger } from "../lib/logger";
import { sniffImage } from "../lib/file-type";
import { toAbsoluteUrl } from "../lib/url";
import {
  COOKIE_NAME,
  clearLoginFailures,
  cookieOptions,
  loginBlockedFor,
  makeToken,
  recordLoginFailure,
  requireAuth,
  revokeAllSessions,
  verifyCredentials,
  verifyToken,
} from "../lib/auth";

export { requireAuth };

const router = Router();

/* ── file upload setup ──────────────────────────────────────────
 * Files land with a random name and no extension; the real type is sniffed
 * from the bytes after the upload completes and the file is renamed then.
 * Nothing attacker-controlled reaches the filename.
 * -------------------------------------------------------------- */
mkdirSync(UPLOADS_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: UPLOADS_DIR,
  filename: (_req, _file, cb) => {
    cb(null, `${Date.now()}-${randomBytes(8).toString("hex")}.upload`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024, files: 1 },
});

/* ── auth routes ────────────────────────────────────────────── */
function clientIp(req: Request): string {
  return req.ip ?? req.socket.remoteAddress ?? "unknown";
}

router.post("/admin/login", (req: Request, res: Response): void => {
  const ip = clientIp(req);

  const blockedSeconds = loginBlockedFor(ip);
  if (blockedSeconds > 0) {
    logger.warn({ ip }, "Login attempt while rate limited");
    res.setHeader("Retry-After", String(blockedSeconds));
    res.status(429).json({
      error: `Too many attempts. Try again in ${Math.ceil(blockedSeconds / 60)} minute(s).`,
    });
    return;
  }

  const { username, password } = req.body as {
    username?: unknown;
    password?: unknown;
  };

  // Everything below answers with the same message and status, so a caller
  // cannot learn whether the username, the password, or the length was wrong.
  const user = typeof username === "string" ? username : "";
  const pass = typeof password === "string" ? password : "";

  if (!verifyCredentials(user, pass)) {
    recordLoginFailure(ip);
    logger.warn({ ip }, "Failed admin login");
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  clearLoginFailures(ip);
  res.cookie(COOKIE_NAME, makeToken(user), cookieOptions());
  logger.info({ ip }, "Admin signed in");
  res.json({ ok: true, username: user });
});

router.post("/admin/logout", (_req: Request, res: Response): void => {
  // Stateless tokens cannot be deleted, so signing out moves the revocation
  // watermark: every token issued before this moment stops working.
  revokeAllSessions();
  res.clearCookie(COOKIE_NAME, { path: "/" });
  res.json({ ok: true });
});

router.get("/admin/me", (req: Request, res: Response): void => {
  const token = req.cookies?.[COOKIE_NAME] as string | undefined;
  const user = token ? verifyToken(token) : null;
  if (!user) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  res.json({ username: user });
});

/* ── file upload ────────────────────────────────────────────── */
const uploadSingle = upload.single("file");

router.post(
  "/admin/upload",
  requireAuth,
  (req: Request, res: Response, next: NextFunction): void => {
    // Handle multer's own errors here so an oversize file gets a clear 413
    // instead of falling through to the generic error handler.
    uploadSingle(req, res, (err: unknown) => {
      if (!err) return next();
      const code = (err as { code?: string }).code;
      if (code === "LIMIT_FILE_SIZE") {
        res.status(413).json({ error: "That image is larger than 10 MB." });
        return;
      }
      if (code === "LIMIT_FILE_COUNT" || code === "LIMIT_UNEXPECTED_FILE") {
        res.status(400).json({ error: "Please upload a single image file." });
        return;
      }
      logger.warn({ err }, "Upload failed");
      res.status(400).json({ error: "Upload failed." });
    });
  },
  (req: Request, res: Response): void => {
    const file = req.file;
    if (!file) {
      res.status(400).json({ error: "No file uploaded (max 10 MB)" });
      return;
    }

    const discard = (): void => {
      try {
        unlinkSync(file.path);
      } catch {
        /* nothing to clean up */
      }
    };

    // Read only the header — enough for every format we accept.
    const header = Buffer.alloc(16);
    try {
      const fd = openSync(file.path, "r");
      try {
        readSync(fd, header, 0, header.length, 0);
      } finally {
        closeSync(fd);
      }
    } catch {
      discard();
      res.status(400).json({ error: "Could not read the uploaded file" });
      return;
    }

    const kind = sniffImage(header);
    if (!kind) {
      discard();
      logger.warn(
        { originalName: file.originalname, declared: file.mimetype },
        "Rejected upload that is not a supported image",
      );
      res.status(400).json({
        error: "Only PNG, JPEG, GIF, WebP and AVIF images are accepted (SVG is not).",
      });
      return;
    }

    const finalName = path.basename(file.filename, ".upload") + kind.ext;
    try {
      renameSync(file.path, path.join(UPLOADS_DIR, finalName));
    } catch {
      discard();
      res.status(500).json({ error: "Could not store the uploaded file" });
      return;
    }

    res.json({ url: `/api/uploads/${finalName}` });
  },
);

/* ── csv import ─────────────────────────────────────────────── */
// Inline RFC 4180 CSV parser — handles embedded commas, newlines & escaped quotes
function parseCSV(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (c === '"' && next === '"') {
        field += '"';
        i++;
      } else if (c === '"') {
        inQuotes = false;
      } else {
        field += c;
      }
    } else {
      if (c === '"') {
        inQuotes = true;
      } else if (c === ",") {
        row.push(field);
        field = "";
      } else if (c === "\r" && next === "\n") {
        row.push(field);
        rows.push(row);
        row = [];
        field = "";
        i++;
      } else if (c === "\n" || c === "\r") {
        row.push(field);
        rows.push(row);
        row = [];
        field = "";
      } else {
        field += c;
      }
    }
  }

  if (row.length > 0 || field) {
    row.push(field);
    if (row.some((f) => f !== "")) rows.push(row);
  }

  if (rows.length < 2) return [];

  const headers = rows[0];
  return rows
    .slice(1)
    .filter((r) => r.some((f) => f !== ""))
    .map((r) => {
      const obj: Record<string, string> = {};
      headers.forEach((h, i) => {
        obj[h] = r[i] ?? "";
      });
      return obj;
    });
}

function toDate(iso: string): string {
  if (!iso) return new Date().toISOString().slice(0, 10);
  return iso.slice(0, 10);
}

function toCategoriesJson(cats: string): string {
  if (!cats) return "[]";
  const arr = cats.split(",").map((c) => c.trim()).filter(Boolean);
  return JSON.stringify(arr);
}

const CSV_FILES: Record<string, string> = {
  blog: path.join(
    __dirname,
    "..",
    "..",
    "..",
    "attached_assets",
    "Blog_1778666242547.csv",
  ),
  articles: path.join(
    __dirname,
    "..",
    "..",
    "..",
    "attached_assets",
    "Articles_1778666242546.csv",
  ),
};

router.post("/admin/import", requireAuth, (req: Request, res: Response): void => {
  const type = String((req.body as Record<string, unknown>)["type"] ?? "");
  if (type !== "blog" && type !== "articles") {
    res.status(400).json({ error: 'type must be "blog" or "articles"' });
    return;
  }

  const csvPath = CSV_FILES[type];
  let csvContent: string;
  try {
    csvContent = readFileSync(csvPath, "utf-8");
  } catch {
    res.status(404).json({ error: "CSV source file not found on server" });
    return;
  }

  const records = parseCSV(csvContent);
  const db = getDb();
  let imported = 0;
  let skipped = 0;

  const insertStmt = db.prepare(`
    INSERT INTO ${type} (name, slug, status, date, categories, content, feature_image)
    VALUES (?, ?, 'published', ?, ?, ?, ?)
  `);

  for (const row of records) {
    const slug = (row["Slug"] ?? "").trim();
    const name = (row["Title"] ?? row["name"] ?? "").trim();
    if (!slug || !name) {
      skipped++;
      continue;
    }
    const existing = db.prepare(`SELECT id FROM ${type} WHERE slug = ?`).get(slug);
    if (existing) {
      skipped++;
      continue;
    }
    const date = toDate(row["Date"] ?? "");
    const categories = toCategoriesJson(row["Categories"] ?? "");
    const content = row["Content"] ?? "";
    const feature_image = (row["Image"] ?? "").trim();
    try {
      insertStmt.run(name, slug, date, categories, content, feature_image);
      imported++;
    } catch {
      skipped++;
    }
  }

  res.json({ imported, skipped, total: records.length });
});

/* ── generic CRUD factory ───────────────────────────────────── */
function crudRoutes(table: "blog" | "articles" | "case_studies") {
  router.get(
    `/admin/${table}`,
    requireAuth,
    (_req: Request, res: Response): void => {
      const db = getDb();
      const rows = db
        .prepare(
          `SELECT * FROM ${table} ORDER BY date DESC, created_at DESC`,
        )
        .all();
      res.json(rows);
    },
  );

  router.get(
    `/admin/${table}/:id`,
    requireAuth,
    (req: Request, res: Response): void => {
      const id = String(req.params["id"] ?? "");
      const db = getDb();
      const row = db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(id);
      if (!row) {
        res.status(404).json({ error: "Not found" });
        return;
      }
      res.json(row);
    },
  );

  router.post(
    `/admin/${table}`,
    requireAuth,
    (req: Request, res: Response): void => {
      const b = req.body as Record<string, unknown>;
      const name = String(b["name"] ?? "");
      const slug = String(b["slug"] ?? "");
      const status = String(b["status"] ?? "draft");
      const date = String(b["date"] ?? "");
      const categories = String(b["categories"] ?? "[]");
      const content = String(b["content"] ?? "");
      const feature_image = String(b["feature_image"] ?? "");
      const external_url = toAbsoluteUrl(String(b["external_url"] ?? ""));
      if (!name || !slug || !date) {
        res.status(400).json({ error: "name, slug, and date are required" });
        return;
      }
      const db = getDb();
      const stmt = db.prepare(`
        INSERT INTO ${table} (name, slug, status, date, categories, content, feature_image, external_url)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      try {
        const info = stmt.run(
          name,
          slug,
          status,
          date,
          categories,
          content,
          feature_image,
          external_url,
        );
        const row = db
          .prepare(`SELECT * FROM ${table} WHERE id = ?`)
          .get(info.lastInsertRowid as number);
        res.status(201).json(row);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes("UNIQUE") || msg.includes("SQLITE_CONSTRAINT")) {
          res.status(409).json({ error: "A post with that slug already exists" });
        } else {
          res.status(500).json({ error: msg });
        }
      }
    },
  );

  router.put(
    `/admin/${table}/:id`,
    requireAuth,
    (req: Request, res: Response): void => {
      const b = req.body as Record<string, unknown>;
      const name = String(b["name"] ?? "");
      const slug = String(b["slug"] ?? "");
      const status = String(b["status"] ?? "draft");
      const date = String(b["date"] ?? "");
      const categories = String(b["categories"] ?? "[]");
      const content = String(b["content"] ?? "");
      const feature_image = String(b["feature_image"] ?? "");
      const external_url = toAbsoluteUrl(String(b["external_url"] ?? ""));
      const id = String(req.params["id"] ?? "");
      const db = getDb();
      const existing = db
        .prepare(`SELECT * FROM ${table} WHERE id = ?`)
        .get(id);
      if (!existing) {
        res.status(404).json({ error: "Not found" });
        return;
      }
      const stmt = db.prepare(`
        UPDATE ${table}
        SET name = ?, slug = ?, status = ?, date = ?, categories = ?,
            content = ?, feature_image = ?, external_url = ?, updated_at = datetime('now')
        WHERE id = ?
      `);
      try {
        stmt.run(name, slug, status, date, categories, content, feature_image, external_url, id);
        const row = db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(id);
        res.json(row);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes("UNIQUE") || msg.includes("SQLITE_CONSTRAINT")) {
          res.status(409).json({ error: "A post with that slug already exists" });
        } else {
          res.status(500).json({ error: msg });
        }
      }
    },
  );

  router.delete(
    `/admin/${table}/:id`,
    requireAuth,
    (req: Request, res: Response): void => {
      const id = String(req.params["id"] ?? "");
      const db = getDb();
      const existing = db
        .prepare(`SELECT id FROM ${table} WHERE id = ?`)
        .get(id);
      if (!existing) {
        res.status(404).json({ error: "Not found" });
        return;
      }
      db.prepare(`DELETE FROM ${table} WHERE id = ?`).run(id);
      res.json({ ok: true });
    },
  );
}

crudRoutes("blog");
crudRoutes("articles");
crudRoutes("case_studies");

/* ── reports CRUD (different schema — no date/categories/content) ─ */
router.get("/admin/reports", requireAuth, (_req: Request, res: Response): void => {
  const db = getDb();
  const rows = db.prepare(`SELECT * FROM reports ORDER BY created_at DESC`).all();
  res.json(rows);
});

router.get("/admin/reports/:id", requireAuth, (req: Request, res: Response): void => {
  const id = String(req.params["id"] ?? "");
  const db = getDb();
  const row = db.prepare(`SELECT * FROM reports WHERE id = ?`).get(id);
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json(row);
});

router.post("/admin/reports", requireAuth, (req: Request, res: Response): void => {
  const b = req.body as Record<string, unknown>;
  const title = String(b["title"] ?? "").trim();
  const slug = String(b["slug"] ?? "").trim();
  const subtitle = String(b["subtitle"] ?? "");
  const image = String(b["image"] ?? "");
  const download_url = String(b["download_url"] ?? "");
  const status = String(b["status"] ?? "draft");
  const date = String(b["date"] ?? "");
  if (!title || !slug) { res.status(400).json({ error: "title and slug are required" }); return; }
  const db = getDb();
  try {
    const info = db.prepare(
      `INSERT INTO reports (title, slug, subtitle, image, download_url, status, date) VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).run(title, slug, subtitle, image, download_url, status, date);
    const row = db.prepare(`SELECT * FROM reports WHERE id = ?`).get(info.lastInsertRowid as number);
    res.status(201).json(row);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("UNIQUE") || msg.includes("SQLITE_CONSTRAINT")) {
      res.status(409).json({ error: "A report with that slug already exists" });
    } else {
      res.status(500).json({ error: msg });
    }
  }
});

router.put("/admin/reports/:id", requireAuth, (req: Request, res: Response): void => {
  const id = String(req.params["id"] ?? "");
  const b = req.body as Record<string, unknown>;
  const title = String(b["title"] ?? "").trim();
  const slug = String(b["slug"] ?? "").trim();
  const subtitle = String(b["subtitle"] ?? "");
  const image = String(b["image"] ?? "");
  const download_url = String(b["download_url"] ?? "");
  const status = String(b["status"] ?? "draft");
  const date = String(b["date"] ?? "");
  const db = getDb();
  const existing = db.prepare(`SELECT id FROM reports WHERE id = ?`).get(id);
  if (!existing) { res.status(404).json({ error: "Not found" }); return; }
  try {
    db.prepare(
      `UPDATE reports SET title=?, slug=?, subtitle=?, image=?, download_url=?, status=?, date=?, updated_at=datetime('now') WHERE id=?`
    ).run(title, slug, subtitle, image, download_url, status, date, id);
    const row = db.prepare(`SELECT * FROM reports WHERE id = ?`).get(id);
    res.json(row);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("UNIQUE") || msg.includes("SQLITE_CONSTRAINT")) {
      res.status(409).json({ error: "A report with that slug already exists" });
    } else {
      res.status(500).json({ error: msg });
    }
  }
});

router.delete("/admin/reports/:id", requireAuth, (req: Request, res: Response): void => {
  const id = String(req.params["id"] ?? "");
  const db = getDb();
  const existing = db.prepare(`SELECT id FROM reports WHERE id = ?`).get(id);
  if (!existing) { res.status(404).json({ error: "Not found" }); return; }
  db.prepare(`DELETE FROM reports WHERE id = ?`).run(id);
  res.json({ ok: true });
});

/* ── Contact Submissions ─────────────────────────────────── */

router.get("/admin/submissions", requireAuth, (_req: Request, res: Response): void => {
  const db = getDb();
  const rows = db.prepare(`SELECT * FROM contact_submissions ORDER BY created_at DESC`).all();
  res.json(rows);
});

router.get("/admin/submissions/:id", requireAuth, (req: Request, res: Response): void => {
  const id = String(req.params["id"] ?? "");
  const db = getDb();
  const row = db.prepare(`SELECT * FROM contact_submissions WHERE id = ?`).get(id);
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json(row);
});

router.delete("/admin/submissions/:id", requireAuth, (req: Request, res: Response): void => {
  const id = String(req.params["id"] ?? "");
  const db = getDb();
  const existing = db.prepare(`SELECT id FROM contact_submissions WHERE id = ?`).get(id);
  if (!existing) { res.status(404).json({ error: "Not found" }); return; }
  db.prepare(`DELETE FROM contact_submissions WHERE id = ?`).run(id);
  res.json({ ok: true });
});

export default router;
