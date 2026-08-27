import { useEffect, useMemo, useRef, useState } from "react";
import AdminLayout from "./layout";
import { adminApi } from "@/lib/admin-api";
import {
  DEFAULT_ITEMS,
  DEFAULT_SECTIONS,
  mergeSection,
  resolveImage,
  type CollectionKey,
  type SectionKey,
} from "@/content/homepage-content";

/* ── field definitions ──────────────────────────────────────── */

type FieldType = "text" | "textarea" | "image";
type Field = { key: string; label: string; type?: FieldType; hint?: string };

const SECTION_FIELDS: Record<SectionKey, Field[]> = {
  nav: [
    { key: "ctaLabel", label: "Button label" },
    { key: "ctaHref", label: "Button link" },
  ],
  hero: [
    { key: "headlineLine1", label: "Headline — line 1" },
    { key: "headlineLine2", label: "Headline — line 2" },
    { key: "headlineAccent", label: "Headline — blue line" },
    { key: "subheading", label: "Subheading", type: "textarea" },
    { key: "emailPlaceholder", label: "Email field placeholder" },
    { key: "buttonLabel", label: "Button label" },
  ],
  clients: [{ key: "label", label: "Label above the logos" }],
  challenge: [
    { key: "eyebrow", label: "Eyebrow" },
    { key: "title", label: "Heading" },
    { key: "titleAccent", label: "Heading — blue ending" },
    { key: "leftTitle", label: "Left column — title" },
    { key: "leftBody", label: "Left column — text", type: "textarea" },
    { key: "rightTitle", label: "Right column — title" },
    { key: "rightBody", label: "Right column — text", type: "textarea" },
  ],
  services: [
    { key: "eyebrow", label: "Eyebrow" },
    { key: "title", label: "Heading" },
    { key: "titleAccent", label: "Heading — blue ending" },
    { key: "privateLabel", label: "Left card label" },
    { key: "publicLabel", label: "Right card label" },
  ],
  verticals: [{ key: "eyebrow", label: "Eyebrow" }],
  story: [
    { key: "eyebrow", label: "Eyebrow" },
    { key: "titleAccent", label: "Heading — blue start" },
    { key: "title", label: "Heading — rest" },
    { key: "image", label: "Photo", type: "image" },
    { key: "imageAlt", label: "Photo alt text" },
    {
      key: "body",
      label: "Story text",
      type: "textarea",
      hint: "Leave a blank line between paragraphs.",
    },
    { key: "buttonLabel", label: "Button label" },
    { key: "buttonHref", label: "Button link" },
  ],
  team: [
    { key: "eyebrow", label: "Eyebrow" },
    { key: "title", label: "Heading" },
    { key: "titleAccent", label: "Heading — blue ending" },
  ],
  evidence: [
    { key: "eyebrow", label: "Eyebrow" },
    { key: "title", label: "Heading" },
    { key: "titleAccent", label: "Heading — blue ending" },
    { key: "linkLabel", label: "Link label" },
  ],
  testimonials: [{ key: "eyebrow", label: "Eyebrow" }],
  reports: [
    { key: "eyebrow", label: "Eyebrow" },
    { key: "title", label: "Heading" },
    { key: "linkLabel", label: "Link label" },
    { key: "emptyLabel", label: "Text when no report is published" },
  ],
  insights: [
    { key: "eyebrow", label: "Eyebrow" },
    { key: "title", label: "Heading" },
    { key: "body", label: "Intro text", type: "textarea" },
    { key: "linkLabel", label: "Link label" },
  ],
  cta: [
    { key: "eyebrow", label: "Eyebrow" },
    { key: "headline", label: "Headline — line 1" },
    { key: "headlineAccent", label: "Headline — gradient line" },
    { key: "body", label: "Text", type: "textarea" },
    { key: "emailPlaceholder", label: "Email field placeholder" },
    { key: "buttonLabel", label: "Button label" },
  ],
};

