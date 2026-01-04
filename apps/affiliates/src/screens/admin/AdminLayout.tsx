import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useSessionStore } from "@/session/sessionStore";
import { LayoutDashboard, Users, LogOut } from "lucide-react";

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  [
    "flex items-center gap-3 rounded-2xl px-4 py-2.5 text-sm font-bold transition-all duration-300",
    isActive
      ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/25"
      : "text-ink-secondary hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-indigo-600 dark:hover:text-indigo-400",
  ].join(" ");

export function AdminLayout() {
  const logout = useSessionStore((s) => s.logout);
  const session = useSessionStore((s) => s.session);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-50/50 via-background to-background dark:from-indigo-900/20 dark:via-background dark:to-background text-ink font-sans pb-24 md:pb-0">
      <div className="mx-auto flex flex-col md:flex-row min-h-screen w-full max-w-7xl relative">
        {/* Desktop Sidebar (Hidden on Mobile) */}
        <aside className="hidden md:flex w-[280px] p-6 sticky top-0 h-screen flex-col transform transition-transform duration-500">
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-[2.5rem] border border-white/50 dark:border-gray-700/50 p-6 shadow-xl shadow-indigo-500/5 flex flex-col h-full overflow-hidden animate-in fade-in slide-in-from-left-4 duration-700">
            <Link to="/admin" className="block mb-10 group">
              <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-600 mb-1 opacity-70 group-hover:opacity-100 transition-opacity">
                Baby Book
              </div>
              <div className="text-xl font-serif font-bold text-gray-900 dark:text-white">
                Admin <span className="text-indigo-600">Afiliados</span>
              </div>
            </Link>

            <nav className="space-y-2 flex-1">
              <NavLink to="/admin" end className={navLinkClass}>
                <LayoutDashboard className="h-4 w-4" /> Dashboard
              </NavLink>
              <NavLink to="/admin/affiliates" className={navLinkClass}>
                <Users className="h-4 w-4" /> Afiliados
              </NavLink>
            </nav>

            <div className="mt-8 pt-8 border-t border-gray-100 dark:border-gray-700/50 flex flex-col gap-4">
              <div className="px-2">
                <div className="text-[10px] font-bold uppercase tracking-widest text-ink-muted mb-1">
                  Sessão Admin
                </div>
                <div className="text-xs font-medium text-ink-secondary truncate" title={session?.email}>
                  {session?.email}
                </div>
              </div>

              <button
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 px-4 py-3 text-sm font-bold text-ink hover:bg-white dark:hover:bg-gray-800 hover:shadow-md active:scale-95 transition-all"
                onClick={() => {
                  logout();
                  navigate("/login", { replace: true });
                }}
              >
                <LogOut className="h-4 w-4" /> Sair
              </button>
            </div>
          </div>
        </aside>

        {/* Mobile Top Header (Minimal) */}
        <div className="md:hidden flex items-center justify-between p-6 pb-2">
          <div className="font-serif font-bold text-xl text-gray-900 dark:text-white">
            Admin <span className="text-indigo-600">Afiliados</span>
          </div>
          <button
            onClick={() => {
              logout();
              navigate("/login", { replace: true });
            }}
            className="p-2.5 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl border border-white/50 dark:border-gray-700/50 text-ink-muted"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>

        {/* Main Content Area */}
        <main className="flex-1 p-4 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
          <Outlet />
        </main>

        {/* Mobile Bottom Navigation */}
        <nav className="md:hidden fixed bottom-6 left-6 right-6 bg-white/90 dark:bg-gray-900/90 backdrop-blur-2xl rounded-[2.5rem] border border-white/50 dark:border-white/10 p-2 shadow-2xl shadow-indigo-500/20 flex items-center justify-around z-50 animate-in slide-in-from-bottom-10 duration-1000">
          <NavLink
            to="/admin"
            end
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 px-6 py-3 rounded-3xl transition-all duration-300 ${
                isActive
                  ? "bg-indigo-600/10 text-indigo-600 scale-110"
                  : "text-ink-muted hover:text-ink"
              }`
            }
          >
            <LayoutDashboard className="h-5 w-5" />
            <span className="text-[10px] font-bold uppercase tracking-tighter">Início</span>
          </NavLink>
          <NavLink
            to="/admin/affiliates"
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 px-6 py-3 rounded-3xl transition-all duration-300 ${
                isActive
                  ? "bg-indigo-600/10 text-indigo-600 scale-110"
                  : "text-ink-muted hover:text-ink"
              }`
            }
          >
            <Users className="h-5 w-5" />
            <span className="text-[10px] font-bold uppercase tracking-tighter">Afiliados</span>
          </NavLink>
        </nav>
      </div>
    </div>
  );
}
