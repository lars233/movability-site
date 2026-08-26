import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, useInView, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowUpRight, Menu, X, ChevronLeft, ChevronRight } from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";
import heroVideo from "@assets/hero-video.mp4";
import MovabilityLogo from "@/components/movability-logo";
import { publicApi, type PublicItem, type PublicReport } from "@/lib/public-api";
import { useHomepageContent } from "@/lib/site-content";
import { resolveImage } from "@/content/homepage-content";

const BLUE = "#4B5CF0";

/* ── hooks ─────────────────────────────────────────────────── */
function useScrolled(t = 50) {
  const [s, set] = useState(false);
  useEffect(() => {
    const h = () => set(window.scrollY > t);
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, [t]);
  return s;
}

/* ── scroll-reveal wrapper ──────────────────────────────────── */
function Reveal({
  children, delay = 0, className = "", direction = "up",
}: {
  children: React.ReactNode; delay?: number; className?: string;
  direction?: "up" | "left" | "right" | "none";
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const initial =
    direction === "up"    ? { opacity: 0, y: 28 }
    : direction === "left"  ? { opacity: 0, x: -28 }
    : direction === "right" ? { opacity: 0, x: 28 }
    : { opacity: 0 };
  return (
    <motion.div ref={ref} initial={initial}
      animate={inView ? { opacity: 1, y: 0, x: 0 } : {}}
      transition={{ duration: 0.75, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}>
      {children}
    </motion.div>
  );
}

/* ── light orbital decoration for hero ─────────────────────── */
function HeroBg() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
      {/* soft blue orb top-right */}
      <div className="absolute -top-40 -right-40 w-[700px] h-[700px] rounded-full opacity-[0.06] blur-[140px]"
        style={{ background: `radial-gradient(circle, ${BLUE}, transparent 70%)`, animation: "orb1 14s ease-in-out infinite alternate" }} />
      {/* concentric rings right side */}
      <div className="absolute right-[-8%] top-1/2 -translate-y-1/2 hidden lg:block">
        {[420, 310, 220, 145, 80].map((r, i) => (
          <div key={i} className="absolute rounded-full border border-black/[0.04]"
            style={{ width: r, height: r, top: "50%", left: "50%",
              transform: "translate(-50%,-50%)",
              animation: `ring-spin ${22 + i * 9}s linear infinite ${i % 2 ? "reverse" : ""}` }} />
        ))}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full"
          style={{ backgroundColor: BLUE, boxShadow: `0 0 20px 6px ${BLUE}40`, animation: "pulse-dot 2.8s ease-in-out infinite" }} />
        {[0, 72, 144, 216, 288].map((deg, i) => (
          <div key={i} className="absolute top-1/2 left-1/2 w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: `${BLUE}60`,
              transform: `translate(-50%,-50%) rotate(${deg}deg) translateX(155px)`,
              animation: `ring-spin 28s linear infinite` }} />
        ))}
      </div>
      {/* fine dot grid */}
      <div className="absolute inset-0 opacity-[0.018]"
        style={{ backgroundImage: "radial-gradient(circle, #000 1px, transparent 1px)", backgroundSize: "44px 44px" }} />
      <style>{`
        @keyframes orb1 { 0% { transform:translate(0,0) scale(1); } 100% { transform:translate(-40px,50px) scale(1.12); } }
        @keyframes ring-spin { from { transform:translate(-50%,-50%) rotate(0deg); } to { transform:translate(-50%,-50%) rotate(360deg); } }
        @keyframes pulse-dot { 0%,100% { transform:translate(-50%,-50%) scale(1); opacity:1; } 50% { transform:translate(-50%,-50%) scale(1.7); opacity:0.5; } }
        @keyframes marquee { from { transform:translateX(0); } to { transform:translateX(-33.333%); } }
        @keyframes marquee-slow { from { transform:translateX(0); } to { transform:translateX(-50%); } }
        .logo-marquee { animation: marquee 22s linear infinite; }
        @media (min-width: 640px) { .logo-marquee { animation: marquee 32s linear infinite; } }
      `}</style>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════ */
export default function HomeFinal() {
  const scrolled = useScrolled();
  const [menuOpen, setMenuOpen] = useState(false);
  const { scrollYProgress } = useScroll();
  const progressWidth = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  /* article slider */
  const [artRef, artApi] = useEmblaCarousel({ loop: true, align: "start", slidesToScroll: 1 });
  const scrollArtPrev = useCallback(() => artApi?.scrollPrev(), [artApi]);
  const scrollArtNext = useCallback(() => artApi?.scrollNext(), [artApi]);

  /* team slider */
  const [teamRef, teamApi] = useEmblaCarousel({ loop: true, align: "start", slidesToScroll: 1 });
  const scrollTeamPrev = useCallback(() => teamApi?.scrollPrev(), [teamApi]);
  const scrollTeamNext = useCallback(() => teamApi?.scrollNext(), [teamApi]);

  /* auto-rotating testimonials */
  /* editable content — CMS overrides layered over the built-in defaults */
  const content = useHomepageContent();
  const navText = content.section("nav");
  const hero = content.section("hero");
  const clients = content.section("clients");
  const challenge = content.section("challenge");
  const services = content.section("services");
  const verticalsText = content.section("verticals");
  const story = content.section("story");
  const teamText = content.section("team");
  const evidence = content.section("evidence");
  const testimonialsText = content.section("testimonials");
  const reportsText = content.section("reports");
  const insights = content.section("insights");
  const cta = content.section("cta");

  const navLinks = content.items("nav_links");
  const clientLogos = content.items("client_logos");
  const verticals = content.items("verticals");
  const privateSector = content.items("services_private");
  const publicSector = content.items("services_public");
  const teamMembers = content.items("team");
  const caseStudies = content.items("case_tiles");
  const testimonials = content.items("testimonials");
  const footerLinks = content.items("footer_links");

  const [activeT, setActiveT] = useState(0);
  useEffect(() => {
    if (testimonials.length < 2) return;
    const t = setInterval(() => setActiveT(p => (p + 1) % testimonials.length), 5500);
    return () => clearInterval(t);
  }, [testimonials.length]);
  const activeTestimonial = testimonials[activeT] ?? testimonials[0];

  /* live articles from API */
  const [liveArticles, setLiveArticles] = useState<PublicItem[]>([]);
  useEffect(() => {
    publicApi.listArticles().then(r => setLiveArticles(r.items.slice(0, 6))).catch(() => {});
  }, []);

  /* featured report from CMS */
  const [featuredReport, setFeaturedReport] = useState<PublicReport | null>(null);
  useEffect(() => {
    publicApi.listReports().then(r => setFeaturedReport(r[0] ?? null)).catch(() => {});
  }, []);



  return (
    <div className="min-h-screen bg-white text-black antialiased" style={{ fontFamily: "'DM Sans', 'Inter', sans-serif" }}>

      {/* ── scroll progress ─────────────────────────────────── */}
      <motion.div className="fixed top-0 left-0 h-[2px] z-[100] origin-left"
        style={{ width: progressWidth, backgroundColor: BLUE }} />

      {/* ── navbar ─────────────────────────────────────────── */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/95 backdrop-blur-xl border-b border-black/[0.07] shadow-sm"
          : "bg-black/40 backdrop-blur-md"
      }`}>
        <div className="max-w-7xl mx-auto px-6 h-[70px] flex items-center justify-between">
          <a href="/" className="flex-shrink-0">
            <MovabilityLogo className={scrolled ? "text-black" : "text-white"} />
          </a>
          <nav className="hidden md:flex items-center gap-7">
            {navLinks.map(l => (
              <a
                key={l.label}
                href={l.href}
                className={`text-sm transition-colors duration-200 ${
                  scrolled ? "text-black/55 hover:text-black" : "text-white/70 hover:text-white"
                }`}
              >
                {l.label}
              </a>
            ))}
            <a
              href={navText.ctaHref}
              className="ml-2 h-10 px-5 text-sm font-semibold text-white flex items-center gap-2 whitespace-nowrap hover:opacity-90 transition-opacity"
              style={{ background: `linear-gradient(135deg, ${BLUE}, #6366F1)` }}
            >
              {navText.ctaLabel} <ArrowRight size={14} />
            </a>
          </nav>
          <button
            className={`md:hidden p-1 ${scrolled ? "text-black" : "text-white"}`}
            onClick={() => setMenuOpen(v => !v)}
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="md:hidden bg-white border-t border-black/10 px-6 py-6 flex flex-col gap-5"
            >
              {navLinks.map(l => (
                <a
                  key={l.label}
                  href={l.href}
                  onClick={() => setMenuOpen(false)}
                  className="text-base text-black/70 hover:text-black"
                >
                  {l.label}
                </a>
              ))}
              <a
                href={navText.ctaHref}
                onClick={() => setMenuOpen(false)}
                className="inline-flex w-fit h-11 px-5 items-center gap-2 text-sm font-semibold text-white"
                style={{ background: `linear-gradient(135deg, ${BLUE}, #6366F1)` }}
              >
                {navText.ctaLabel} <ArrowRight size={14} />
              </a>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ══ HERO ════════════════════════════════════════════════ */}
      <section className="relative h-screen flex items-center overflow-hidden bg-black">
        {/* background video — European public transport stock footage */}
        <video
          autoPlay muted loop playsInline preload="auto"
          className="absolute inset-0 w-full h-full object-cover opacity-55 pointer-events-none"
          src={heroVideo}
        />
        {/* gradient overlay — dark bottom so text stays legible */}
        <div className="absolute inset-0 z-[1] pointer-events-none"
          style={{ background: "linear-gradient(135deg, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.45) 60%, rgba(0,0,0,0.55) 100%)" }} />
        {/* subtle orbital rings on top of video */}
        <HeroBg />

        <div className="relative z-10 max-w-7xl mx-auto px-6 pt-36 pb-28 w-full">
          {/* V3 headline — white on video */}
          <Reveal delay={0.08}>
            <h1 className="text-6xl md:text-8xl lg:text-[108px] font-bold leading-[0.9] tracking-tight mb-8 max-w-5xl text-white">
              {hero.headlineLine1}<br />
              {hero.headlineLine2}<br />
              <span style={{ backgroundImage: `linear-gradient(135deg, ${BLUE}, #818CF8)`,
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                {hero.headlineAccent}
              </span>
            </h1>
          </Reveal>

          {/* V1 subtext */}
          <Reveal delay={0.16}>
            <p className="text-lg md:text-xl text-white/65 max-w-xl leading-relaxed mb-10">
              {hero.subheading}
            </p>
          </Reveal>

          {/* V1 email + CTA */}
          <Reveal delay={0.24}>
            <div className="flex flex-col sm:flex-row gap-3 max-w-md w-full mb-16">
              <input type="email" placeholder={hero.emailPlaceholder}
                className="w-full sm:flex-1 h-12 px-4 text-sm border border-white/25 bg-white/10 text-white placeholder:text-white/40 focus:outline-none focus:border-white/50 transition-colors backdrop-blur-sm" />
              <button className="w-full sm:w-auto h-12 px-6 text-sm font-semibold text-white flex items-center justify-center gap-2 whitespace-nowrap hover:opacity-90 transition-opacity"
                style={{ background: `linear-gradient(135deg, ${BLUE}, #6366F1)` }}>
                {hero.buttonLabel} <ArrowRight size={15} />
              </button>
            </div>
          </Reveal>

        </div>
      </section>

      {/* ══ CLIENT SLIDER ═══════════════════════════════════════ */}
      <section className="border-y border-black/[0.08] bg-white">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-black/30 mb-4">
            {clients.label}
          </p>
        </div>
        <div className="overflow-hidden pb-5">
          <style>{`
            @keyframes logo-scroll { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
            .logo-scroll-track { animation: logo-scroll 36s linear infinite; }
          `}</style>
          <div className="logo-scroll-track flex items-center w-max"
            style={{ maskImage: "linear-gradient(to right, transparent, black 8%, black 92%, transparent)", WebkitMaskImage: "linear-gradient(to right, transparent, black 8%, black 92%, transparent)" }}>
            {[...clientLogos, ...clientLogos].map((logo, i) => (
              <div key={i} className="flex-shrink-0 px-5 sm:px-8 py-1 flex items-center justify-center h-8 sm:h-10">
                <img
                  src={resolveImage(logo.image)}
                  alt={logo.name}
                  className="max-h-5 sm:max-h-7 w-auto object-contain opacity-55 hover:opacity-90 transition-opacity"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ THE CHALLENGE ═══════════════════════════════════════ */}
      <section className="py-28 px-6 bg-white border-b border-black/[0.07]">
        <div className="max-w-7xl mx-auto">
          <Reveal>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/35 mb-5">{challenge.eyebrow}</p>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold max-w-3xl mb-20 leading-tight">
              {challenge.title} <span style={{ color: BLUE }}>{challenge.titleAccent}</span>
            </h2>
          </Reveal>
          <div className="grid md:grid-cols-2 gap-12 md:gap-20">
            <Reveal delay={0.12} direction="left">
              <div className="space-y-5">
                <div className="h-[2px] w-10" style={{ backgroundColor: BLUE }} />
                <h3 className="text-xl font-bold">{challenge.leftTitle}</h3>
                <p className="text-base text-black/55 leading-relaxed">
                  {challenge.leftBody}
                </p>
              </div>
            </Reveal>
            <Reveal delay={0.24} direction="right">
              <div className="space-y-5">
                <div className="h-[2px] w-10" style={{ backgroundColor: BLUE }} />
                <h3 className="text-xl font-bold">{challenge.rightTitle}</h3>
                <p className="text-base text-black/55 leading-relaxed">
                  {challenge.rightBody}
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ══ WHAT WE DO ══════════════════════════════════════════ */}
      <section id="fn-services" className="py-28 px-6 bg-white border-b border-black/[0.07]">
        <div className="max-w-7xl mx-auto">
          <Reveal>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/35 mb-4">{services.eyebrow}</p>
            <h2 className="text-4xl md:text-5xl font-bold mb-16 leading-tight">
              {services.title} <span style={{ color: BLUE }}>{services.titleAccent}</span>
            </h2>
          </Reveal>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Private sector card */}
            <Reveal delay={0.1} direction="left">
              <div className="bg-[#F7F7F7] p-10 h-full border border-black/[0.07]">
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-black/40 mb-7">{services.privateLabel}</p>
                <ul className="space-y-0 divide-y divide-black/[0.08]">
                  {privateSector.map(item => (
                    <li key={item.num} className="py-6 flex gap-5">
                      <span className="text-xs font-bold text-black/25 mt-0.5 flex-shrink-0 w-5">{item.num}</span>
                      <div>
                        <p className="font-bold text-sm mb-1">{item.title}</p>
                        <p className="text-sm text-black/50 leading-relaxed">{item.desc}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>

            {/* Public sector card */}
            <Reveal delay={0.18} direction="right">
              <div className="p-10 h-full text-white" style={{ backgroundColor: BLUE }}>
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/50 mb-7">{services.publicLabel}</p>
                <ul className="space-y-0 divide-y divide-white/[0.20]">
                  {publicSector.map(item => (
                    <li key={item.num} className="py-6 flex gap-5">
                      <span className="text-xs font-bold text-white/40 mt-0.5 flex-shrink-0 w-5">{item.num}</span>
                      <div>
                        <p className="font-bold text-sm mb-1 text-white">{item.title}</p>
                        <p className="text-sm text-white/65 leading-relaxed">{item.desc}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ══ VERTICALS — single blue slider ══════════════════════ */}
      <section className="py-16 bg-white border-b border-black/[0.07] overflow-hidden">
        <style>{`
          @keyframes sector-scroll { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
          .sector-scroll-track { animation: sector-scroll 38s linear infinite; }
          .sector-pill { background-color: #4B5CF0; color: white; border: 1px solid transparent; transition: background-color 0.2s, color 0.2s, border-color 0.2s; cursor: default; }
          .sector-pill:hover { background-color: white; color: black; border-color: rgba(0,0,0,0.18); }
        `}</style>
        <Reveal className="max-w-7xl mx-auto px-6 mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/35">{verticalsText.eyebrow}</p>
        </Reveal>
        <div className="relative overflow-hidden"
          style={{ maskImage: "linear-gradient(to right, transparent, black 6%, black 94%, transparent)", WebkitMaskImage: "linear-gradient(to right, transparent, black 6%, black 94%, transparent)" }}>
          <div className="sector-scroll-track flex gap-3 w-max">
            {[...verticals, ...verticals].map((v, i) => (
              <div key={i} className="sector-pill inline-flex items-center px-6 py-3 text-sm font-semibold flex-shrink-0 whitespace-nowrap">
                {v.label}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ MY STORY ════════════════════════════════════════════ */}
      <section id="fn-story" className="py-28 px-6 bg-white border-b border-black/[0.07]">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          <Reveal direction="left">
            <div className="aspect-[4/5] overflow-hidden bg-[#F0F0F0]">
              <img src={resolveImage(story.image)} alt={story.imageAlt}
                className="w-full h-full object-cover object-top hover:grayscale transition-all duration-700" />
            </div>
          </Reveal>
          <Reveal delay={0.12} direction="right">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/35 mb-5">{story.eyebrow}</p>
            <h2 className="text-4xl md:text-5xl font-bold mb-8 leading-tight">
              <span style={{ color: BLUE }}>{story.titleAccent}</span> {story.title}
            </h2>
            <div className="space-y-5 text-base text-black/60 leading-relaxed mb-10">
              {story.body.split(/\n\s*\n/).map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
            <a href={story.buttonHref}
              target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-semibold border border-black px-6 py-3 hover:bg-black hover:text-white transition-all">
              {story.buttonLabel} <ArrowRight size={15} />
            </a>
          </Reveal>
        </div>
      </section>

      {/* ══ OUR TEAM ════════════════════════════════════════════ */}
      <section id="fn-team" className="py-28 px-6 bg-[#FAFAFA] border-b border-black/[0.07]">
        <div className="max-w-7xl mx-auto">
          <Reveal>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/35 mb-4">{teamText.eyebrow}</p>
            <h2 className="text-4xl md:text-5xl font-bold mb-16 leading-tight">
              {teamText.title} <span style={{ color: BLUE }}>{teamText.titleAccent}</span>
            </h2>
          </Reveal>
          <div className="relative">
            <div className="overflow-hidden" ref={teamRef}>
              <div className="flex gap-6">
                {teamMembers.map((member) => (
                  <div key={member.name} className="flex-[0_0_calc(50%-12px)] sm:flex-[0_0_calc(33.333%-16px)] lg:flex-[0_0_calc(25%-18px)] min-w-0 group">
                    <div className="aspect-square overflow-hidden bg-[#E8E8E8] mb-4">
                      <img
                        src={resolveImage(member.image)}
                        alt={member.name}
                        className="w-full h-full object-cover object-top group-hover:grayscale transition-all duration-500"
                      />
                    </div>
                    <p className="text-sm font-bold text-black leading-snug mb-1">{member.name}</p>
                    <p className="text-xs text-black/45 leading-snug">{member.title}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-3 mt-8">
              <button onClick={scrollTeamPrev}
                className="w-10 h-10 flex items-center justify-center border border-black/20 hover:bg-black hover:text-white hover:border-black transition-all">
                <ChevronLeft size={16} />
              </button>
              <button onClick={scrollTeamNext}
                className="w-10 h-10 flex items-center justify-center border border-black/20 hover:bg-black hover:text-white hover:border-black transition-all">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ══ EVIDENCE ════════════════════════════════════════════ */}
      <section id="fn-evidence" className="py-28 px-6 bg-white border-b border-black/[0.07]">
        <div className="max-w-7xl mx-auto">
          <Reveal>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/35 mb-4">{evidence.eyebrow}</p>
            <h2 className="text-4xl md:text-5xl font-bold mb-16 leading-tight">
              {evidence.title} <span style={{ color: BLUE }}>{evidence.titleAccent}</span>
            </h2>
          </Reveal>
          <div className="grid md:grid-cols-3 gap-5 mb-8">
            {caseStudies.map((c, i) => (
              <Reveal key={i} delay={i * 0.1}>
                <div className="relative border border-black/[0.10] bg-white p-8 overflow-hidden flex flex-col justify-between min-h-[220px]">
                  <div className="relative">
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: BLUE }}>{c.tag}</span>
                    <h3 className="text-base font-bold leading-snug mt-4 mb-8 text-black/80">{c.title}</h3>
                  </div>
                  <div className="relative">
                    <div className="text-3xl font-bold" style={{ color: BLUE }}>{c.stat}</div>
                    <div className="text-xs text-black/40 mt-1">{c.statLabel}</div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal delay={0.2}>
            <a href="/case-studies" className="inline-flex items-center gap-2 text-sm font-semibold text-black/50 hover:text-black transition-colors">
              {evidence.linkLabel} <ArrowRight size={14} />
            </a>
          </Reveal>
        </div>
      </section>

      {/* ══ TESTIMONIALS ════════════════════════════════════════ */}
      <section className="py-28 px-6 bg-white border-b border-black/[0.07]">
        <div className="max-w-7xl mx-auto">
          <Reveal>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/35 mb-16">{testimonialsText.eyebrow}</p>
          </Reveal>
          <div className="grid md:grid-cols-[1fr_auto] gap-12 items-start">
            <div className="min-h-[220px]">
              <AnimatePresence mode="wait">
                <motion.div key={activeT}
                  initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
                  transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}>
                  <blockquote className="text-2xl md:text-3xl font-medium leading-snug text-black/80 mb-10 max-w-3xl">
                    "{activeTestimonial?.quote}"
                  </blockquote>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 border border-black/10">
                      <img
                        src={resolveImage(activeTestimonial?.image)}
                        alt={activeTestimonial?.name ?? ""}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <p className="text-sm font-bold">{activeTestimonial?.name}</p>
                      <p className="text-xs text-black/40">{activeTestimonial?.role} — {activeTestimonial?.company}</p>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
            <div className="flex md:flex-col gap-2.5 pt-1">
              {testimonials.map((_, i) => (
                <button key={i} onClick={() => setActiveT(i)}
                  className={`h-1 rounded-full transition-all duration-400 ${i === activeT ? "w-10 md:w-1 md:h-10" : "w-6 md:w-1 md:h-6 opacity-20 hover:opacity-40"}`}
                  style={{ backgroundColor: i === activeT ? BLUE : "black" }} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══ REPORTS ═════════════════════════════════════════════ */}
      <section id="fn-reports" className="py-28 px-6 bg-white border-b border-black/[0.07]">
        <div className="max-w-7xl mx-auto">
          <Reveal>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/35 mb-4">{reportsText.eyebrow}</p>
            <h2 className="text-4xl md:text-5xl font-bold mb-14 leading-tight">{reportsText.title}</h2>
          </Reveal>
          {/* featured report card — CMS-driven */}
          {featuredReport ? (
            <Reveal delay={0.1}>
              <div className="group grid md:grid-cols-[1.4fr_1fr] border border-black/[0.10] hover:border-black/25 transition-all duration-400 overflow-hidden">
                {/* cover image — full bleed, taller */}
                <div className="relative bg-black aspect-video md:aspect-auto md:min-h-[420px] overflow-hidden">
                  {featuredReport.image ? (
                    <img src={featuredReport.image} alt={featuredReport.title}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500" />
                  ) : (
                    <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, #0f1729 0%, #1a1f3a 50%, ${BLUE}33 100%)` }} />
                  )}
                </div>
                {/* text panel */}
                <div className="p-10 md:p-14 flex flex-col justify-between bg-[#FAFAFA] group-hover:bg-white transition-colors">
                  <div>
                    <h3 className="text-2xl md:text-3xl font-bold leading-snug mb-5">
                      {featuredReport.title}
                    </h3>
                    {featuredReport.subtitle && (
                      <p className="text-sm text-black/50 leading-relaxed max-w-md">{featuredReport.subtitle}</p>
                    )}
                    {featuredReport.date && (
                      <div className="mt-6">
                        <p className="text-xs text-black/35 mb-0.5">Published</p>
                        <p className="text-sm font-semibold">
                          {new Date(featuredReport.date).toLocaleDateString("en-GB", { month: "long", year: "numeric" })}
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="mt-10">
                    {featuredReport.download_url ? (
                      <a href={featuredReport.download_url} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sm font-semibold px-6 py-3 border border-black hover:bg-black hover:text-white transition-all">
                        Download Report <ArrowUpRight size={15} />
                      </a>
                    ) : (
                      <a href="/reports"
                        className="inline-flex items-center gap-2 text-sm font-semibold px-6 py-3 border border-black hover:bg-black hover:text-white transition-all">
                        Download Report <ArrowUpRight size={15} />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </Reveal>
          ) : (
            <Reveal delay={0.1}>
              <div className="border border-black/[0.06] bg-[#FAFAFA] min-h-[200px] flex items-center justify-center">
                <p className="text-sm text-black/30">{reportsText.emptyLabel}</p>
              </div>
            </Reveal>
          )}
          <Reveal delay={0.15}>
            <div className="mt-8">
              <a href="/reports"
                className="inline-flex items-center gap-2 text-sm font-semibold text-black/50 hover:text-black transition-colors">
                {reportsText.linkLabel} <ArrowRight size={14} />
              </a>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ══ INSIGHTS / ARTICLES ═════════════════════════════════ */}
      <section id="fn-articles" className="py-28 px-6 bg-[#FAFAFA] border-b border-black/[0.07]">
        <div className="max-w-7xl mx-auto">
          <Reveal>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/35 mb-4">{insights.eyebrow}</p>
            <h2 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">{insights.title}</h2>
            <p className="text-base text-black/50 max-w-xl mb-8 leading-relaxed">
              {insights.body}
            </p>
          </Reveal>

          {/* article slider */}
          {liveArticles.length > 0 ? (
            <div className="relative">
              <div className="overflow-hidden" ref={artRef}>
                <div className="flex gap-6">
                  {liveArticles.map((a) => {
                    return (
                      <div key={a.id} className="flex-[0_0_100%] sm:flex-[0_0_calc(50%-12px)] lg:flex-[0_0_calc(33.333%-16px)] min-w-0">
                        <a href={`/articles/${a.slug}`} className="group cursor-pointer block">
                          <div className="aspect-[4/3] bg-gray-100 mb-5 overflow-hidden">
                            {a.feature_image ? (
                              <img
                                src={a.feature_image}
                                alt={a.name}
                                className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-slate-700 to-slate-900 group-hover:scale-[1.03] transition-transform duration-500" />
                            )}
                          </div>
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-xs text-black/30">{a.date}</span>
                          </div>
                          <h3 className="text-base font-bold leading-snug group-hover:opacity-60 transition-opacity">{a.name}</h3>
                        </a>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="flex items-center justify-between mt-8">
                <div className="flex items-center gap-3">
                  <button onClick={scrollArtPrev}
                    className="w-10 h-10 flex items-center justify-center border border-black/20 hover:bg-black hover:text-white hover:border-black transition-all">
                    <ChevronLeft size={16} />
                  </button>
                  <button onClick={scrollArtNext}
                    className="w-10 h-10 flex items-center justify-center border border-black/20 hover:bg-black hover:text-white hover:border-black transition-all">
                    <ChevronRight size={16} />
                  </button>
                </div>
                <a href="/articles" className="inline-flex items-center gap-2 text-sm font-semibold text-black/50 hover:text-black transition-colors">
                  {insights.linkLabel} <ArrowRight size={14} />
                </a>
              </div>
            </div>
          ) : (
            <div className="flex justify-end">
              <a href="/articles" className="inline-flex items-center gap-2 text-sm font-semibold text-black/50 hover:text-black transition-colors">
                {insights.linkLabel} <ArrowRight size={14} />
              </a>
            </div>
          )}
        </div>
      </section>

      {/* ══ CTA / CONTACT ═══════════════════════════════════════ */}
      <section id="fn-contact" className="py-36 px-6 bg-black text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.05] blur-[160px] pointer-events-none"
          style={{ background: `radial-gradient(ellipse at 50% 50%, ${BLUE}, transparent 70%)` }} />
        <div className="relative max-w-5xl mx-auto text-center">
          <Reveal>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/30 mb-6">{cta.eyebrow}</p>
            <h2 className="text-5xl md:text-7xl font-bold mb-8 leading-tight">
              {cta.headline}<br />
              <span style={{ backgroundImage: `linear-gradient(135deg, ${BLUE}, #8B5CF6)`,
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                {cta.headlineAccent}
              </span>
            </h2>
            <p className="text-lg text-white/40 max-w-xl mx-auto mb-12 leading-relaxed">
              {cta.body}
            </p>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input type="email" placeholder={cta.emailPlaceholder}
                className="flex-1 px-5 py-3.5 text-sm bg-white/[0.06] border border-white/[0.14] text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 transition-colors" />
              <button className="px-6 py-3.5 text-sm font-semibold text-white flex items-center gap-2 justify-center hover:opacity-90 transition-opacity"
                style={{ background: `linear-gradient(135deg, ${BLUE}, #6366F1)` }}>
                {cta.buttonLabel} <ArrowRight size={15} />
              </button>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ══ FOOTER ══════════════════════════════════════════════ */}
      <footer className="border-t border-white/[0.08] py-12 px-6 bg-black">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start gap-8">
          <div>
            <MovabilityLogo className="text-white" />
          </div>
          <div className="flex flex-wrap gap-x-10 gap-y-3">
            {footerLinks.map(x => (
              <a
                key={x.label}
                href={x.href}
                target={x.external ? "_blank" : undefined}
                rel={x.external ? "noopener noreferrer" : undefined}
                className="text-xs text-white/30 hover:text-white transition-colors"
              >
                {x.label}
              </a>
            ))}
          </div>
          <p className="text-xs text-white/15">© {new Date().getFullYear()} Movability</p>
        </div>
      </footer>

    </div>
  );
}
