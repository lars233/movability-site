import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, useInView, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowUpRight, Menu, X, MapPin, ChevronRight } from "lucide-react";
import larsPhoto from "@assets/Lars_photo_1778244138811.webp";

/* ─── constants ──────────────────────────────────────────── */
const BLUE = "#4B5CF0";
const BG   = "#07090F";

/* ─── utility hooks ──────────────────────────────────────── */
function useScrolled(threshold = 60) {
  const [s, set] = useState(false);
  useEffect(() => {
    const h = () => set(window.scrollY > threshold);
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, [threshold]);
  return s;
}

function useCounter(target: number, once = true) {
  const [v, setV] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once });
  useEffect(() => {
    if (!inView) return;
    let cur = 0;
    const dur = 1600, step = 16;
    const inc = target / (dur / step);
    const t = setInterval(() => {
      cur += inc;
      if (cur >= target) { setV(target); clearInterval(t); }
      else setV(Math.floor(cur));
    }, step);
    return () => clearInterval(t);
  }, [inView, target]);
  return { ref, value: v };
}

/* ─── animated orbital background ───────────────────────── */
function OrbitalBg() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* gradient orbs */}
      <div
        className="absolute top-1/4 right-1/4 w-[600px] h-[600px] rounded-full opacity-[0.07] blur-[120px]"
        style={{ background: `radial-gradient(circle, ${BLUE}, transparent 70%)`, animation: "orb1 12s ease-in-out infinite alternate" }}
      />
      <div
        className="absolute bottom-1/3 left-1/5 w-[400px] h-[400px] rounded-full opacity-[0.05] blur-[100px]"
        style={{ background: "radial-gradient(circle, #8B5CF6, transparent 70%)", animation: "orb2 18s ease-in-out infinite alternate" }}
      />
      {/* concentric rings */}
      <div className="absolute right-[-5%] top-1/2 -translate-y-1/2">
        {[380, 280, 200, 130, 72].map((r, i) => (
          <div
            key={i}
            className="absolute rounded-full border border-white/[0.04]"
            style={{
              width: r, height: r,
              top: "50%", left: "50%",
              transform: `translate(-50%,-50%)`,
              animation: `ring-spin ${20 + i * 8}s linear infinite ${i % 2 === 0 ? "" : "reverse"}`,
            }}
          />
        ))}
        {/* center pulse */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full"
          style={{ background: BLUE, boxShadow: `0 0 30px 8px ${BLUE}55`, animation: "pulse-dot 2.5s ease-in-out infinite" }} />
        {/* orbital dots */}
        {[0, 72, 144, 216, 288].map((deg, i) => (
          <div
            key={i}
            className="absolute top-1/2 left-1/2 w-1.5 h-1.5 rounded-full bg-white/20"
            style={{
              transform: `translate(-50%,-50%) rotate(${deg}deg) translateX(140px)`,
              animation: `ring-spin 25s linear infinite`,
            }}
          />
        ))}
      </div>
      {/* subtle grid */}
      <div className="absolute inset-0 opacity-[0.025]"
        style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.3) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.3) 1px,transparent 1px)", backgroundSize: "80px 80px" }} />
    </div>
  );
}

