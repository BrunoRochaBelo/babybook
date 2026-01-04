export const THEME_KEY_B2C = "babybook-theme:b2c";
export const THEME_KEY_PARTNER = "babybook-theme:partner";

export function getThemeStorageKeyForPath(pathname: string): string {
  // O B2B (portal do parceiro/fotógrafo) vive sob /partner.
  // Mantemos keys separadas para que tema do B2C e do B2B não se misturem
  // quando ambos estiverem sob a mesma origin (mesmo navegador).
  return pathname.startsWith("/partner") ? THEME_KEY_PARTNER : THEME_KEY_B2C;
}
