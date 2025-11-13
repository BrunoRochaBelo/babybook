# Lib

Módulos complexos e agnósticos (sem conhecimento de domínio).

## Estrutura

- `api-client.ts` - Cliente para chamadas HTTP
- `utils.ts` - Funções utilitárias puras

## Padrão

- **api-client**: HTTP client, sem saber o que está sendo requisitado
- **upload**: Manager de upload de arquivos (quando necessário)
- **utils**: Formatação, parsing, helpers puros

**Diferença**: lib/upload NÃO sabe o que é um "Momento"; features/moment SIM.

Ver seção 3.3 de `docs/Estrutura_e_Dependencias.md`
