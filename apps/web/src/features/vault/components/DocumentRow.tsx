import React from "react";
import { FileText, Image, File, MoreVertical, Download, Trash2 } from "lucide-react";
import type { Document } from "../hooks/useVault";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"; // Assuming a UI library like shadcn/ui

interface DocumentRowProps {
  document: Document;
}

const fileIcons = {
  pdf: <FileText className="w-6 h-6 text-red-500" />,
  image: <Image className="w-6 h-6 text-blue-500" />,
  other: <File className="w-6 h-6 text-gray-500" />,
};

export const DocumentRow = ({ document }: DocumentRowProps) => {
  return (
    <div className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
      <div className="flex-shrink-0 mr-4">{fileIcons[document.type]}</div>
      <div className="flex-1 grid grid-cols-3 items-center">
        <span className="font-medium text-gray-800 truncate">{document.name}</span>
        <span className="text-sm text-gray-500">{new Date(document.uploadedAt).toLocaleDateString("pt-BR")}</span>
        <span className="text-sm text-gray-500">{document.size}</span>
      </div>
      <div className="ml-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="p-2 rounded-full hover:bg-gray-200">
              <MoreVertical className="w-5 h-5 text-gray-600" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>
              <Download className="w-4 h-4 mr-2" />
              Baixar
            </DropdownMenuItem>
            <DropdownMenuItem className="text-red-600">
              <Trash2 className="w-4 h-4 mr-2" />
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};
