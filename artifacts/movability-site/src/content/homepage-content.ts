/**
 * Landing-page content.
 *
 * Every string and list rendered on the landing page lives here as a default.
 * The CMS stores overrides in the `site_content` / `site_items` tables; the
 * merge helpers below layer those over these defaults, so a missing field, an
 * empty CMS or an unreachable API always falls back to the copy shipped in the
 * build. The page can never render blank because of a CMS problem.
 */

import larsPhoto from "@assets/Lars_photo_1778244138811.webp";
import logoUIP from "@assets/Logo_UIP_1_1778694121898.png";
import logoRuter from "@assets/Logo_Ruter_Updated_1778696147178.png";
import logoCachet from "@assets/Logo_cachet_3_1778694121892.png";
import logoBauer from "@assets/Logo_Baeur_4_1778694121890.png";
import logoBolt from "@assets/Logo_Bolt_5_1778694121891.png";
import logoDott from "@assets/Logo_dott_6_1778694121893.png";
import logoRulle from "@assets/Logo_RULLE_7_1778694121897.png";
import logoEcov from "@assets/Logo_ecov_8_1778694121895.png";
import logoFairtiq from "@assets/Logo_fairtiq_9_1778694121896.png";
import logoFastTravel from "@assets/Logo_fast_travel_10_1778694121896.png";
import logoKolumbus from "@assets/Logo_Kolumbus_11_1778694121897.png";
import logoRidemovi from "@assets/Logo_ridemovi_12_1778694121897.png";
import logoIms from "@assets/Logo_ims_13_1778694121896.png";
import logoNextbike from "@assets/Logo_nextbike_14_1778694121897.png";
import logoVoltraware from "@assets/Logo_voltraware_copy_15_1778694121898.jpg";
import photoAntoine from "@assets/Testimonial_by_Antoine_1778694372098.png";
import photoKalle from "@assets/Testimonial_by_Kalle_1778694372101.png";
import photoPia from "@assets/Testimonial_by_Pia_1778694372101.png";
import teamLars from "@assets/Lars_1778695117982.webp";
import teamSampo from "@assets/Sampo_1778695128631.jpg";
import teamMax from "@assets/max_1778695128629.webp";
import teamLisa from "@assets/Liisa_1778695128628.webp";
import teamJulia from "@assets/Julia_1778695122874.webp";
import teamThomas from "@assets/Thomas_1778695128631.webp";
import teamPeter from "@assets/Peter_1778695128630.webp";
import teamDuncan from "@assets/Duncan_1778695122872.webp";

/**
 * Images that ship with the build. The CMS stores them as `builtin:<key>`
 * so the original artwork keeps working without being re-uploaded, while new
 * entries simply store an uploaded `/api/uploads/...` URL instead.
 */
export const BUILTIN_IMAGES: Record<string, string> = {
  larsPhoto,
  logoUIP,
  logoRuter,
  logoCachet,
  logoBauer,
  logoBolt,
  logoDott,
  logoRulle,
  logoEcov,
  logoFairtiq,
  logoFastTravel,
  logoKolumbus,
  logoRidemovi,
  logoIms,
  logoNextbike,
  logoVoltraware,
  photoAntoine,
  photoKalle,
  photoPia,
  teamLars,
  teamSampo,
  teamMax,
  teamLisa,
  teamJulia,
  teamThomas,
  teamPeter,
  teamDuncan,
};

/** Turns a stored image reference into something an <img src> understands. */
export function resolveImage(ref: string | undefined): string {
  if (!ref) return "";
  if (ref.startsWith("builtin:")) return BUILTIN_IMAGES[ref.slice(8)] ?? "";
  return ref;
}

export type Section = Record<string, string>;
export type Item = Record<string, string>;

