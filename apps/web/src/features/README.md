# Features

Lógica de negócio da UI organizada por feature.

## Estrutura por Feature

Cada feature deve seguir este padrão:

```
features/
├── dashboard/
│   ├── index.tsx              # Export principal
│   ├── components/            # Componentes privados da feature
│   ├── hooks/                 # Hooks privados da feature
│   ├── pages/                 # Páginas/rotas
│   └── types.ts               # Types da feature
│
├── moment/
│   ├── index.tsx
│   ├── components/
│   ├── hooks/
│   └── types.ts
```

## Convenções

- **Feature agrega lógica + dados + UI**: Não dispersar uma feature entre features/
- **Imports locais**: Usar `./` para imports internos à feature
- **Exports de feature**: Usar `index.tsx` como ponto de entrada
