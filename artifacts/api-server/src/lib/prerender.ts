import { getDb } from "./cms-db";
import { SITE_URL } from "./seo";

/**
 * Writes a plain-HTML version of each page into the shell before it is sent.
 *
 * The app is rendered in the browser, so without this the HTML contains an
 * empty <div id="root"> — fine for Google, which runs JavaScript, but blank to
 * Bing, LinkedIn and the AI crawlers, which largely do not. React replaces this
 * markup the moment it mounts, so visitors never see it; it exists so that
 * anything reading the raw HTML gets the same words a visitor gets.
 */

type Row = Record<string, string>;

function esc(value: string): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Tiptap output is already HTML written by the admin; keep the structural
 *  tags and drop anything that could execute. */
function safeContentHtml(html: string): string {
  return String(html ?? "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/ on[a-z]+="[^"]*"/gi, "")
    .replace(/ on[a-z]+='[^']*'/gi, "");
}

function parseCats(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as string[]) : [];
  } catch {
    return [];
  }
}

function stripHtml(html: string, limit = 220): string {
  const text = String(html ?? "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return text.length > limit ? `${text.slice(0, limit - 1)}…` : text;
}

const SECTION_LABELS: Record<string, { title: string; intro: string; base: string }> = {
  articles: {
    title: "Mobility Expert Interviews",
    intro:
      "In-depth interviews with operators, regulators and city officials on how transport markets are evolving.",
    base: "/articles",
  },
  case_studies: {
    title: "How we've closed the gap before",
    intro: "Previous Movability projects and their outcomes.",
    base: "/case-studies",
  },
  blog: {
    title: "Latest from the Blog",
    intro: "Practical strategy, policy analysis and mobility market intelligence.",
    base: "/blog",
  },
};

function listMarkup(table: "articles" | "case_studies" | "blog"): string {
  const cfg = SECTION_LABELS[table];
  const rows = getDb()
    .prepare(
      `SELECT name, slug, date, content, categories, external_url FROM ${table}
        WHERE status = 'published' ORDER BY date DESC LIMIT 50`,
    )
    .all() as Row[];

  const items = rows
    .map(
      (r) => `<li>
        <article>
          <h2><a href="${r.external_url ? esc(r.external_url) : `${cfg.base}/${esc(r.slug)}`}"${
            r.external_url ? ' rel="noopener"' : ""
          }>${esc(r.name)}</a>${r.external_url ? " (published externally)" : ""}</h2>
          <p><time datetime="${esc(r.date)}">${esc(r.date)}</time>${
            parseCats(r.categories).length ? ` · ${esc(parseCats(r.categories).join(", "))}` : ""
          }</p>
          <p>${esc(stripHtml(r.content))}</p>
        </article>
      </li>`,
    )
    .join("\n");

  return `<h1>${esc(cfg.title)}</h1>\n<p>${esc(cfg.intro)}</p>\n<ul>\n${items}\n</ul>`;
}

function detailMarkup(table: "articles" | "case_studies" | "blog", slug: string): string | null {
  const row = getDb()
    .prepare(
      `SELECT name, slug, date, content, categories, feature_image FROM ${table}
        WHERE slug = ? AND status = 'published'`,
    )
    .get(slug) as Row | undefined;
  if (!row) return null;

  const cats = parseCats(row.categories);
  return `<article>
    <h1>${esc(row.name)}</h1>
    <p><time datetime="${esc(row.date)}">${esc(row.date)}</time>${
      cats.length ? ` · ${esc(cats.join(", "))}` : ""
    }</p>
    ${row.feature_image ? `<img src="${esc(row.feature_image)}" alt="${esc(row.name)}" />` : ""}
    <div>${safeContentHtml(row.content)}</div>
  </article>`;
}

function reportsMarkup(): string {
  const rows = getDb()
    .prepare(
      `SELECT title, subtitle, slug, date, download_url FROM reports
        WHERE status = 'published' ORDER BY created_at DESC`,
    )
    .all() as Row[];

  const items = rows
    .map(
      (r) => `<li>
        <article>
          <h2>${esc(r.title)}</h2>
          ${r.subtitle ? `<p>${esc(r.subtitle)}</p>` : ""}
          ${r.date ? `<p><time datetime="${esc(r.date)}">${esc(r.date)}</time></p>` : ""}
          ${r.download_url ? `<p><a href="${esc(r.download_url)}">Download report</a></p>` : ""}
        </article>
      </li>`,
    )
    .join("\n");

  return `<h1>Actionable Mobility Intelligence</h1>
    <p>Deep-dive research on procurement strategy, regulatory evolutions and new mobility, with operational and market data.</p>
    <ul>\n${items}\n</ul>`;
}

/** Section text the admin can edit, falling back to what the site ships with. */
function homeText(): Record<string, Record<string, string>> {
  const rows = getDb().prepare(`SELECT key, data FROM site_content`).all() as Row[];
  const stored: Record<string, Record<string, string>> = {};
  for (const row of rows) {
    try {
      stored[row.key] = JSON.parse(row.data) as Record<string, string>;
    } catch {
      /* ignore malformed rows */
    }
  }
  return stored;
}

function homeMarkup(): string {
  const stored = homeText();
  const hero = stored["hero"] ?? {};
  const story = stored["story"] ?? {};
  const cta = stored["cta"] ?? {};

  const headline = [
    hero["headlineLine1"] ?? "Where public",
    hero["headlineLine2"] ?? "goals meet",
    hero["headlineAccent"] ?? "market reality.",
  ].join(" ");

  const latest = getDb()
    .prepare(
      `SELECT name, slug FROM articles WHERE status = 'published' ORDER BY date DESC LIMIT 6`,
    )
    .all() as Row[];

  return `<h1>${esc(headline)}</h1>
    <p>${esc(
      hero["subheading"] ??
        "Movability advises public sector and transport companies on growing new mobility.",
    )}</p>

    <h2>${esc(story["eyebrow"] ?? "About Movability")}</h2>
    <p>${esc(
      story["body"] ??
        "Movability is a transport consultancy centred on its founder Lars Christian Grødem-Olsen, advising public authorities and operators on market entry, tenders, regulation and integrations across mobility modes.",
    ).slice(0, 700)}</p>

    <h2>What we do</h2>
    <ul>
      <li>Market entry strategy for transport operators</li>
      <li>Bid, tender and policy strategy</li>
      <li>Regulation strategy for cities and public transport authorities</li>
      <li>Procurement strategy and framework design</li>
      <li>Innovation strategy and scaling beyond pilots</li>
    </ul>

    <h2>Latest articles</h2>
    <ul>${latest
      .map((a) => `<li><a href="/articles/${esc(a.slug)}">${esc(a.name)}</a></li>`)
      .join("")}</ul>

    <h2>${esc(cta["headline"] ?? "Let's close")} ${esc(cta["headlineAccent"] ?? "the gap together.")}</h2>
    <p>${esc(
      cta["body"] ??
        "Whether you're entering a new market, designing a procurement process, or need a strategic partner who speaks both mobility languages, let's kick off the conversation.",
    )}</p>
    <p><a href="/contact">Get in touch</a> · <a href="${SITE_URL}/reports">Reports</a> · <a href="/case-studies">Case studies</a> · <a href="/articles">Articles</a></p>`;
}

/** Returns the markup to place inside #root, or null to leave it empty. */
export function bodyForPath(pathname: string): string | null {
  const path = pathname.replace(/\/+$/, "") || "/";
  if (path.startsWith("/admin")) return null;

  const detail = path.match(/^\/(blog|articles|case-studies)\/(.+)$/);
  if (detail) {
    const table = detail[1] === "case-studies" ? "case_studies" : (detail[1] as "articles" | "blog");
    return detailMarkup(table, decodeURIComponent(detail[2]));
  }

  if (path === "/articles") return listMarkup("articles");
  if (path === "/case-studies") return listMarkup("case_studies");
  if (path === "/blog") return listMarkup("blog");
  if (path === "/reports") return reportsMarkup();
  if (path === "/") return homeMarkup();

  if (path === "/contact") {
    return `<h1>Get in touch</h1>
      <p>Start a conversation about market entry, procurement, regulation or a mobility strategy project.</p>`;
  }

  return null;
}