const COLLECTION_FIELDS: Record<CollectionKey, Field[]> = {
  nav_links: [
    { key: "label", label: "Label" },
    { key: "href", label: "Link" },
  ],
  footer_links: [
    { key: "label", label: "Label" },
    { key: "href", label: "Link" },
    { key: "external", label: "Opens in new tab", hint: "Type yes to open in a new tab." },
  ],
  client_logos: [
    { key: "name", label: "Company" },
    { key: "image", label: "Logo", type: "image" },
  ],
  verticals: [{ key: "label", label: "Sector" }],
  services_private: [
    { key: "num", label: "Number" },
    { key: "title", label: "Title" },
    { key: "desc", label: "Description", type: "textarea" },
  ],
  services_public: [
    { key: "num", label: "Number" },
    { key: "title", label: "Title" },
    { key: "desc", label: "Description", type: "textarea" },
  ],
  team: [
    { key: "name", label: "Name" },
    { key: "title", label: "Role" },
    { key: "image", label: "Photo", type: "image" },
  ],
  case_tiles: [
    { key: "tag", label: "Tag" },
    { key: "title", label: "Title", type: "textarea" },
    { key: "stat", label: "Headline number" },
    { key: "statLabel", label: "Number caption" },
  ],
  proof_points: [
    { key: "stat", label: "Number", hint: "e.g. 30+, 15m+, 8yrs+" },
    { key: "label", label: "Caption" },
  ],
  testimonials: [
    { key: "name", label: "Name" },
    { key: "role", label: "Role" },
    { key: "company", label: "Company" },
    { key: "quote", label: "Quote", type: "textarea" },
    { key: "image", label: "Photo", type: "image" },
  ],
};

const COLLECTION_LABELS: Record<CollectionKey, string> = {
  nav_links: "Menu links",
  footer_links: "Footer links",
  client_logos: "Client logos",
  verticals: "Sectors",
  services_private: "Private sector services",
  services_public: "Public sector services",
  team: "Team members",
  case_tiles: "Case study tiles",
  proof_points: "Proof points",
  testimonials: "References",
};

type Panel = { id: SectionKey; label: string; collections: CollectionKey[] };

const PANELS: Panel[] = [
  { id: "hero", label: "Hero", collections: [] },
  { id: "nav", label: "Navigation", collections: ["nav_links", "footer_links"] },
  { id: "clients", label: "Client logos", collections: ["client_logos"] },
  { id: "challenge", label: "The Challenge", collections: [] },
  { id: "services", label: "What We Do", collections: ["services_private", "services_public"] },
  { id: "verticals", label: "Sectors", collections: ["verticals"] },
  { id: "story", label: "Story", collections: [] },
  { id: "team", label: "Team", collections: ["team"] },
  { id: "evidence", label: "Evidence", collections: ["proof_points", "case_tiles"] },
  { id: "testimonials", label: "References", collections: ["testimonials"] },
  { id: "reports", label: "Reports", collections: [] },
  { id: "insights", label: "Articles", collections: [] },
  { id: "cta", label: "Closing CTA", collections: [] },
];

type Row = { data: Record<string, string>; visible: boolean };

function toStringRecord(input: Record<string, unknown>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(input)) {
    if (typeof v === "string") out[k] = v;
  }
  return out;
}

/* ── image picker ───────────────────────────────────────────── */

