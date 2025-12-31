import React from "react";
import { Lock, MoreVertical, FileText, Image as ImageIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Document } from "../hooks/useVault";

interface VaultCardProps {
  document: Document;
  onClick: () => void;
  className?: string;
  label: string;
}

export const VaultCard = ({ document, onClick, className, label }: VaultCardProps) => {
  return (
    <div
      onClick={onClick}
      className={`group relative overflow-hidden rounded-xl border transition-all duration-300 hover:shadow-lg cursor-pointer ${className}`}
      style={{
        backgroundColor: "var(--bb-color-surface)",
        borderColor: "var(--bb-color-border)",
      }}
    >
      {/* Header with Title and Secure Icon */}
      <div className="flex items-center justify-between border-b px-4 py-3" style={{ borderColor: "var(--bb-color-border)"}}>
         <div className="flex items-center gap-2">
            <div className="rounded-full p-1" style={{ backgroundColor: "var(--bb-color-accent-soft)" }}>
               <Lock className="h-3 w-3" style={{ color: "var(--bb-color-accent)" }} />
            </div>
            <span className="text-sm font-semibold" style={{ color: "var(--bb-color-ink)" }}>
               {label}
            </span>
         </div>
         <DropdownMenu>
            <DropdownMenuTrigger asChild>
               <button
                  onClick={(e) => e.stopPropagation()}
                  className="rounded-full p-1 transition-colors hover:bg-black/5"
                  style={{ 
                    color: "var(--bb-color-ink-muted)",
                    backgroundColor: "var(--bb-color-surface)"
                  }}
               >
                  <MoreVertical className="h-4 w-4" />
               </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" style={{ backgroundColor: "var(--bb-color-surface)" }}>
               <DropdownMenuItem onClick={(e) => { e.stopPropagation(); /* Download logic */ }}>
                  Baixar
               </DropdownMenuItem>
               <DropdownMenuItem
                  className="text-red-500 focus:text-red-500"
                  onClick={(e) => { e.stopPropagation(); /* Delete logic */ }}
               >
                  Excluir
               </DropdownMenuItem>
            </DropdownMenuContent>
         </DropdownMenu>
      </div>

      {/* Body with Blurred Thumbnail */}
      <div className="relative flex aspect-[1.586] w-full items-center justify-center overflow-hidden bg-gray-100 dark:bg-gray-800">
         {/* Background Patterns for "Official Document" look */}
         <div className="absolute inset-0 opacity-10" 
              style={{ backgroundImage: "radial-gradient(circle, #000 1px, transparent 1px)", backgroundSize: "10px 10px" }} 
         />
         
         {/* Blurred Content Placeholder */}
         <div className="flex flex-col items-center gap-2 opacity-50 blur-[2px] transition-all duration-500 group-hover:blur-0 group-hover:opacity-100">
            {document.type === 'pdf' ? (
                <FileText className="h-12 w-12" style={{ color: "var(--bb-color-ink-muted)" }} />
            ) : (
                <ImageIcon className="h-12 w-12" style={{ color: "var(--bb-color-ink-muted)" }} />
            )}
            <span className="text-xs font-mono uppercase tracking-widest" style={{ color: "var(--bb-color-ink-muted)" }}>
               {document.type.toUpperCase()}
            </span>
         </div>

         {/* Overlay when blurred (Secure State) */}
         <div className="absolute inset-0 flex items-center justify-center bg-white/30 backdrop-blur-sm transition-opacity duration-300 group-hover:opacity-0 dark:bg-black/30">
             <Lock className="h-8 w-8 opacity-40" style={{ color: "var(--bb-color-ink)" }} />
         </div>
      </div>
      
      {/* Footer Info */}
      <div className="flex justify-between border-t px-4 py-2 text-xs" style={{ borderColor: "var(--bb-color-border)", color: "var(--bb-color-ink-muted)" }}>
        <span>Adicionado em {new Date(document.uploadedAt).toLocaleDateString()}</span>
        <span>{document.size}</span>
      </div>
    </div>
  );
};
