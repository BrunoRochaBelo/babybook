// src/workers/stamp.worker.ts
import { removeBackground } from '@imgly/background-removal';

// Configuração para encontrar os arquivos WASM (ajuste conforme seu deploy)
// Futuramente podemos baixar esses arquivos para a pasta public do projeto
const PUBLIC_PATH = "https://staticimgly.com/@imgly/background-removal-data/1.7.0/dist/";

interface WorkerMessage {
  file: File;
  colorHex: string; // Ex: "#2A2A2A"
}

self.onmessage = async (e: MessageEvent<WorkerMessage>) => {
  const { file, colorHex } = e.data;
  console.log("[StampWorker] Iniciando processamento de:", file.name, colorHex);

  // Teste de conectividade básico antes de começar
  try {
    console.log("[StampWorker] Testando acesso à CDN...");
    const test = await fetch(PUBLIC_PATH + "resources.json", { mode: 'cors' });
    console.log("[StampWorker] CDN Status:", test.status, test.statusText);
  } catch (err) {
    console.error("[StampWorker] Falha crítica de conexão com a CDN:", err);
  }

  try {
    // 1. Notificar início
    self.postMessage({ type: 'progress', value: 10, status: 'Baixando IA e removendo fundo...' });

    console.log("[StampWorker] Iniciando remoção de fundo com imgly...");
    const blob = await removeBackground(file, {
      publicPath: PUBLIC_PATH,
      progress: (key: string, current: number, total: number) => {
        const percent = Math.round((current / total) * 50);
        console.log(`[StampWorker] Progress (${key}):`, percent, "%");
        self.postMessage({ type: 'progress', value: percent, status: `Carregando modelos... ${percent}%` });
      }
    });

    console.log("[StampWorker] Fundo removido, iniciando threshold...");
    self.postMessage({ type: 'progress', value: 60, status: 'Aplicando efeito carimbo...' });

    // 3. Processamento de Imagem (OffscreenCanvas)
    const bitmap = await createImageBitmap(blob);
    
    // Redimensionar para otimizar (Max 1024px)
    const maxDim = 1024;
    const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = new OffscreenCanvas(width, height);
    const ctx = canvas.getContext('2d');

    if (!ctx) throw new Error("Falha ao criar contexto 2D no Worker");

    // Desenhar a imagem sem fundo redimensionada
    ctx.drawImage(bitmap, 0, 0, width, height);

    // 4. Manipulação de Pixels (Realist Stamp Effect)
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    const rTinta = parseInt(colorHex.slice(1, 3), 16);
    const gTinta = parseInt(colorHex.slice(3, 5), 16);
    const bTinta = parseInt(colorHex.slice(5, 7), 16);

    // Função auxiliar para ruído (simular porosidade do papel/tinta)
    const getGrit = (x: number, y: number) => {
        const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453123;
        return n - Math.floor(n);
    };

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4;
        const oAlpha = data[i + 3];

        if (oAlpha < 10) continue;

        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const gray = 0.299 * r + 0.587 * g + 0.114 * b;

        // ALGORITMO DE CARIMBO REALISTA:
        // No carimbo real, os "picos" da pele (partes mais claras na foto) tocam o papel.
        // As "valas" (linhas da mão/pé) são mais escuras e não tocam.
        // Portanto, quanto mais claro o pixel, MAIS tinta ele deve ter.
        
        // 1. Normalizar BRILHO (Invertido em relação ao threshold anterior)
        // Usamos uma curva para destacar as cristas da pele
        let inkDensity = (gray - 80) / 100; // Mapeia 80-180 para 0-1
        inkDensity = Math.max(0, Math.min(1, inkDensity));
        
        // 2. Aplicar contraste (curva S para bordas orgânicas)
        inkDensity = inkDensity * inkDensity * (3 - 2 * inkDensity);

        // 3. Adicionar GRIT (porosidade)
        const grit = getGrit(x, y);
        const noiseFactor = 0.8 + grit * 0.4; // Variação de 20% na densidade
        
        // 4. Calcular Alpha Final
        // Mistura a densidade da tinta com a transparência original do fundo removido
        const finalAlpha = Math.round(inkDensity * oAlpha * noiseFactor);

        if (finalAlpha < 20) {
          data[i + 3] = 0;
        } else {
          data[i] = rTinta;
          data[i + 1] = gTinta;
          data[i + 2] = bTinta;
          data[i + 3] = finalAlpha;
        }
      }
    }

    ctx.putImageData(imageData, 0, 0);

    self.postMessage({ type: 'progress', value: 90, status: 'Finalizando...' });

    // 5. Converter de volta para Blob
    const resultBlob = await canvas.convertToBlob({ type: 'image/png' });
    const processedFile = new File([resultBlob], "stamp_processed.png", { type: "image/png" });

    // Enviar sucesso
    self.postMessage({ type: 'complete', file: processedFile });

  } catch (error) {
    console.error(error);
    self.postMessage({ type: 'error', message: 'Falha ao processar imagem.' });
  }
};