function ImageField({
  value,
  onChange,
}: {
  value: string;
  onChange: (next: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      onChange(await adminApi.upload(file));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="flex items-start gap-3">
      <div className="w-16 h-16 flex-shrink-0 border border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden rounded">
        {value ? (
          <img src={resolveImage(value)} alt="" className="max-w-full max-h-full object-contain" />
        ) : (
          <span className="text-[10px] text-gray-400">None</span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            className="px-3 py-1.5 text-xs font-medium border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
          >
            {busy ? "Uploading…" : value ? "Replace" : "Upload"}
          </button>
          {value && (
            <button
              type="button"
              onClick={() => onChange("")}
              className="px-3 py-1.5 text-xs text-gray-500 hover:text-red-600"
            >
              Remove
            </button>
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => void handleFile(e.target.files?.[0])}
        />
        <p className="mt-1 text-[11px] text-gray-400 truncate">
          {value.startsWith("builtin:")
            ? "Image included with the site design"
            : value || "No image selected"}
        </p>
        {error && <p className="mt-1 text-[11px] text-red-600">{error}</p>}
      </div>
    </div>
  );
}

/* ── page ───────────────────────────────────────────────────── */

export default function AdminHomepage() {
  const [active, setActive] = useState<SectionKey>("hero");
  const [sections, setSections] = useState<Record<string, Record<string, string>>>({});
  const [items, setItems] = useState<Record<string, Row[]>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    adminApi
      .getSiteContent()
      .then((stored) => {
        const nextSections: Record<string, Record<string, string>> = {};
        for (const key of Object.keys(DEFAULT_SECTIONS) as SectionKey[]) {
          nextSections[key] = { ...mergeSection(key, stored.content?.[key]) };
        }

        const nextItems: Record<string, Row[]> = {};
        for (const key of Object.keys(DEFAULT_ITEMS) as CollectionKey[]) {
          const rows = stored.items?.[key];
          nextItems[key] =
            rows && rows.length > 0
              ? rows.map((row) => ({
                  data: toStringRecord(row.data),
                  visible: row.visible !== false,
                }))
              : (DEFAULT_ITEMS[key] as Record<string, string>[]).map((data) => ({
                  data: { ...data },
                  visible: true,
                }));
        }

        setSections(nextSections);
        setItems(nextItems);
        setLoading(false);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Could not load content");
        setLoading(false);
      });
  }, []);

  const panel = useMemo(() => PANELS.find((p) => p.id === active) ?? PANELS[0], [active]);

  function setField(section: SectionKey, key: string, value: string) {
    setSections((prev) => ({ ...prev, [section]: { ...prev[section], [key]: value } }));
    setStatus("");
  }

  function updateRow(collection: CollectionKey, index: number, next: Partial<Row>) {
    setItems((prev) => ({
      ...prev,
      [collection]: prev[collection].map((row, i) =>
        i === index ? { ...row, ...next, data: { ...row.data, ...next.data } } : row,
      ),
    }));
    setStatus("");
  }

  function moveRow(collection: CollectionKey, index: number, delta: number) {
    setItems((prev) => {
      const rows = [...prev[collection]];
      const target = index + delta;
      if (target < 0 || target >= rows.length) return prev;
      [rows[index], rows[target]] = [rows[target], rows[index]];
      return { ...prev, [collection]: rows };
    });
    setStatus("");
  }

  function addRow(collection: CollectionKey) {
    const blank: Record<string, string> = {};
    for (const field of COLLECTION_FIELDS[collection]) blank[field.key] = "";
    setItems((prev) => ({
      ...prev,
      [collection]: [...prev[collection], { data: blank, visible: true }],
    }));
    setStatus("");
  }

  function removeRow(collection: CollectionKey, index: number) {
    setItems((prev) => ({
      ...prev,
      [collection]: prev[collection].filter((_, i) => i !== index),
    }));
    setStatus("");
  }

  async function handleSave() {
    setSaving(true);
    setError("");
    setStatus("");
    try {
      await adminApi.saveSection(panel.id, sections[panel.id] ?? {});
      for (const collection of panel.collections) {
        await adminApi.saveCollection(collection, items[collection] ?? []);
      }
      setStatus("Saved — refresh the homepage to see it live.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  function handleResetPanel() {
    if (!confirm(`Reset "${panel.label}" back to the original wording?`)) return;
    setSections((prev) => ({ ...prev, [panel.id]: { ...DEFAULT_SECTIONS[panel.id] } }));
    setItems((prev) => {
      const next = { ...prev };
      for (const collection of panel.collections) {
        next[collection] = (DEFAULT_ITEMS[collection] as Record<string, string>[]).map(
          (data) => ({ data: { ...data }, visible: true }),
        );
      }
      return next;
    });
    setStatus("Reset — remember to save.");
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="p-8 text-sm text-gray-400">Loading…</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto p-6 md:p-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Landing page</h1>
          <p className="text-sm text-gray-500 mt-1">
            Edit the wording and lists on the homepage. Anything you leave blank falls
            back to the original text.
          </p>
        </div>

        {/* section tabs */}
        <div className="flex flex-wrap gap-1.5 mb-8">
          {PANELS.map((p) => (
            <button
              key={p.id}
              onClick={() => {
                setActive(p.id);
                setStatus("");
                setError("");
              }}
              className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
                p.id === active
                  ? "bg-blue-600 border-blue-600 text-white font-medium"
                  : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* section fields */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <h2 className="text-sm font-bold text-gray-900 mb-5">{panel.label} — text</h2>
          <div className="space-y-4">
            {SECTION_FIELDS[panel.id].map((field) => (
              <label key={field.key} className="block">
                <span className="block text-xs font-medium text-gray-600 mb-1.5">
                  {field.label}
                </span>
                {field.type === "image" ? (
                  <ImageField
                    value={sections[panel.id]?.[field.key] ?? ""}
                    onChange={(next) => setField(panel.id, field.key, next)}
                  />
                ) : field.type === "textarea" ? (
                  <textarea
                    rows={field.key === "body" ? 6 : 3}
                    value={sections[panel.id]?.[field.key] ?? ""}
                    onChange={(e) => setField(panel.id, field.key, e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                  />
                ) : (
                  <input
                    type="text"
                    value={sections[panel.id]?.[field.key] ?? ""}
                    onChange={(e) => setField(panel.id, field.key, e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                  />
                )}
                {field.hint && (
                  <span className="block text-[11px] text-gray-400 mt-1">{field.hint}</span>
                )}
              </label>
            ))}
          </div>
        </div>

        {/* collections */}
        {panel.collections.map((collection) => (
          <div
            key={collection}
            className="bg-white border border-gray-200 rounded-lg p-6 mb-6"
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-sm font-bold text-gray-900">
                {COLLECTION_LABELS[collection]}
                <span className="ml-2 text-xs font-normal text-gray-400">
                  {items[collection]?.length ?? 0}
                </span>
              </h2>
              <button
                onClick={() => addRow(collection)}
                className="px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 rounded hover:bg-blue-100"
              >
                + Add
              </button>
            </div>

            <div className="space-y-4">
              {(items[collection] ?? []).map((row, index) => (
                <div
                  key={index}
                  className={`border rounded-lg p-4 ${
                    row.visible ? "border-gray-200" : "border-dashed border-gray-300 bg-gray-50"
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-medium text-gray-400">
                      #{index + 1}
                      {!row.visible && " — hidden"}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => moveRow(collection, index, -1)}
                        disabled={index === 0}
                        className="px-2 py-1 text-xs text-gray-500 hover:text-gray-900 disabled:opacity-30"
                        title="Move up"
                      >
                        ↑
                      </button>
                      <button
                        onClick={() => moveRow(collection, index, 1)}
                        disabled={index === (items[collection]?.length ?? 0) - 1}
                        className="px-2 py-1 text-xs text-gray-500 hover:text-gray-900 disabled:opacity-30"
                        title="Move down"
                      >
                        ↓
                      </button>
                      <button
                        onClick={() => updateRow(collection, index, { visible: !row.visible })}
                        className="px-2 py-1 text-xs text-gray-500 hover:text-gray-900"
                      >
                        {row.visible ? "Hide" : "Show"}
                      </button>
                      <button
                        onClick={() => removeRow(collection, index)}
                        className="px-2 py-1 text-xs text-gray-400 hover:text-red-600"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-3">
                    {COLLECTION_FIELDS[collection].map((field) => (
                      <label
                        key={field.key}
                        className={`block ${
                          field.type === "textarea" ? "sm:col-span-2" : ""
                        }`}
                      >
                        <span className="block text-[11px] font-medium text-gray-500 mb-1">
                          {field.label}
                        </span>
                        {field.type === "image" ? (
                          <ImageField
                            value={row.data[field.key] ?? ""}
                            onChange={(next) =>
                              updateRow(collection, index, { data: { [field.key]: next } })
                            }
                          />
                        ) : field.type === "textarea" ? (
                          <textarea
                            rows={3}
                            value={row.data[field.key] ?? ""}
                            onChange={(e) =>
                              updateRow(collection, index, {
                                data: { [field.key]: e.target.value },
                              })
                            }
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                          />
                        ) : (
                          <input
                            type="text"
                            value={row.data[field.key] ?? ""}
                            onChange={(e) =>
                              updateRow(collection, index, {
                                data: { [field.key]: e.target.value },
                              })
                            }
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                          />
                        )}
                        {field.hint && (
                          <span className="block text-[11px] text-gray-400 mt-1">
                            {field.hint}
                          </span>
                        )}
                      </label>
                    ))}
                  </div>
                </div>
              ))}

              {(items[collection]?.length ?? 0) === 0 && (
                <p className="text-xs text-gray-400 py-6 text-center border border-dashed border-gray-200 rounded">
                  Nothing here yet — the homepage will show this section empty.
                </p>
              )}
            </div>
          </div>
        ))}

        {/* save bar */}
        <div className="sticky bottom-0 -mx-6 md:-mx-10 px-6 md:px-10 py-4 bg-white/95 backdrop-blur border-t border-gray-200 flex flex-wrap items-center gap-3">
          <button
            onClick={() => void handleSave()}
            disabled={saving}
            className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? "Saving…" : `Save ${panel.label}`}
          </button>
          <button
            onClick={handleResetPanel}
            className="px-4 py-2 text-sm text-gray-500 hover:text-gray-900"
          >
            Reset to original
          </button>
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 text-sm text-gray-500 hover:text-gray-900"
          >
            View homepage ↗
          </a>
          {status && <span className="text-sm text-green-600">{status}</span>}
          {error && <span className="text-sm text-red-600">{error}</span>}
        </div>
      </div>
    </AdminLayout>
  );
}
