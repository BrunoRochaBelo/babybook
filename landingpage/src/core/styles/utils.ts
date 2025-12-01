export type CssModule = Record<string, string>;

export const loadCssModule = async (
  overrideStyles: CssModule | undefined,
  importer: () => Promise<any>,
): Promise<CssModule> => {
  if (overrideStyles) {
    return overrideStyles;
  }

  const mod = await importer();
  return (mod.default ?? mod) as CssModule;
};
