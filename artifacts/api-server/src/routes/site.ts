import { Router, type Request, type Response } from "express";
import { getDb } from "../lib/cms-db";
import { requireAuth } from "../lib/auth";

const router = Router();

/* Collections that may be edited through the site-content API. */
const COLLECTIONS = [
  "nav_links",
  "client_logos",
  "verticals",
  "services_private",
  "services_public",
  "team",
  "case_tiles",
  "proof_points",
  "testimonials",
  "footer_links",
] as const;

type Collection = (typeof COLLECTIONS)[number];

function isCollection(value: string): value is Collection {
  return (COLLECTIONS as readonly string[]).includes(value);
}

/* Singleton section keys that may be edited. */
const SECTIONS = [
  "nav",
  "hero",
  "clients",
  "challenge",
  "services",
  "verticals",
  "story",
  "team",
  "evidence",
  "testimonials",
  "reports",
  "insights",
  "cta",
  "page_articles",
  "page_case_studies",
  "page_blog",
  "page_contact",
] as const;

function isSection(value: string): boolean {
  return (SECTIONS as readonly string[]).includes(value);
}

type ContentRow = { key: string; data: string };
type ItemRow = {
  id: number;
  collection: string;
  sort_order: number;
  visible: number;
  data: string;
};

function safeParse(raw: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
  } catch {
    /* fall through to empty object */
  }
  return {};
}

type SiteContentPayload = {
  content: Record<string, Record<string, unknown>>;
  items: Record<string, { data: Record<string, unknown>; visible: boolean }[]>;
};

function readAll(includeHidden: boolean): SiteContentPayload {
  const db = getDb();

  const contentRows = db
    .prepare(`SELECT key, data FROM site_content`)
    .all() as ContentRow[];

  const content: SiteContentPayload["content"] = {};
  for (const row of contentRows) {
    content[row.key] = safeParse(row.data);
  }

  const itemRows = db
    .prepare(
      `SELECT id, collection, sort_order, visible, data
         FROM site_items
        ${includeHidden ? "" : "WHERE visible = 1"}
        ORDER BY collection, sort_order, id`,
    )
    .all() as ItemRow[];

  const items: SiteContentPayload["items"] = {};
  for (const row of itemRows) {
    (items[row.collection] ??= []).push({
      data: safeParse(row.data),
      visible: row.visible === 1,
    });
  }

  return { content, items };
}

/* ── public read ────────────────────────────────────────────── */
router.get("/site-content", (_req: Request, res: Response): void => {
  res.json(readAll(false));
});

/* ── admin read (includes hidden entries) ───────────────────── */
router.get(
  "/admin/site-content",
  requireAuth,
  (_req: Request, res: Response): void => {
    res.json(readAll(true));
  },
);

/* ── admin: save one section ────────────────────────────────── */
router.put(
  "/admin/site-content/:key",
  requireAuth,
  (req: Request, res: Response): void => {
    const key = String(req.params["key"]);
    if (!isSection(key)) {
      res.status(400).json({ error: `Unknown section "${key}"` });
      return;
    }

    const { data } = req.body as { data?: unknown };
    if (!data || typeof data !== "object" || Array.isArray(data)) {
      res.status(400).json({ error: "data must be an object" });
      return;
    }

    getDb()
      .prepare(
        `INSERT INTO site_content (key, data, updated_at)
         VALUES (?, ?, datetime('now'))
         ON CONFLICT(key) DO UPDATE
           SET data = excluded.data, updated_at = datetime('now')`,
      )
      .run(key, JSON.stringify(data));

    res.json({ ok: true, key });
  },
);

/* ── admin: replace one collection ──────────────────────────── */
router.put(
  "/admin/site-items/:collection",
  requireAuth,
  (req: Request, res: Response): void => {
    const collection = String(req.params["collection"]);
    if (!isCollection(collection)) {
      res.status(400).json({ error: `Unknown collection "${collection}"` });
      return;
    }

    const { items } = req.body as {
      items?: { data?: unknown; visible?: unknown }[];
    };
    if (!Array.isArray(items)) {
      res.status(400).json({ error: "items must be an array" });
      return;
    }
    if (items.length > 200) {
      res.status(400).json({ error: "Too many items (max 200)" });
      return;
    }
    for (const item of items) {
      if (!item.data || typeof item.data !== "object" || Array.isArray(item.data)) {
        res.status(400).json({ error: "Every item needs a data object" });
        return;
      }
    }

    const db = getDb();
    db.exec("BEGIN");
    try {
      db.prepare(`DELETE FROM site_items WHERE collection = ?`).run(collection);
      const insert = db.prepare(
        `INSERT INTO site_items (collection, sort_order, visible, data)
         VALUES (?, ?, ?, ?)`,
      );
      items.forEach((item, index) => {
        insert.run(
          collection,
          index,
          item.visible === false ? 0 : 1,
          JSON.stringify(item.data),
        );
      });
      db.exec("COMMIT");
    } catch (err) {
      db.exec("ROLLBACK");
      throw err;
    }

    res.json({ ok: true, collection, count: items.length });
  },
);

export default router;
