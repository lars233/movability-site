import React, { useState, useCallback, useEffect } from "react";
import { FadeIn } from "@/components/fade-in";
import { Marquee } from "@/components/marquee";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, ChevronLeft, ChevronRight, Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import useEmblaCarousel from "embla-carousel-react";
import larsPhoto from "@assets/Lars_photo_1778244138811.webp";

export default function Home() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: "start" });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([]);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    setScrollSnaps(emblaApi.scrollSnapList());
    const onSelect = () => setSelectedIndex(emblaApi.selectedScrollSnap());
    emblaApi.on("select", onSelect);
    onSelect();
    return () => { emblaApi.off("select", onSelect); };
  }, [emblaApi]);

  const navLinks = [
    { name: "Reports", href: "#reports" },
    { name: "Articles", href: "#articles" },
    { name: "Case Studies", href: "#case-studies" },
    { name: "V2", href: "/v2" },
    { name: "V3", href: "/v3" },
    { name: "Final", href: "/final" },
  ];

  const clients = [
    "Bolt", "FAIRTIQ", "Ruter", "Fast Travel", "Nextbike",
    "dott", "Kolumbus", "Cachet", "IM Solutions", "UIP",
    "Voltraware", "Rulle",
  ];

  const mobilityVerticals = [
    "Self-driving", "Public Transport", "Ride-hail", "Investment & M&A",
    "Micromobility", "Demand-responsive Transport", "Car-Sharing",
    "Mobility Software", "Insurance",
  ];

  const stats = [
    {
      number: "€6M+",
      label: "Ride-hail market",
      desc: "Negotiated a pilot contract for a ride-hail platform entering a high-value European market",
    },
    {
      number: "2x",
      label: "Rides in Oslo",
      desc: "Revised e-scooter regulations led to 50% more bidders and double the rides.",
    },
    {
      number: "5",
      label: "Contracts for Ruter",
      desc: "Negotiated contracts with bike-share and e-scooter rental providers for Oslo's PTA",
    },
    {
      number: "€10M+",
      label: "Tender Won",
      desc: "Helped Bolt secure an e-scooter tender in a competitive European market",
    },
    {
      number: "20+",
      label: "Clients served",
      desc: "From CPOs, insurers, and bike-share operators — successful market entries across Europe",
    },
    {
      number: "2025",
      label: "Policy shaped",
      desc: "Set the Green Party's Shared Mobility programme for Norwegian national elections",
    },
  ];

  const testimonials = [
    {
      name: "Antoine Belaieff",
      role: "Head of New Markets",
      company: "FAIRTIQ",
      quote:
        "Lars brings resourcefulness, credibility, and integrity to his work. He has built trusted relationships with the right people and uses them responsibly. He listens deeply, thinks strategically, and contributes as a real partner in shaping direction. On top of that, he is a pleasure to work with.",
    },
    {
      name: "Kalle Palling",
      role: "COO",
      company: "Cachet",
      quote:
        "Movability has helped us enter new markets in the mobility space across various verticals. They helped us create clear GTM strategies and bring operator hustle to our execution, providing us with measurable ROI.",
    },
    {
      name: "Pia-Suzann Skulevold",
      role: "Head of Micromobility",
      company: "Ruter, the PTA of Oslo",
      quote:
        "Micromobility was a completely new market for us and we lacked clarity on critical focus areas for us as a PTA. Movability has provided us with expert knowledge from the operator side and PMO that has helped us build SLAs, relevant data analysis, negotiate better deals and improve micromobility regulations.",
    },
  ];

  const articles = [
    {
      title: "Blablacar Bus VP: A Waymo will never give you the long-distance ride you need",
      date: "September 9, 2025",
      bg: "from-slate-700 to-slate-900",
    },
    {
      title: "Interview with CEO on nextbike's Journey: Expansion, TIER-nextbike Merger, and Return to Independence",
      date: "September 9, 2025",
      bg: "from-zinc-600 to-zinc-900",
    },
    {
      title: "Ex. Bike-Share CEO Wants To Bring Big Tech's Data Ambition To Public Procurement",
      date: "September 9, 2025",
      bg: "from-neutral-600 to-neutral-900",
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/10 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <a href="#" className="text-xl font-bold tracking-tight text-white z-50">
            Movability
          </a>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            <div className="flex gap-6">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  data-testid={`nav-link-${link.name.toLowerCase().replace(" ", "-")}`}
                  className="text-sm font-medium text-white/80 hover:text-white transition-colors"
                >
                  {link.name}
                </a>
              ))}
            </div>
            <Button
              data-testid="nav-cta-book"
              variant="outline"
              className="bg-transparent border-white/30 text-white hover:bg-white hover:text-black rounded-sm text-sm font-medium"
            >
              Book a meeting
            </Button>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden z-50 text-white"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            data-testid="nav-mobile-toggle"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-40 bg-black text-white pt-24 px-6 flex flex-col gap-6 md:hidden"
          >
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="text-2xl font-semibold hover:text-white/70"
                onClick={() => setIsMenuOpen(false)}
              >
                {link.name}
              </a>
            ))}
            <Button
              className="mt-4 bg-white text-black hover:bg-white/90 rounded-sm w-full"
              size="lg"
              data-testid="nav-mobile-cta"
            >
              Book a meeting
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Section */}
      <section className="relative min-h-[100dvh] flex items-center pt-20 pb-12 overflow-hidden bg-black text-white">
        <div className="absolute inset-0 z-0">
          <img
            src="/hero-bg.png"
            alt="City mobility at night"
            className="w-full h-full object-cover opacity-55"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/20 to-black/80" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 w-full">
          <div className="max-w-4xl">
            <FadeIn>
              <h1 className="text-6xl md:text-8xl lg:text-[120px] leading-[0.9] font-bold tracking-tight mb-8">
                Stop guessing.<br />
                <span className="text-white/60">Start growing.</span>
              </h1>
            </FadeIn>
            <FadeIn delay={0.2}>
              <p className="text-lg md:text-xl text-white/75 max-w-xl mb-10 leading-relaxed font-normal">
                Movability advises governments and transport companies on growing new mobility, bridging public goals and market realities.
              </p>
            </FadeIn>
            <FadeIn delay={0.35}>
              <div className="flex flex-col sm:flex-row gap-3 max-w-md">
                <Input
                  type="email"
                  placeholder="Enter your email"
                  data-testid="hero-email-input"
                  className="h-12 rounded-sm bg-white/10 border-white/20 text-white placeholder:text-white/45 focus-visible:ring-white/30"
                />
                <Button
                  size="lg"
                  data-testid="hero-cta-button"
                  className="h-12 rounded-sm bg-white text-black hover:bg-white/90 px-6 whitespace-nowrap font-semibold"
                >
                  Let's discuss <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* Client Logo Marquee */}
      <section className="py-8 border-b bg-white overflow-hidden">
        <Marquee speed="normal" className="[mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
          {clients.map((client, idx) => (
            <div
              key={idx}
              className="flex items-center justify-center px-10 text-sm font-bold uppercase tracking-widest text-black/25 hover:text-black/70 transition-colors cursor-default whitespace-nowrap"
            >
              {client}
              <span className="ml-10 text-black/10">·</span>
            </div>
          ))}
        </Marquee>
      </section>

      {/* The Problem */}
      <section className="py-28 px-6 bg-background">
        <div className="max-w-7xl mx-auto">
          <FadeIn>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-6">The challenge</p>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold max-w-3xl mb-20 leading-tight">
              The transport market can feel like a guessing game.
            </h2>
          </FadeIn>

          <div className="grid md:grid-cols-2 gap-12 md:gap-20">
            <FadeIn delay={0.15}>
              <div className="space-y-5">
                <div className="h-[2px] w-10 bg-black" />
                <h3 className="text-xl font-semibold">For City Officials</h3>
                <p className="text-base text-muted-foreground leading-relaxed">
                  You struggle to align fast-moving market offerings with long-term public goals. The technology moves faster than regulation, leaving you reactive instead of proactive in shaping your city's mobility future.
                </p>
              </div>
            </FadeIn>
            <FadeIn delay={0.3}>
              <div className="space-y-5">
                <div className="h-[2px] w-10 bg-black" />
                <h3 className="text-xl font-semibold">For Transport Providers</h3>
                <p className="text-base text-muted-foreground leading-relaxed">
                  You find regulatory gatekeepers and complex bidding processes hard to decode. Entering a new market requires deep local insight, and a generic playbook rarely survives contact with reality.
                </p>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* Impact Stats — matching the provided screenshot */}
      <section className="px-6 pb-0 bg-background">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 border-t border-l border-border">
            {stats.map((stat, idx) => (
              <FadeIn key={idx} delay={idx * 0.08}>
                <div className="border-b border-r border-border p-8 md:p-10 flex flex-col gap-3 group">
                  <span className="text-4xl md:text-5xl font-bold text-foreground group-hover:text-[#4B5CF0] transition-colors duration-300">
                    {stat.number}
                  </span>
                  <span className="text-base font-semibold text-foreground">{stat.label}</span>
                  <p className="text-sm text-muted-foreground leading-relaxed">{stat.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="py-28 px-6 bg-background">
        <div className="max-w-7xl mx-auto">
          <FadeIn>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">What we do</p>
            <h2 className="text-4xl md:text-5xl font-bold mb-16">How we help.</h2>
          </FadeIn>

          <div className="grid md:grid-cols-2 gap-6">
            <FadeIn delay={0.1}>
              <div className="bg-secondary p-10 h-full">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-6">Private Sector</p>
                <ul className="space-y-6">
                  {[
                    { title: "Market Entry Strategy", desc: "Assess, strategize and enter markets with tailored operator playbooks." },
                    { title: "Bid & Policy Strategy", desc: "Close gaps, differentiate yourself to win and defend contracts, and influence policy." },
                    { title: "Innovation Strategy", desc: "Validate market needs and build new revenue streams in urban mobility." },
                  ].map((item) => (
                    <li key={item.title} className="border-t border-border pt-5">
                      <p className="font-semibold mb-1">{item.title}</p>
                      <p className="text-sm text-muted-foreground">{item.desc}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </FadeIn>

            <FadeIn delay={0.2}>
              <div className="bg-foreground text-background p-10 h-full">
                <p className="text-xs font-semibold uppercase tracking-widest text-background/50 mb-6">Public Sector</p>
                <ul className="space-y-6">
                  {[
                    { title: "Regulation Strategy", desc: "Design frameworks that reach public goals at minimal costs to tax payers and businesses." },
                    { title: "Procurement Strategy", desc: "Research and engage the market, shape competitions, implement and follow up new services." },
                    { title: "Innovation Strategy", desc: "Enable startups to innovate, and plan and scale beyond pilots." },
                  ].map((item) => (
                    <li key={item.title} className="border-t border-background/20 pt-5">
                      <p className="font-semibold mb-1">{item.title}</p>
                      <p className="text-sm text-background/60">{item.desc}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* Testimonials Slider */}
      <section className="py-28 px-6 bg-secondary overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <FadeIn>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">What clients say</p>
            <h2 className="text-4xl md:text-5xl font-bold mb-14">In their own words.</h2>
          </FadeIn>

          <div className="relative">
            <div className="overflow-hidden" ref={emblaRef}>
              <div className="flex gap-6">
                {testimonials.map((t, idx) => (
                  <div
                    key={idx}
                    className="flex-[0_0_100%] md:flex-[0_0_calc(50%-12px)] lg:flex-[0_0_calc(50%-12px)] min-w-0"
                    data-testid={`testimonial-card-${idx}`}
                  >
                    <div className="bg-white border border-border p-8 md:p-10 h-full flex flex-col justify-between min-h-[280px]">
                      <p className="text-base md:text-lg leading-relaxed text-foreground/80 mb-8">
                        "{t.quote}"
                      </p>
                      <div className="flex items-center gap-4 border-t border-border pt-6">
                        <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ backgroundColor: "#4B5CF0" }}>
                          {t.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{t.name}</p>
                          <p className="text-xs text-muted-foreground">{t.role} — {t.company}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-4 mt-8">
              <button
                onClick={scrollPrev}
                data-testid="testimonial-prev"
                className="w-10 h-10 flex items-center justify-center border border-border bg-white hover:bg-foreground hover:text-background transition-colors"
              >
                <ChevronLeft size={18} />
              </button>
              <div className="flex gap-2">
                {scrollSnaps.map((_, idx) => (
                  <button
                    key={idx}
                    data-testid={`testimonial-dot-${idx}`}
                    onClick={() => emblaApi?.scrollTo(idx)}
                    className={`h-1.5 transition-all duration-300 ${idx === selectedIndex ? "w-8 bg-foreground" : "w-1.5 bg-border"}`}
                  />
                ))}
              </div>
              <button
                onClick={scrollNext}
                data-testid="testimonial-next"
                className="w-10 h-10 flex items-center justify-center border border-border bg-white hover:bg-foreground hover:text-background transition-colors"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* About / Story */}
      <section className="py-28 px-6 bg-background">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <FadeIn>
              <div className="aspect-[4/5] relative overflow-hidden bg-secondary">
                <img
                  src={larsPhoto}
                  alt="Lars Christian Grødem-Olsen, founder of Movability"
                  className="object-cover object-top w-full h-full"
                  data-testid="img-lars-portrait"
                />
              </div>
            </FadeIn>
            <FadeIn delay={0.2}>
              <div className="space-y-7">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">Our story</p>
                  <h2 className="text-4xl md:text-5xl font-bold leading-tight">Movability's Story</h2>
                </div>
                <div className="space-y-5 text-base text-muted-foreground leading-relaxed">
                  <p>
                    Founded by Lars Christian Grødem-Olsen, Movability is a boutique solopreneur consultancy built on real operational experience in new mobility.
                  </p>
                  <p>
                    Before consulting, Lars co-founded a car-sharing startup and led TIER Norway. He knows what it takes to operate on the ground — then brought that perspective to the public sector, consulting Ruter on MaaS integrations and helping shape the revised 2024 Oslo e-scooter regulations.
                  </p>
                  <p>
                    With 19+ clients advised globally, Movability offers the agility of a startup with the strategic rigor of a top-tier firm. For larger engagements, Lars partners with a trusted network of transport specialists.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="lg"
                  data-testid="about-read-bio"
                  className="rounded-sm border-foreground hover:bg-foreground hover:text-background font-semibold"
                >
                  Book a meeting <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* Mobility Verticals — auto-scrolling black ticker */}
      <section className="py-5 bg-foreground text-background border-y border-foreground overflow-hidden">
        <Marquee speed="slow" direction="left" pauseOnHover={true}>
          {mobilityVerticals.map((vertical, idx) => (
            <div
              key={idx}
              className="flex items-center text-sm font-medium uppercase tracking-widest text-background/50 hover:text-background transition-colors cursor-default whitespace-nowrap px-8"
            >
              {vertical}
              <span className="ml-8 text-background/20">—</span>
            </div>
          ))}
        </Marquee>
      </section>

      {/* Transport Strategy Case Studies */}
      <section id="case-studies" className="py-28 px-6 bg-secondary">
        <div className="max-w-7xl mx-auto">
          <FadeIn>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">Results</p>
            <h2 className="text-4xl md:text-5xl font-bold mb-14">Transport Strategy Case Studies</h2>
          </FadeIn>

          <div className="grid md:grid-cols-2 gap-6">
            <FadeIn delay={0.1}>
              <div
                className="group bg-card border border-border hover:-translate-y-1 transition-transform duration-300 cursor-pointer overflow-hidden"
                data-testid="case-study-card-0"
              >
                <div className="h-52 overflow-hidden relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900">
                    <div className="absolute inset-0 opacity-20" style={{
                      backgroundImage: "radial-gradient(circle at 30% 50%, #4B5CF0 0%, transparent 60%)",
                    }} />
                    <div className="absolute bottom-6 left-6 right-6">
                      <span className="inline-block bg-white/10 backdrop-blur text-white text-xs font-semibold uppercase tracking-widest px-3 py-1">
                        Oslo · E-Scooter Regulations
                      </span>
                    </div>
                  </div>
                </div>
                <div className="p-8">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">Regulation Case Study</p>
                  <h3 className="text-xl md:text-2xl font-bold mb-6 leading-snug group-hover:text-[#4B5CF0] transition-colors">
                    How We Helped Oslo Design Its E-Scooter Regulations
                  </h3>
                  <span className="flex items-center text-sm font-semibold uppercase tracking-wider group-hover:translate-x-1 transition-transform">
                    Read Case Study <ArrowRight className="ml-2 h-4 w-4" />
                  </span>
                </div>
              </div>
            </FadeIn>

            <FadeIn delay={0.2}>
              <div
                className="group bg-foreground text-background hover:-translate-y-1 transition-transform duration-300 cursor-pointer overflow-hidden"
                data-testid="case-study-card-1"
              >
                <div className="h-52 overflow-hidden relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#3a4ad4] via-[#4B5CF0] to-[#6b7cf5]">
                    <div className="absolute inset-0 opacity-30" style={{
                      backgroundImage: "radial-gradient(circle at 70% 30%, #ffffff 0%, transparent 50%)",
                    }} />
                    <div className="absolute bottom-6 left-6 right-6">
                      <span className="inline-block bg-white/15 backdrop-blur text-white text-xs font-semibold uppercase tracking-widest px-3 py-1">
                        Ride-hail · Contract Negotiation
                      </span>
                    </div>
                  </div>
                </div>
                <div className="p-8">
                  <p className="text-xs font-semibold text-background/50 uppercase tracking-widest mb-3">Ride-hail Case Study</p>
                  <h3 className="text-xl md:text-2xl font-bold mb-6 leading-snug group-hover:text-white/80 transition-colors">
                    How We Secured a Pilot Contract for a Ride-Hail Platform
                  </h3>
                  <span className="flex items-center text-sm font-semibold uppercase tracking-wider group-hover:translate-x-1 transition-transform">
                    Read Case Study <ArrowRight className="ml-2 h-4 w-4" />
                  </span>
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* Featured Report */}
      <section id="reports" className="py-28 px-6 bg-background">
        <div className="max-w-7xl mx-auto">
          <div className="border border-border p-8 md:p-14 grid md:grid-cols-2 gap-12 items-center">
            <FadeIn>
              <div className="space-y-6">
                <span className="inline-block px-3 py-1 bg-[#4B5CF0]/10 text-[#4B5CF0] text-xs font-bold uppercase tracking-widest">
                  Featured Report
                </span>
                <h2 className="text-3xl md:text-4xl font-bold leading-tight">
                  User Acquisition Mastery: The Mobility Growth Playbook
                </h2>
                <p className="text-base text-muted-foreground leading-relaxed">
                  Stop guessing your growth strategy. We dissected the winning strategies of Uber, Foodora, and TIER to show you exactly how top mobility operators acquire and retain users.
                </p>
                <Button
                  size="lg"
                  data-testid="report-cta"
                  className="rounded-sm font-semibold bg-foreground text-background hover:bg-foreground/80"
                >
                  See our reports here <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </FadeIn>
            <FadeIn delay={0.2}>
              <div className="aspect-[4/3] bg-secondary relative overflow-hidden group shadow-lg">
                <img
                  src="/report-cover.png"
                  alt="Mobility Growth Playbook Report"
                  className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-700"
                />
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* How We Work */}
      <section className="py-28 px-6 bg-secondary">
        <div className="max-w-7xl mx-auto">
          <FadeIn>
            <div className="max-w-2xl mb-16">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">How we work</p>
              <h2 className="text-4xl md:text-5xl font-bold mb-4">We hate billing hours without outcomes.</h2>
              <p className="text-base text-muted-foreground">Choose a model that aligns with your goals, not just your clock.</p>
            </div>
          </FadeIn>

          <div className="grid md:grid-cols-3 gap-5">
            {[
              {
                title: "Hourly & Milestones",
                desc: "Transparent hourly rates capped by strict milestones and budget limits. Ideal for well-defined, short-term projects.",
              },
              {
                title: "Outcome-based Fee",
                desc: "We share the risk. You pay based on the value and specific outcomes we deliver. Ideal for market entry and tender bids.",
              },
              {
                title: "Retainer",
                desc: "Ongoing strategic support and advisory on a fixed monthly fee. Ideal for long-term policy shaping and market analysis.",
              },
            ].map((model, idx) => (
              <FadeIn key={idx} delay={idx * 0.1}>
                <div
                  className="bg-white border border-border p-8 h-full hover:border-foreground transition-colors group"
                  data-testid={`pricing-card-${idx}`}
                >
                  <h3 className="text-lg font-bold mb-3">{model.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{model.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>

          <div className="mt-12">
            <Button
              size="lg"
              data-testid="pricing-cta"
              className="rounded-sm px-8 h-12 font-semibold bg-foreground text-background hover:bg-foreground/80"
            >
              Let's discuss outcomes
            </Button>
          </div>
        </div>
      </section>

      {/* Latest Articles */}
      <section id="articles" className="py-28 px-6 bg-background">
        <div className="max-w-7xl mx-auto">
          <FadeIn>
            <div className="flex items-end justify-between mb-14">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">Insights</p>
                <h2 className="text-4xl md:text-5xl font-bold">Latest Articles</h2>
              </div>
              <a
                href="#"
                data-testid="articles-view-all"
                className="hidden md:flex items-center text-sm font-semibold hover:opacity-60 transition-opacity"
              >
                View all <ArrowRight className="ml-1 h-4 w-4" />
              </a>
            </div>
          </FadeIn>

          <div className="grid md:grid-cols-3 gap-6">
            {articles.map((article, idx) => (
              <FadeIn key={idx} delay={idx * 0.1}>
                <div
                  className="group cursor-pointer"
                  data-testid={`article-card-${idx}`}
                >
                  <div className={`aspect-[4/3] overflow-hidden mb-5 bg-gradient-to-br ${article.bg} transition-transform duration-500 group-hover:scale-[1.02]`} />
                  <p className="text-xs text-muted-foreground mb-2">{article.date}</p>
                  <h3 className="text-base font-semibold leading-snug group-hover:opacity-60 transition-opacity">
                    {article.title}
                  </h3>
                </div>
              </FadeIn>
            ))}
          </div>

          <a
            href="#"
            className="md:hidden mt-8 flex items-center text-sm font-semibold hover:opacity-60 transition-opacity"
          >
            View all articles <ArrowRight className="ml-1 h-4 w-4" />
          </a>
        </div>
      </section>

      {/* Footer CTA & Footer */}
      <footer className="bg-foreground text-background">
        <div className="py-28 px-6 border-b border-background/10 text-center">
          <div className="max-w-2xl mx-auto">
            <FadeIn>
              <h2 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">Ready to stop guessing?</h2>
              <p className="text-lg text-background/60 mb-10">Let's align your strategy with market realities.</p>
              <Button
                size="lg"
                data-testid="footer-cta-book"
                className="rounded-sm bg-white text-black hover:bg-white/90 px-10 h-14 text-base font-semibold"
              >
                Book a meeting
              </Button>
            </FadeIn>
          </div>
        </div>

        <div className="py-8 px-6">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-5">
            <span className="text-xl font-bold">Movability</span>
            <div className="flex gap-8 text-sm text-background/50">
              <a href="#" className="hover:text-background transition-colors">LinkedIn</a>
              <a href="#" className="hover:text-background transition-colors">Privacy Policy</a>
            </div>
            <span className="text-sm text-background/30">© {new Date().getFullYear()} Movability. All rights reserved.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
