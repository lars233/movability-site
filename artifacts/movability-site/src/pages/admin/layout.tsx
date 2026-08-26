import { useEffect, useState } from "react";
import { useLocation, Link } from "wouter";
import { Menu, X } from "lucide-react";
import { adminApi } from "@/lib/admin-api";
import MovabilityLogo from "@/components/movability-logo";

interface AdminLayoutProps {
  children: React.ReactNode;
}

const NAV = [
  { label: "Landing Page", href: "/admin/homepage", icon: "🏠" },
  { label: "Blog Posts", href: "/admin/blog", icon: "✍️" },
  { label: "Articles", href: "/admin/articles", icon: "📰" },
  { label: "Case Studies", href: "/admin/case-studies", icon: "📋" },
  { label: "Reports", href: "/admin/reports", icon: "📄" },
  { label: "Form Submissions", href: "/admin/submissions", icon: "📬" },
];

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [location, navigate] = useLocation();
  const [user, setUser] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    adminApi
      .me()
      .then((res) => {
        setUser(res.username);
        setChecking(false);
      })
      .catch(() => {
        navigate("/admin/login");
      });
  }, [navigate]);

  async function handleLogout() {
    await adminApi.logout().catch(() => {});
    navigate("/admin/login");
  }

  if (checking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-400 text-sm">Loading…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-30 bg-white border-b border-gray-200 h-14 flex items-center px-4 gap-3">
        <button
          onClick={() => setSidebarOpen((v) => !v)}
          className="p-1 text-gray-600"
          aria-label="Toggle menu"
        >
          {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
        <MovabilityLogo className="text-black" />
      </div>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="md:hidden fixed inset-0 z-20 bg-black/20"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`w-56 bg-white border-r border-gray-200 flex flex-col fixed inset-y-0 left-0 z-20 transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0`}
      >
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <MovabilityLogo className="text-black" />
          <button
            className="md:hidden text-gray-400 hover:text-gray-700"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={16} />
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-0.5">
          {NAV.map((item) => {
            const active =
              location === item.href || location.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                  active
                    ? "bg-blue-50 text-blue-700 font-medium"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <span>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-gray-100">
          <div className="px-3 py-2 text-xs text-gray-500 truncate mb-1">
            {user}
          </div>
          <button
            onClick={handleLogout}
            className="w-full text-left flex items-center gap-2 px-3 py-2 text-sm text-gray-500 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <span>↩</span> Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="md:ml-56 min-h-screen pt-14 md:pt-0">{children}</main>
    </div>
  );
}
