import React from "react";
import { Plus } from "lucide-react";

interface VaultEmptyCardProps {
  label: string;
  helper: string;
  onClick: () => void;
}

export const VaultEmptyCard = ({ label, helper, onClick }: VaultEmptyCardProps) => {
  return (
    <button
      onClick={onClick}
      type="button"
      className="group relative flex w-full flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center transition-all duration-200 hover:border-solid hover:shadow-md active:scale-[0.99]"
      style={{
        backgroundColor: "var(--bb-color-bg)",
        borderColor: "var(--bb-color-border)",
      }}
    >
      <div
        className="mb-3 rounded-full p-3 transition-colors group-hover:bg-pink-100 dark:group-hover:bg-pink-900/30"
        style={{ color: "var(--bb-color-accent)" }}
      >
        <Plus className="h-6 w-6" />
      </div>
      
      <h3 className="mb-1 font-semibold" style={{ color: "var(--bb-color-ink)" }}>
        Adicionar {label}
      </h3>
      
      <p className="max-w-[200px] text-xs" style={{ color: "var(--bb-color-ink-muted)" }}>
        {helper}
      </p>
    </button>
  );
};
