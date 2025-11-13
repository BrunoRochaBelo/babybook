# Hooks

Hooks reutilizáveis e agnósticos.

## Padrão

- `useTheme` - Gerenciar tema light/dark
- Adicionar novos hooks conforme necessário

## Diferença: Hooks vs Hooks de Feature

- **Hooks aqui**: Agnósticos, sem dependência de domínio (useTheme, useScreenSize, etc)
- **Hooks de Feature**: Moram em `features/*/hooks/` (ex: useMomentQuery em features/moment/hooks/)

Ver seção 8 de `docs/Estrutura_e_Dependencias.md`
