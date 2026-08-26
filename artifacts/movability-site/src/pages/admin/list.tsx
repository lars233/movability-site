import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { adminApi, type CmsRow, type CmsType } from "@/lib/admin-api";
import { formatCategoryLabel } from "@/lib/category-format";
import AdminLayout from "./layout";

interface AdminListProps {
  type: CmsType;
}

const CONFIG = {
  blog: {
    title: "Blog Posts",
    newLabel: "New Post",
    newHref: "/admin/blog/new",
    basePath: "/admin/blog",
  },
  articles: {
    title: "Articles",
    newLabel: "New Article",
    newHref: "/admin/articles/new",
    basePath: "/admin/articles",
  },
  case_studies: {
    title: "Case Studies",
    newLabel: "New Case Study",
    newHref: "/admin/case-studies/new",
    basePath: "/admin/case-studies",
  },
};

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

export default function AdminList({ type }: AdminListProps) {
  const cfg = CONFIG[type];
  const [, navigate] = useLocation();
  const [rows, setRows] = useState<CmsRow[]>([]);
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
      const data = await adminApi.list(type);
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
  }, [type]);

  async function handleDelete(row: CmsRow) {
    if (!window.confirm(`Delete "${row.name}"? This cannot be undone.`)) return;
    try {
      await adminApi.remove(type, row.id);
      showToast("Deleted successfully");
      setRows((prev) => prev.filter((r) => r.id !== row.id));
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Delete failed");
    }
  }

  const parseCats = (raw: string): string[] => {
    try {
      return JSON.parse(raw) as string[];
    } catch {
      return [];
    }
  };

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">{cfg.title}</h1>
            <p className="text-sm text-gray-500 mt-0.5">{rows.length} entries</p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={cfg.newHref}
              className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              + {cfg.newLabel}
            </Link>
          </div>
        </div>

        {loading && (
          <div className="text-center py-16 text-gray-400 text-sm">
            Loading…
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
            {error}
          </div>
        )}

        {!loading && !error && rows.length === 0 && (
          <div className="text-center py-16">
            <p className="text-gray-400 text-sm mb-4">No entries yet</p>
            <Link
              href={cfg.newHref}
              className="text-blue-600 hover:underline text-sm"
            >
              Create your first entry →
            </Link>
          </div>
        )}

        {!loading && rows.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-3 font-medium text-gray-500 w-14">
                    Image
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">
                    Title
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 w-28">
                    Status
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 w-32">
                    Date
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">
                    Categories
                  </th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500 w-28">
                    Actions
                  </th>
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
                      <ImageThumb src={row.feature_image} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900 leading-snug line-clamp-2">
                        {row.name}
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5 font-mono truncate max-w-xs">
                        /{row.slug}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={row.status} />
                    </td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                      {row.date}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {parseCats(row.categories).map((cat) => (
                          <span
                            key={cat}
                            className="bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-full"
                          >
                            {formatCategoryLabel(cat)}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <Link
                        href={`${cfg.basePath}/${row.id}`}
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
