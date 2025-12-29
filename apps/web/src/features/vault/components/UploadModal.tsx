import React, { useState } from "react";
import { UploadCloud } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Carregar Novo Documento</DialogTitle>
          <DialogDescription>
            Faça o upload de um documento para guardar no seu cofre.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="flex items-center justify-center w-full">
            <label
              htmlFor="dropzone-file"
              className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer transition-colors"
              style={{
                backgroundColor: "var(--bb-color-bg)",
                borderColor: "var(--bb-color-border)",
              }}
            >
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <UploadCloud
                  className="w-10 h-10 mb-4"
                  style={{ color: "var(--bb-color-ink-muted)" }}
                />
                <p
                  className="mb-2 text-sm"
                  style={{ color: "var(--bb-color-ink-muted)" }}
                >
                  <span className="font-semibold">Clique para carregar</span> ou
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
            <div className="mt-4">
              <h4
                className="font-semibold"
                style={{ color: "var(--bb-color-ink)" }}
              >
                Arquivos selecionados:
              </h4>
              <ul
                className="list-disc list-inside"
                style={{ color: "var(--bb-color-ink)" }}
              >
                {files.map((file, i) => (
                  <li key={i}>{file.name}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleUpload} disabled={files.length === 0}>
            Carregar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
