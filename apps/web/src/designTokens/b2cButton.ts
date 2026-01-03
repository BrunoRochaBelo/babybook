export const B2C_BUTTON_SIZE_CLASSES = {
  sm: "px-3 py-2 text-xs font-semibold",
  md: "px-6 py-2 text-sm font-bold",
  lg: "px-7 py-3 text-base font-bold",
} as const;

export type B2CButtonSize = keyof typeof B2C_BUTTON_SIZE_CLASSES;
