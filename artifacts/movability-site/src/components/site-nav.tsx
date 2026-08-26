import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X, ArrowRight } from "lucide-react";
import MovabilityLogo from "@/components/movability-logo";

const BLUE = "#4B5CF0";

const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "Reports", href: "/reports" },
  { label: "Case Studies", href: "/case-studies" },
  { label: "Articles", href: "/articles" },
];

export default function SiteNav() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [location] = useLocation();

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", h, { passive: true });
    h();
    return () => window.removeEventListener("scroll", h);
  }, []);

  function isActive(href: string) {
    if (href === "/") return location === "/";
    if (href === "/reports") return location.startsWith("/reports");
    if (href === "/case-studies") return location.startsWith("/case-studies");
    if (href === "/articles") return location.startsWith("/articles");
    return false;
  }

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/95 backdrop-blur-xl border-b border-black/[0.07] shadow-sm"
          : "bg-white border-b border-black/[0.07]"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 h-[70px] flex items-center justify-between">
        <Link href="/" className="flex-shrink-0">
          <MovabilityLogo className="text-black" />
        </Link>

        <nav className="hidden md:flex items-center gap-7">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.label}
              href={l.href}
              className={`text-sm transition-colors duration-200 ${
                isActive(l.href) ? "font-medium" : "text-black/55 hover:text-black"
              }`}
              style={isActive(l.href) ? { color: BLUE } : undefined}
            >
              {l.label}
            </Link>
          ))}
          <Link
            href="/contact"
            className="ml-2 h-10 px-5 text-sm font-semibold text-white flex items-center gap-2 whitespace-nowrap hover:opacity-90 transition-opacity"
            style={{ background: `linear-gradient(135deg, ${BLUE}, #6366F1)` }}
          >
            Get in Touch <ArrowRight size={14} />
          </Link>
        </nav>

        <button
          className="md:hidden p-1"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Toggle menu"
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
            {NAV_LINKS.map((l) => (
              <Link
                key={l.label}
                href={l.href}
                onClick={() => setMenuOpen(false)}
                className={`text-base ${isActive(l.href) ? "font-medium" : "text-black/70"}`}
                style={isActive(l.href) ? { color: BLUE } : undefined}
              >
                {l.label}
              </Link>
            ))}
            <Link
              href="/contact"
              onClick={() => setMenuOpen(false)}
              className="inline-flex w-fit h-11 px-5 items-center gap-2 text-sm font-semibold text-white"
              style={{ background: `linear-gradient(135deg, ${BLUE}, #6366F1)` }}
            >
              Get in Touch <ArrowRight size={14} />
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
