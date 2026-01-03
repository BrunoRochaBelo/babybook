import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AlertCircle, Eye, EyeOff, Loader2 } from "lucide-react";
import { Card } from "@babybook/ui";
import { apiFetch } from "@/lib/api";
import { useSessionStore } from "@/session/sessionStore";
import { sanitizeRedirectTo } from "@/lib/redirect";

type LoginResponse = {
  role: "company_admin" | "affiliate";
  email: string;
  affiliate_id: string | null;
};

export function LoginPage() {
  const [email, setEmail] = useState("admin@babybook.dev");
  const [password, setPassword] = useState("admin123");
  const [role, setRole] = useState<LoginResponse["role"]>("company_admin");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const setSession = useSessionStore((s) => s.setSession);
  const navigate = useNavigate();

  const isDev = import.meta.env.DEV || import.meta.env.MODE === "test";

  const params = useMemo(() => new URLSearchParams(window.location.search), []);
  const redirectTo = sanitizeRedirectTo(
    params.get("redirectTo"),
    role === "company_admin" ? "/admin" : "/affiliate",
  );

  useEffect(() => {
    // Ajusta credenciais sugeridas quando o usuário troca o perfil.
    if (role === "company_admin") {
      setEmail("admin@babybook.dev");
      setPassword("admin123");
    } else {
      setEmail("alice@influ.dev");
      setPassword("affiliate123");
    }
  }, [role]);

  const devCredentials = useMemo(
    () =>
      role === "company_admin"
        ? {
            email: "admin@babybook.dev",
            password: "admin123",
          }
        : {
            email: "alice@influ.dev",
            password: "affiliate123",
          },
    [role],
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !normalizedEmail.includes("@")) {
      setError("Informe um e-mail válido");
      return;
    }
    if (!password) {
      setError("Informe sua senha");
      return;
    }

    setLoading(true);
    try {
      const data = await apiFetch<LoginResponse>("/auth/login", {
        method: "POST",
        body: { email: normalizedEmail, password, role },
      });

      setSession({
        role: data.role,
        email: data.email,
        affiliateId: data.affiliate_id,
      });

      // Evita open redirect e mantém navegação interna
      navigate(redirectTo, { replace: true });
    } catch (err) {
      if (err && typeof err === "object" && "status" in err) {
        const status = (err as { status?: number }).status;
        if (status === 401) {
          setError("E-mail ou senha inválidos");
        } else if (typeof status === "number" && status >= 500) {
          setError("Serviço indisponível no momento. Tente novamente.");
        } else {
          setError("Falha ao entrar. Tente novamente.");
        }
      } else {
        setError("Falha ao entrar. Tente novamente.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background text-ink">
      <div className="mx-auto flex min-h-screen w-full max-w-5xl items-center justify-center p-6">
        <div className="grid w-full grid-cols-1 gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <div>
              <p className="text-xs font-semibold tracking-widest text-ink-muted">
                BABY BOOK
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight">
                Portal de Afiliados
              </h1>
              <p className="mt-3 text-ink-muted">
                Acompanhe vendas, comissão e repasses. A empresa gerencia o
                programa; o afiliado acompanha sua performance.
              </p>
            </div>

            {isDev && (
              <div className="rounded-xl border border-border bg-surface p-4 text-sm text-ink-muted">
                <p className="font-medium text-ink">
                  Credenciais de dev (mock)
                </p>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  <li>Admin: admin@babybook.dev / admin123</li>
                  <li>Afiliado: alice@influ.dev / affiliate123</li>
                </ul>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    className="rounded-lg border border-border bg-muted px-2 py-1 text-xs text-ink hover:opacity-90"
                    onClick={() => {
                      setEmail(devCredentials.email);
                      setPassword(devCredentials.password);
                    }}
                  >
                    Preencher ({role === "company_admin" ? "Admin" : "Afiliado"}
                    )
                  </button>
                  <span className="text-xs">•</span>
                  <span className="text-xs">
                    Dica: se o login falhar após mudanças, limpe o storage.
                  </span>
                </div>
              </div>
            )}
          </div>

          <Card title="Entrar" description="Admin da empresa ou Afiliado">
            <form className="space-y-4" onSubmit={onSubmit}>
              {error && (
                <div
                  className="rounded-xl border p-3 text-sm"
                  style={{
                    backgroundColor: "var(--bb-color-danger-soft)",
                    borderColor: "var(--bb-color-danger)",
                    color: "var(--bb-color-danger)",
                  }}
                >
                  <div className="flex items-start gap-2">
                    <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                    <p>{error}</p>
                  </div>
                </div>
              )}

              <label className="block">
                <span className="text-sm font-medium text-ink">Perfil</span>
                <select
                  className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2"
                  value={role}
                  onChange={(e) =>
                    setRole(e.target.value as LoginResponse["role"])
                  }
                >
                  <option value="company_admin">Empresa (Admin)</option>
                  <option value="affiliate">Afiliado</option>
                </select>
              </label>

              <label className="block">
                <span className="text-sm font-medium text-ink">Email</span>
                <input
                  className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  inputMode="email"
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium text-ink">Senha</span>
                <div className="relative mt-1">
                  <input
                    type={showPassword ? "text" : "password"}
                    className="w-full rounded-lg border border-border bg-surface px-3 py-2 pr-10"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-ink-muted hover:text-ink"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={
                      showPassword ? "Ocultar senha" : "Mostrar senha"
                    }
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </label>

              <button
                type="submit"
                disabled={loading}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-3 py-2 font-medium text-white hover:opacity-95 disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Entrando…
                  </>
                ) : (
                  "Entrar"
                )}
              </button>

              <div className="flex items-center justify-between text-xs text-ink-muted">
                <span>Ao entrar, você aceita os termos do programa.</span>
                <Link className="underline" to="/login">
                  Ajuda
                </Link>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
