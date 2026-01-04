import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@babybook/i18n";

interface B2CBackButtonProps {
  fallback: string;
  text?: string;
  className?: string;
}

export const B2CBackButton = ({ fallback, text, className }: B2CBackButtonProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  // Verifica se há histórico interno do React Router/Browser
  const hasHistory = window.history.state && window.history.state.idx > 0;

  const handleBack = () => {
    if (hasHistory) {
      navigate(-1);
    } else {
      navigate(fallback);
    }
  };

  return (
    <button
      onClick={handleBack}
      className={cn(
        "inline-flex items-center gap-2 mb-6 p-2 -ml-2 rounded-xl text-sm font-semibold transition-colors hover:bg-[var(--bb-color-bg)]",
        className
      )}
      style={{ color: "var(--bb-color-ink-muted)" }}
    >
      <ChevronLeft className="w-5 h-5" />
      {text || t("common.back")}
    </button>
  );
};
