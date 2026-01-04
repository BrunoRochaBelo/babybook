import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/auth";
import { useRegister } from "@/hooks/api";
import { B2CButton } from "@/components/B2CButton";
import { ValidatedInput, validationRules } from "@/components/ValidatedInput";
import { BabyBookLogo } from "@/components/BabyBookLogo";
import GoogleIcon from "@/components/icons/GoogleIcon";
import MicrosoftIcon from "@/components/icons/MicrosoftIcon";
import AppleIcon from "@/components/icons/AppleIcon";
import { sanitizeRedirectTo } from "@/lib/redirect";
import { Eye, EyeOff, Loader2, AlertCircle } from "lucide-react";

export function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const register = useRegister();
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const params = new URLSearchParams(window.location.search);
  const redirectTo = sanitizeRedirectTo(params.get("redirectTo"), "/jornada");
  const apiBaseUrl = (
    import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000"
  ).replace(/\/+$/, "");
  const homeUrl =
    (import.meta.env.VITE_LANDINGPAGE_URL as string | undefined) ?? "/";

  React.useEffect(() => {
    if (isAuthenticated) {
      navigate(redirectTo);
    }
  }, [isAuthenticated, navigate, redirectTo]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await register.mutateAsync({ email, password, name });
      const params = new URLSearchParams(window.location.search);
      const redirectTo = sanitizeRedirectTo(
        params.get("redirectTo"),
        "/jornada",
      );
      navigate(redirectTo);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Erro ao criar conta. Tente novamente.");
    }
  }

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
                Crie sua conta
              </h1>
              <p
                className="text-sm mt-1"
                style={{ color: "var(--bb-color-ink-muted)" }}
              >
                Comece a registrar momentos hoje
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
                ou cadastre com e-mail
              </span>
              <div
                className="flex-1 h-px"
                style={{ backgroundColor: "var(--bb-color-border)" }}
              />
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-3">
              <ValidatedInput
                label="Nome completo"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Seu nome"
                autoComplete="name"
                rules={[validationRules.required("Nome")]}
              />

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
                    placeholder="Min. 6 caracteres"
                    className="w-full px-3 py-2.5 rounded-xl text-sm transition-all focus:outline-none focus:ring-2 pr-10"
                    style={{
                      backgroundColor: "var(--bb-color-surface)",
                      border: "1px solid var(--bb-color-border-strong)",
                      color: "var(--bb-color-ink)",
                    }}
                    autoComplete="new-password"
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

              <B2CButton 
                type="submit" 
                disabled={register.status === "pending"}
                className="w-full"
                size="lg"
              >
                 {register.status === "pending" ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Criando conta...
                  </>
                ) : (
                  "Criar Conta"
                )}
              </B2CButton>
            </form>
            
            <div
              className="mt-4 text-center text-xs"
              style={{ color: "var(--bb-color-ink-muted)" }}
            >
              Já tem uma conta?{" "}
              <Link
                to="/login"
                className="font-medium"
                style={{ color: "var(--bb-color-accent)" }}
              >
                Entrar
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

export default RegisterPage;
