/// <reference types="vite/client" />

// Tipos para vite-imagetools
declare module "*?format=*" {
  const value: Array<{
    src: string;
    width: number;
    height: number;
    format: string;
  }>;
  export default value;
}

declare module "*?w=*" {
  const value: Array<{
    src: string;
    width: number;
    height: number;
    format: string;
  }>;
  export default value;
}

// Importações de imagem padrão
declare module "*.jpg" {
  const value: string;
  export default value;
}

declare module "*.jpeg" {
  const value: string;
  export default value;
}

declare module "*.png" {
  const value: string;
  export default value;
}

declare module "*.svg" {
  const value: string;
  export default value;
}

declare module "*.webp" {
  const value: string;
  export default value;
}

declare module "*.avif" {
  const value: string;
  export default value;
}

// CSS Modules
declare module "*.module.css" {
  const classes: { [key: string]: string };
  export default classes;
}
