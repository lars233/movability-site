import { useState, useEffect } from "react";
import { Link, useParams } from "wouter";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Calendar, Clock } from "lucide-react";
import { publicApi, type PublicDetail, type PublicItem } from "@/lib/public-api";
import { formatCategoryLabel } from "@/lib/category-format";
import SiteNav from "@/components/site-nav";
import SiteFooter from "@/components/site-footer";

const BLUE = "#4B5CF0";

const CONTENT_STYLES = `
  .mb-content { color: rgba(0,0,0,0.72); line-height: 1.8; font-size: 1.0625rem; }
  .mb-content h1, .mb-content h2, .mb-content h3, .mb-content h4 {
    font-weight: 700; line-height: 1.25; color: #111; margin-top: 2.25rem; margin-bottom: 0.875rem;
  }
  .mb-content h1 { font-size: 2rem; }
  .mb-content h2 { font-size: 1.5rem; border-bottom: 1px solid rgba(0,0,0,0.08); padding-bottom: 0.5rem; }
  .mb-content h3 { font-size: 1.2rem; }
  .mb-content h4 { font-size: 1rem; }
  .mb-content p { margin-bottom: 1.4rem; }
  .mb-content a { color: #4B5CF0; text-decoration: underline; text-underline-offset: 3px; }
  .mb-content a:hover { opacity: 0.8; }
  .mb-content ul { list-style: disc; padding-left: 1.5rem; margin-bottom: 1.4rem; }
  .mb-content ol { list-style: decimal; padding-left: 1.5rem; margin-bottom: 1.4rem; }
  .mb-content li { margin-bottom: 0.4rem; }
  .mb-content blockquote {
    border-left: 3px solid #4B5CF0; padding: 0.75rem 1.25rem; margin: 2rem 0;
    background: rgba(75,92,240,0.04); border-radius: 0 6px 6px 0;
    font-style: italic; color: rgba(0,0,0,0.6);
  }
  .mb-content code {
    background: #f3f4f6; padding: 0.15rem 0.45rem; border-radius: 4px;
    font-size: 0.875em; font-family: ui-monospace, monospace;
  }
  .mb-content pre {
    background: #1a1a2e; color: #e2e8f0; padding: 1.25rem 1.5rem;
    border-radius: 10px; overflow-x: auto; margin-bottom: 1.5rem; font-size: 0.875rem;
  }
  .mb-content pre code { background: none; padding: 0; font-size: inherit; }
  .mb-content img { max-width: 100%; height: auto; border-radius: 10px; margin: 1.5rem 0; }
  .mb-content strong { font-weight: 700; color: #111; }
  .mb-content em { font-style: italic; }
  .mb-content hr { border: none; border-top: 1px solid rgba(0,0,0,0.1); margin: 2.5rem 0; }
  .mb-content table { width: 100%; border-collapse: collapse; margin-bottom: 1.5rem; font-size: 0.9rem; }
  .mb-content th { background: #f9fafb; font-weight: 600; text-align: left; padding: 0.6rem 0.875rem; border: 1px solid rgba(0,0,0,0.1); }
  .mb-content td { padding: 0.6rem 0.875rem; border: 1px solid rgba(0,0,0,0.1); }
`;

