import { useState, useEffect, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { ArrowUpRight, FileText } from "lucide-react";
import { publicApi, type PublicReport } from "@/lib/public-api";
import SiteNav from "@/components/site-nav";
import SiteFooter from "@/components/site-footer";

const BLUE = "#4B5CF0";

function Reveal({ children, delay = 0, className = "" }: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function ReportCard({ report, index }: { report: PublicReport; index: number }) {
  const hasLink = !!report.download_url;

  const card = (
    <div className="group grid md:grid-cols-[1.62fr_1fr] md:h-[420px] border border-black/[0.10] hover:border-black/25 transition-all duration-400 overflow-hidden md:max-w-[96%]">
      {/* cover image — full bleed */}
      <div className="relative bg-black overflow-hidden min-h-[220px]">
        {report.image ? (
          <img
            src={report.image}
            alt={report.title}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3"
            style={{ background: `linear-gradient(135deg, #0f1729 0%, #1a1f3a 50%, ${BLUE}33 100%)` }}>
            <FileText size={36} style={{ color: `${BLUE}80` }} />
          </div>
        )}
      </div>
      {/* text panel */}
      <div className="p-8 md:p-12 min-w-0 flex flex-col justify-between bg-[#FAFAFA] group-hover:bg-white transition-colors">
        <div>
          <h2 className="text-xl md:text-2xl font-bold leading-snug mb-4">
            {report.title}
          </h2>
          {report.subtitle && (
            <p className="text-sm text-black/50 leading-relaxed max-w-md">{report.subtitle}</p>
          )}
          {report.date && (
            <div className="mt-6">
              <p className="text-xs text-black/35 mb-0.5">Published</p>
              <p className="text-sm font-semibold">
                {new Date(report.date).toLocaleDateString("en-GB", { month: "long", year: "numeric" })}
              </p>
            </div>
          )}
        </div>
        <div className="mt-10">
          {hasLink ? (
            <span className="inline-flex items-center gap-2 text-sm font-semibold px-6 py-3 border border-black group-hover:bg-black group-hover:text-white transition-all">
              Download Report <ArrowUpRight size={15} />
            </span>
          ) : (
            <span className="text-sm text-black/30 italic">Coming soon</span>
          )}
        </div>
      </div>
    </div>
  );

  if (hasLink) {
    return (
      <a href={report.download_url} target="_blank" rel="noopener noreferrer" className="block">
        <Reveal delay={index * 0.1}>{card}</Reveal>
      </a>
    );
  }
  return <Reveal delay={index * 0.1}>{card}</Reveal>;
}

export default function ReportsPage() {
  const [reports, setReports] = useState<PublicReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    window.scrollTo(0, 0);
    publicApi
      .listReports()
      .then((data) => { setReports(data); setLoading(false); })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Failed to load");
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-white text-black antialiased" style={{ fontFamily: "'DM Sans', 'Inter', sans-serif" }}>
      <SiteNav />

      <section className="pt-[70px]">
        <div className="max-w-7xl mx-auto px-6 pt-20 pb-16 border-b border-black/[0.07]">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] mb-4" style={{ color: BLUE }}>Reports</p>
            <h1 className="text-4xl md:text-6xl font-bold leading-tight tracking-tight mb-5 max-w-2xl">
              Actionable{" "}
              <span style={{ backgroundImage: `linear-gradient(135deg, ${BLUE}, #6366F1)`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                Mobility
              </span>{" "}
              Intelligence
            </h1>
            <p className="text-base text-black/45 max-w-lg leading-relaxed">
              Deep-dive research on procurement strategy, regulatory evolutions and new mobility, with unique behind the scenes operational and market data.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 py-16">
        {loading && <div className="flex items-center justify-center py-32"><div className="w-7 h-7 rounded-full border-2 border-blue-200 border-t-blue-600 animate-spin" /></div>}
        {error && <div className="text-center py-20"><p className="text-sm text-red-500">{error}</p></div>}
        {!loading && !error && reports.length === 0 && <div className="text-center py-32"><div className="w-14 h-14 rounded-xl mx-auto mb-5 flex items-center justify-center" style={{ background: `${BLUE}10` }}><FileText size={24} style={{ color: BLUE }} /></div><h2 className="text-lg font-semibold text-gray-900 mb-2">No reports yet</h2><p className="text-sm text-black/35 max-w-xs mx-auto">Reports will appear here once published.</p></div>}
        {!loading && !error && reports.length > 0 && <div className="flex flex-col gap-5">{reports.map((report, i) => <ReportCard key={report.id} report={report} index={i} />)}</div>}
      </section>

      <SiteFooter />
    </div>
  );
}
