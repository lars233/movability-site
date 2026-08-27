import { getDb } from "./cms-db";

/**
 * Search engines and social networks read the HTML they are served. This site
 * is a single-page app, so without help every URL would return the same empty
 * shell with one generic title. These helpers fill in a real title,
 * description, canonical URL, social preview and structured data per route —
 * including for CMS content, looked up by slug — before the HTML is sent.
 */

export const SITE_URL = (process.env["SITE_URL"] ?? "https://movability.io").replace(/\/$/, "");
const SITE_NAME = "Movability";
const DEFAULT_IMAGE = `${SITE_URL}/opengraph.jpg`;

export type PageMeta = {
  title: string;
  description: string;
  canonical: string;
  image: string;
  type: "website" | "article";
  publishedAt?: string;
  noindex?: boolean;
  jsonLd?: Record<string, unknown>;
};

const DEFAULT_DESCRIPTION =
  "Movability advises public sector bodies and transport companies on entering, regulating and growing new mobility markets — market entry, tenders, regulation and procurement strategy.";

const ORGANISATION = {
  "@context": "https://schema.org",
  "@type": "ProfessionalService",
  name: SITE_NAME,
  url: SITE_URL,
  description: DEFAULT_DESCRIPTION,
  areaServed: "Europe",
  founder: {
    "@type": "Person",
    name: "Lars Christian Grødem-Olsen",
    jobTitle: "Managing Director",
  },
  address: {
    "@type": "PostalAddress",
    addressLocality: "Oslo",
    addressCountry: "NO",
  },
  knowsAbout: [
    "Micromobility",
    "Public transport",
    "Mobility as a Service",
    "Transport procurement",
    "Mobility regulation",
    "Market entry strategy",
  ],
};

const STATIC_PAGES: Record<string, Omit<PageMeta, "canonical" | "image" | "type">> = {
  "/": {
    title: "Movability — Mobility strategy for cities and transport operators",
    description: DEFAULT_DESCRIPTION,
  },
  "/reports": {
    title: "Mobility research reports | Movability",
    description:
      "Deep-dive research on procurement strategy, regulatory change and new mobility, with operational and market data from inside the industry.",
  },
  "/articles": {
    title: "Mobility expert interviews | Movability",
    description:
      "In-depth interviews with operators, regulators and city officials on how transport markets are evolving across Europe.",
  },
  "/case-studies": {
    title: "Case studies | Movability",
    description:
      "How Movability has helped cities and operators enter markets, win tenders and design workable mobility regulation.",
  },
  "/blog": {
    title: "Blog | Movability",
    description: "Practical strategy, policy analysis and mobility market intelligence.",
  },
  "/contact": {
    title: "Get in touch | Movability",
    description:
      "Start a conversation about market entry, procurement, regulation or a mobility strategy project.",
  },
};

type ContentRow = {
  name: string;
  slug: string;
  date: string;
  content: string;
  feature_image: string;
};

function excerpt(html: string, fallback: string): string {
  const text = html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!text) return fallback;
  return text.length > 155 ? `${text.slice(0, 152).trimEnd()}…` : text;
}