export const DEFAULT_SECTIONS = {
  nav: {
    ctaLabel: "Get in Touch",
    ctaHref: "/contact",
  },
  hero: {
    headlineLine1: "Where public",
    headlineLine2: "goals meet",
    headlineAccent: "market reality.",
    subheading:
      "Movability advises public sector and transport companies on growing new mobility.",
    emailPlaceholder: "Enter your email",
    buttonLabel: "Let's discuss",
  },
  clients: {
    label: "Companies I've worked with:",
  },
  challenge: {
    eyebrow: "The Challenge",
    title: "The transport market can feel like a",
    titleAccent: "guessing game.",
    leftTitle: "For City Officials",
    leftBody:
      "You may struggle to align market offerings with public goals. Technology and markets often move faster than regulation.",
    rightTitle: "For Transport Providers",
    rightBody:
      "You may find regulations and bidding processes hard to decode. Entering a new market requires local insight, and a generic playbook rarely survives contact with reality.",
  },
  services: {
    eyebrow: "What We Do",
    title: "Six ways we",
    titleAccent: "close the gap",
    privateLabel: "Private Sector",
    publicLabel: "Public Sector",
  },
  verticals: {
    eyebrow: "Sectors we've worked across",
  },
  story: {
    eyebrow: "About Movability",
    titleAccent: "Movability's",
    title: "story",
    image: "builtin:larsPhoto",
    imageAlt: "Lars Christian Grødem-Olsen",
    body: "Movability is a transport solopreneur consultancy centered around its founder Lars Christian Grødem-Olsen. After co-founding a car-sharing startup and leading TIER's Norway market, he went on to consult the PTA Ruter on its MaaS integrations and the revised 2024 Oslo escooter regulations.\n\nSince then he has advised over 20 clients on market entries, tenders, regulations, and integrations across various mobility modes. Where clients need more capacity or a diverse competence-base, Movability partners with several transport specialists and boutique consultancies.",
    buttonLabel: "Book a meeting",
    buttonHref:
      "https://calendly.com/movability/brief-interview?month=2026-05",
  },
  team: {
    eyebrow: "Our expert partners",
    title: "Our",
    titleAccent: "Team",
  },
  evidence: {
    eyebrow: "Evidence",
    title: "Strategy that",
    titleAccent: "moves markets.",
    linkLabel: "Read more of our case studies here",
  },
  testimonials: {
    eyebrow: "What clients say",
  },
  reports: {
    eyebrow: "Reports",
    title: "Latest Reports",
    linkLabel: "View all reports",
    emptyLabel: "No reports published yet.",
  },
  insights: {
    eyebrow: "Insights",
    title: "Latest Articles",
    body: "I regularly interview mobility leaders to obtain market and regulatory insights.",
    linkLabel: "View all articles",
  },
  cta: {
    eyebrow: "Start the conversation",
    headline: "Let's close",
    headlineAccent: "the gap together.",
    body: "Whether you're entering a new market, designing a procurement process, or need a strategic partner who speaks both mobility languages, let's kick off the conversation.",
    emailPlaceholder: "Your email address",
    buttonLabel: "Let's talk",
  },
} satisfies Record<string, Section>;

export type SectionKey = keyof typeof DEFAULT_SECTIONS;

