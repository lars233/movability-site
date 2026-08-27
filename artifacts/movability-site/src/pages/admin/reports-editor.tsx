import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useParams } from "wouter";
import ImageCropper from "@/components/image-cropper";
import { adminApi, type ReportEntry, type ReportRow } from "@/lib/admin-api";
import AdminLayout from "./layout";

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function ImageField({ value, onChange }: { value: string; onChange: (url: string) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [cropping, setCropping] = useState(false);
  const [imgError, setImgError] = useState(false);

  useEffect(() => { setImgError(false); }, [value]);

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
        Cover Image
      </label>
      {value && !imgError && (
        <div className="mb-2 relative rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
          <img src={value} alt="" onError={() => setImgError(true)} className="w-full object-cover" style={{ aspectRatio: "1.75" }} />
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
        <label className={`cursor-pointer text-sm font-medium text-blue-600 hover:text-blue-800 ${uploading ? "opacity-50 pointer-events-none" : ""}`}>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => void handleFile(e)} />
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
          <button type="button" onClick={() => onChange("")} className="text-sm text-red-500 hover:text-red-700">
            Remove
          </button>
        )}
      </div>
      {uploadError && <p className="text-xs text-red-600 mt-1">{uploadError}</p>}

      {cropping && (
        <ImageCropper
          src={value}
          aspect={1.75}
          label="how it appears on the report card"
          onCancel={() => setCropping(false)}
          onApply={handleCropped}
        />
      )}
    </div>
  );
}

export default function AdminReportsEditor() {
  const params = useParams<{ id?: string }>();
  const [, navigate] = useLocation();
  const isNew = !params.id || params.id === "new";

  const [form, setForm] = useState<ReportEntry>({
    title: "",
    slug: "",
    subtitle: "",
    image: "",
    download_url: "",
    status: "draft",
    date: new Date().toISOString().slice(0, 10),
  });
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
        .getReport(Number(params.id))
        .then((row: ReportRow) => {
          setForm({
            title: row.title,
            slug: row.slug,
            subtitle: row.subtitle,
            image: row.image,
            download_url: row.download_url,
            status: row.status,
            date: row.date ?? "",
          });
          setSlugManual(true);
          setLoading(false);
        })
        .catch((err: unknown) => {
          const msg = err instanceof Error ? err.message : "Failed to load";
          if (msg.includes("authenticated")) navigate("/admin/login");
          else { setError(msg); setLoading(false); }
        });
    }
  }, [params.id, isNew, navigate]);

  function setField<K extends keyof ReportEntry>(key: K, value: ReportEntry[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleTitleChange(title: string) {
    setField("title", title);
    if (!slugManual) setField("slug", slugify(title));
  }

  async function handleSave() {
    if (!form.title.trim()) { setError("Title is required"); return; }
    if (!form.slug.trim()) { setError("Slug is required"); return; }
    setError("");
    setSaving(true);
    try {
      if (isNew) {
        const created = await adminApi.createReport(form);
        showToast("Created successfully");
        navigate(`/admin/reports/${created.id}`);
      } else {
        await adminApi.updateReport(Number(params.id), form);
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
      <div className="p-8 max-w-4xl">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Link href="/admin/reports" className="hover:text-gray-800">Reports</Link>
          <span>/</span>
          <span className="text-gray-800">{isNew ? "New Report" : form.title || "Edit"}</span>
        </div>

        <div className="flex gap-6 items-start">
          {/* Main */}
          <div className="flex-1 min-w-0 space-y-5">
            {/* Title */}
            <input
              type="text"
              value={form.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Report title"
              className="w-full text-2xl font-semibold text-gray-900 border-0 border-b border-gray-200 pb-2 focus:outline-none focus:border-blue-500 bg-transparent placeholder-gray-300"
            />

            {/* Subtitle */}
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
                Short Description
              </label>
              <textarea
                value={form.subtitle}
                onChange={(e) => setField("subtitle", e.target.value)}
                placeholder="A brief description of the report…"
                rows={3}
                className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none leading-relaxed"
              />
            </div>

            {/* Download URL */}
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
                Download Link
              </label>
              <input
                type="url"
                value={form.download_url}
                onChange={(e) => setField("download_url", e.target.value)}
                placeholder="https://example.com/report.pdf"
                className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              />
              <p className="text-xs text-gray-400 mt-1">
                Visitors will be redirected here when they click "Download Report".
              </p>
            </div>
          </div>

          {/* Sidebar */}
          <div className="w-64 flex-shrink-0 space-y-4">
            <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
              {/* Cover Image */}
              <ImageField value={form.image} onChange={(url) => setField("image", url)} />

              {/* Status */}
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
                  Status
                </label>
                <select
                  value={form.status}
                  onChange={(e) => setField("status", e.target.value as ReportEntry["status"])}
                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </div>

              {/* Date (internal tracking only) */}
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
                  Date <span className="text-gray-300 normal-case">(internal)</span>
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
                  onChange={(e) => { setField("slug", e.target.value); setSlugManual(true); }}
                  placeholder="url-slug"
                  className="w-full text-sm font-mono border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
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

            <Link href="/admin/reports" className="block text-center text-sm text-gray-500 hover:text-gray-800">
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