function absolute(url: string): string {
  if (!url) return DEFAULT_IMAGE;
  if (/^https?:\/\//i.test(url)) return url;
  return `${SITE_URL}${url.startsWith("/") ? "" : "/"}${url}`;
}

function lookup(table: "blog" | "articles" | "case_studies", slug: string): ContentRow | undefined {
  return getDb()
    .prepare(
      `SELECT name, slug, date, content, feature_image
         FROM ${table}
        WHERE slug = ? AND status = 'published'`,
    )
    .get(slug) as ContentRow | undefined;
}

/** Works out the metadata for a given site path. */
export function metaForPath(pathname: string): PageMeta {
  const path = pathname.replace(/\/+$/, "") || "/";
  const canonical = `${SITE_URL}${path === "/" ? "" : path}`;

  // The admin panel must never be indexed.
  if (path.startsWith("/admin")) {
    return {
      title: "Admin | Movability",
      description: "",
      canonical,
      image: DEFAULT_IMAGE,
      type: "website",
      noindex: true,
    };
  }

  const detail = path.match(/^\/(blog|articles|case-studies)\/(.+)$/);
  if (detail) {
    const table = detail[1] === "case-studies" ? "case_studies" : (detail[1] as "blog" | "articles");
    const row = lookup(table, decodeURIComponent(detail[2]));
    if (row) {
      const description = excerpt(row.content, DEFAULT_DESCRIPTION);
      return {
        title: `${row.name} | ${SITE_NAME}`,
        description,
        canonical,
        image: absolute(row.feature_image),
        type: "article",
        publishedAt: row.date,
        jsonLd: {
          "@context": "https://schema.org",
          "@type": detail[1] === "case-studies" ? "Article" : "NewsArticle",
          headline: row.name,
          description,
          datePublished: row.date,
          image: absolute(row.feature_image),
          mainEntityOfPage: canonical,
          author: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
          publisher: {
            "@type": "Organization",
            name: SITE_NAME,
            url: SITE_URL,
            logo: { "@type": "ImageObject", url: `${SITE_URL}/favicon.png` },
          },
        },
      };
    }
  }

  const staticPage = STATIC_PAGES[path];
  if (staticPage) {
    return {
      ...staticPage,
      canonical,
      image: DEFAULT_IMAGE,
      type: "website",
      jsonLd: path === "/" ? ORGANISATION : undefined,
    };
  }

  return {
    title: `${SITE_NAME} — Mobility strategy for cities and transport operators`,
    description: DEFAULT_DESCRIPTION,
    canonical,
    image: DEFAULT_IMAGE,
    type: "website",
  };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Builds the tags that replace the placeholder block in index.html. */
export function renderMetaTags(meta: PageMeta): string {
  const tags = [
    `<title>${escapeHtml(meta.title)}</title>`,
    `<meta name="description" content="${escapeHtml(meta.description)}" />`,
    `<link rel="canonical" href="${escapeHtml(meta.canonical)}" />`,
    meta.noindex
      ? `<meta name="robots" content="noindex, nofollow" />`
      : `<meta name="robots" content="index, follow, max-image-preview:large" />`,
    `<meta property="og:site_name" content="${SITE_NAME}" />`,
    `<meta property="og:type" content="${meta.type}" />`,
    `<meta property="og:title" content="${escapeHtml(meta.title)}" />`,
    `<meta property="og:description" content="${escapeHtml(meta.description)}" />`,
    `<meta property="og:url" content="${escapeHtml(meta.canonical)}" />`,
    `<meta property="og:image" content="${escapeHtml(meta.image)}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${escapeHtml(meta.title)}" />`,
    `<meta name="twitter:description" content="${escapeHtml(meta.description)}" />`,
    `<meta name="twitter:image" content="${escapeHtml(meta.image)}" />`,
  ];

  if (meta.publishedAt) {
    tags.push(`<meta property="article:published_time" content="${escapeHtml(meta.publishedAt)}" />`);
  }
  if (meta.jsonLd) {
    tags.push(
      `<script type="application/ld+json">${JSON.stringify(meta.jsonLd).replace(/</g, "\\u003c")}</script>`,
    );
  }

  return tags.join("\n    ");
}

/** robots.txt — everything public is crawlable, the admin is not. */
export function robotsTxt(): string {
  return [
    "User-agent: *",
    "Allow: /",
    "Disallow: /admin",
    "Disallow: /api/",
    "",
    `Sitemap: ${SITE_URL}/sitemap.xml`,
    "",
  ].join("\n");
}

/** sitemap.xml, built from what is actually published in the CMS. */
export function sitemapXml(): string {
  const db = getDb();
  const urls: { loc: string; lastmod?: string; priority: string }[] = [
    { loc: `${SITE_URL}/`, priority: "1.0" },
    { loc: `${SITE_URL}/reports`, priority: "0.8" },
    { loc: `${SITE_URL}/case-studies`, priority: "0.8" },
    { loc: `${SITE_URL}/articles`, priority: "0.8" },
    { loc: `${SITE_URL}/blog`, priority: "0.6" },
    { loc: `${SITE_URL}/contact`, priority: "0.5" },
  ];

  for (const [table, base] of [
    ["articles", "articles"],
    ["case_studies", "case-studies"],
    ["blog", "blog"],
  ] as const) {
    const rows = db
      .prepare(
        `SELECT slug, date, updated_at FROM ${table}
          WHERE status = 'published' AND (external_url IS NULL OR external_url = '')
          ORDER BY date DESC`,
      )
      .all() as { slug: string; date: string; updated_at: string }[];
    for (const row of rows) {
      urls.push({
        loc: `${SITE_URL}/${base}/${encodeURIComponent(row.slug)}`,
        lastmod: (row.updated_at || row.date || "").slice(0, 10) || undefined,
        priority: "0.7",
      });
    }
  }

  const body = urls
    .map(
      (u) =>
        `  <url>\n    <loc>${escapeHtml(u.loc)}</loc>` +
        (u.lastmod ? `\n    <lastmod>${u.lastmod}</lastmod>` : "") +
        `\n    <priority>${u.priority}</priority>\n  </url>`,
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;
}
