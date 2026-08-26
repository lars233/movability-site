import React, { useState, useEffect, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { ArrowRight, ArrowUpRight, Menu, X } from "lucide-react";
import larsPhoto from "@assets/Lars_photo_1778244138811.webp";

const BLUE = "#4B5CF0";

function useScrolled() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return scrolled;
}

function Reveal({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function Counter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const duration = 1400;
    const step = 16;
    const increment = target / (duration / step);
    const timer = setInterval(() => {
      start += increment;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, step);
    return () => clearInterval(timer);
  }, [inView, target]);
  return <span ref={ref}>{count}{suffix}</span>;
}

export default function HomeV2() {
  const [menuOpen, setMenuOpen] = useState(false);
  const scrolled = useScrolled();

  const navLinks = [
    { label: "Reports", href: "#v2-reports" },
    { label: "Articles", href: "#v2-articles" },
    { label: "Case Studies", href: "#v2-cases" },
    { label: "V1", href: "/" },
    { label: "V3", href: "/v3" },
    { label: "Final", href: "/final" },
  ];

  const clients = [
    "Bolt", "FAIRTIQ", "Ruter", "Fast Travel", "Nextbike",
    "dott", "Kolumbus", "Cachet", "IM Solutions", "UIP", "Voltraware", "Rulle",
  ];

  const stats = [
    { prefix: "€", number: 6, suffix: "M+", label: "Ride-hail market entry contract" },
    { prefix: "", number: 2, suffix: "x", label: "Rides doubled through regulation" },
    { prefix: "", number: 5, suffix: "", label: "Contracts secured for Ruter" },
    { prefix: "€", number: 10, suffix: "M+", label: "New revenue unlocked" },
    { prefix: "", number: 20, suffix: "+", label: "Clients across Europe" },
  ];

  const services = [
    {
      index: "01",
      title: "Market Entry",
      desc: "Navigate new geographies with precision. We map competitive landscapes, regulatory environments, and partnership opportunities so you move fast with conviction.",
    },
    {
      index: "02",
      title: "Strategy & Regulation",
      desc: "Translate policy into opportunity. We advise municipalities and operators on frameworks that serve both public goals and commercial growth.",
    },
    {
      index: "03",
      title: "Operator Advisory",
      desc: "From fleet economics to SLA design, we help operators build the operational and contractual foundations that sustain scale.",
    },
    {
      index: "04",
      title: "Public Procurement",
      desc: "Win tenders and procure mobility services that actually perform. We bring operator expertise to both sides of the table.",
    },
    {
      index: "05",
      title: "Investment & M&A",
      desc: "Due diligence, strategic positioning, and deal preparation for mobility investments — grounded in market reality.",
    },
    {
      index: "06",
      title: "Research & Reports",
      desc: "Deep-dive intelligence on mobility verticals, published and commissioned, that decision-makers rely on.",
    },
  ];

  const verticals = [
    "Self-driving", "Public Transport", "Ride-hail", "Investment & M&A",
    "Micromobility", "Demand-responsive Transport", "Car-Sharing", "Mobility Software", "Insurance",
  ];

  const testimonials = [
    {
      quote: "Movability's deep knowledge of the bike-share industry as well as the regulatory landscape in Norway has been invaluable in shaping our procurement strategy.",
      author: "Mobility Director",
      company: "Ruter",
    },
    {
      quote: "Lars's understanding of micromobility regulation from both an operator and government perspective is frankly unmatched. He helped us close a market we'd been circling for two years.",
      author: "Head of Market Expansion",
      company: "European Operator",
    },
    {
      quote: "Micromobility was a completely new market for us. Movability provided expert knowledge from the operator side and PMO that helped us build SLAs, analyse data, and negotiate better deals.",
      author: "Head of Procurement",
      company: "Public Transport Authority",
    },
  ];

  const caseStudies = [
    {
      tag: "Regulation",
      title: "Doubling Oslo's e-scooter rides through regulatory reform",
      year: "2024",
      bg: "bg-zinc-100",
    },
    {
      tag: "Market Entry",
      title: "€6M ride-hail contract — from zero presence to signed deal",
      year: "2024",
      bg: "bg-slate-100",
    },
    {
      tag: "Procurement",
      title: "Five mobility contracts secured for Norway's largest PTA",
      year: "2023",
      bg: "bg-neutral-100",
    },
  ];

  const articles = [
    {
      date: "Sep 9, 2025",
      tag: "Autonomous",
      title: "A Waymo will never give you the long-distance ride you need",
      bg: "from-slate-700 to-slate-900",
    },
    {
      date: "Sep 9, 2025",
      tag: "Bike-Share",
      title: "CEO on nextbike's Journey: Expansion, TIER Merger, and Return to Independence",
      bg: "from-zinc-600 to-zinc-900",
    },
    {
      date: "Sep 9, 2025",
      tag: "Procurement",
      title: "Ex. Bike-Share CEO Wants To Bring Big Tech's Data Ambition To Public Procurement",
      bg: "from-neutral-600 to-neutral-900",
    },
  ];

  return (
    <div className="min-h-screen bg-white text-black font-sans antialiased">

      {/* ── Navbar ── */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? "bg-white/95 backdrop-blur-md border-b border-black/10" : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <a href="#" className="text-sm font-bold tracking-widest uppercase">Movability</a>
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((l) => (
              <a key={l.label} href={l.href}
                className="text-sm font-medium text-black/60 hover:text-black transition-colors">
                {l.label}
              </a>
            ))}
            <a href="#v2-contact"
              className="text-sm font-semibold border border-black px-5 py-2 hover:bg-black hover:text-white transition-colors">
              Book a meeting
            </a>
          </nav>
          <button className="md:hidden" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
        {menuOpen && (
          <div className="md:hidden bg-white border-t border-black/10 px-6 py-6 flex flex-col gap-5">
            {navLinks.map((l) => (
              <a key={l.label} href={l.href} onClick={() => setMenuOpen(false)}
                className="text-base font-medium">{l.label}</a>
            ))}
            <a href="#v2-contact"
              className="text-base font-semibold border border-black px-5 py-3 text-center">
              Book a meeting
            </a>
          </div>
        )}
      </header>

      {/* ── Hero ── */}
      <section className="pt-40 pb-24 px-6 max-w-7xl mx-auto">
        <Reveal>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/40 mb-8">
            Mobility Strategy · Europe
          </p>
        </Reveal>
        <Reveal delay={0.08}>
          <h1 className="text-6xl md:text-8xl lg:text-[110px] font-bold leading-[0.92] tracking-tight mb-10 max-w-5xl">
            The strategy layer<br />
            <span style={{ color: BLUE }}>mobility needs.</span>
          </h1>
        </Reveal>
        <Reveal delay={0.16}>
          <div className="flex flex-col sm:flex-row gap-6 items-start">
            <p className="text-lg text-black/55 max-w-sm leading-relaxed">
              Movability advises governments and transport companies on growing new mobility — bridging public goals and market realities.
            </p>
            <div className="flex gap-4 flex-shrink-0 sm:ml-auto sm:items-end sm:self-end">
              <a href="#v2-contact"
                style={{ backgroundColor: BLUE }}
                className="inline-flex items-center gap-2 text-white text-sm font-semibold px-6 py-3 hover:opacity-90 transition-opacity">
                Let's talk <ArrowRight size={16} />
              </a>
              <a href="#v2-cases"
                className="inline-flex items-center gap-2 text-sm font-semibold border border-black/30 px-6 py-3 hover:border-black transition-colors">
                See work <ArrowUpRight size={16} />
              </a>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ── Divider + Clients ── */}
      <div className="border-t border-black/10" />
      <section className="py-8 px-6 max-w-7xl mx-auto">
        <div className="flex flex-wrap gap-x-10 gap-y-3">
          {clients.map((c, i) => (
            <span key={i} className="text-xs font-bold uppercase tracking-widest text-black/25 hover:text-black/60 transition-colors cursor-default">
              {c}
            </span>
          ))}
        </div>
      </section>
      <div className="border-t border-black/10" />

      {/* ── Stats bar ── */}
      <section className="py-20 px-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-0 border border-black/10">
          {stats.map((s, i) => (
            <Reveal key={i} delay={i * 0.07}>
              <div className="p-8 border-r border-b md:border-b-0 border-black/10 last:border-r-0 group hover:bg-black transition-colors duration-300">
                <div className="text-4xl md:text-5xl font-bold mb-3 transition-colors duration-300 group-hover:text-white" style={{ color: BLUE }}>
                  {s.prefix}<Counter target={s.number} suffix={s.suffix} />
                </div>
                <p className="text-xs text-black/50 leading-snug group-hover:text-white/60 transition-colors duration-300">{s.label}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── Problem statement ── */}
      <div className="border-t border-black/10" />
      <section className="py-24 px-6 max-w-7xl mx-auto grid md:grid-cols-2 gap-16 items-start">
        <Reveal>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/40 mb-6">The challenge</p>
          <h2 className="text-4xl md:text-5xl font-bold leading-tight">
            Mobility markets move fast.<br />Most decisions don't.
          </h2>
        </Reveal>
        <Reveal delay={0.1}>
          <div className="pt-10 md:pt-16 space-y-5 text-black/60 text-base leading-relaxed">
            <p>Governments struggle to write contracts that operators can actually deliver. Operators struggle to enter markets without burning capital on the wrong things.</p>
            <p>The gap is strategy — not effort. Movability closes it by bringing both sides of the table the expertise they're missing.</p>
            <a href="#v2-services" className="inline-flex items-center gap-2 text-sm font-semibold text-black hover:opacity-60 transition-opacity mt-4">
              What we do <ArrowRight size={14} />
            </a>
          </div>
        </Reveal>
      </section>
      <div className="border-t border-black/10" />

      {/* ── Services ── */}
      <section id="v2-services" className="py-24 px-6 max-w-7xl mx-auto">
        <Reveal>
          <div className="flex items-end justify-between mb-14">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/40 mb-3">Services</p>
              <h2 className="text-4xl md:text-5xl font-bold leading-tight">What we do</h2>
            </div>
          </div>
        </Reveal>
        <div className="divide-y divide-black/10 border-t border-black/10">
          {services.map((s, i) => (
            <Reveal key={i} delay={i * 0.06}>
              <div className="group py-8 flex gap-8 items-start hover:bg-black/[0.02] transition-colors -mx-6 px-6 cursor-default">
                <span className="text-xs font-bold text-black/25 pt-1 w-6 flex-shrink-0">{s.index}</span>
                <div className="flex-1 md:grid md:grid-cols-2 gap-10">
                  <h3 className="text-xl font-bold mb-3 md:mb-0 group-hover:text-[#4B5CF0] transition-colors">{s.title}</h3>
                  <p className="text-sm text-black/55 leading-relaxed">{s.desc}</p>
                </div>
                <ArrowUpRight size={18} className="flex-shrink-0 text-black/20 group-hover:text-black/60 transition-colors mt-1" />
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── Verticals ticker ── */}
      <div className="border-t border-black/10 bg-black py-16 overflow-hidden">
        <div className="flex gap-0 animate-[marquee_30s_linear_infinite] whitespace-nowrap w-max">
          {[...verticals, ...verticals, ...verticals].map((v, i) => (
            <span key={i} className="text-white/20 text-sm font-bold uppercase tracking-widest px-8">
              {v} <span className="text-white/10 mx-4">·</span>
            </span>
          ))}
        </div>
      </div>

      {/* ── Case Studies ── */}
      <section id="v2-cases" className="py-24 px-6 max-w-7xl mx-auto">
        <Reveal>
          <div className="flex items-end justify-between mb-14">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/40 mb-3">Case Studies</p>
              <h2 className="text-4xl md:text-5xl font-bold leading-tight">Transport strategy<br />in practice</h2>
            </div>
            <a href="#v2-cases" className="hidden md:inline-flex items-center gap-2 text-sm font-semibold text-black/50 hover:text-black transition-colors">
              All cases <ArrowRight size={14} />
            </a>
          </div>
        </Reveal>
        <div className="grid md:grid-cols-3 gap-6">
          {caseStudies.map((c, i) => (
            <Reveal key={i} delay={i * 0.1}>
              <div className={`group cursor-pointer ${c.bg} p-8 flex flex-col justify-between min-h-64 hover:opacity-80 transition-opacity`}>
                <div className="flex items-center justify-between mb-8">
                  <span className="text-xs font-bold uppercase tracking-widest text-black/50">{c.tag}</span>
                  <span className="text-xs text-black/30">{c.year}</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold leading-snug mb-4">{c.title}</h3>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-black/50 group-hover:text-black transition-colors">
                    Read case <ArrowRight size={12} />
                  </span>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── Testimonials ── */}
      <div className="border-t border-black/10" />
      <section className="py-24 px-6 max-w-7xl mx-auto">
        <Reveal>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/40 mb-16">What clients say</p>
        </Reveal>
        <div className="divide-y divide-black/10">
          {testimonials.map((t, i) => (
            <Reveal key={i} delay={i * 0.1}>
              <div className="py-10 grid md:grid-cols-[1fr_auto] gap-8 items-start">
                <blockquote className="text-xl md:text-2xl font-medium leading-snug text-black/80 max-w-2xl">
                  "{t.quote}"
                </blockquote>
                <div className="text-right md:text-right flex-shrink-0">
                  <p className="text-sm font-bold">{t.author}</p>
                  <p className="text-xs text-black/40 mt-1">{t.company}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── About Lars ── */}
      <div className="border-t border-black/10" />
      <section className="py-24 px-6 max-w-7xl mx-auto grid md:grid-cols-2 gap-16 items-center">
        <Reveal>
          <div className="aspect-[4/5] overflow-hidden bg-zinc-100">
            <img src={larsPhoto} alt="Lars Christian Grødem-Olsen"
              className="w-full h-full object-cover object-top grayscale hover:grayscale-0 transition-all duration-700" />
          </div>
        </Reveal>
        <Reveal delay={0.1}>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/40 mb-6">The founder</p>
          <h2 className="text-4xl font-bold mb-6 leading-tight">Lars Christian<br />Grødem-Olsen</h2>
          <div className="space-y-4 text-black/60 text-base leading-relaxed mb-8">
            <p>Lars has spent a decade at the intersection of public mobility policy and private operator strategy. As a former operator and regulator-facing consultant, he built Movability to solve the problem he kept encountering: a total absence of independent strategy expertise in European mobility markets.</p>
            <p>He has advised PTAs, scooter operators, ride-hail platforms, and investors across 12+ countries.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {["Oslo", "Berlin", "Copenhagen", "Brussels", "Amsterdam", "London"].map((city) => (
              <span key={city} className="text-xs font-semibold border border-black/20 px-3 py-1.5 text-black/50">
                {city}
              </span>
            ))}
          </div>
        </Reveal>
      </section>

      {/* ── Articles ── */}
      <div className="border-t border-black/10" />
      <section id="v2-articles" className="py-24 px-6 max-w-7xl mx-auto">
        <Reveal>
          <div className="flex items-end justify-between mb-14">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/40 mb-3">Intelligence</p>
              <h2 className="text-4xl md:text-5xl font-bold leading-tight">Latest articles</h2>
            </div>
            <a href="#v2-articles" className="hidden md:inline-flex items-center gap-2 text-sm font-semibold text-black/50 hover:text-black transition-colors">
              All articles <ArrowRight size={14} />
            </a>
          </div>
        </Reveal>
        <div className="grid md:grid-cols-3 gap-8">
          {articles.map((a, i) => (
            <Reveal key={i} delay={i * 0.1}>
              <div className="group cursor-pointer">
                <div className={`aspect-[4/3] bg-gradient-to-br ${a.bg} mb-5 overflow-hidden`}>
                  <div className="w-full h-full group-hover:scale-[1.03] transition-transform duration-500 bg-gradient-to-br opacity-100" />
                </div>
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-xs font-bold uppercase tracking-widest" style={{ color: BLUE }}>{a.tag}</span>
                  <span className="text-xs text-black/30">{a.date}</span>
                </div>
                <h3 className="text-base font-bold leading-snug group-hover:opacity-60 transition-opacity">{a.title}</h3>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── Collaboration models ── */}
      <div className="border-t border-black/10 bg-zinc-50" />
      <section className="py-24 px-6 max-w-7xl mx-auto bg-zinc-50">
        <Reveal>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/40 mb-6">How we work</p>
          <h2 className="text-4xl md:text-5xl font-bold mb-16 leading-tight">Collaboration models</h2>
        </Reveal>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { name: "Retainer", desc: "Ongoing strategic advice on a monthly basis. Best for organisations navigating continuous market change." },
            { name: "Project", desc: "Scoped engagements for market entry, procurement, or regulation work with defined deliverables." },
            { name: "Advisory", desc: "Board-level and investor advisory — episodic, high-context input when the stakes are highest." },
          ].map((m, i) => (
            <Reveal key={i} delay={i * 0.08}>
              <div className="bg-white border border-black/10 p-8 hover:border-black/40 transition-colors group cursor-default">
                <div className="w-8 h-0.5 mb-6 transition-colors group-hover:bg-[#4B5CF0]" style={{ backgroundColor: BLUE }} />
                <h3 className="text-xl font-bold mb-3">{m.name}</h3>
                <p className="text-sm text-black/55 leading-relaxed">{m.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section id="v2-contact" className="py-32 px-6 bg-black text-white">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          <Reveal>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/40 mb-6">Start the conversation</p>
            <h2 className="text-5xl md:text-6xl font-bold leading-tight">
              Ready to move<br /><span style={{ color: BLUE }}>with clarity?</span>
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="text-white/60 text-lg leading-relaxed mb-8">
              Whether you're entering a new market, redesigning a procurement process, or seeking a strategic partner — let's talk.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                placeholder="Your email"
                className="flex-1 bg-white/10 border border-white/20 text-white placeholder:text-white/30 px-5 py-3 text-sm focus:outline-none focus:border-white/50 transition-colors"
              />
              <button
                style={{ backgroundColor: BLUE }}
                className="px-6 py-3 text-sm font-semibold text-white hover:opacity-90 transition-opacity flex items-center gap-2 justify-center"
              >
                Let's discuss <ArrowRight size={16} />
              </button>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-black border-t border-white/10 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start gap-8">
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-white mb-2">Movability</p>
            <p className="text-xs text-white/30">movability.io · Oslo, Norway</p>
          </div>
          <div className="flex flex-wrap gap-x-10 gap-y-4">
            {[
              { label: "Reports", href: "#v2-reports" },
              { label: "Articles", href: "#v2-articles" },
              { label: "Case Studies", href: "#v2-cases" },
              { label: "Book a meeting", href: "#v2-contact" },
            ].map((l) => (
              <a key={l.label} href={l.href} className="text-xs text-white/40 hover:text-white transition-colors">
                {l.label}
              </a>
            ))}
          </div>
          <p className="text-xs text-white/20">© 2025 Movability</p>
        </div>
      </footer>

    </div>
  );
}
