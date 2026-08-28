import { useState, useEffect, useCallback, useRef } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { ArrowRight, ArrowUpRight, Search, X } from "lucide-react";
import { publicApi, toAbsoluteUrl, type PublicItem, type ListResponse } from "@/lib/public-api";
import { formatCategoryLabel } from "@/lib/category-format";
import SiteNav from "@/components/site-nav";
import SiteFooter from "@/components/site-footer";
import { useHomepageContent } from "@/lib/site-content";

const BLUE = "#4B5CF0";

const CONFIG = {
  blog: {
    basePath: "/blog",
    listFn: publicApi.listBlog,
    sectionKey: "page_blog" as const,
    search: "hero" as const,
  },
  articles: {
    basePath: "/articles",
    listFn: publicApi.listArticles,
    sectionKey: "page_articles" as const,
    search: "bottom" as const,
  },
  case_studies: {
    basePath: "/case-studies",
    listFn: publicApi.listCaseStudies,
    sectionKey: "page_case_studies" as const,
    search: "none" as const,
  },
};

function formatDate(d: string) {
  if (!d) return "";
  const dt = new Date(d + "T00:00:00");
  return dt.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function parseCats(raw: string): string[] {
  try {
    return JSON.parse(raw) as string[];
  } catch {
    return [];
  }
}

function ContentRow({ item, basePath, index }: { item: PublicItem; basePath: string; index: number; }) {
  const [imgErr, setImgErr] = useState(false);
  const cats = parseCats(item.categories).slice(0, 2);
  // Pieces published elsewhere open on that site instead of a detail page.
  const external = toAbsoluteUrl(item.external_url);
  const host = external ? external.replace(/^https?:\/\//, "").split("/")[0].replace(/^www\./, "") : "";
  // Alternate which side the image sits on, so a long list keeps a rhythm
  // instead of reading as one repeated block.
  const flipped = index % 2 === 1;

  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      <LinkOrAnchor external={external} href={`${basePath}/${item.slug}`}>
        <article
          className={`grid md:grid-cols-2 gap-7 md:gap-14 items-center py-10 md:py-14 border-t border-black/[0.08] ${
            flipped ? "md:[&>*:first-child]:order-2" : ""
          }`}
        >
          {/* cover */}
          <div className="relative aspect-[16/10] overflow-hidden bg-gray-100">
            {item.feature_image && !imgErr ? (
              <img
                src={item.feature_image}
                alt={item.name}
                onError={() => setImgErr(true)}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700"
              />
            ) : (
              <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${BLUE}cc, #6366F1)` }} />
            )}
          </div>

          {/* text */}
          <div className="flex flex-col gap-4 md:max-w-[92%]">
            <div className="flex items-center gap-3 flex-wrap text-xs">
              <span className="text-black/35">{formatDate(item.date)}</span>
              {cats.map((cat) => (
                <span key={cat} className="font-semibold uppercase tracking-[0.14em]" style={{ color: BLUE }}>
                  {formatCategoryLabel(cat)}
                </span>
              ))}
            </div>

            <h2 className="text-2xl md:text-[34px] font-bold leading-[1.15] tracking-tight text-gray-900 group-hover:opacity-60 transition-opacity duration-300">
              {item.name}
            </h2>

            {item.excerpt && (
              <p className="text-base text-black/50 leading-relaxed line-clamp-3">{item.excerpt}</p>
            )}

            <span className="mt-1 inline-flex items-center gap-2 text-sm font-semibold" style={{ color: BLUE }}>
              {external ? `Read on ${host}` : "Read more"}
              {external ? (
                <ArrowUpRight size={15} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform duration-300" />
              ) : (
                <ArrowRight size={14} className="group-hover:translate-x-1.5 transition-transform duration-300" />
              )}
            </span>
          </div>
        </article>
      </LinkOrAnchor>
    </motion.div>
  );
}

/** Renders an internal route link, or an outbound link for external pieces. */
function LinkOrAnchor({
  external,
  href,
  children,
}: {
  external: string;
  href: string;
  children: React.ReactNode;
}) {
  if (external) {
    return (
      <a href={external} target="_blank" rel="noopener noreferrer" className="group block">
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className="group block">
      {children}
    </Link>
  );
}

function Pagination({ page, pages, onPage }: { page: number; pages: number; onPage: (p: number) => void; }) {
  if (pages <= 1) return null;
  const nums: (number | "…")[] = [];
  if (pages <= 7) { for (let i = 1; i <= pages; i++) nums.push(i); } else { nums.push(1); if (page > 3) nums.push("…"); for (let i = Math.max(2, page - 1); i <= Math.min(pages - 1, page + 1); i++) nums.push(i); if (page < pages - 2) nums.push("…"); nums.push(pages); }
  return (<div className="flex items-center justify-center gap-1.5 mt-12 flex-wrap"><button onClick={() => onPage(page - 1)} disabled={page === 1} className="px-3 py-2 text-sm border border-black/[0.12] rounded-lg text-black/50 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">←</button>{nums.map((n, i) => n === "…" ? <span key={`e${i}`} className="px-2 text-black/30 text-sm">…</span> : <button key={n} onClick={() => onPage(n as number)} className="w-9 h-9 text-sm rounded-lg border transition-colors font-medium" style={n === page ? { background: BLUE, color: "white", borderColor: BLUE } : { borderColor: "rgba(0,0,0,0.12)", color: "rgba(0,0,0,0.6)" }}>{n}</button>)}<button onClick={() => onPage(page + 1)} disabled={page === pages} className="px-3 py-2 text-sm border border-black/[0.12] rounded-lg text-black/50 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">→</button></div>);
}

export default function ContentIndexPage({ type }: { type: "blog" | "articles" | "case_studies" }) {
  const cfg = CONFIG[type];
  // Wording comes from the CMS ("Other pages" in the admin), falling back to
  // the defaults shipped in the build.
  const text = useHomepageContent().section(cfg.sectionKey);
  const [, navigate] = useLocation();
  const [search, setSearch] = useState("");
  const [inputValue, setInputValue] = useState("");
  const [category, setCategory] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<ListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchData = useCallback(async (s: string, cat: string, p: number) => { setLoading(true); setError(""); try { const result = await cfg.listFn({ search: s, category: cat, page: p }); setData(result); } catch (err) { setError(err instanceof Error ? err.message : "Failed to load"); } finally { setLoading(false); } }, [cfg]);
  useEffect(() => { void fetchData(search, category, page); }, [search, category, page, fetchData]);
  function handleSearchInput(val: string) { setInputValue(val); if (debounceRef.current) clearTimeout(debounceRef.current); debounceRef.current = setTimeout(() => { setSearch(val); setPage(1); }, 400); }
  function clearSearch() { setInputValue(""); setSearch(""); setPage(1); }
  function selectCategory(cat: string) { setCategory(cat); setPage(1); }
  useEffect(() => { window.scrollTo({ top: 0, behavior: "smooth" }); }, [page]);
  const allCategories = data?.categories ?? [];

  const searchField = (
    <>
      <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-black/30 pointer-events-none" />
      <input
        type="text"
        value={inputValue}
        onChange={(e) => handleSearchInput(e.target.value)}
        placeholder={text.searchPlaceholder}
        aria-label={text.searchLabel}
        className="w-full pl-11 pr-10 py-3.5 text-sm border border-black/[0.14] focus:outline-none focus:border-blue-500 transition-colors bg-white"
      />
      {inputValue && (
        <button onClick={clearSearch} aria-label="Clear search" className="absolute right-4 top-1/2 -translate-y-1/2 text-black/30 hover:text-black transition-colors">
          <X size={14} />
        </button>
      )}
    </>
  );

  return (
    <div className="min-h-screen bg-white text-black antialiased" style={{ fontFamily: "'DM Sans', 'Inter', sans-serif" }}>
      <SiteNav />
      <section className="pt-[70px]">
        <div className="max-w-7xl mx-auto px-6 pt-20 pb-16 border-b border-black/[0.07]">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}>
            <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
              className="text-xs font-semibold uppercase tracking-[0.22em] mb-4" style={{ color: BLUE }}>{text.eyebrow}</motion.p>
            <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.06 }}
              className="text-4xl md:text-6xl font-bold leading-tight mb-5 tracking-tight max-w-2xl">{text.title}</motion.h1>
            <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.12 }}
              className="text-base text-black/45 leading-relaxed mb-10 max-w-lg">{text.subtitle}</motion.p>
            {cfg.search === "hero" && (
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.18 }} className="relative max-w-lg">
                {searchField}
              </motion.div>
            )}
          </motion.div>
        </div>
      </section>
      {allCategories.length > 0 && (
        <section className="sticky top-[70px] z-30 bg-white/95 backdrop-blur border-b border-black/[0.07]"><div className="max-w-7xl mx-auto px-6 py-3"><div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-0.5"><button onClick={() => selectCategory("")} className="flex-shrink-0 text-xs font-medium px-3.5 py-1.5 rounded-full border transition-all" style={!category ? { background: BLUE, color: "white", borderColor: BLUE } : { borderColor: "rgba(0,0,0,0.15)", color: "rgba(0,0,0,0.55)" }}>All</button>{allCategories.map((cat) => (<button key={cat} onClick={() => selectCategory(category === cat ? "" : cat)} className="flex-shrink-0 text-xs font-medium px-3.5 py-1.5 rounded-full border transition-all whitespace-nowrap" style={category === cat ? { background: BLUE, color: "white", borderColor: BLUE } : { borderColor: "rgba(0,0,0,0.15)", color: "rgba(0,0,0,0.55)" }}>{formatCategoryLabel(cat)}</button>))}</div></div></section>
      )}
      <section className="py-14 px-6"><div className="max-w-6xl mx-auto">{!loading && data && (<div className="mb-8 text-sm text-black/40">{data.total === 0 ? text.emptyLabel : <>{data.total} {data.total === 1 ? "result" : "results"}{search && <> {" "}for{" "}<span className="font-medium text-black/70">"{search}"</span></>}{category && <> {" "}in{" "}<span className="font-medium text-black/70">{formatCategoryLabel(category)}</span></>}</>}</div>)}{loading && (<div className="flex flex-col">{Array.from({ length: 3 }).map((_, i) => (<div key={i} className="grid md:grid-cols-2 gap-7 md:gap-14 py-10 md:py-14 border-t border-black/[0.08]"><div className="aspect-[16/10] bg-gray-50 animate-pulse" /><div className="flex flex-col gap-4 pt-2"><div className="h-3 w-24 bg-gray-50 animate-pulse" /><div className="h-7 w-4/5 bg-gray-50 animate-pulse" /><div className="h-4 w-full bg-gray-50 animate-pulse" /><div className="h-4 w-2/3 bg-gray-50 animate-pulse" /></div></div>))}</div>)}{error && (<div className="text-center py-20"><p className="text-red-500 text-sm mb-4">{error}</p><button onClick={() => void fetchData(search, category, page)} className="text-sm text-blue-600 hover:underline">Try again</button></div>)}{!loading && !error && data?.items.length === 0 && (<div className="text-center py-24"><p className="text-black/30 text-sm mb-4">No results found{search ? ` for "${search}"` : ""}{category ? ` in "${formatCategoryLabel(category)}"` : ""}</p>{(search || category) && (<button onClick={() => { clearSearch(); setCategory(""); }} className="text-sm text-blue-600 hover:underline">Clear filters</button>)}</div>)}{!loading && !error && data && data.items.length > 0 && (<><div className="border-b border-black/[0.08]">{data.items.map((item, i) => (<ContentRow key={item.id} item={item} basePath={cfg.basePath} index={i} />))}</div><Pagination page={data.page} pages={data.pages} onPage={(p) => setPage(p)} /></>)}</div></section>
      {cfg.search === "bottom" && (
        <section className="px-6 pb-20">
          <div className="max-w-6xl mx-auto border-t border-black/[0.08] pt-10">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/35 mb-4">{text.searchLabel}</p>
            <div className="relative max-w-lg">{searchField}</div>
          </div>
        </section>
      )}
      <SiteFooter />
    </div>
  );
}
