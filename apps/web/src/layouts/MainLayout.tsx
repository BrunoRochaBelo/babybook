import React from "react";
import { NavLink, Outlet } from "react-router-dom";
import { Home, BookHeart, Gift, ShieldCheck, User } from "lucide-react";

const Sidebar = () => (
  <aside className="w-64 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col">
    <div className="h-16 flex items-center justify-center border-b border-gray-200">
      <h1 className="text-2xl font-bold text-primary">BabyBook</h1>
    </div>
    <nav className="flex-1 px-4 py-6 space-y-2">
      <NavLink
        to="/dashboard"
        className={({ isActive }) =>
          `flex items-center gap-3 px-4 py-2 rounded-lg font-medium transition-colors ${
            isActive
              ? "bg-primary text-white"
              : "text-gray-600 hover:bg-gray-100"
          }`
        }
      >
        <Home className="w-5 h-5" />
        <span>Dashboard</span>
      </NavLink>
      <NavLink
        to="/momentos"
        className={({ isActive }) =>
          `flex items-center gap-3 px-4 py-2 rounded-lg font-medium transition-colors ${
            isActive
              ? "bg-primary text-white"
              : "text-gray-600 hover:bg-gray-100"
          }`
        }
      >
        <BookHeart className="w-5 h-5" />
        <span>Momentos</span>
      </NavLink>
      <NavLink
        to="/capsula"
        className={({ isActive }) =>
          `flex items-center gap-3 px-4 py-2 rounded-lg font-medium transition-colors ${
            isActive
              ? "bg-primary text-white"
              : "text-gray-600 hover:bg-gray-100"
          }`
        }
      >
        <Gift className="w-5 h-5" />
        <span>Cápsula do Tempo</span>
      </NavLink>
      <NavLink
        to="/cofre"
        className={({ isActive }) =>
          `flex items-center gap-3 px-4 py-2 rounded-lg font-medium transition-colors ${
            isActive
              ? "bg-primary text-white"
              : "text-gray-600 hover:bg-gray-100"
          }`
        }
      >
        <ShieldCheck className="w-5 h-5" />
        <span>Cofre</span>
      </NavLink>
    </nav>
    <div className="p-4 border-t border-gray-200">
      <NavLink
        to="/perfil"
        className={({ isActive }) =>
          `flex items-center gap-3 px-4 py-2 rounded-lg font-medium transition-colors ${
            isActive
              ? "bg-primary text-white"
              : "text-gray-600 hover:bg-gray-100"
          }`
        }
      >
        <User className="w-5 h-5" />
        <span>Meu Perfil</span>
      </NavLink>
    </div>
  </aside>
);

export const MainLayout = () => {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-8">
        <Outlet />
      </main>
    </div>
  );
};