export const DEFAULT_ITEMS = {
  nav_links: [
    { label: "Home", href: "/" },
    { label: "Reports", href: "/reports" },
    { label: "Case Studies", href: "/case-studies" },
    { label: "Articles", href: "/articles" },
  ],
  client_logos: [
    { image: "builtin:logoBolt", name: "Bolt" },
    { image: "builtin:logoFairtiq", name: "FAIRTIQ" },
    { image: "builtin:logoFastTravel", name: "Fast Travel" },
    { image: "builtin:logoNextbike", name: "Nextbike" },
    { image: "builtin:logoDott", name: "dott" },
    { image: "builtin:logoKolumbus", name: "Kolumbus" },
    { image: "builtin:logoCachet", name: "Cachet" },
    { image: "builtin:logoIms", name: "IM Solutions" },
    { image: "builtin:logoUIP", name: "UIP" },
    { image: "builtin:logoVoltraware", name: "Voltraware" },
    { image: "builtin:logoRulle", name: "Rulle" },
    { image: "builtin:logoBauer", name: "Bauer Media Outdoor" },
    { image: "builtin:logoEcov", name: "Ecov" },
    { image: "builtin:logoRidemovi", name: "RideMovi" },
    { image: "builtin:logoRuter", name: "Ruter#" },
  ],
  verticals: [
    { label: "Micromobility" },
    { label: "Public Transport" },
    { label: "Ride-hail" },
    { label: "Car-Sharing" },
    { label: "Demand-responsive Transport" },
    { label: "Mobility Software" },
    { label: "Investment & M&A" },
    { label: "Insurance" },
    { label: "Self-driving" },
    { label: "Mobility Regulation Software" },
  ],
  services_private: [
    {
      num: "01",
      title: "Market Entry Strategy",
      desc: "Assess, strategize and enter markets with tailored operator playbooks.",
    },
    {
      num: "02",
      title: "Bid & Policy Strategy",
      desc: "Close gaps, differentiate to win and defend contracts, and influence policy.",
    },
    {
      num: "03",
      title: "Innovation Strategy",
      desc: "Validate market needs and build new revenue streams in urban mobility.",
    },
  ],
  services_public: [
    {
      num: "04",
      title: "Regulation Strategy",
      desc: "Design frameworks that reach public goals at minimal costs.",
    },
    {
      num: "05",
      title: "Procurement Strategy",
      desc: "Design frameworks that reach public goals at minimal costs.",
    },
    {
      num: "06",
      title: "Innovation Strategy",
      desc: "Enable startups to innovate, and plan and scale beyond pilots.",
    },
  ],
  team: [
    { name: "Lars Grødem-Olsen", title: "MD, Micromobility and Taxi Expert", image: "builtin:teamLars" },
    { name: "Sampo Heitanen", title: "Senior MaaS Expert and Entrepreneur", image: "builtin:teamSampo" },
    { name: "Maximilian Schreiber", title: "Logistics and Insurance Expert", image: "builtin:teamMax" },
    { name: "Lisa Anderson", title: "Bike-Share & AV Expert", image: "builtin:teamLisa" },
    { name: "Julia Sandsto", title: "Policy and PR Expert", image: "builtin:teamJulia" },
    { name: "Thomas K. Hamann", title: "Senior Automotive Expert", image: "builtin:teamThomas" },
    { name: "Peter Froede", title: "Senior Charging Expert", image: "builtin:teamPeter" },
    { name: "Duncan Robertson", title: "Bike-share and Escooter Expert", image: "builtin:teamDuncan" },
  ],
  case_tiles: [
    {
      tag: "Regulation",
      title: "Revising Oslo's e-scooter regulations and creating increased connectivity",
      stat: "2×",
      statLabel: "Ridership increase",
    },
    {
      tag: "Market Entry",
      title: "Helped sign B2G ride-hail contract",
      stat: "€6M",
      statLabel: "Contract value",
    },
    {
      tag: "Procurement",
      title: "MaaS integrations secured for Ruter, Norway's largest PTA",
      stat: "5",
      statLabel: "Contracts won",
    },
  ],
  proof_points: [
    { stat: "30+", label: "market entries" },
    {
      stat: "50+",
      label: "shared mobility strategy projects for public and private sector",
    },
    { stat: "20+", label: "clients supported" },
    { stat: "15m+", label: "trips analyzed" },
    { stat: "8yrs+", label: "mobility experience" },
  ],
  testimonials: [
    {
      name: "Antoine Belaieff",
      role: "Head of New Markets",
      company: "FAIRTIQ",
      quote:
        "Lars brings resourcefulness, credibility, and integrity to his work. He has built trusted relationships with the right people and uses them responsibly. He listens deeply, thinks strategically, and contributes as a real partner in shaping direction.",
      image: "builtin:photoAntoine",
    },
    {
      name: "Kalle Palling",
      role: "COO",
      company: "Cachet",
      quote:
        "Movability has helped us enter new markets in the mobility space across various verticals. They helped us create clear GTM strategies and bring operator hustle to our execution, providing us with measurable ROI.",
      image: "builtin:photoKalle",
    },
    {
      name: "Pia-Suzann Skulevold",
      role: "Head of Micromobility",
      company: "Ruter, Oslo PTA",
      quote:
        "Micromobility was a completely new market for us and we lacked clarity on critical focus areas for us as a PTA. Movability has provided us with expert knowledge from the operator side and PMO that has helped us build SLAs, relevant data analysis, negotiate better deals and improve micromobility regulations.",
      image: "builtin:photoPia",
    },
    {
      name: "Ricardo Gallego Gómez",
      role: "Head of Bid Management",
      company: "Bolt",
      quote:
        "Movability provided us with a comprehensive gap analysis using their excellent local knowledge and industry experience, which was critical in preparing and securing the Oslo tender. Throughout the process, they were available, with a hands-on attitude, and provided proactive recommendations.",
      image: "/photo-ricardo.webp",
    },
    {
      name: "Randi Markvardsen",
      role: "Head of Bike-share",
      company: "Kolumbus",
      quote:
        "We were looking for experts to help us make a critical supply chain decision in an immature market. Movability helped us source expert knowledge as well as provide critical thinking and structure around RFI answers received from the market so we could land on a recommended course of action towards our board members.",
      image: "/photo-randi.jpg",
    },
  ],
  footer_links: [
    { label: "Home", href: "/" },
    { label: "Reports", href: "/reports" },
    { label: "Case Studies", href: "/case-studies" },
    { label: "Articles", href: "/articles" },
    {
      label: "Book a meeting",
      href: "https://calendly.com/movability/brief-interview?month=2026-05",
      external: "yes",
    },
    { label: "Get in Touch", href: "#fn-contact" },
  ],
} satisfies Record<string, Item[]>;

export type CollectionKey = keyof typeof DEFAULT_ITEMS;

export type SiteContentResponse = {
  content: Record<string, Record<string, unknown>>;
  items: Record<string, { data: Record<string, unknown>; visible: boolean }[]>;
};

/** Overlays stored values on the defaults, ignoring blank strings. */
export function mergeSection<K extends SectionKey>(
  key: K,
  stored: Record<string, unknown> | undefined,
): (typeof DEFAULT_SECTIONS)[K] {
  const base = { ...DEFAULT_SECTIONS[key] };
  if (!stored) return base;
  for (const [field, value] of Object.entries(stored)) {
    if (typeof value === "string" && value.trim() !== "" && field in base) {
      (base as Record<string, string>)[field] = value;
    }
  }
  return base;
}

/** Returns stored rows for a collection, or the built-in list when empty. */
export function mergeCollection<K extends CollectionKey>(
  key: K,
  stored: SiteContentResponse["items"] | undefined,
): Item[] {
  const rows = stored?.[key];
  if (!rows || rows.length === 0) return DEFAULT_ITEMS[key] as Item[];
  return rows
    .filter((row) => row.visible !== false)
    .map((row) => row.data as Item);
}
