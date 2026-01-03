import * as React from "react";

import { cn } from "@/lib/utils";

export interface B2CActionBarProps
  extends React.HTMLAttributes<HTMLDivElement> {
  align?: "start" | "end";
}

/**
 * Barra de ações B2C
 *
 * Uso: abaixo de widgets (ex.: árvore) e acima de listas.
 * Objetivo: manter espaçamento/alinhamento consistentes entre telas.
 */
export const B2CActionBar = ({
  className,
  align = "end",
  children,
  ...props
}: B2CActionBarProps) => {
  return (
    <div
      className={cn(
        "mb-6 flex flex-wrap items-center gap-2",
        align === "end" ? "justify-end" : "justify-start",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
};
