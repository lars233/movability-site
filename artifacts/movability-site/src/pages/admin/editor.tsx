import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useParams } from "wouter";
import { adminApi, type CmsEntry, type CmsRow, type CmsType } from "@/lib/admin-api";
import TiptapEditor from "@/components/tiptap-editor";
import AdminLayout from "./layout";
import ImageCropper from "@/components/image-cropper";

interface AdminEditorProps {
  type: CmsType;
}

const CONFIG = {
  blog: { title: "Blog Post", backHref: "/admin/blog", backLabel: "Blog Posts" },
  articles: {
    title: "Article",
    backHref: "/admin/articles",
    backLabel: "Articles",
  },
  case_studies: {
    title: "Case Study",
    backHref: "/admin/case-studies",
    backLabel: "Case Studies",
  },
};

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function parseCategories(raw: string): string[] {
  try {
    return JSON.parse(raw) as string[];
  } catch {
    return [];
  }
}

/* ── Image field component ──────────────────────────────────── */
interface ImageFieldProps {
  value: string;
  onChange: (url: string) => void;
}

function ImageField({ value, onChange }: ImageFieldProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [imgError, setImgError] = useState(false);
  const [cropping, setCropping] = useState(false);

  // Reset imgError whenever value changes
  useEffect(() => {
    setImgError(false);
  }, [value]);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError("");
    setUploading(true);
    try {
      const url = await adminApi.upload(file);
      onChange(url);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function handleCropped(file: File) {
    setUploadError("");
    setUploading(true);
    try {
      onChange(await adminApi.uploadFile(file));
      setCropping(false);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
        Feature Image
      </label>

      {value && !imgError && (
        <div className="mb-2 relative rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
          <img
            src={value}
            alt=""
            onError={() => setImgError(true)}
            className="w-full object-cover"
            style={{ aspectRatio: "1.6" }}
          />
        </div>
      )}

      {value && imgError && (
        <div className="mb-2 rounded-lg border border-dashed border-gray-300 bg-gray-50 h-20 flex items-center justify-center text-xs text-gray-400">
          Image failed to load
        </div>
      )}

      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Paste image URL…"
        className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
      />

      <div className="flex items-center gap-3">
        <label
          className={`cursor-pointer text-sm font-medium text-blue-600 hover:text-blue-800 ${
            uploading ? "opacity-50 pointer-events-none" : ""
          }`}
        >
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => void handleFile(e)}
          />
          {uploading ? "Uploading…" : "↑ Upload file"}
        </label>

        {value && !imgError && (
          <button
            type="button"
            onClick={() => setCropping(true)}
            className="text-sm font-medium text-blue-600 hover:text-blue-800"
          >
            ⌗ Adjust crop
          </button>
        )}

        {value && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="text-sm text-red-500 hover:text-red-700"
          >
            Remove
          </button>
        )}
      </div>

      {uploadError && (
        <p className="text-xs text-red-600 mt-1">{uploadError}</p>
      )}

      {cropping && (
        <ImageCropper
          src={value}
          aspect={1.6}
          label="how it appears in the list"
          onCancel={() => setCropping(false)}
          onApply={handleCropped}
        />
      )}
    </div>
  );
}

