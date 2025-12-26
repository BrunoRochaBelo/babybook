/**
 * Partner Login Page
 *
 * Página de login específica para fotógrafos parceiros.
 * Redireciona para o Portal do Parceiro após autenticação.
 */

import { useState, FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Camera, Eye, EyeOff, Loader2, AlertCircle, Heart } from "lucide-react";
import { useLogin } from "@/hooks/api";
import { useAuthStore } from "@/store/auth";
import { useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { userProfileSchema } from "@babybook/contracts";
import { ValidatedInput, validationRules } from "@/components/ValidatedInput";

export function PartnerLoginPage() {
  const navigate = useNavigate();
  const loginMutation = useLogin();
  const queryClient = useQueryClient();
  const login = useAuthStore((s) => s.login);
  const proUrl =
    (import.meta.env.VITE_LANDINGPAGE_PRO_URL as string | undefined) ??
    "/pro.html";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sanitizeRedirectTo = (value: string | null): string => {
    if (!value) return "/partner";
    // Permitimos apenas paths internos. Bloqueia http(s)://, // e esquemas.
    if (!value.startsWith("/")) return "/partner";
    if (value.startsWith("//")) return "/partner";
    return value;
  };

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
      // Enviamos rememberMe para o backend definir a duração do cookie de sessão
      // Boas práticas: não armazenamos credenciais no client, apenas uma flag
      await loginMutation.mutateAsync({
        email: email.trim(),
        password,
        rememberMe,
      });

      // Força refresh do cache e busca perfil usando o mesmo client (cookies + redirects + parsing)
      queryClient.removeQueries({ queryKey: ["user-profile"] });
      const profileData = await apiClient.get("/me", {
        schema: userProfileSchema,
      });
      login(profileData);

      // Navigate to redirect URL if available, otherwise go to partner portal
      const params = new URLSearchParams(window.location.search);
      const redirectTo = sanitizeRedirectTo(params.get("redirectTo"));
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
    <div className="min-h-screen bg-gradient-to-b from-pink-50 via-white to-rose-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900 flex flex-col">
      {/* Header */}
      <header className="p-4">
        <a
          href={proUrl}
          className="inline-flex items-center gap-2"
          rel="noreferrer"
        >
          <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-rose-500 rounded-xl flex items-center justify-center">
            <Heart className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold text-gray-900 dark:text-white">
            Baby Book{" "}
            <span className="text-pink-600 dark:text-pink-400">Pro</span>
          </span>
        </a>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-gray-700">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-pink-100 dark:bg-pink-900/50 rounded-full mb-4">
                <Camera className="w-8 h-8 text-pink-600 dark:text-pink-400" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Portal do Parceiro
              </h1>
              <p className="text-gray-500 dark:text-gray-400 mt-2">
                Entre na sua conta para gerenciar suas entregas
              </p>
            </div>

            {/* Error Alert */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-3 text-red-700 dark:text-red-300">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p className="text-sm">{error}</p>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <ValidatedInput
                label="E-mail"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                autoComplete="email"
                rules={[validationRules.email]}
                validateDelay={300}
              />

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
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
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors pr-12 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400"
                    aria-label={
                      showPassword ? "Ocultar senha" : "Mostrar senha"
                    }
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
                <button
                  type="button"
                  onClick={() => setRememberMe(!rememberMe)}
                  aria-pressed={rememberMe}
                  aria-label={
                    rememberMe
                      ? "Desativar lembrar de mim"
                      : "Ativar lembrar de mim"
                  }
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all
                    ${
                      rememberMe
                        ? "bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
                    }
                  `}
                >
                  <span>Lembrar de mim</span>
                  {/* Toggle indicator */}
                  <div
                    className={`
                    relative w-8 h-4 rounded-full transition-colors
                    ${rememberMe ? "bg-pink-500" : "bg-gray-300 dark:bg-gray-500"}
                  `}
                  >
                    <div
                      className={`
                      absolute top-0.5 w-3 h-3 bg-white rounded-full shadow transition-transform
                      ${rememberMe ? "translate-x-4" : "translate-x-0.5"}
                    `}
                    />
                  </div>
                </button>
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
            <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
              Ainda não tem conta?{" "}
              <Link
                to="/pro/register"
                className="text-pink-600 dark:text-pink-400 hover:text-pink-700 dark:hover:text-pink-300 font-medium"
              >
                Cadastre-se grátis
              </Link>
            </div>
          </div>

          {/* Back to Home */}
          <div className="text-center mt-6">
            <a
              href={proUrl}
              className="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-pink-600 dark:hover:text-pink-400 hover:bg-pink-50 dark:hover:bg-pink-900/20 transition-all duration-200 rounded-lg px-3 py-1.5"
              rel="noreferrer"
            >
              ← Voltar para Baby Book Pro
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}

export default PartnerLoginPage;
