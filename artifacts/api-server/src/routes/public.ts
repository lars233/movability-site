import { Router, type Request, type Response } from "express";
import { getDb } from "../lib/cms-db";
import { toAbsoluteUrl } from "../lib/url";

const router = Router();

type Row = {
  id: number;
  name: string;
  slug: string;
  date: string;
  categories: string;
  feature_image: string;
  content: string;
  external_url: string;
};

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 300);
}

function parseCats(raw: string): string[] {
  try {
    return JSON.parse(raw) as string[];
  } catch {
    return [];
  }
}

function publicRoutes(table: "blog" | "articles" | "case_studies") {
  const basePath =
    table === "blog" ? "blog" : table === "articles" ? "articles" : "case-studies";

  router.get(`/${basePath}`, (req: Request, res: Response): void => {
    const search = String(req.query["search"] ?? "").toLowerCase().trim();
    const category = String(req.query["category"] ?? "").trim();
    const page = Math.max(1, parseInt(String(req.query["page"] ?? "1"), 10));
    const limit = 12;

    const db = getDb();

    const allRows = db
      .prepare(
        `SELECT id, name, slug, date, categories, feature_image, content, external_url
         FROM ${table}
         WHERE status = 'published'
         ORDER BY date DESC`,
      )
      .all() as Row[];

    let filtered = allRows;

    if (search) {
      filtered = filtered.filter(
        (r) =>
          r.name.toLowerCase().includes(search) ||
          stripHtml(r.content).toLowerCase().includes(search),
      );
    }

    if (category) {
      filtered = filtered.filter((r) =>
        parseCats(r.categories).includes(category),
      );
    }

    const allCats = new Set<string>();
    allRows.forEach((r) => parseCats(r.categories).forEach((c) => allCats.add(c)));

    const total = filtered.length;
    const pages = Math.ceil(total / limit) || 1;
    const offset = (page - 1) * limit;
    const items = filtered.slice(offset, offset + limit).map((r) => ({
      id: r.id,
      name: r.name,
      slug: r.slug,
      date: r.date,
      categories: r.categories,
      feature_image: r.feature_image,
      excerpt: stripHtml(r.content),
      external_url: toAbsoluteUrl(r.external_url ?? ""),
    }));

    res.json({
      items,
      total,
      page,
      limit,
      pages,
      categories: [...allCats].sort(),
    });
  });

  router.get(`/${basePath}/:slug`, (req: Request, res: Response): void => {
    const slug = String(req.params["slug"] ?? "");
    const db = getDb();

    const row = db
      .prepare(
        `SELECT * FROM ${table} WHERE slug = ? AND status = 'published'`,
      )
      .get(slug) as Row | undefined;

    if (!row) {
      res.status(404).json({ error: "Not found" });
      return;
    }

    const more = db
      .prepare(
        `SELECT id, name, slug, date, categories, feature_image, content
         FROM ${table}
         WHERE status = 'published' AND id != ?
         ORDER BY date DESC
         LIMIT 3`,
      )
      .all(row.id) as Row[];

    res.json({
      ...row,
      more: more.map((r) => ({
        id: r.id,
        name: r.name,
        slug: r.slug,
        date: r.date,
        categories: r.categories,
        feature_image: r.feature_image,
        excerpt: stripHtml(r.content),
      })),
    });
  });
}

publicRoutes("blog");
publicRoutes("articles");
publicRoutes("case_studies");

/* ── public reports (no pagination/search needed — small fixed set) ── */
type ReportRow = {
  id: number;
  title: string;
  slug: string;
  subtitle: string;
  image: string;
  download_url: string;
  date: string;
};

router.get("/reports", (_req: Request, res: Response): void => {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT id, title, slug, subtitle, image, download_url, date FROM reports WHERE status = 'published' ORDER BY created_at DESC`,
    )
    .all() as ReportRow[];
  res.json(rows);
});

export default router;
