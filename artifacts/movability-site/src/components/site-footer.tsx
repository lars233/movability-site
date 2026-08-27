import { Link } from "wouter";
import { ArrowRight } from "lucide-react";
import { useHomepageContent } from "@/lib/site-content";

const BLUE = "#4B5CF0";

/**
 * The closing call-to-action and footer shown on every page except the
 * landing page (which renders its own copy of the same sections).
 *
 * Both read the CMS "Closing CTA" and "Navigation" sections, so editing the
 * wording once in the admin changes it everywhere rather than only on the
 * homepage.
 */
export default function SiteFooter() {
  const content = useHomepageContent();
  const cta = content.section("cta");
  const footerLinks = content.items("footer_links");

  return (
    <>
      <section className="py-28 px-6 bg-black text-white relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.05] blur-[160px] pointer-events-none"
          style={{ background: `radial-gradient(ellipse at 50% 50%, ${BLUE}, transparent 70%)` }}
        />
        <div className="relative max-w-4xl mx-auto text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/30 mb-6">
            {cta.eyebrow}
          </p>
          <h2 className="text-4xl md:text-6xl font-bold mb-8 leading-tight">
            {cta.headline}
            <br />
            <span
              style={{
                backgroundImage: `linear-gradient(135deg, ${BLUE}, #8B5CF6)`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              {cta.headlineAccent}
            </span>
          </h2>
          <p className="text-base text-white/40 max-w-xl mx-auto mb-10 leading-relaxed">
            {cta.body}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              placeholder={cta.emailPlaceholder}
              className="flex-1 px-5 py-3.5 text-sm bg-white/[0.06] border border-white/[0.14] text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 transition-colors"
            />
            <button
              className="px-6 py-3.5 text-sm font-semibold text-white flex items-center gap-2 justify-center hover:opacity-90 transition-opacity"
              style={{ background: `linear-gradient(135deg, ${BLUE}, #6366F1)` }}
            >
              {cta.buttonLabel} <ArrowRight size={15} />
            </button>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/[0.08] py-12 px-6 bg-black">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start gap-8">
          <div>
            <p className="text-sm font-bold tracking-tight text-white mb-1">Movability</p>
            <p className="text-xs text-white/25">movability.io · Oslo, Norway</p>
          </div>
          <div className="flex flex-wrap gap-x-10 gap-y-3">
            {footerLinks.map((link) =>
              link.external ? (
                <a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-white/30 hover:text-white transition-colors"
                >
                  {link.label}
                </a>
              ) : (
                <Link
                  key={link.label}
                  href={link.href}
                  className="text-xs text-white/30 hover:text-white transition-colors"
                >
                  {link.label}
                </Link>
              ),
            )}
          </div>
          <p className="text-xs text-white/15">© {new Date().getFullYear()} Movability</p>
        </div>
      </footer>
    </>
  );
}
