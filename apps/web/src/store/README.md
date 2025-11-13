# State Management

Estado global da aplicação usando **Zustand**.

## Stores

- `app.store.ts` - Estado geral (theme, user, etc)

## Convenções

- **Zustand**: Para UI State (tema, modais abertos, filtros da UI)
- **React Query**: Para Server State (dados da API)
- **Props Drilling**: Para state local de componentes

Ver seção 8.2 de `docs/Estrutura_e_Dependencias.md`
