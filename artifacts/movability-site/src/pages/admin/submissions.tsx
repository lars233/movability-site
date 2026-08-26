import { useState, useEffect } from "react";
import AdminLayout from "./layout";
import { adminApi } from "@/lib/admin-api";

type Submission = {
  id: number;
  name: string;
  email: string;
  company: string;
  country: string;
  industry: string;
  primary_objective: string;
  project_overview: string;
  created_at: string;
};

export default function AdminSubmissions() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<Submission | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/submissions", {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to load");
      const data = (await res.json()) as Submission[];
      setSubmissions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load submissions");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this submission?")) return;
    setDeleting(id);
    try {
      await adminApi.removeSubmission(id);
      setSubmissions((s) => s.filter((x) => x.id !== id));
      if (selected?.id === id) setSelected(null);
    } catch {
      alert("Failed to delete");
    } finally {
      setDeleting(null);
    }
  }

  function formatDate(dt: string) {
    try {
      return new Date(dt + "Z").toLocaleDateString("en-GB", {
        day: "numeric", month: "short", year: "numeric",
        hour: "2-digit", minute: "2-digit",
      });
    } catch {
      return dt;
    }
  }

  return (
    <AdminLayout>
      <div className="p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Form Submissions</h1>
            <p className="text-sm text-gray-500 mt-1">{submissions.length} submission{submissions.length !== 1 ? "s" : ""}</p>
          </div>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-32">
            <div className="w-6 h-6 rounded-full border-2 border-blue-200 border-t-blue-600 animate-spin" />
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-lg">{error}</div>
        )}

        {!loading && !error && submissions.length === 0 && (
          <div className="text-center py-32">
            <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <span className="text-xl">📬</span>
            </div>
            <p className="text-gray-500 text-sm">No submissions yet</p>
            <p className="text-gray-400 text-xs mt-1">Form submissions will appear here</p>
          </div>
        )}

        {!loading && !error && submissions.length > 0 && (
          <div className="flex gap-6">
            {/* List */}
            <div className="flex-1 min-w-0">
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Company</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Objective</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden xl:table-cell">Date</th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {submissions.map((s) => (
                      <tr
                        key={s.id}
                        onClick={() => setSelected(s)}
                        className={`cursor-pointer hover:bg-gray-50 transition-colors ${selected?.id === s.id ? "bg-blue-50" : ""}`}
                      >
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900">{s.name}</p>
                          <p className="text-xs text-gray-400">{s.email}</p>
                        </td>
                        <td className="px-4 py-3 text-gray-500 hidden md:table-cell">{s.company || "—"}</td>
                        <td className="px-4 py-3 hidden lg:table-cell">
                          {s.primary_objective ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700">
                              {s.primary_objective}
                            </span>
                          ) : "—"}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-400 hidden xl:table-cell whitespace-nowrap">
                          {formatDate(s.created_at)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={(e) => { e.stopPropagation(); void handleDelete(s.id); }}
                            disabled={deleting === s.id}
                            className="text-xs text-gray-400 hover:text-red-500 transition-colors px-2 py-1"
                          >
                            {deleting === s.id ? "…" : "Delete"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Detail panel */}
            {selected && (
              <div className="w-80 flex-shrink-0">
                <div className="bg-white border border-gray-200 rounded-xl p-5 sticky top-8">
                  <div className="flex items-start justify-between mb-5">
                    <div>
                      <p className="font-bold text-gray-900">{selected.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{formatDate(selected.created_at)}</p>
                    </div>
                    <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-lg leading-none">×</button>
                  </div>

                  <div className="space-y-4 text-sm">
                    <Field label="Email" value={selected.email} link={`mailto:${selected.email}`} />
                    <Field label="Company" value={selected.company} />
                    <Field label="Country" value={selected.country} />
                    <Field label="Industry" value={selected.industry} />
                    <Field label="Primary Objective" value={selected.primary_objective} />
                    {selected.project_overview && (
                      <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Project Overview</p>
                        <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{selected.project_overview}</p>
                      </div>
                    )}
                  </div>

                  <div className="mt-6 pt-4 border-t border-gray-100">
                    <a
                      href={`mailto:${selected.email}`}
                      className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-semibold text-white rounded-lg"
                      style={{ background: "#4B5CF0" }}
                    >
                      Reply by email
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

function Field({ label, value, link }: { label: string; value: string; link?: string }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">{label}</p>
      {link ? (
        <a href={link} className="text-blue-600 hover:underline">{value}</a>
      ) : (
        <p className="text-gray-700">{value}</p>
      )}
    </div>
  );
}