function formatDate(d: string) {
  if (!d) return "";
  const dt = new Date(d + "T00:00:00");
  return dt.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function readTime(html: string): string {
  const words = html.replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length;
  const mins = Math.max(1, Math.round(words / 200));
  return `${mins} min read`;
}

function parseCats(raw: string): string[] {
  try {
    return JSON.parse(raw) as string[];
  } catch {
    return [];
  }
}

function RelatedCard({ item, basePath }: { item: PublicItem; basePath: string }) {
  const cats = parseCats(item.categories);
  const [imgErr, setImgErr] = useState(false);

  return (
    <Link href={`${basePath}/${item.slug}`} className="group block">
      <article className="bg-white rounded-xl border border-black/[0.08] overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 h-full">
        <div className="aspect-[16/9] overflow-hidden bg-gray-100">
          {item.feature_image && !imgErr ? (
            <img
              src={item.feature_image}
              alt={item.name}
              onError={() => setImgErr(true)}
              className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-500"
            />
          ) : (
            <div
              className="w-full h-full"
              style={{ background: `linear-gradient(135deg, ${BLUE}cc, #6366F1)` }}
            />
          )}
        </div>
        <div className="p-5">
          <div className="flex items-center gap-2 mb-2.5">
            {cats[0] && (
              <span
                className="text-xs font-medium px-2.5 py-0.5 rounded-full"
                style={{ background: `${BLUE}12`, color: BLUE }}
              >
                {formatCategoryLabel(cats[0])}
              </span>
            )}
            <span className="text-xs text-black/35">{formatDate(item.date)}</span>
          </div>
          <h3 className="font-semibold text-sm leading-snug line-clamp-2 text-gray-900 group-hover:text-blue-600 transition-colors">
            {item.name}
          </h3>
          {item.excerpt && (
            <p className="text-xs text-black/50 leading-relaxed line-clamp-2 mt-2">
              {item.excerpt}
            </p>
          )}
        </div>
      </article>
    </Link>
  );
}

export default function ContentDetailPage({ type }: { type: "blog" | "articles" | "case_studies" }) {
  const params = useParams<{ slug: string }>();
  const slug = params.slug ?? "";
  const basePath = type === "blog" ? "/blog" : type === "articles" ? "/articles" : "/case-studies";
  const backLabel = type === "blog" ? "Blog" : type === "articles" ? "Articles" : "Case Studies";

  const [data, setData] = useState<PublicDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    window.scrollTo(0, 0);
    setLoading(true);
    setError("");
    const fn = type === "blog" ? publicApi.getBlog : type === "articles" ? publicApi.getArticle : publicApi.getCaseStudy;
    fn(slug)
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Failed to load");
        setLoading(false);
      });
  }, [slug, type]);

  const cats = parseCats(data?.categories ?? "");

  return (
    <div className="min-h-screen bg-white text-black antialiased" style={{ fontFamily: "'DM Sans', 'Inter', sans-serif" }}>
      <style>{CONTENT_STYLES}</style>
      <SiteNav />

      {loading && (
        <div className="pt-[70px] flex items-center justify-center min-h-screen">
          <div className="flex flex-col items-center gap-4">
            <div className="w-8 h-8 rounded-full border-2 border-blue-200 border-t-blue-600 animate-spin" />
            <p className="text-sm text-black/40">Loading…</p>
          </div>
        </div>
      )}

      {error && (
        <div className="pt-[70px] flex items-center justify-center min-h-screen">
          <div className="text-center px-6">
            <p className="text-4xl font-bold text-black/10 mb-4">404</p>
            <p className="text-black/50 text-sm mb-6">{error}</p>
            <Link href={basePath} className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-800">
              <ArrowLeft size={14} /> Back to {backLabel}
            </Link>
          </div>
        </div>
      )}

      {!loading && !error && data && (
        <>
          <section className="pt-[70px]">
            {data.feature_image ? (
              <div className="relative h-[55vh] min-h-[360px] max-h-[600px] overflow-hidden bg-black">
                <img
                  src={data.feature_image}
                  alt={data.name}
                  className="w-full h-full object-cover opacity-70"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 max-w-4xl mx-auto px-6 pb-10">
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
                    <div className="flex items-center gap-2.5 mb-4 flex-wrap">
                      {cats.map((cat) => (
                        <span key={cat} className="text-xs font-medium px-3 py-1 rounded-full text-white" style={{ background: "rgba(75,92,240,0.75)" }}>
                          {formatCategoryLabel(cat)}
                        </span>
                      ))}
                    </div>
                    <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight max-w-3xl">
                      {data.name}
                    </h1>
                  </motion.div>
                </div>
              </div>
            ) : (
              <div className="bg-black py-24 px-6 relative overflow-hidden">
                <div className="absolute inset-0 opacity-[0.06] pointer-events-none" style={{ background: `radial-gradient(ellipse at 30% 50%, ${BLUE}, transparent 70%)` }} />
                <div className="relative max-w-4xl mx-auto">
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
                    <div className="flex items-center gap-2.5 mb-6 flex-wrap">
                      {cats.map((cat) => (
                        <span key={cat} className="text-xs font-medium px-3 py-1 rounded-full text-white" style={{ background: "rgba(75,92,240,0.7)" }}>
                          {formatCategoryLabel(cat)}
                        </span>
                      ))}
                    </div>
                    <h1 className="text-3xl md:text-5xl font-bold text-white leading-tight max-w-3xl">
                      {data.name}
                    </h1>
                  </motion.div>
                </div>
              </div>
            )}
          </section>

          <section className="border-b border-black/[0.08] py-5 px-6">
            <div className="max-w-4xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <Link href={basePath} className="inline-flex items-center gap-1.5 text-sm text-black/45 hover:text-black transition-colors">
                <ArrowLeft size={14} /> {backLabel}
              </Link>
              <div className="flex items-center gap-5 text-sm text-black/45">
                {data.date && (
                  <span className="flex items-center gap-1.5">
                    <Calendar size={13} />
                    {formatDate(data.date)}
                  </span>
                )}
                {data.content && (
                  <span className="flex items-center gap-1.5">
                    <Clock size={13} />
                    {readTime(data.content)}
                  </span>
                )}
              </div>
            </div>
          </section>

          <article className="py-14 px-6">
            <div className="max-w-3xl mx-auto">
              {data.content ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                  className="mb-content"
                  dangerouslySetInnerHTML={{ __html: data.content }}
                />
              ) : (
                <p className="text-black/40 text-sm italic">No content yet.</p>
              )}
            </div>
          </article>

          {data.more && data.more.length > 0 && (
            <section className="py-16 px-6 bg-gray-50/70 border-t border-black/[0.07]">
              <div className="max-w-7xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/30 mb-2">
                      Continue reading
                    </p>
                    <h2 className="text-2xl font-bold">
                      More {type === "blog" ? "Posts" : type === "articles" ? "Articles" : "Case Studies"}
                    </h2>
                  </div>
                  <Link href={basePath} className="hidden sm:inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors">
                    View all <ArrowRight size={14} />
                  </Link>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {data.more.map((item) => (
                    <RelatedCard key={item.id} item={item} basePath={basePath} />
                  ))}
                </div>

                <div className="mt-8 sm:hidden">
                  <Link href={basePath} className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600">
                    View all {type === "blog" ? "posts" : type === "articles" ? "articles" : "case studies"} <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            </section>
          )}

          <SiteFooter />
        </>
      )}
    </div>
  );
}
