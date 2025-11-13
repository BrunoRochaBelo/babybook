import { useNavigate } from "react-router-dom";
import { User, LogOut } from "lucide-react";

export const PerfilUsuarioPage = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-serif font-bold text-[#2A2A2A] mb-6">
        Meu Perfil
      </h1>

      <div className="space-y-4">
        <div className="bg-white rounded-2xl p-6 border border-[#C9D3C2]">
          <div className="flex items-center gap-4 mb-4">
            <User className="w-8 h-8 text-[#F2995D]" />
            <div>
              <h3 className="font-semibold text-[#2A2A2A]">Dados da Conta</h3>
              <p className="text-sm text-[#C9D3C2]">Seus dados de perfil</p>
            </div>
          </div>
          <button className="text-[#F2995D] hover:underline text-sm font-semibold">
            Editar Perfil
          </button>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-[#C9D3C2]">
          <h3 className="font-semibold text-[#2A2A2A] mb-4">Guardiões</h3>
          <button className="text-[#F2995D] hover:underline text-sm font-semibold">
            Gerenciar Guardiões e Compartilhamento
          </button>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-[#C9D3C2]">
          <h3 className="font-semibold text-[#2A2A2A] mb-4">Meus Pedidos</h3>
          <button
            onClick={() => navigate("/perfil-usuario/orders")}
            className="text-[#F2995D] hover:underline text-sm font-semibold"
          >
            Ver Pedidos de Impressão
          </button>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-[#C9D3C2]">
          <h3 className="font-semibold text-[#2A2A2A] mb-4">Armazenamento</h3>
          <div className="w-full bg-[#F7F3EF] rounded-full h-2 mb-2">
            <div
              className="bg-[#F2995D] h-2 rounded-full"
              style={{ width: "75%" }}
            />
          </div>
          <p className="text-sm text-[#C9D3C2]">1.5 GB de 2 GB utilizados</p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-[#C9D3C2]">
          <h3 className="font-semibold text-[#2A2A2A] mb-4">Configurações</h3>
          <div className="space-y-2">
            <button className="block text-[#F2995D] hover:underline text-sm font-semibold">
              Notificações
            </button>
            <button className="block text-[#F2995D] hover:underline text-sm font-semibold">
              Idioma
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-[#C76A6A]/30">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-[#C76A6A] font-semibold hover:bg-red-50 px-4 py-2 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Sair da Conta
          </button>
        </div>
      </div>
    </div>
  );
};
