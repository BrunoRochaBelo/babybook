import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/auth";
import { useRegister } from "@/hooks/api";
import { Button } from "@/components/ui/button";
import GoogleIcon from "@/components/icons/GoogleIcon";
import MicrosoftIcon from "@/components/icons/MicrosoftIcon";
import AppleIcon from "@/components/icons/AppleIcon";

export function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const register = useRegister();
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const params = new URLSearchParams(window.location.search);
  const redirectTo = params.get("redirectTo") ?? "/jornada";
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
      await register.mutateAsync({ email, password, name });
      const params = new URLSearchParams(window.location.search);
      const redirectTo = params.get("redirectTo") || "/jornada";
      navigate(redirectTo);
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div className="p-6 max-w-md mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Cadastrar</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex gap-2 mt-6 flex-col w-full">
          <div className="flex flex-col gap-2">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() =>
                (window.location.href = `${apiBaseUrl}/auth/google/authorize?state=${encodeURIComponent(redirectTo)}`)
              }
            >
              <span className="mr-3 inline-flex items-center">
                <GoogleIcon className="h-5 w-5" />
              </span>
              Entrar com Google
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() =>
                (window.location.href = `${apiBaseUrl}/auth/microsoft/authorize?state=${encodeURIComponent(redirectTo)}`)
              }
            >
              <span className="mr-3 inline-flex items-center">
                <MicrosoftIcon className="h-5 w-5" />
              </span>
              Entrar com Microsoft
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() =>
                (window.location.href = `${apiBaseUrl}/auth/apple/authorize?state=${encodeURIComponent(redirectTo)}`)
              }
            >
              <span className="mr-3 inline-flex items-center">
                <AppleIcon className="h-5 w-5" />
              </span>
              Entrar com Apple
            </Button>
          </div>
          <div className="flex items-center gap-3 mt-4">
            <hr className="flex-1 border-border/60" />
            <span className="text-sm text-muted-foreground">ou</span>
            <hr className="flex-1 border-border/60" />
          </div>
        </div>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nome"
          className="p-3 border rounded"
        />
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="p-3 border rounded"
        />
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Senha"
          type="password"
          className="p-3 border rounded"
        />
        <Button type="submit" disabled={register.status === "pending"}>
          Criar Conta
        </Button>
      </form>
    </div>
  );
}

export default RegisterPage;
