/**
 * RequirePhotographer
 *
 * Guard de autenticação que verifica se o usuário tem role PHOTOGRAPHER.
 * Usado para proteger as rotas do Portal do Parceiro.
 */

import { Navigate, useLocation } from "react-router-dom";
import { useAuthStore } from "@/store/auth";
import { Spinner } from "@/components/ui/spinner";

interface RequirePhotographerProps {
  children: JSX.Element;
}

export function RequirePhotographer({ children }: RequirePhotographerProps) {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="py-16 flex items-center justify-center min-h-screen">
        <Spinner />
      </div>
    );
  }

  // Not authenticated - redirect to login
  if (!isAuthenticated) {
    return (
      <Navigate
        to={`/login?redirectTo=${encodeURIComponent(location.pathname)}`}
        replace
      />
    );
  }

  // Check if user has photographer or admin role
  const allowedRoles = ["photographer", "admin"];
  const userRole = user?.role;

  if (!userRole || !allowedRoles.includes(userRole)) {
    // User is authenticated but doesn't have access to partner portal
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl p-8 max-w-md text-center shadow-lg">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-red-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">
            Acesso Restrito
          </h1>
          <p className="text-gray-600 mb-6">
            O Portal do Parceiro é exclusivo para fotógrafos parceiros. Se você
            é um fotógrafo interessado em se tornar parceiro, entre em contato
            conosco.
          </p>
          <div className="flex gap-3 justify-center">
            <a
              href="/jornada"
              className="px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors"
            >
              Ir para o Baby Book
            </a>
          </div>
        </div>
      </div>
    );
  }

  return children;
}

export default RequirePhotographer;
