/**
 * Partner Login Page
 *
 * Página de login específica para fotógrafos parceiros.
 * Redireciona para o Portal do Parceiro após autenticação.
 */

import { useState, FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Camera, Eye, EyeOff, Loader2, AlertCircle, Heart } from "lucide-react";
import { useLogin, useUserProfile } from "@/hooks/api";
import { useAuthStore } from "@/store/auth";
import { useQueryClient } from "@tanstack/react-query";

export function PartnerLoginPage() {
  const navigate = useNavigate();
  const loginMutation = useLogin();
  const queryClient = useQueryClient();
  const login = useAuthStore((s) => s.login);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError("Informe seu e-mail");
      return;
    }
    if (!password) {
      setError("Informe sua senha");
      return;
    }

    try {
      await loginMutation.mutateAsync({ email: email.trim(), password });
      
      // Force refetch user profile from mock/API to get correct role
      const profileData = await queryClient.fetchQuery({
        queryKey: ["user-profile"],
        queryFn: async () => {
          // Use the API path - MSW intercepts /api/me
          const response = await fetch("/api/me", {
            credentials: "include",
          });
          if (!response.ok) throw new Error("Failed to fetch profile");
          return response.json();
        },
        staleTime: 0, // Force fresh fetch
      });
      
      // Update auth store with the fetched profile
      if (profileData) {
        login({
          id: profileData.id,
          email: profileData.email,
          name: profileData.name,
          locale: profileData.locale ?? "pt-BR",
          role: profileData.role ?? "owner",
          hasPurchased: profileData.has_purchased ?? false,
          onboardingCompleted: profileData.onboarding_completed ?? false,
        });
      }
      
      // Navigate to redirect URL if available, otherwise go to partner portal
      const params = new URLSearchParams(window.location.search);
      const redirectTo = params.get("redirectTo") ?? "/partner";
      navigate(redirectTo);
    } catch (err) {
      if (err instanceof Error) {
        if (err.message.includes("photographer")) {
          setError(
            "Sua conta não é uma conta de parceiro. Entre em contato com o suporte.",
          );
        } else {
          setError(err.message || "Email ou senha inválidos");
        }
      } else {
        setError("Email ou senha inválidos");
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 via-white to-rose-50 flex flex-col">
      {/* Header */}
      <header className="p-4">
        <Link to="/pro" className="inline-flex items-center gap-2">
          <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-rose-500 rounded-xl flex items-center justify-center">
            <Heart className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold text-gray-900">
            Baby Book <span className="text-pink-600">Pro</span>
          </span>
        </Link>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-pink-100 rounded-full mb-4">
                <Camera className="w-8 h-8 text-pink-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">
                Portal do Parceiro
              </h1>
              <p className="text-gray-500 mt-2">
                Entre na sua conta para gerenciar suas entregas
              </p>
            </div>

            {/* Error Alert */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p className="text-sm">{error}</p>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  E-mail
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors"
                  autoComplete="email"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Senha
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors pr-12"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-gray-300 text-pink-500 focus:ring-pink-500"
                  />
                  <span className="text-gray-600">Lembrar de mim</span>
                </label>
                <Link
                  to="/forgot-password"
                  className="text-pink-600 hover:text-pink-700 font-medium"
                >
                  Esqueci minha senha
                </Link>
              </div>

              <button
                type="submit"
                disabled={loginMutation.isPending}
                className="w-full py-3 px-4 bg-pink-500 text-white font-medium rounded-xl hover:bg-pink-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loginMutation.isPending ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  "Entrar"
                )}
              </button>
            </form>

            {/* Register Link */}
            <div className="mt-6 text-center text-sm text-gray-600">
              Ainda não tem conta?{" "}
              <Link
                to="/pro/register"
                className="text-pink-600 hover:text-pink-700 font-medium"
              >
                Cadastre-se grátis
              </Link>
            </div>
          </div>

          {/* Back to Home */}
          <div className="text-center mt-6">
            <Link
              to="/pro"
              className="text-gray-500 hover:text-gray-700 text-sm"
            >
              ← Voltar para Baby Book Pro
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

export default PartnerLoginPage;
