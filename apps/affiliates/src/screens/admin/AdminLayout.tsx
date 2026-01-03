import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useSessionStore } from "@/session/sessionStore";
import { LayoutDashboard, Users, LogOut } from "lucide-react";

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  [
    "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium",
    isActive
      ? "bg-accent-soft text-ink"
      : "text-ink-muted hover:bg-accent-soft hover:text-ink",
  ].join(" ");

export function AdminLayout() {
  const logout = useSessionStore((s) => s.logout);
  const session = useSessionStore((s) => s.session);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-ink">
      <div className="mx-auto grid min-h-screen w-full max-w-7xl grid-cols-1 md:grid-cols-[260px_1fr]">
        <aside className="border-b border-border bg-surface p-4 md:border-b-0 md:border-r">
          <Link to="/admin" className="block rounded-lg px-2 py-2">
            <div className="text-sm text-ink-muted">Baby Book</div>
            <div className="text-lg font-semibold">Admin Afiliados</div>
          </Link>
          <nav className="mt-4 space-y-1">
            <NavLink to="/admin" end className={navLinkClass}>
              <LayoutDashboard className="h-4 w-4" /> Dashboard
            </NavLink>
            <NavLink to="/admin/affiliates" className={navLinkClass}>
              <Users className="h-4 w-4" /> Afiliados
            </NavLink>
          </nav>
          <div className="mt-6 rounded-lg border border-border bg-background p-3 text-xs text-ink-muted">
            <div className="font-medium text-ink">Sessão</div>
            <div className="mt-1 break-all">{session?.email}</div>
            <button
              className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium"
              onClick={() => {
                logout();
                navigate("/login", { replace: true });
              }}
            >
              <LogOut className="h-4 w-4" /> Sair
            </button>
          </div>
        </aside>

        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
