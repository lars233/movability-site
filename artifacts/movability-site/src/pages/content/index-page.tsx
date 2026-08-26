import { useState, useEffect, useCallback, useRef } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { ArrowRight, Search, X } from "lucide-react";
import { publicApi, type PublicItem, type ListResponse } from "@/lib/public-api";
import { formatCategoryLabel } from "@/lib/category-format";
import SiteNav from "@/components/site-nav";
import SiteFooter from "@/components/site-footer";

const BLUE = "#4B5CF0";

const CONFIG = {
  blog: {
    eyebrow: "Blog",
    title: "Latest from the Blog",
    subtitle:
      "Practical strategy, policy analysis, and mobility market intelligence.",
    basePath: "/blog",
    listFn: publicApi.listBlog,
    emptyMessage: "No blog posts yet.",
  },
  articles: {
    eyebrow: "Articles",
    title: "Mobility Expert Interviews",
    subtitle:
      "In-depth chats with operators, regulators and officials to help you understand how transport is evolving.",
    basePath: "/articles",
    listFn: publicApi.listArticles,
    emptyMessage: "No articles yet.",
  },
  case_studies: {
    eyebrow: "CASE STUDIES",
    title: "How we've closed the gap before",
    subtitle:
      "Previous Movability projects showcasing our impact.",
    basePath: "/case-studies",
    listFn: publicApi.listCaseStudies,
    emptyMessage: "No case studies yet.",
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

function ContentCard({ item, basePath, index }: { item: PublicItem; basePath: string; index: number; }) {
  const [imgErr, setImgErr] = useState(false);
  return (
    <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}>
      <Link href={`${basePath}/${item.slug}`} className="group block h-full">
        <article className="h-full bg-white rounded-xl border border-black/[0.08] overflow-hidden hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300">
          <div className="aspect-[16/9] overflow-hidden bg-gray-100">
            {item.feature_image && !imgErr ? (
              <img src={item.feature_image} alt={item.name} onError={() => setImgErr(true)} className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-500" />
            ) : (
              <div className="w-full h-full" style={{ background: `linear-gradient(135deg, ${BLUE}cc, #6366F1)` }} />
            )}
          </div>
          <div className="p-5 sm:p-6 flex flex-col gap-3">
            <div className="flex items-center gap-2.5 flex-wrap"><span className="text-xs text-black/35">{formatDate(item.date)}</span></div>
            <h3 className="font-semibold text-base leading-snug line-clamp-2 text-gray-900 group-hover:text-blue-600 transition-colors duration-200">{item.name}</h3>
            {item.excerpt && (<p className="text-sm text-black/55 leading-relaxed line-clamp-3">{item.excerpt}</p>)}
            <div className="pt-1 flex items-center gap-1.5 text-xs font-semibold text-blue-600">Read more{" "}<ArrowRight size={12} className="group-hover:translate-x-1 transition-transform duration-200" /></div>
          </div>
        </article>
      </Link>
    </motion.div>
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

  return (
    <div className="min-h-screen bg-white text-black antialiased" style={{ fontFamily: "'DM Sans', 'Inter', sans-serif" }}>
      <SiteNav />
      <section className="pt-[70px]">
        <div className="max-w-7xl mx-auto px-6 pt-20 pb-16 border-b border-black/[0.07]">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}>
            <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
              className="text-xs font-semibold uppercase tracking-[0.22em] mb-4" style={{ color: BLUE }}>{cfg.eyebrow}</motion.p>
            <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.06 }}
              className="text-4xl md:text-6xl font-bold leading-tight mb-5 tracking-tight max-w-2xl">{cfg.title}</motion.h1>
            <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.12 }}
              className="text-base text-black/45 leading-relaxed mb-10 max-w-lg">{cfg.subtitle}</motion.p>
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.18 }} className="relative max-w-lg">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-black/30 pointer-events-none" />
              <input type="text" value={inputValue} onChange={(e) => handleSearchInput(e.target.value)} placeholder={`Search ${cfg.eyebrow.toLowerCase()}…`} className="w-full pl-11 pr-10 py-3.5 text-sm border border-black/[0.14] focus:outline-none focus:border-blue-500 transition-colors bg-white" />
              {inputValue && (<button onClick={clearSearch} className="absolute right-4 top-1/2 -translate-y-1/2 text-black/30 hover:text-black transition-colors"><X size={14} /></button>)}
            </motion.div>
          </motion.div>
        </div>
      </section>
      {allCategories.length > 0 && (
        <section className="sticky top-[70px] z-30 bg-white/95 backdrop-blur border-b border-black/[0.07]"><div className="max-w-7xl mx-auto px-6 py-3"><div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-0.5"><button onClick={() => selectCategory("")} className="flex-shrink-0 text-xs font-medium px-3.5 py-1.5 rounded-full border transition-all" style={!category ? { background: BLUE, color: "white", borderColor: BLUE } : { borderColor: "rgba(0,0,0,0.15)", color: "rgba(0,0,0,0.55)" }}>All</button>{allCategories.map((cat) => (<button key={cat} onClick={() => selectCategory(category === cat ? "" : cat)} className="flex-shrink-0 text-xs font-medium px-3.5 py-1.5 rounded-full border transition-all whitespace-nowrap" style={category === cat ? { background: BLUE, color: "white", borderColor: BLUE } : { borderColor: "rgba(0,0,0,0.15)", color: "rgba(0,0,0,0.55)" }}>{formatCategoryLabel(cat)}</button>))}</div></div></section>
      )}
      <section className="py-14 px-6"><div className="max-w-7xl mx-auto">{!loading && data && (<div className="mb-8 text-sm text-black/40">{data.total === 0 ? cfg.emptyMessage : <>{data.total} {data.total === 1 ? "result" : "results"}{search && <> {" "}for{" "}<span className="font-medium text-black/70">"{search}"</span></>}{category && <> {" "}in{" "}<span className="font-medium text-black/70">{formatCategoryLabel(category)}</span></>}</>}</div>)}{loading && (<div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">{Array.from({ length: 6 }).map((_, i) => (<div key={i} className="bg-gray-50 rounded-xl border border-black/[0.06] aspect-[4/3] animate-pulse" />))}</div>)}{error && (<div className="text-center py-20"><p className="text-red-500 text-sm mb-4">{error}</p><button onClick={() => void fetchData(search, category, page)} className="text-sm text-blue-600 hover:underline">Try again</button></div>)}{!loading && !error && data?.items.length === 0 && (<div className="text-center py-24"><p className="text-black/30 text-sm mb-4">No results found{search ? ` for "${search}"` : ""}{category ? ` in "${formatCategoryLabel(category)}"` : ""}</p>{(search || category) && (<button onClick={() => { clearSearch(); setCategory(""); }} className="text-sm text-blue-600 hover:underline">Clear filters</button>)}</div>)}{!loading && !error && data && data.items.length > 0 && (<><div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">{data.items.map((item, i) => (<ContentCard key={item.id} item={item} basePath={cfg.basePath} index={i} />))}</div><Pagination page={data.page} pages={data.pages} onPage={(p) => setPage(p)} /></>)}</div></section>
      <SiteFooter />
    </div>
  );
}
