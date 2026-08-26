import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { adminApi, type ReportRow } from "@/lib/admin-api";
import AdminLayout from "./layout";

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
        status === "published"
          ? "bg-green-100 text-green-700"
          : "bg-gray-100 text-gray-600"
      }`}
    >
      {status === "published" ? "Published" : "Draft"}
    </span>
  );
}

function ImageThumb({ src }: { src: string }) {
  const [err, setErr] = useState(false);
  if (!src || err) {
    return (
      <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center flex-shrink-0">
        <span className="text-gray-300 text-xs">—</span>
      </div>
    );
  }
  return (
    <img
      src={src}
      alt=""
      onError={() => setErr(true)}
      className="w-10 h-10 rounded object-cover flex-shrink-0 border border-gray-100"
    />
  );
}

export default function AdminReportsList() {
  const [, navigate] = useLocation();
  const [rows, setRows] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 4000);
  }

  async function load() {
    setLoading(true);
    try {
      const data = await adminApi.listReports();
      setRows(data);
    } catch (err) {
      if (err instanceof Error && err.message.includes("authenticated")) {
        navigate("/admin/login");
        return;
      }
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function handleDelete(row: ReportRow) {
    if (!window.confirm(`Delete "${row.title}"? This cannot be undone.`)) return;
    try {
      await adminApi.removeReport(row.id);
      showToast("Deleted successfully");
      setRows((prev) => prev.filter((r) => r.id !== row.id));
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Delete failed");
    }
  }

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Reports</h1>
            <p className="text-sm text-gray-500 mt-0.5">{rows.length} entries</p>
          </div>
          <Link
            href="/admin/reports/new"
            className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            + New Report
          </Link>
        </div>

        {loading && (
          <div className="text-center py-16 text-gray-400 text-sm">Loading…</div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
            {error}
          </div>
        )}

        {!loading && !error && rows.length === 0 && (
          <div className="text-center py-16">
            <p className="text-gray-400 text-sm mb-4">No reports yet</p>
            <Link href="/admin/reports/new" className="text-blue-600 hover:underline text-sm">
              Create your first report →
            </Link>
          </div>
        )}

        {!loading && rows.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-3 font-medium text-gray-500 w-14">Image</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Title</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Subtitle</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 w-28">Status</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500 w-28">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr
                    key={row.id}
                    className={`border-b border-gray-50 hover:bg-gray-50/50 transition-colors ${
                      i === rows.length - 1 ? "border-b-0" : ""
                    }`}
                  >
                    <td className="px-4 py-3">
                      <ImageThumb src={row.image} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900 leading-snug">{row.title}</div>
                      <div className="text-xs text-gray-400 mt-0.5 font-mono truncate max-w-xs">
                        /{row.slug}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs max-w-xs">
                      <span className="line-clamp-2">{row.subtitle || <span className="italic text-gray-300">—</span>}</span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={row.status} />
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <Link
                        href={`/admin/reports/${row.id}`}
                        className="text-blue-600 hover:text-blue-800 text-xs font-medium mr-3"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => void handleDelete(row)}
                        className="text-red-500 hover:text-red-700 text-xs font-medium"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {toast && (
        <div className="fixed bottom-6 right-6 bg-gray-900 text-white text-sm px-4 py-2.5 rounded-lg shadow-lg z-50 max-w-sm">
          {toast}
        </div>
      )}
    </AdminLayout>
  );
}
