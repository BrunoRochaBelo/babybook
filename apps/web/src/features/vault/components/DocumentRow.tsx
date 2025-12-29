import React from "react";
import { FileText, Image, File, MoreVertical, Download, Trash2 } from "lucide-react";
import type { Document } from "../hooks/useVault";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface DocumentRowProps {
  document: Document;
}

const FileIcon = ({ type }: { type: Document["type"] }) => {
  switch (type) {
    case "pdf":
      return <FileText className="w-6 h-6" style={{ color: "var(--bb-color-danger)" }} />;
    case "image":
      return <Image className="w-6 h-6" style={{ color: "var(--bb-color-accent)" }} />;
    default:
      return <File className="w-6 h-6" style={{ color: "var(--bb-color-ink-muted)" }} />;
  }
};

export const DocumentRow = ({ document }: DocumentRowProps) => {
  return (
    <div
      className="flex items-center p-3 rounded-lg transition-colors"
      style={{ backgroundColor: "var(--bb-color-bg)" }}
    >
      <div className="flex-shrink-0 mr-4">
        <FileIcon type={document.type} />
      </div>
      <div className="flex-1 grid grid-cols-3 items-center">
        <span
          className="font-medium truncate"
          style={{ color: "var(--bb-color-ink)" }}
        >
          {document.name}
        </span>
        <span className="text-sm" style={{ color: "var(--bb-color-ink-muted)" }}>
          {new Date(document.uploadedAt).toLocaleDateString("pt-BR")}
        </span>
        <span className="text-sm" style={{ color: "var(--bb-color-ink-muted)" }}>
          {document.size}
        </span>
      </div>
      <div className="ml-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="p-2 rounded-full transition-colors"
              style={{ color: "var(--bb-color-ink-muted)" }}
            >
              <MoreVertical className="w-5 h-5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>
              <Download className="w-4 h-4 mr-2" />
              Baixar
            </DropdownMenuItem>
            <DropdownMenuItem style={{ color: "var(--bb-color-danger)" }}>
              <Trash2 className="w-4 h-4 mr-2" />
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};
