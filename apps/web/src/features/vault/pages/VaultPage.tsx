import React, { useState } from "react";
import { ShieldCheck, Upload, FileText } from "lucide-react";
import { useVault } from "../hooks/useVault";
import { DocumentRow } from "../components/DocumentRow";
import { UploadModal } from "../components/UploadModal";

export const VaultPage = () => {
  const { data: documents = [], isLoading } = useVault();
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <ShieldCheck className="w-8 h-8 text-primary" />
        <h1 className="text-3xl font-bold text-gray-800">Cofre de Documentos</h1>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold text-gray-800">Seus Documentos Privados</h2>
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg font-semibold hover:bg-opacity-90 transition-all active:scale-95"
          >
            <Upload className="w-5 h-5" />
            Novo Documento
          </button>
        </div>

        <div className="space-y-3">
          {isLoading ? (
            <>
              <div className="h-12 bg-gray-100 rounded-lg animate-pulse" />
              <div className="h-12 bg-gray-100 rounded-lg animate-pulse" />
              <div className="h-12 bg-gray-100 rounded-lg animate-pulse" />
            </>
          ) : documents.length > 0 ? (
            documents.map((doc) => <DocumentRow key={doc.id} document={doc} />)
          ) : (
            <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-lg">
              <FileText className="w-12 h-12 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-500 mb-2">Nenhum documento no cofre</h3>
              <p className="text-sm text-gray-400">Use o botão "Novo Documento" para começar.</p>
            </div>
          )}
        </div>
      </div>

      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
      />
    </div>
  );
};
