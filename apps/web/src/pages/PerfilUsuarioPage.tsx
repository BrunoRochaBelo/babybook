import { useNavigate } from "react-router-dom";
import { User, LogOut } from "lucide-react";
import { useLogout } from "@/hooks/api";
import { useAuthStore } from "@/store/auth";

export const PerfilUsuarioPage = () => {
  const navigate = useNavigate();
  const logoutMutation = useLogout();
  const clearAuth = useAuthStore((state) => state.logout);

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
    } catch (error) {
      console.error(error);
    } finally {
      clearAuth();
      navigate("/login");
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <h1
        className="text-2xl font-serif font-bold mb-6"
        style={{ color: "var(--bb-color-ink)" }}
      >
        Meu Perfil
      </h1>

      <div className="space-y-4">
        <div
          className="rounded-2xl p-6 border"
          style={{
            backgroundColor: "var(--bb-color-surface)",
            borderColor: "var(--bb-color-border)",
          }}
        >
          <div className="flex items-center gap-4 mb-8">
            <User className="w-8 h-8" style={{ color: "var(--bb-color-accent)" }} />
            <div>
              <h3
                className="font-semibold"
                style={{ color: "var(--bb-color-ink)" }}
              >
                Dados da Conta
              </h3>
              <p
                className="text-sm"
                style={{ color: "var(--bb-color-ink-muted)" }}
              >
                Seus dados de perfil
              </p>
            </div>
          </div>
          <button
            className="hover:underline text-sm font-semibold"
            style={{ color: "var(--bb-color-accent)" }}
          >
            Editar Perfil
          </button>
        </div>

        <div
          className="rounded-2xl p-6 border"
          style={{
            backgroundColor: "var(--bb-color-surface)",
            borderColor: "var(--bb-color-border)",
          }}
        >
          <h3
            className="font-semibold mb-4"
            style={{ color: "var(--bb-color-ink)" }}
          >
            Guardiões
          </h3>
          <button
            className="hover:underline text-sm font-semibold"
            style={{ color: "var(--bb-color-accent)" }}
          >
            Gerenciar Guardiões e Compartilhamento
          </button>
        </div>

        <div
          className="rounded-2xl p-6 border"
          style={{
            backgroundColor: "var(--bb-color-surface)",
            borderColor: "var(--bb-color-border)",
          }}
        >
          <h3
            className="font-semibold mb-4"
            style={{ color: "var(--bb-color-ink)" }}
          >
            Meus Pedidos
          </h3>
          <button
            onClick={() => navigate("/perfil-usuario/orders")}
            className="hover:underline text-sm font-semibold"
            style={{ color: "var(--bb-color-accent)" }}
          >
            Ver Pedidos de Impressão
          </button>
        </div>

        <div
          className="rounded-2xl p-6 border"
          style={{
            backgroundColor: "var(--bb-color-surface)",
            borderColor: "var(--bb-color-border)",
          }}
        >
          <h3
            className="font-semibold mb-4"
            style={{ color: "var(--bb-color-ink)" }}
          >
            Armazenamento
          </h3>
          <div
            className="w-full rounded-full h-2 mb-2"
            style={{ backgroundColor: "var(--bb-color-bg)" }}
          >
            <div
              className="h-2 rounded-full"
              style={{
                backgroundColor: "var(--bb-color-accent)",
                width: "75%",
              }}
            />
          </div>
          <p className="text-sm" style={{ color: "var(--bb-color-ink-muted)" }}>
            1.5 GB de 2 GB utilizados
          </p>
        </div>

        <div
          className="rounded-2xl p-6 border"
          style={{
            backgroundColor: "var(--bb-color-surface)",
            borderColor: "var(--bb-color-border)",
          }}
        >
          <h3
            className="font-semibold mb-4"
            style={{ color: "var(--bb-color-ink)" }}
          >
            Configurações
          </h3>
          <div className="space-y-2">
            <button
              className="block hover:underline text-sm font-semibold"
              style={{ color: "var(--bb-color-accent)" }}
            >
              Notificações
            </button>
            <button
              className="block hover:underline text-sm font-semibold"
              style={{ color: "var(--bb-color-accent)" }}
            >
              Idioma
            </button>
          </div>
        </div>

        <div
          className="rounded-2xl p-6 border"
          style={{
            backgroundColor: "var(--bb-color-surface)",
            borderColor: "var(--bb-color-danger-soft)",
          }}
        >
          <button
            onClick={handleLogout}
            disabled={logoutMutation.status === "pending"}
            className="flex items-center gap-2 font-semibold px-4 py-2 rounded-lg transition-colors disabled:cursor-not-allowed disabled:opacity-60"
            style={{ color: "var(--bb-color-danger)" }}
          >
            <LogOut className="w-5 h-5" />
            Sair da Conta
          </button>
        </div>
      </div>
    </div>
  );
};