/* ─── reveal wrapper ──────────────────────────────────────── */
function Reveal({ children, delay = 0, className = "", direction = "up" }: {
  children: React.ReactNode; delay?: number; className?: string; direction?: "up" | "left" | "right" | "none"
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const initial = direction === "up" ? { opacity: 0, y: 32 }
    : direction === "left" ? { opacity: 0, x: -32 }
    : direction === "right" ? { opacity: 0, x: 32 }
    : { opacity: 0 };
  return (
    <motion.div ref={ref} initial={initial}
      animate={inView ? { opacity: 1, y: 0, x: 0 } : {}}
      transition={{ duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}>
      {children}
    </motion.div>
  );
}

/* ─── glowing stat card ──────────────────────────────────── */
function StatCard({ prefix = "", target, suffix = "", label }: { prefix?: string; target: number; suffix?: string; label: string }) {
  const { ref, value } = useCounter(target);
  return (
    <div className="relative group p-6 border border-white/[0.08] hover:border-white/20 transition-all duration-500 rounded-sm overflow-hidden">
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-sm"
        style={{ background: `radial-gradient(circle at 50% 50%, ${BLUE}18, transparent 70%)` }} />
      <div className="relative">
        <div className="text-4xl font-bold mb-2 tabular-nums" style={{ color: BLUE }}>
          {prefix}<span ref={ref}>{value}</span>{suffix}
        </div>
        <p className="text-sm text-white/40 leading-snug">{label}</p>
      </div>
    </div>
  );
}

/* ─── timeline dot ───────────────────────────────────────── */
function TimelineDot({ active }: { active: boolean }) {
  return (
    <div className="flex flex-col items-center">
      <div className={`w-3 h-3 rounded-full border-2 transition-all duration-500 ${active ? "border-[#4B5CF0] bg-[#4B5CF0] shadow-[0_0_12px_4px_#4B5CF044]" : "border-white/20 bg-transparent"}`} />
    </div>
  );
}

/* ══════════════════════════════════════════════════════════ */
export default function HomeV3() {
  const [menuOpen, setMenuOpen] = useState(false);
  const scrolled = useScrolled();
  const { scrollYProgress } = useScroll();
  const progressWidth = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  const navLinks = [
    { label: "Services", href: "#v3-services" },
    { label: "Story",    href: "#v3-story"    },
    { label: "Work",     href: "#v3-work"     },
    { label: "About",    href: "#v3-about"    },
    { label: "V1",       href: "/"       },
    { label: "V2",       href: "/v2"     },
    { label: "Final",    href: "/final"  },
  ];

  const clients = ["Bolt","FAIRTIQ","Ruter","Fast Travel","Nextbike","dott","Kolumbus","Cachet","IM Solutions","UIP","Voltraware","Rulle"];

  const services = [
    { num: "01", title: "Market Entry Strategy",    body: "New geography. New rules. We map the terrain so you move with speed and conviction — competitive landscape, regulatory hurdles, and partnership targets identified before you spend a euro." },
    { num: "02", title: "Regulation & Policy",      body: "Municipalities write rules that operators can't live with. Operators propose models that regulators can't approve. We translate. Both directions." },
    { num: "03", title: "Operator Advisory",        body: "Fleet economics. SLA design. Contract architecture. The operational and contractual foundations that let a mobility service actually sustain scale." },
    { num: "04", title: "Public Procurement",       body: "Winning tenders and designing procurements that perform. Operator expertise on both sides of the table — that's the edge." },
    { num: "05", title: "Investment & M&A",         body: "Due diligence grounded in market reality. Strategic positioning before a raise or acquisition. Mobility has a language — we speak it." },
    { num: "06", title: "Research & Reports",       body: "Deep-dive intelligence on mobility verticals, published and commissioned, that decision-makers actually rely on." },
  ];

  const storyChapters = [
    {
      tag:  "The gap",
      year: "2018",
      heading: "Two worlds. One missing bridge.",
      body: "I kept watching the same scene play out. A forward-thinking public transport authority would design a mobility tender — well-intentioned, rigorous, months in the making. Then the bids would come in. Either too expensive, too narrow, or from operators who had no idea how to deliver against public-sector expectations. The contract would fail within eighteen months. And nobody really knew why.",
    },
    {
      tag:  "The realization",
      year: "2020",
      heading: "The problem wasn't the operators. Or the authorities.",
      body: "Both sides were operating without a shared language. Operators spoke growth and margins. Authorities spoke ridership goals and political mandates. Neither had a partner who understood both. I'd sat at both tables. I knew what was missing wasn't technology, or budget, or ambition. It was translation. Strategic translation.",
    },
    {
      tag:  "The decision",
      year: "2022",
      heading: "So I built the bridge myself.",
      body: "Movability started with one conviction: the mobility transition in Europe would succeed or fail on strategy, not on hardware. The companies and governments that win will be the ones who understand both the market and the mandate — and can move between them without losing the thread. That's what we do.",
    },
  ];

  const caseStudies = [
    { tag: "Regulation", title: "Doubling Oslo's e-scooter rides through smarter rules", stat: "2x", statLabel: "ridership" },
    { tag: "Market Entry", title: "€6M ride-hail contract — from zero presence to signed deal", stat: "€6M", statLabel: "contract value" },
    { tag: "Procurement", title: "Five contracts secured for Norway's largest PTA", stat: "5", statLabel: "contracts won" },
  ];

  const collaborators = [
    { role: "Legal & Regulatory", bg: "from-blue-900/40 to-blue-950/60" },
    { role: "Data & Analytics", bg: "from-purple-900/40 to-purple-950/60" },
    { role: "Public Affairs", bg: "from-indigo-900/40 to-indigo-950/60" },
    { role: "Market Research", bg: "from-slate-800/60 to-slate-900/80" },
    { role: "Financial Modelling", bg: "from-zinc-800/60 to-zinc-900/80" },
  ];

  const testimonials = [
    { quote: "Lars's understanding of micromobility regulation from both an operator and government perspective is frankly unmatched. He helped us close a market we'd been circling for two years.", name: "Head of Market Expansion", co: "European Operator" },
    { quote: "Movability's deep knowledge of the bike-share industry and the regulatory landscape in Norway has been invaluable in shaping our procurement strategy.", name: "Mobility Director", co: "Ruter" },
    { quote: "We lacked clarity on critical focus areas. Movability provided expert knowledge that helped us build SLAs, analyse data, negotiate better deals and improve regulations.", name: "Head of Procurement", co: "Public Transport Authority" },
  ];

  const [activeTestimonial, setActiveTestimonial] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setActiveTestimonial(p => (p + 1) % testimonials.length), 5000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="min-h-screen text-white font-sans antialiased" style={{ backgroundColor: BG }}>

      {/* ── scroll progress bar ── */}
      <motion.div className="fixed top-0 left-0 h-[2px] z-[100] origin-left"
        style={{ width: progressWidth, backgroundColor: BLUE }} />

      {/* ── Navbar ── */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? "bg-[#07090F]/90 backdrop-blur-xl border-b border-white/[0.06]" : "bg-transparent"}`}>
        <div className="max-w-7xl mx-auto px-6 h-[68px] flex items-center justify-between">
          <a href="#" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full flex items-center justify-center border border-white/20" style={{ background: `${BLUE}22` }}>
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: BLUE }} />
            </div>
            <span className="text-sm font-bold tracking-wider uppercase text-white">Movability</span>
          </a>
          <nav className="hidden md:flex items-center gap-7">
            {navLinks.map(l => (
              <a key={l.label} href={l.href}
                className="text-sm text-white/50 hover:text-white transition-colors duration-200">
                {l.label}
              </a>
            ))}
            <a href="#v3-contact"
              className="text-sm font-semibold px-5 py-2 rounded-sm border border-white/20 hover:border-white/50 hover:text-white text-white/80 transition-all">
              Book a call
            </a>
          </nav>
          <button className="md:hidden text-white/60 hover:text-white" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
        <AnimatePresence>
          {menuOpen && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              className="md:hidden border-t border-white/[0.06] px-6 py-6 flex flex-col gap-5"
              style={{ background: BG }}>
              {navLinks.map(l => (
                <a key={l.label} href={l.href} onClick={() => setMenuOpen(false)}
                  className="text-base text-white/70">{l.label}</a>
              ))}
              <a href="#v3-contact" className="text-base font-semibold border border-white/20 px-5 py-3 text-center text-white/80">Book a call</a>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ══ HERO ══════════════════════════════════════════════ */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        <OrbitalBg />
        <div className="relative z-10 max-w-7xl mx-auto px-6 pt-32 pb-24 w-full">
          <Reveal>
            <div className="inline-flex items-center gap-2 border border-white/[0.12] rounded-full px-4 py-1.5 text-xs text-white/50 mb-10"
              style={{ background: `${BLUE}10` }}>
              <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: BLUE }} />
              Mobility Strategy · Europe
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <h1 className="text-6xl md:text-8xl lg:text-[108px] font-bold leading-[0.9] tracking-tight mb-8 max-w-5xl">
              Where public
              <br />goals meet
              <br /><span style={{ backgroundImage: `linear-gradient(135deg, ${BLUE}, #8B5CF6)`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                market reality.
              </span>
            </h1>
          </Reveal>
          <Reveal delay={0.2}>
            <p className="text-lg md:text-xl text-white/50 max-w-lg leading-relaxed mb-12">
              Movability advises governments and mobility companies across Europe — closing the strategy gap that stalls new transport services before they ever scale.
            </p>
          </Reveal>
          <Reveal delay={0.28}>
            <div className="flex flex-wrap gap-4">
              <a href="#v3-contact" className="inline-flex items-center gap-2 px-7 py-3.5 text-sm font-semibold text-white rounded-sm transition-all hover:opacity-90"
                style={{ background: `linear-gradient(135deg, ${BLUE}, #6366F1)` }}>
                Start the conversation <ArrowRight size={16} />
              </a>
              <a href="#v3-story" className="inline-flex items-center gap-2 px-7 py-3.5 text-sm font-semibold text-white/70 border border-white/[0.15] rounded-sm hover:border-white/30 hover:text-white transition-all">
                Read the story <ChevronRight size={16} />
              </a>
            </div>
          </Reveal>

          {/* scroll hint */}
          <motion.div
            className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/20"
            animate={{ y: [0, 8, 0] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}>
            <span className="text-[10px] uppercase tracking-[0.2em]">Scroll</span>
            <div className="w-px h-10 bg-gradient-to-b from-white/20 to-transparent" />
          </motion.div>
        </div>
      </section>

      {/* ══ CLIENT TICKER ═════════════════════════════════════ */}
      <div className="border-y border-white/[0.06] py-6 overflow-hidden">
        <div className="flex gap-0 whitespace-nowrap" style={{ animation: "marquee 35s linear infinite" }}>
          {[...clients, ...clients, ...clients].map((c, i) => (
            <span key={i} className="text-[11px] font-bold uppercase tracking-[0.25em] text-white/20 hover:text-white/50 transition-colors px-10">
              {c}
            </span>
          ))}
        </div>
      </div>

      {/* ══ STATS ═════════════════════════════════════════════ */}
      <section className="py-24 px-6 max-w-7xl mx-auto">
        <Reveal>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/30 mb-12">Impact by the numbers</p>
        </Reveal>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { prefix: "€", target: 6, suffix: "M+", label: "Ride-hail contract value" },
            { prefix: "",  target: 2, suffix: "x",  label: "Oslo rides doubled" },
            { prefix: "",  target: 5, suffix: "",   label: "PTA contracts won" },
            { prefix: "€", target: 10, suffix: "M+", label: "New revenue unlocked" },
            { prefix: "",  target: 20, suffix: "+",  label: "Clients across Europe" },
          ].map((s, i) => (
            <Reveal key={i} delay={i * 0.07}>
              <StatCard {...s} />
            </Reveal>
          ))}
        </div>
      </section>

      {/* ══ ORIGIN STORY ══════════════════════════════════════ */}
      <section id="v3-story" className="py-32 px-6 border-t border-white/[0.06]">
        <div className="max-w-7xl mx-auto">
          <Reveal>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/30 mb-4">Origin</p>
            <h2 className="text-4xl md:text-6xl font-bold mb-24 leading-tight max-w-2xl">
              How Movability<br />
              <span style={{ color: BLUE }}>came to be.</span>
            </h2>
          </Reveal>

          {/* chapters */}
          <div className="relative">
            {/* vertical line */}
            <div className="absolute left-[7px] top-4 bottom-4 w-px bg-gradient-to-b from-white/20 via-white/10 to-transparent hidden md:block" />
            <div className="flex flex-col gap-20">
              {storyChapters.map((ch, i) => (
                <Reveal key={i} delay={0.1} direction="left">
                  <div className="md:grid md:grid-cols-[24px_200px_1fr] gap-8 items-start">
                    <div className="hidden md:flex pt-1">
                      <TimelineDot active />
                    </div>
                    <div>
                      <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: BLUE }}>{ch.tag}</span>
                      <p className="text-sm text-white/30 mt-1">{ch.year}</p>
                    </div>
                    <div>
                      <h3 className="text-2xl md:text-3xl font-bold mb-4 leading-snug">{ch.heading}</h3>
                      <p className="text-base text-white/50 leading-relaxed max-w-2xl">{ch.body}</p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══ SERVICES ══════════════════════════════════════════ */}
      <section id="v3-services" className="py-32 px-6 border-t border-white/[0.06]">
        <div className="max-w-7xl mx-auto">
          <Reveal>
            <div className="flex items-end justify-between mb-16">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/30 mb-4">What we do</p>
                <h2 className="text-4xl md:text-6xl font-bold leading-tight">Six ways<br />we close the gap.</h2>
              </div>
            </div>
          </Reveal>
          <div className="grid md:grid-cols-2 gap-0 border border-white/[0.08]">
            {services.map((s, i) => (
              <Reveal key={i} delay={i * 0.07}>
                <div className="group p-8 md:p-10 border-r border-b border-white/[0.08] odd:border-l-0 hover:bg-white/[0.02] transition-colors cursor-default relative overflow-hidden">
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700"
                    style={{ background: `radial-gradient(circle at 0% 100%, ${BLUE}12, transparent 60%)` }} />
                  <div className="relative">
                    <div className="flex items-start justify-between mb-4">
                      <span className="text-xs font-bold text-white/20">{s.num}</span>
                      <ArrowUpRight size={16} className="text-white/20 group-hover:text-white/50 transition-colors" />
                    </div>
                    <h3 className="text-lg font-bold mb-3 group-hover:text-white transition-colors" style={{ color: "rgba(255,255,255,0.85)" }}>{s.title}</h3>
                    <p className="text-sm text-white/40 leading-relaxed">{s.body}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ══ CASE STUDIES ══════════════════════════════════════ */}
      <section id="v3-work" className="py-32 px-6 border-t border-white/[0.06]">
        <div className="max-w-7xl mx-auto">
          <Reveal>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/30 mb-4">Evidence</p>
            <h2 className="text-4xl md:text-6xl font-bold mb-16 leading-tight max-w-2xl">
              Strategy that<br /><span style={{ color: BLUE }}>moves markets.</span>
            </h2>
          </Reveal>
          <div className="grid md:grid-cols-3 gap-5">
            {caseStudies.map((c, i) => (
              <Reveal key={i} delay={i * 0.1}>
                <div className="group relative border border-white/[0.08] p-8 hover:border-white/20 transition-all duration-500 cursor-pointer overflow-hidden rounded-sm h-full flex flex-col justify-between min-h-[220px]">
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700"
                    style={{ background: `linear-gradient(135deg, ${BLUE}18, transparent 60%)` }} />
                  <div className="relative">
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: BLUE }}>{c.tag}</span>
                    <h3 className="text-base font-bold leading-snug mt-4 mb-8 text-white/80">{c.title}</h3>
                  </div>
                  <div className="relative flex items-end justify-between">
                    <div>
                      <div className="text-3xl font-bold" style={{ color: BLUE }}>{c.stat}</div>
                      <div className="text-xs text-white/30 mt-1">{c.statLabel}</div>
                    </div>
                    <ArrowUpRight size={18} className="text-white/20 group-hover:text-white/60 transition-colors" />
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ══ TESTIMONIALS ══════════════════════════════════════ */}
      <section className="py-32 px-6 border-t border-white/[0.06]" style={{ background: `linear-gradient(180deg, ${BG}, #0B0F1A)` }}>
        <div className="max-w-7xl mx-auto">
          <Reveal>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/30 mb-16">What clients say</p>
          </Reveal>
          <div className="grid md:grid-cols-[1fr_auto] gap-16 items-start">
            <div className="min-h-[200px]">
              <AnimatePresence mode="wait">
                <motion.div key={activeTestimonial}
                  initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
                  transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}>
                  <blockquote className="text-2xl md:text-3xl font-medium leading-snug text-white/80 mb-8 max-w-3xl">
                    "{testimonials[activeTestimonial].quote}"
                  </blockquote>
                  <div>
                    <p className="text-sm font-bold text-white">{testimonials[activeTestimonial].name}</p>
                    <p className="text-xs text-white/30 mt-0.5">{testimonials[activeTestimonial].co}</p>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
            <div className="flex md:flex-col gap-3 pt-2">
              {testimonials.map((_, i) => (
                <button key={i} onClick={() => setActiveTestimonial(i)}
                  className={`w-8 h-1 rounded-full transition-all duration-400 ${i === activeTestimonial ? "opacity-100" : "opacity-20 hover:opacity-40"}`}
                  style={{ backgroundColor: i === activeTestimonial ? BLUE : "white" }} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══ ABOUT LARS ════════════════════════════════════════ */}
      <section id="v3-about" className="py-32 px-6 border-t border-white/[0.06]">
        <div className="max-w-7xl mx-auto">
          <Reveal>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/30 mb-16">The person behind it</p>
          </Reveal>
          <div className="grid md:grid-cols-2 gap-16 items-start">
            <Reveal direction="left">
              <div className="relative">
                <div className="aspect-[4/5] overflow-hidden rounded-sm relative">
                  <img src={larsPhoto} alt="Lars Christian Grødem-Olsen"
                    className="w-full h-full object-cover object-top grayscale hover:grayscale-0 transition-all duration-700" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                </div>
                {/* floating badge */}
                <div className="absolute -bottom-5 -right-5 border border-white/[0.12] backdrop-blur-sm px-5 py-4 rounded-sm hidden md:block"
                  style={{ background: `${BG}CC` }}>
                  <div className="flex items-center gap-2">
                    <MapPin size={12} style={{ color: BLUE }} />
                    <span className="text-xs text-white/60">Oslo, Norway</span>
                  </div>
                  <p className="text-sm font-bold text-white mt-1">12+ countries advised</p>
                </div>
              </div>
            </Reveal>

            <Reveal delay={0.15} direction="right">
              <h2 className="text-4xl md:text-5xl font-bold mb-2 leading-tight">
                Lars Christian<br />Grødem-Olsen
              </h2>
              <p className="text-sm text-white/30 mb-8 uppercase tracking-widest">Founder · Movability</p>

              <div className="space-y-4 text-white/55 text-base leading-relaxed mb-10">
                <p>A decade at the intersection of public mobility policy and private operator strategy. Former operator. Former regulator-facing consultant. Built Movability to solve the problem he kept encountering — a total absence of independent strategy expertise in European mobility markets.</p>
                <p>He has sat at the negotiating table on both sides: advising PTAs on procurement design, and advising operators on how to win and execute those same tenders. That dual fluency is rare. It's the core of what Movability offers.</p>
              </div>

              {/* CV chips */}
              <div className="mb-10">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/30 mb-4">Background</p>
                <div className="flex flex-wrap gap-2">
                  {["Mobility operator", "PTA advisor", "Bid strategy", "Contract design", "Market regulation", "12+ countries"].map(tag => (
                    <span key={tag} className="text-xs font-medium border border-white/[0.12] px-3 py-1.5 text-white/50 rounded-sm hover:border-white/30 hover:text-white/80 transition-all"
                      style={{ background: `${BLUE}08` }}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Collaborator network */}
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/30 mb-4">Extended network</p>
                <div className="grid grid-cols-1 gap-2">
                  {collaborators.map((c, i) => (
                    <div key={i} className={`flex items-center gap-3 border border-white/[0.07] px-4 py-3 rounded-sm bg-gradient-to-r ${c.bg} group hover:border-white/20 transition-all`}>
                      <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: BLUE }} />
                      <span className="text-sm text-white/60 group-hover:text-white/90 transition-colors">{c.role}</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-white/25 mt-4 leading-relaxed">
                  Movability operates as a lean, expert-led practice. For larger engagements, Lars pulls on a curated network of specialists across law, data science, public affairs, and financial modelling.
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ══ VERTICALS DARK TICKER ═════════════════════════════ */}
      <div className="py-12 border-t border-white/[0.06] overflow-hidden" style={{ background: `${BLUE}10` }}>
        <div className="flex whitespace-nowrap" style={{ animation: "marquee 28s linear infinite reverse" }}>
          {["Self-driving","Public Transport","Ride-hail","Investment & M&A","Micromobility","Demand-responsive Transport","Car-Sharing","Mobility Software","Insurance","Self-driving","Public Transport","Ride-hail","Investment & M&A","Micromobility","Demand-responsive Transport","Car-Sharing","Mobility Software","Insurance"].map((v, i) => (
            <span key={i} className="text-sm font-bold uppercase tracking-widest px-8" style={{ color: `${BLUE}99` }}>
              {v} <span className="mx-4 opacity-30">·</span>
            </span>
          ))}
        </div>
      </div>

      {/* ══ CTA ═══════════════════════════════════════════════ */}
      <section id="v3-contact" className="relative py-40 px-6 overflow-hidden border-t border-white/[0.06]">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 opacity-[0.06] blur-[160px]"
            style={{ background: `radial-gradient(ellipse at 50% 50%, ${BLUE}, transparent 70%)` }} />
        </div>
        <div className="relative max-w-5xl mx-auto text-center">
          <Reveal>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/30 mb-6">Ready to move</p>
            <h2 className="text-5xl md:text-7xl font-bold mb-8 leading-tight">
              Let's close<br />
              <span style={{ backgroundImage: `linear-gradient(135deg, ${BLUE}, #8B5CF6)`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                your gap.
              </span>
            </h2>
            <p className="text-lg text-white/40 max-w-xl mx-auto mb-12 leading-relaxed">
              Whether you're entering a new market, designing a procurement process, or need a strategic partner who speaks both languages — start here.
            </p>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input type="email" placeholder="Your email address"
                className="flex-1 px-5 py-3.5 text-sm bg-white/[0.05] border border-white/[0.12] text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 transition-colors rounded-sm" />
              <button className="px-6 py-3.5 text-sm font-semibold text-white rounded-sm flex items-center gap-2 justify-center hover:opacity-90 transition-opacity"
                style={{ background: `linear-gradient(135deg, ${BLUE}, #6366F1)` }}>
                Let's talk <ArrowRight size={16} />
              </button>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ══ FOOTER ════════════════════════════════════════════ */}
      <footer className="border-t border-white/[0.06] py-12 px-6" style={{ background: "#050709" }}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start gap-8">
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-white mb-1">Movability</p>
            <p className="text-xs text-white/25">movability.io · Oslo, Norway</p>
          </div>
          <div className="flex flex-wrap gap-x-10 gap-y-3">
            {[
              { l: "Services", h: "#v3-services" },
              { l: "Our Story", h: "#v3-story" },
              { l: "Work", h: "#v3-work" },
              { l: "About Lars", h: "#v3-about" },
              { l: "Book a call", h: "#v3-contact" },
            ].map(x => (
              <a key={x.l} href={x.h} className="text-xs text-white/30 hover:text-white transition-colors">{x.l}</a>
            ))}
          </div>
          <p className="text-xs text-white/15">© 2025 Movability</p>
        </div>
      </footer>

      {/* ── global keyframes injected via style tag ── */}
      <style>{`
        @keyframes orb1 {
          0%   { transform: translate(0,0) scale(1); }
          100% { transform: translate(40px, -60px) scale(1.15); }
        }
        @keyframes orb2 {
          0%   { transform: translate(0,0) scale(1); }
          100% { transform: translate(-30px, 50px) scale(1.1); }
        }
        @keyframes ring-spin {
          from { transform: translate(-50%,-50%) rotate(0deg); }
          to   { transform: translate(-50%,-50%) rotate(360deg); }
        }
        @keyframes pulse-dot {
          0%, 100% { transform: translate(-50%,-50%) scale(1);   opacity: 1; }
          50%       { transform: translate(-50%,-50%) scale(1.6); opacity: 0.6; }
        }
        @keyframes marquee {
          from { transform: translateX(0); }
          to   { transform: translateX(-33.333%); }
        }
      `}</style>
    </div>
  );
}
