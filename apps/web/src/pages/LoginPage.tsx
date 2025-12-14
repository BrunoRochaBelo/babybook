import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/auth";
import { useLogin } from "@/hooks/api";
import { Button } from "@/components/ui/button";
import GoogleIcon from "@/components/icons/GoogleIcon";
import MicrosoftIcon from "@/components/icons/MicrosoftIcon";
import AppleIcon from "@/components/icons/AppleIcon";
import { cn } from "@/lib/utils";
import { sanitizeRedirectTo } from "@/lib/redirect";

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const login = useLogin();
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const params = new URLSearchParams(window.location.search);
  const redirectTo = sanitizeRedirectTo(params.get("redirectTo"), "/jornada");
  const isDev = import.meta.env.DEV;
  const devEmail = import.meta.env.VITE_DEV_USER_EMAIL ?? "bruno@example.com";
  const devPassword = import.meta.env.VITE_DEV_USER_PASSWORD ?? "password";
  const apiBaseUrl = (
    import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000"
  ).replace(/\/+$/, "");

  React.useEffect(() => {
    if (isAuthenticated) {
      navigate(redirectTo);
    }
  }, [isAuthenticated, navigate, redirectTo]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await login.mutateAsync({ email, password });
      const params = new URLSearchParams(window.location.search);
      const redirectTo = sanitizeRedirectTo(
        params.get("redirectTo"),
        "/jornada",
      );
      navigate(redirectTo);
    } catch (err) {
      // TODO: show error
      console.error(err);
    }
  }

  const inputClassName =
    "w-full rounded-2xl border border-border/60 bg-white/90 px-5 py-3.5 text-base text-ink placeholder:text-ink-muted shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30";

  const socialProviders: Array<{
    label: string;
    provider: "google" | "microsoft" | "apple";
    icon: React.ReactNode;
    badgeClassName: string;
  }> = [
    {
      label: "Continuar com Google",
      provider: "google",
      icon: <GoogleIcon className="h-4 w-4" />,
      badgeClassName: "bg-[#E8F0FE] text-[#1A73E8]",
    },
    {
      label: "Continuar com Microsoft",
      provider: "microsoft",
      icon: <MicrosoftIcon className="h-4 w-4" />,
      badgeClassName: "bg-[#E7F1FD] text-[#0F6CBD]",
    },
    {
      label: "Continuar com Apple",
      provider: "apple",
      icon: <AppleIcon className="h-4 w-4" />,
      badgeClassName: "bg-[#F4F4F4] text-[#111111]",
    },
  ];

  const SocialButton = ({
    label,
    icon,
    provider,
    badgeClassName,
  }: {
    label: string;
    icon: React.ReactNode;
    provider: "google" | "microsoft" | "apple";
    badgeClassName?: string;
  }) => (
    <Button
      type="button"
      variant="outline"
      className="w-full justify-start gap-3 rounded-2xl border-border/70 bg-white/80 py-3 text-base font-medium hover:bg-white"
      onClick={() =>
        (window.location.href = `${apiBaseUrl}/auth/${provider}/authorize?state=${encodeURIComponent(redirectTo)}`)
      }
    >
      <span
        className={cn(
          "inline-flex h-9 w-9 items-center justify-center rounded-xl bg-muted text-muted-foreground",
          badgeClassName,
        )}
      >
        {icon}
      </span>
      {label}
    </Button>
  );

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#FDF9F3]">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.9),_transparent_60%),_linear-gradient(180deg,_rgba(242,153,93,0.12),_rgba(199,211,194,0.15))]" />
      <div className="absolute -top-1/3 right-0 h-[480px] w-[480px] rounded-full bg-primary/5 blur-3xl" />
      <div className="absolute bottom-0 left-0 h-[320px] w-[320px] rounded-full bg-[#C9D3C2]/30 blur-[120px]" />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-8 px-4 py-10 lg:flex-row lg:items-center">
        <section className="flex flex-1 flex-col justify-center rounded-3xl border border-white/70 bg-white/60 p-8 shadow-[0_25px_60px_rgba(242,153,93,0.15)] backdrop-blur">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1 text-sm font-semibold text-primary">
            <span className="h-2 w-2 rounded-full bg-primary" />
            Baby Book
          </div>
          <h1 className="mt-6 font-serif text-4xl text-ink">
            Um álbum vivo, privado e cheio de calma
          </h1>
          <p className="mt-4 text-lg text-ink-muted">
            Entre para continuar a jornada dos momentos mais especiais.
            Conecte-se em segundos com sua conta social favorita ou use seu
            e-mail para manter tudo protegido.
          </p>
          <dl className="mt-8 grid gap-6 sm:grid-cols-2">
            {[
              "Memórias guiadas",
              "Compartilhamento seguro",
              "Upload ilimitado",
              "Modo convidado",
            ].map((item) => (
              <div
                key={item}
                className="flex items-center gap-3 rounded-2xl border border-white/80 bg-white/70 px-4 py-3 shadow-sm"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                  ✓
                </span>
                <dt className="text-sm font-semibold text-ink">{item}</dt>
              </div>
            ))}
          </dl>
        </section>

        <section
          className="w-full max-w-xl rounded-3xl border border-white/80 bg-white/95 p-8 shadow-[0_30px_80px_rgba(42,42,42,0.12)]"
          aria-label="Formulário de login"
        >
          <div className="mb-6 space-y-2 text-center">
            <h2 className="text-3xl font-serif text-ink">Entrar</h2>
            <p className="text-sm text-ink-muted">
              Bem-vindo de volta! Escolha uma opção de login para retomar seu
              Baby Book.
            </p>
          </div>

          <div className="grid gap-3">
            {socialProviders.map((provider) => (
              <SocialButton key={provider.provider} {...provider} />
            ))}
          </div>

          <div className="my-6 flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex-1 border-t border-border/50" />
            <span>ou entre com e-mail</span>
            <div className="flex-1 border-t border-border/50" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-ink" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu melhor email"
                className={inputClassName}
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <label
                className="text-sm font-semibold text-ink"
                htmlFor="password"
              >
                Senha
              </label>
              <input
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                type="password"
                className={inputClassName}
                autoComplete="current-password"
              />
            </div>

            {isDev && (
              <div className="rounded-2xl border border-dashed border-border/80 bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-ink">Modo dev</span>
                  <code className="rounded-full bg-background px-3 py-1 text-xs font-semibold">
                    {devEmail} / {devPassword}
                  </code>
                  <button
                    type="button"
                    className="text-primary underline"
                    onClick={() => {
                      setEmail(devEmail);
                      setPassword(devPassword);
                    }}
                  >
                    Preencher automaticamente
                  </button>
                </div>
              </div>
            )}

            <Button
              type="submit"
              disabled={login.status === "pending"}
              className="w-full rounded-2xl py-4 text-base font-semibold shadow-lg shadow-primary/30"
            >
              {login.status === "pending" ? "Conectando..." : "Entrar"}
            </Button>
          </form>

          <div className="mt-6 flex flex-col gap-2 text-center text-sm">
            <a className="text-primary hover:underline" href="/forgot-password">
              Esqueceu a senha?
            </a>
            <p className="text-ink-muted">
              Ainda não tem conta?{" "}
              <a
                className="font-semibold text-primary hover:underline"
                href="/register"
              >
                Criar agora
              </a>
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}

export default LoginPage;
