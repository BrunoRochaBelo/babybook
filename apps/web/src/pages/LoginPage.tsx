/**
 * Login Page - B2C
 *
 * Página de login para usuários finais.
 * Design alinhado com o app B2C (cores laranjas) e padrões de segurança do B2B.
 */

import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Loader2, AlertCircle } from "lucide-react";
import { useAuthStore } from "@/store/auth";
import { useLogin } from "@/hooks/api";
import { useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { userProfileSchema } from "@babybook/contracts";
import { ValidatedInput, validationRules } from "@/components/ValidatedInput";
import { sanitizeRedirectTo } from "@/lib/redirect";
import { BabyBookLogo } from "@/components/BabyBookLogo";
import GoogleIcon from "@/components/icons/GoogleIcon";
import MicrosoftIcon from "@/components/icons/MicrosoftIcon";
import AppleIcon from "@/components/icons/AppleIcon";
import { B2CButton } from "@/components/B2CButton";

export function LoginPage() {
  const navigate = useNavigate();
  const loginMutation = useLogin();
  const queryClient = useQueryClient();
  const login = useAuthStore((s) => s.login);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isDev = import.meta.env.DEV;
  const devEmail = import.meta.env.VITE_DEV_USER_EMAIL ?? "dev@babybook.dev";
  const devPassword = import.meta.env.VITE_DEV_USER_PASSWORD ?? "password";
  const apiBaseUrl = (
    import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000"
  ).replace(/\/+$/, "");
  const homeUrl =
    (import.meta.env.VITE_LANDINGPAGE_URL as string | undefined) ?? "/";

  const params = new URLSearchParams(window.location.search);
  const redirectTo = sanitizeRedirectTo(params.get("redirectTo"), "/jornada");



  const handleSubmit = async (e: React.FormEvent) => {
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
      navigate(redirectTo);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message || "Email ou senha inválidos");
      } else {
        setError("Email ou senha inválidos");
      }
    }
  };

  const socialProviders = [
    { provider: "google" as const, icon: <GoogleIcon className="h-5 w-5" />, label: "Google" },
    { provider: "microsoft" as const, icon: <MicrosoftIcon className="h-5 w-5" />, label: "Microsoft" },
    { provider: "apple" as const, icon: <AppleIcon className="h-5 w-5" />, label: "Apple" },
  ];

  return (
    <div
      className="app-b2c min-h-screen flex flex-col"
      style={{ backgroundColor: "var(--bb-color-bg)" }}
    >
      {/* Header */}
      <header className="p-4">
        <a href={homeUrl} rel="noreferrer">
          <BabyBookLogo variant="b2c" size="md" />
        </a>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div
            className="rounded-2xl p-6 shadow-lg"
            style={{
              backgroundColor: "var(--bb-color-surface)",
              border: "1px solid var(--bb-color-border)",
            }}
          >
            {/* Header */}
            <div className="text-center mb-8">
              <h1
                className="text-xl font-bold"
                style={{ color: "var(--bb-color-ink)" }}
              >
                Bem-vindo de volta
              </h1>
              <p
                className="text-sm mt-1"
                style={{ color: "var(--bb-color-ink-muted)" }}
              >
                Entre para continuar sua jornada
              </p>
            </div>

            {/* Error Alert */}
            {error && (
              <div
                className="mb-4 p-3 rounded-xl flex items-center gap-2 text-sm"
                style={{
                  backgroundColor: "var(--bb-color-danger-soft)",
                  color: "var(--bb-color-danger)",
                  border: "1px solid var(--bb-color-danger)",
                }}
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <p>{error}</p>
              </div>
            )}

            {/* Social Login - Compact */}
            <div className="flex justify-center gap-3 mb-4">
              {socialProviders.map(({ provider, icon, label }) => (
                <button
                  key={provider}
                  type="button"
                  onClick={() =>
                    (window.location.href = `${apiBaseUrl}/auth/${provider}/authorize?state=${encodeURIComponent(redirectTo)}`)
                  }
                  className="w-12 h-12 rounded-xl flex items-center justify-center transition-all hover:scale-105"
                  style={{
                    backgroundColor: "var(--bb-color-surface)",
                    border: "1px solid var(--bb-color-border-strong)",
                    color: "var(--bb-color-ink)",
                  }}
                  aria-label={`Entrar com ${label}`}
                  title={`Entrar com ${label}`}
                >
                  {icon}
                </button>
              ))}
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3 text-xs mb-4">
              <div
                className="flex-1 h-px"
                style={{ backgroundColor: "var(--bb-color-border)" }}
              />
              <span style={{ color: "var(--bb-color-ink-subtle)" }}>
                ou com e-mail
              </span>
              <div
                className="flex-1 h-px"
                style={{ backgroundColor: "var(--bb-color-border)" }}
              />
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-3">
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
                  className="block text-sm font-medium mb-1"
                  style={{ color: "var(--bb-color-ink)" }}
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
                    className="w-full px-3 py-2.5 rounded-xl text-sm transition-all focus:outline-none focus:ring-2 pr-10"
                    style={{
                      backgroundColor: "var(--bb-color-surface)",
                      border: "1px solid var(--bb-color-border-strong)",
                      color: "var(--bb-color-ink)",
                    }}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 opacity-60 hover:opacity-100 p-1 rounded-full hover:bg-[var(--bb-color-bg)] transition-colors"
                    style={{ color: "var(--bb-color-ink)" }}
                    aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Remember Me + Forgot */}
              <div className="flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={() => setRememberMe(!rememberMe)}
                  aria-pressed={rememberMe}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all"
                  style={{
                    backgroundColor: rememberMe
                      ? "var(--bb-color-accent-soft)"
                      : "var(--bb-color-muted)",
                    color: rememberMe
                      ? "var(--bb-color-accent)"
                      : "var(--bb-color-ink-muted)",
                  }}
                >
                  <span>Lembrar</span>
                  <div
                    className="relative w-6 h-3 rounded-full transition-colors"
                    style={{
                      backgroundColor: rememberMe
                        ? "var(--bb-color-accent)"
                        : "var(--bb-color-border-strong)",
                    }}
                  >
                    <div
                      className="absolute top-0.5 w-2 h-2 bg-white rounded-full shadow transition-transform"
                      style={{
                        transform: rememberMe ? "translateX(12px)" : "translateX(2px)",
                      }}
                    />
                  </div>
                </button>
                <Link
                  to="/forgot-password"
                  className="hover:underline font-medium"
                  style={{ color: "var(--bb-color-accent)" }}
                >
                  Esqueci a senha
                </Link>
              </div>

              {/* Dev Mode */}
              {isDev && (
                <div
                  className="rounded-lg px-3 py-2 text-xs"
                  style={{
                    backgroundColor: "var(--bb-color-muted)",
                    border: "1px dashed var(--bb-color-border-strong)",
                    color: "var(--bb-color-ink-muted)",
                  }}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span style={{ color: "var(--bb-color-ink)" }}>Dev:</span>
                    <code className="px-2 py-0.5 rounded text-xs" style={{ backgroundColor: "var(--bb-color-surface)" }}>
                      {devEmail}
                    </code>
                    <button
                      type="button"
                      className="underline"
                      style={{ color: "var(--bb-color-accent)" }}
                      onClick={() => {
                        setEmail(devEmail);
                        setPassword(devPassword);
                      }}
                    >
                      Preencher
                    </button>
                  </div>
                </div>
              )}

              {/* Submit */}
              <B2CButton
                type="submit"
                disabled={loginMutation.isPending}
                className="w-full"
                size="lg"
              >
                {loginMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  "Entrar"
                )}
              </B2CButton>
            </form>

            {/* Register */}
            <div
              className="mt-4 text-center text-xs"
              style={{ color: "var(--bb-color-ink-muted)" }}
            >
              Não tem conta?{" "}
              <Link
                to="/register"
                className="font-medium"
                style={{ color: "var(--bb-color-accent)" }}
              >
                Criar agora
              </Link>
            </div>
          </div>

          {/* Back */}
          <div className="text-center mt-4">
            <a
              href={homeUrl}
              className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg transition-all hover:opacity-80"
              style={{ color: "var(--bb-color-ink-muted)" }}
              rel="noreferrer"
            >
              ← Voltar
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}

export default LoginPage;
