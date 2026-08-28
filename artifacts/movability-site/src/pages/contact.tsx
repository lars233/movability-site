import { useState, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { ArrowRight, CheckCircle } from "lucide-react";
import SiteNav from "@/components/site-nav";
import SiteFooter from "@/components/site-footer";
import { useHomepageContent } from "@/lib/site-content";
import larsPhoto from "@assets/Lars_photo_1778244138811.webp";

const BLUE = "#4B5CF0";

const OBJECTIVES = [
  "Market Entry & Strategy",
  "Bid & Tender Support",
  "Policy & Regulation",
  "Innovation & Scaling",
  "Other",
];

export default function ContactPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    company: "",
    country: "",
    primary_objective: "",
    project_overview: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const ref = useRef(null);
  const inView = useInView(ref, { once: true });

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? "Submission failed");
      }
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  // Wording comes from the CMS ("Contact page" in the admin), falling back to
  // the defaults shipped in the build.
  const text = useHomepageContent().section("page_contact");

  const inputClass =
    "w-full h-12 px-4 text-sm border border-black/15 bg-white placeholder:text-black/35 focus:outline-none focus:border-black/50 transition-colors";
  const selectClass =
    "w-full h-12 px-4 text-sm border border-black/15 bg-white focus:outline-none focus:border-black/50 transition-colors appearance-none cursor-pointer";
  const labelClass = "block text-xs font-semibold uppercase tracking-[0.15em] text-black/50 mb-2";

  return (
    <div className="min-h-screen bg-white text-black antialiased" style={{ fontFamily: "'DM Sans', 'Inter', sans-serif" }}>
      <SiteNav />

      {/* Hero */}
      <section className="pt-[70px] border-b border-black/[0.07]">
        <div className="max-w-7xl mx-auto px-6 pt-20 pb-16">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] mb-4" style={{ color: BLUE }}>
              {text.eyebrow}
            </p>
            <h1 className="text-4xl md:text-6xl font-bold leading-tight tracking-tight mb-5 max-w-2xl">
              {text.title}{" "}
              <span style={{ backgroundImage: `linear-gradient(135deg, ${BLUE}, #6366F1)`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                {text.titleAccent}
              </span>
            </h1>
            <p className="text-base text-black/45 max-w-lg leading-relaxed">
              {text.body}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Form */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-[1fr_1.6fr] gap-16 items-start">

            {/* photo column */}
            <div className="hidden md:block sticky top-28">
              <div className="overflow-hidden">
                <img
                  src={larsPhoto}
                  alt="Lars Christian Grødem-Olsen"
                  className="w-full object-cover object-top"
                  style={{ aspectRatio: "3/4" }}
                />
              </div>
              <div className="mt-6">
                <p className="text-sm font-bold text-black">{text.photoName}</p>
                <p className="text-xs text-black/45 mt-1">{text.photoRole}</p>
              </div>
            </div>

            {/* form column */}
            <div ref={ref}>
              {submitted ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-20"
                >
                  <CheckCircle size={48} className="mx-auto mb-6" style={{ color: BLUE }} />
                  <h2 className="text-2xl font-bold mb-3">{text.successTitle}</h2>
                  <p className="text-black/50 max-w-sm mx-auto leading-relaxed">
                    {text.successBody}
                  </p>
                  <a
                    href="/"
                    className="inline-flex items-center gap-2 mt-8 text-sm font-semibold text-black/50 hover:text-black transition-colors"
                  >
                    {text.successLinkLabel} <ArrowRight size={14} />
                  </a>
                </motion.div>
              ) : (
                <motion.form
                  onSubmit={handleSubmit}
                  initial={{ opacity: 0, y: 24 }}
                  animate={inView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                  className="space-y-6"
                >
                  <div className="grid sm:grid-cols-2 gap-6">
                    <div>
                      <label className={labelClass}>{text.labelName}</label>
                      <input
                        type="text"
                        required
                        placeholder={text.placeholderName}
                        value={form.name}
                        onChange={(e) => set("name", e.target.value)}
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>{text.labelEmail}</label>
                      <input
                        type="email"
                        required
                        placeholder={text.placeholderEmail}
                        value={form.email}
                        onChange={(e) => set("email", e.target.value)}
                        className={inputClass}
                      />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-6">
                    <div>
                      <label className={labelClass}>{text.labelCompany}</label>
                      <input
                        type="text"
                        placeholder={text.placeholderCompany}
                        value={form.company}
                        onChange={(e) => set("company", e.target.value)}
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>{text.labelCountry}</label>
                      <input
                        type="text"
                        placeholder={text.placeholderCountry}
                        value={form.country}
                        onChange={(e) => set("country", e.target.value)}
                        className={inputClass}
                      />
                    </div>
                  </div>

                  <div>
                    <label className={labelClass}>{text.labelObjective}</label>
                    <div className="relative">
                      <select
                        value={form.primary_objective}
                        onChange={(e) => set("primary_objective", e.target.value)}
                        className={selectClass}
                      >
                        <option value="">{text.placeholderObjective}</option>
                        {OBJECTIVES.map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center">
                        <svg width="12" height="8" viewBox="0 0 12 8" fill="none"><path d="M1 1l5 5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className={labelClass}>{text.labelOverview}</label>
                    <textarea
                      rows={5}
                      placeholder={text.placeholderOverview}
                      value={form.project_overview}
                      onChange={(e) => set("project_overview", e.target.value)}
                      className="w-full px-4 py-3 text-sm border border-black/15 bg-white placeholder:text-black/35 focus:outline-none focus:border-black/50 transition-colors resize-none"
                    />
                  </div>

                  {error && (
                    <p className="text-sm text-red-500">{error}</p>
                  )}

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full h-13 px-6 py-3.5 text-sm font-semibold text-white flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-60"
                    style={{ background: `linear-gradient(135deg, ${BLUE}, #6366F1)` }}
                  >
                    {submitting ? text.sendingLabel : <>{text.submitLabel} <ArrowRight size={15} /></>}
                  </button>
                </motion.form>
              )}
            </div>

          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
