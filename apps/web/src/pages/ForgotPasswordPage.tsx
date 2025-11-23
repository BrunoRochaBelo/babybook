import React, { useState } from "react";
import { useForgotPassword } from "@/hooks/api";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const forgot = useForgotPassword();
  const navigate = useNavigate();
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await forgot.mutateAsync({ email });
      setSubmitted(true);
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div className="p-6 max-w-md mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Recuperar senha</h1>
      {!submitted ? (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            Informe o e-mail da conta e enviaremos instruções para redefinir a
            senha.
          </p>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="p-3 border rounded"
          />
          <div className="flex justify-between items-center">
            <Button type="submit" disabled={forgot.status === "pending"}>
              Enviar instruções
            </Button>
            <Button variant="link" size="sm" onClick={() => navigate(-1)}>
              Voltar
            </Button>
          </div>
        </form>
      ) : (
        <div className="text-center">
          <p className="mb-4">
            Se existir uma conta com esse email, você receberá instruções para
            redefinir sua senha.
          </p>
          <Button onClick={() => navigate("/login")} variant="secondary">
            Ir para o login
          </Button>
        </div>
      )}
    </div>
  );
}

export default ForgotPasswordPage;
