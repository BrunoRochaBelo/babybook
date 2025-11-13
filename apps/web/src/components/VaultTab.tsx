import { Lock, Upload } from "lucide-react";

interface VaultTabProps {
  childId: string;
}

export const VaultTab = ({ childId }: VaultTabProps) => {
  const documents = [
    { id: "birth_certificate", label: "Certidão de Nascimento", icon: "📄" },
    { id: "cpf", label: "CPF", icon: "🆔" },
    { id: "health_card", label: "Cartão SUS", icon: "🏥" },
  ];

  return (
    <div>
      <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-lg mb-6">
        <div className="flex gap-2">
          <Lock className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-blue-700">
            Estes documentos são privados e visíveis apenas para você. Nunca
            serão incluídos em álbuns impressos.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {documents.map((doc) => (
          <div
            key={doc.id}
            className="bg-white rounded-2xl p-6 border-2 border-dashed border-[#C9D3C2] text-center hover:border-[#F2995D] transition-colors"
          >
            <p className="text-4xl mb-3">{doc.icon}</p>
            <h4 className="font-semibold text-[#2A2A2A] mb-4">{doc.label}</h4>
            <button className="flex items-center justify-center gap-2 w-full bg-[#F2995D] text-white px-4 py-2 rounded-xl font-semibold hover:bg-opacity-90 transition-all">
              <Upload className="w-4 h-4" />
              Upload
            </button>
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-2xl">
        <p className="text-sm text-yellow-800">
          <strong>Segurança:</strong> Ao acessar esta seção após 5 minutos de
          inatividade, será solicitado que você se autentique novamente.
        </p>
      </div>
    </div>
  );
};
