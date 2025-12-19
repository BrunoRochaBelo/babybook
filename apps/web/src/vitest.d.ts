// Garante que o TypeScript (tsc --noEmit) enxergue os matchers do jest-dom
// mesmo fora do ambiente de execução do Vitest.
//
// Observação: esse arquivo fica dentro de `src/` para ser incluído pelo tsconfig.
import "@testing-library/jest-dom/vitest";

export {};
