import React, { useState } from "react";
import { UploadCloud } from "lucide-react";
import {
  B2CDialog,
  B2CDialogContent,
  B2CDialogHeader,
  B2CDialogTitle,
  B2CDialogDescription,
  B2CDialogFooter,
} from "@/components/B2CDialog";
import { B2CButton } from "@/components/B2CButton";

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UploadModal = ({ isOpen, onClose }: UploadModalProps) => {
  const [files, setFiles] = useState<File[]>([]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setFiles(Array.from(event.target.files));
    }
  };

  const handleUpload = () => {
    // Handle the file upload logic here
    console.log("Uploading files:", files);
    onClose();
  };

  return (
    <B2CDialog open={isOpen} onOpenChange={onClose}>
      <B2CDialogContent>
        <B2CDialogHeader>
          <B2CDialogTitle>Carregar Novo Documento</B2CDialogTitle>
          <B2CDialogDescription>
            Faça o upload de um documento para guardar no seu cofre.
          </B2CDialogDescription>
        </B2CDialogHeader>

        <div className="py-4">
          <div className="flex items-center justify-center w-full">
            <label
              htmlFor="dropzone-file"
              className="group flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-2xl cursor-pointer transition-colors hover:border-[var(--bb-color-accent)]/50"
              style={{
                backgroundColor: "var(--bb-color-bg)",
                borderColor: "var(--bb-color-border)",
              }}
            >
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <div 
                    className="p-4 rounded-full mb-4 transition-transform group-hover:scale-110"
                    style={{ backgroundColor: "var(--bb-color-surface)" }}
                >
                    <UploadCloud
                    className="w-8 h-8"
                    style={{ color: "var(--bb-color-accent)" }}
                    />
                </div>
                <p
                  className="mb-2 text-sm font-medium"
                  style={{ color: "var(--bb-color-ink)" }}
                >
                  <span className="font-bold">Clique para carregar</span> ou
                  arraste e solte
                </p>
                <p
                  className="text-xs"
                  style={{ color: "var(--bb-color-ink-muted)" }}
                >
                  PDF, PNG, JPG (MAX. 10MB)
                </p>
              </div>
              <input
                id="dropzone-file"
                type="file"
                className="hidden"
                onChange={handleFileChange}
                multiple
              />
            </label>
          </div>
          {files.length > 0 && (
            <div className="mt-4 p-4 rounded-xl" style={{ backgroundColor: "var(--bb-color-bg)" }}>
              <h4
                className="text-sm font-bold mb-2"
                style={{ color: "var(--bb-color-ink)" }}
              >
                Arquivos selecionados ({files.length}):
              </h4>
              <ul
                className="text-sm space-y-1"
                style={{ color: "var(--bb-color-ink-muted)" }}
              >
                {files.map((file, i) => (
                  <li key={i} className="flex items-center gap-2">
                     <span className="w-1.5 h-1.5 rounded-full bg-[var(--bb-color-accent)]"/>
                     {file.name}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <B2CDialogFooter className="flex-row gap-3">
          <B2CButton 
            variant="secondary" 
            onClick={onClose}
            className="flex-1"
          >
            Cancelar
          </B2CButton>
          <B2CButton 
            onClick={handleUpload} 
            disabled={files.length === 0}
            className="flex-1"
          >
            Carregar
          </B2CButton>
        </B2CDialogFooter>
      </B2CDialogContent>
    </B2CDialog>
  );
};
