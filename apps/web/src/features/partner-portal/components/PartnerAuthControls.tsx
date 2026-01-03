import { ThemeSelector } from "@/components/ThemeSelector";
import { LanguageSelector } from "@/components/LanguageSelector";

interface PartnerAuthControlsProps {
  className?: string;
}

export function PartnerAuthControls({ className = "" }: PartnerAuthControlsProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <LanguageSelector variant="compact" />
      <div className="w-px h-6 bg-partner-border mx-1" />
      <ThemeSelector />
    </div>
  );
}
