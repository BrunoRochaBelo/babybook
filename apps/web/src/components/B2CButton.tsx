import * as React from "react";

import { cn } from "@/lib/utils";
import {
  B2C_BUTTON_SIZE_CLASSES,
  type B2CButtonSize,
} from "@/designTokens/b2cButton";

type B2CButtonVariant = "primary" | "secondary";

export interface B2CButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: B2CButtonVariant;
  size?: B2CButtonSize;
  /**
   * Microinterações:
   * - ripple: animação visual no toque/clique
   * - haptics: vibração leve em mobile web (quando suportado)
   */
  ripple?: boolean;
  haptics?: boolean;
}

function supportsCoarsePointer(): boolean {
  if (typeof window === "undefined") return false;
  try {
    if (typeof window.matchMedia !== "function") return false;
    return window.matchMedia("(pointer: coarse)").matches;
  } catch (_err) {
    return false;
  }
}

function triggerHaptics() {
  if (typeof navigator === "undefined") return;
  // Vibração curtinha, estilo "tap".
  if (typeof navigator.vibrate === "function") {
    navigator.vibrate(10);
  }
}

function addRipple(
  button: HTMLButtonElement,
  event: React.PointerEvent<HTMLButtonElement>,
  color: string,
) {
  const rect = button.getBoundingClientRect();

  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;

  const size = Math.max(rect.width, rect.height) * 2;

  const ripple = document.createElement("span");
  ripple.className = "bb-ripple";
  ripple.style.left = `${x}px`;
  ripple.style.top = `${y}px`;
  ripple.style.width = `${size}px`;
  ripple.style.height = `${size}px`;
  ripple.style.background = color;

  button.appendChild(ripple);

  window.setTimeout(() => {
    ripple.remove();
  }, 520);
}

export const B2CButton = React.forwardRef<HTMLButtonElement, B2CButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      ripple = true,
      haptics = true,
      onPointerDown,
      disabled,
      children,
      ...props
    },
    ref,
  ) => {
    const localRef = React.useRef<HTMLButtonElement | null>(null);

    const setRefs = (node: HTMLButtonElement | null) => {
      localRef.current = node;
      if (!ref) return;
      if (typeof ref === "function") {
        ref(node);
      } else {
        ref.current = node;
      }
    };

    const sizeClasses =
      B2C_BUTTON_SIZE_CLASSES[size] ?? B2C_BUTTON_SIZE_CLASSES.md;

    const variantClasses =
      variant === "secondary"
        ? "border border-[var(--bb-color-accent)] text-[var(--bb-color-accent)] bg-transparent hover:bg-[var(--bb-color-accent)] hover:text-[var(--bb-color-surface)]"
        : "bg-[var(--bb-color-accent)] text-[var(--bb-color-surface)] hover:opacity-90";

    const rippleColor =
      variant === "secondary"
        ? "rgba(242, 153, 93, 0.25)"
        : "rgba(255, 255, 255, 0.25)";

    return (
      <button
        ref={setRefs}
        type={props.type ?? "button"}
        disabled={disabled}
        onPointerDown={(event) => {
          onPointerDown?.(event);

          // Não cria ripple/haptics quando desabilitado.
          if (disabled) return;

          if (haptics && supportsCoarsePointer()) {
            triggerHaptics();
          }

          if (ripple && localRef.current) {
            addRipple(localRef.current, event, rippleColor);
          }
        }}
        className={cn(
          "bb-pressable relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-2xl transition active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bb-color-accent)]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bb-color-surface)] disabled:opacity-50",
          sizeClasses,
          variantClasses,
          className,
        )}
        {...props}
      >
        {children}
      </button>
    );
  },
);

B2CButton.displayName = "B2CButton";