/* ── Main editor page ───────────────────────────────────────── */
export default function AdminEditor({ type }: AdminEditorProps) {
  const cfg = CONFIG[type];
  const params = useParams<{ id?: string }>();
  const [, navigate] = useLocation();
  const isNew = !params.id || params.id === "new";

  const [form, setForm] = useState<CmsEntry>({
    name: "",
    slug: "",
    status: "draft",
    date: new Date().toISOString().slice(0, 10),
    categories: "[]",
    content: "",
    feature_image: "",
    external_url: "",
  });
  const [cats, setCats] = useState<string[]>([]);
  const [catInput, setCatInput] = useState("");
  const [slugManual, setSlugManual] = useState(false);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  }

  useEffect(() => {
    if (!isNew && params.id) {
      adminApi
        .get(type, Number(params.id))
        .then((row: CmsRow) => {
          setForm({
            name: row.name,
            slug: row.slug,
            status: row.status,
            date: row.date,
            categories: row.categories,
            content: row.content,
            external_url: row.external_url ?? "",
            feature_image: row.feature_image ?? "",
          });
          setCats(parseCategories(row.categories));
          setSlugManual(true);
          setLoading(false);
        })
        .catch((err: unknown) => {
          const msg = err instanceof Error ? err.message : "Failed to load";
          if (msg.includes("authenticated")) navigate("/admin/login");
          else {
            setError(msg);
            setLoading(false);
          }
        });
    }
  }, [type, params.id, isNew, navigate]);

  function setField<K extends keyof CmsEntry>(key: K, value: CmsEntry[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleNameChange(name: string) {
    setField("name", name);
    if (!slugManual) setField("slug", slugify(name));
  }

  function handleSlugChange(slug: string) {
    setField("slug", slug);
    setSlugManual(true);
  }

  function addCategory() {
    const val = catInput.trim();
    if (!val || cats.includes(val)) {
      setCatInput("");
      return;
    }
    const next = [...cats, val];
    setCats(next);
    setField("categories", JSON.stringify(next));
    setCatInput("");
  }

  function removeCategory(cat: string) {
    const next = cats.filter((c) => c !== cat);
    setCats(next);
    setField("categories", JSON.stringify(next));
  }

  async function handleSave() {
    if (!form.name.trim()) {
      setError("Title is required");
      return;
    }
    if (!form.slug.trim()) {
      setError("Slug is required");
      return;
    }
    setError("");
    setSaving(true);
    try {
      if (isNew) {
        const created = await adminApi.create(type, form);
        showToast("Created successfully");
        navigate(`${cfg.backHref}/${created.id}`);
      } else {
        await adminApi.update(type, Number(params.id), form);
        showToast("Saved successfully");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="p-8 text-center text-gray-400 text-sm">Loading…</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-8 max-w-5xl">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Link href={cfg.backHref} className="hover:text-gray-800">
            {cfg.backLabel}
          </Link>
          <span>/</span>
          <span className="text-gray-800">
            {isNew ? `New ${cfg.title}` : form.name || "Edit"}
          </span>
        </div>

        <div className="flex gap-6 items-start">
          {/* Main content area */}
          <div className="flex-1 min-w-0 space-y-5">
            <input
              type="text"
              value={form.name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Title"
              className="w-full text-2xl font-semibold text-gray-900 border-0 border-b border-gray-200 pb-2 focus:outline-none focus:border-blue-500 bg-transparent placeholder-gray-300"
            />

            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
                Content
              </label>
              <TiptapEditor
                value={form.content}
                onChange={(html) => setField("content", html)}
                placeholder="Start writing your content…"
              />
            </div>
          </div>

          {/* Settings sidebar */}
          <div className="w-64 flex-shrink-0 space-y-4">
            <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
              {/* Feature Image */}
              <ImageField
                value={form.feature_image}
                onChange={(url) => setField("feature_image", url)}
              />

              {/* Published elsewhere */}
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
                  Published elsewhere
                </label>
                <input
                  type="url"
                  value={form.external_url}
                  onChange={(e) => setField("external_url", e.target.value)}
                  placeholder="https://zagdaily.com/…"
                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-[11px] text-gray-400 mt-1.5 leading-snug">
                  {form.external_url.trim()
                    ? "This piece will open on the other site. The body text below is not shown, so it can stay empty."
                    : "Leave empty for interviews hosted on movability.io. Add a link and the site opens that page instead."}
                </p>
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
                  Status
                </label>
                <select
                  value={form.status}
                  onChange={(e) =>
                    setField("status", e.target.value as CmsEntry["status"])
                  }
                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </div>

              {/* Date */}
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
                  Date
                </label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setField("date", e.target.value)}
                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Slug */}
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
                  Slug
                </label>
                <input
                  type="text"
                  value={form.slug}
                  onChange={(e) => handleSlugChange(e.target.value)}
                  placeholder="url-slug"
                  className="w-full text-sm font-mono border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Categories */}
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
                  Categories
                </label>
                <div className="flex flex-wrap gap-1 mb-2">
                  {cats.map((cat) => (
                    <span
                      key={cat}
                      className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-full"
                    >
                      {cat}
                      <button
                        type="button"
                        onClick={() => removeCategory(cat)}
                        className="hover:text-blue-900 leading-none"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <input
                  type="text"
                  value={catInput}
                  onChange={(e) => setCatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === ",") {
                      e.preventDefault();
                      addCategory();
                    }
                  }}
                  placeholder="Add tag, press Enter"
                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg px-3 py-2.5">
                {error}
              </div>
            )}

            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={saving}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-medium py-2.5 px-4 rounded-lg text-sm transition-colors"
            >
              {saving ? "Saving…" : isNew ? "Create" : "Save changes"}
            </button>

            <Link
              href={cfg.backHref}
              className="block text-center text-sm text-gray-500 hover:text-gray-800"
            >
              Cancel
            </Link>
          </div>
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-6 right-6 bg-gray-900 text-white text-sm px-4 py-2.5 rounded-lg shadow-lg z-50">
          {toast}
        </div>
      )}
    </AdminLayout>
  );
}
