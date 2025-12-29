"use client";

import * as React from "react";
import { Drawer as DrawerPrimitive } from "vaul";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";

// Hook para detectar mobile
function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const checkIsMobile = () => setIsMobile(window.innerWidth < breakpoint);
    checkIsMobile();
    window.addEventListener("resize", checkIsMobile);
    return () => window.removeEventListener("resize", checkIsMobile);
  }, [breakpoint]);

  return isMobile;
}

// Context para passar direção aos componentes filhos
const DrawerContext = React.createContext<{
  direction: "top" | "bottom" | "left" | "right";
}>({ direction: "bottom" });

// ─────────────────────────────────────────────────────────────────────────────
// Drawer Root - Responsivo (bottom em mobile, right em desktop)
// ─────────────────────────────────────────────────────────────────────────────

interface DrawerProps {
  /**
   * Direção fixa do drawer. Se não fornecido, usa responsivo:
   * - Mobile: "bottom" (sheet)
   * - Desktop: "right" (sidebar)
   */
  direction?: "top" | "bottom" | "left" | "right" | "responsive";
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

function Drawer({
  direction = "responsive",
  open,
  onOpenChange,
  children,
}: DrawerProps) {
  const isMobile = useIsMobile();

  const resolvedDirection =
    direction === "responsive"
      ? isMobile
        ? "bottom"
        : "right"
      : direction;

  return (
    <DrawerContext.Provider value={{ direction: resolvedDirection }}>
      <DrawerPrimitive.Root
        direction={resolvedDirection}
        open={open}
        onOpenChange={onOpenChange}
      >
        {children}
      </DrawerPrimitive.Root>
    </DrawerContext.Provider>
  );
}

const DrawerTrigger = DrawerPrimitive.Trigger;

const DrawerPortal = DrawerPrimitive.Portal;

const DrawerClose = DrawerPrimitive.Close;

// ─────────────────────────────────────────────────────────────────────────────
// Overlay
// ─────────────────────────────────────────────────────────────────────────────

const DrawerOverlay = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 backdrop-blur-sm",
      className
    )}
    style={{ backgroundColor: "rgba(42, 42, 42, 0.5)" }}
    {...props}
  />
));
DrawerOverlay.displayName = "DrawerOverlay";

// ─────────────────────────────────────────────────────────────────────────────
// Content - Estilizado por direção
// ─────────────────────────────────────────────────────────────────────────────

const DrawerContent = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Content>
>(({ className, children, ...props }, ref) => {
  const { direction } = React.useContext(DrawerContext);

  const isHorizontal = direction === "left" || direction === "right";
  const isBottom = direction === "bottom";

  return (
    <DrawerPortal>
      <DrawerOverlay />
      <DrawerPrimitive.Content
        ref={ref}
        className={cn(
          "fixed z-50 flex flex-col shadow-2xl",
          // Posição baseada na direção
          isHorizontal && [
            "top-0 h-full w-full max-w-md",
            direction === "right" && "right-0 rounded-l-2xl border-l",
            direction === "left" && "left-0 rounded-r-2xl border-r",
          ],
          isBottom && [
            "bottom-0 left-0 right-0",
            "max-h-[96vh] rounded-t-2xl border-t",
          ],
          direction === "top" && [
            "top-0 left-0 right-0",
            "max-h-[96vh] rounded-b-2xl border-b",
          ],
          // Cores padrão Tailwind (B2B usa isso, B2C sobrescreve via className)
          "bg-white dark:bg-gray-900",
          "border-gray-200 dark:border-gray-700",
          className
        )}
        {...props}
      >
        {/* Handle para arrastar (apenas bottom sheet) */}
        {isBottom && (
          <div className="mx-auto mt-4 h-1.5 w-12 shrink-0 rounded-full bg-gray-300 dark:bg-gray-600" />
        )}
        {children}
      </DrawerPrimitive.Content>
    </DrawerPortal>
  );
});
DrawerContent.displayName = "DrawerContent";

// ─────────────────────────────────────────────────────────────────────────────
// Header
// ─────────────────────────────────────────────────────────────────────────────

const DrawerHeader = ({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => {
  const { direction } = React.useContext(DrawerContext);
  const isHorizontal = direction === "left" || direction === "right";

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4 px-4 py-4",
        isHorizontal && "border-b border-gray-200 dark:border-gray-700",
        className
      )}
      {...props}
    >
      <div className="flex-1 min-w-0">{children}</div>
      <DrawerClose
        className="shrink-0 rounded-lg p-2 transition-colors text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
        aria-label="Fechar"
      >
        <X className="h-5 w-5" />
      </DrawerClose>
    </div>
  );
};
DrawerHeader.displayName = "DrawerHeader";

// ─────────────────────────────────────────────────────────────────────────────
// Footer
// ─────────────────────────────────────────────────────────────────────────────

const DrawerFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "mt-auto flex flex-col gap-2 p-4",
      "border-t border-gray-200 dark:border-gray-700",
      "bg-gray-50 dark:bg-gray-800",
      className
    )}
    {...props}
  />
);
DrawerFooter.displayName = "DrawerFooter";

// ─────────────────────────────────────────────────────────────────────────────
// Title & Description
// ─────────────────────────────────────────────────────────────────────────────

const DrawerTitle = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Title
    ref={ref}
    className={cn(
      "text-lg font-semibold",
      className
    )}
    style={{ color: "var(--bb-color-ink)" }}
    {...props}
  />
));
DrawerTitle.displayName = "DrawerTitle";

const DrawerDescription = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Description
    ref={ref}
    className={cn("text-sm", className)}
    style={{ color: "var(--bb-color-ink-muted)" }}
    {...props}
  />
));
DrawerDescription.displayName = "DrawerDescription";

// ─────────────────────────────────────────────────────────────────────────────
// Body (área de scroll)
// ─────────────────────────────────────────────────────────────────────────────

const DrawerBody = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex-1 overflow-y-auto overscroll-contain px-4 py-4",
      className
    )}
    {...props}
  />
);
DrawerBody.displayName = "DrawerBody";

export {
  Drawer,
  DrawerPortal,
  DrawerOverlay,
  DrawerTrigger,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
  useIsMobile,
};
