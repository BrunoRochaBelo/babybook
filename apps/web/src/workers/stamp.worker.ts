// src/workers/stamp.worker.ts
import { removeBackground } from "@imgly/background-removal";

// Configuração para encontrar os arquivos WASM (ajuste conforme seu deploy)
// Agora internalizado em /public/imgly para garantir longevidade e offline-first
const PUBLIC_PATH = new URL("/imgly/", self.location.href).toString();

type WorkerMessage =
  | { type?: "process"; jobId?: number; file: File; colorHex: string }
  | { type: "preload" };

let currentCache: { id: string; blob: Blob } | null = null;

self.onmessage = async (e: MessageEvent<WorkerMessage>) => {
  // 0. Preload ou Processamento
  if (e.data.type === "preload") {
    console.log("[StampWorker] Preloading models...");
    try {
      await fetch(PUBLIC_PATH + "model.json");
    } catch {
      /* ignore */
    }
    return;
  }

  // TS agora sabe que não é preload, mas precisamos acessar propriedades
  // que apenas existem no tipo de processamento.
  // Cast explícito ou checagem de propriedade é necessário se o TS não inferir.
  const msg = e.data as { file: File; colorHex: string; jobId?: number };
  const { file, colorHex } = msg;
  const jobId = typeof msg.jobId === "number" ? msg.jobId : 0;

  const post = (payload: Record<string, unknown>) => {
    self.postMessage({ jobId, ...payload });
  };

  console.log("[StampWorker] Iniciando processamento de:", file.name, colorHex);

  // Teste de conectividade básico antes de começar
  try {
    console.log("[StampWorker] Testando acesso à CDN...");
    const test = await fetch(PUBLIC_PATH + "resources.json", { mode: "cors" });
    console.log("[StampWorker] CDN Status:", test.status, test.statusText);
  } catch (err) {
    console.error("[StampWorker] Falha crítica de conexão com a CDN:", err);
  }

  try {
    // 1. Otimização: Redimensionar ANTES da IA (max 1024px)
    // Isso acelera muito a inferência em imagens de alta resolução (câmera de celular)
    post({ type: "progress", value: 5, status: "Otimizando imagem..." });

    const preBitmap = await createImageBitmap(file);
    const maxInput = 1024;
    const preScale = Math.min(
      1,
      maxInput / Math.max(preBitmap.width, preBitmap.height),
    );

    let inputBlob = file;

    if (preScale < 1) {
      const preWidth = Math.round(preBitmap.width * preScale);
      const preHeight = Math.round(preBitmap.height * preScale);
      const preCanvas = new OffscreenCanvas(preWidth, preHeight);
      const preCtx = preCanvas.getContext("2d");
      if (preCtx) {
        preCtx.drawImage(preBitmap, 0, 0, preWidth, preHeight);
        inputBlob = (await preCanvas.convertToBlob({
          type: "image/jpeg",
          quality: 0.8,
        })) as File; // Cast como File ok para API
      }
    }

    // 2. Cache Strategy check
    const fileId = `${file.name}-${file.size}`;
    let blob: Blob;

    if (currentCache && currentCache.id === fileId) {
      console.log("[StampWorker] Using cached background removal");
      post({ type: "progress", value: 80, status: "Reaplicando cor..." });
      blob = currentCache.blob;
    } else {
      // 3. Notificar início real (Download/IA)
      post({
        type: "progress",
        value: 10,
        status: "Baixando IA e removendo fundo...",
      });
      console.log("[StampWorker] Iniciando remoção de fundo com imgly...");

      blob = await removeBackground(inputBlob, {
        publicPath: PUBLIC_PATH,
        model: "medium",
        progress: (key: string, current: number, total: number) => {
          // Weighted Progress: fetch (0-30%), compute (30-80%)
          let percent = 0;
          if (key.includes("fetch")) {
            percent = Math.round((current / total) * 30);
          } else if (key.includes("compute")) {
            percent = 30 + Math.round((current / total) * 50);
          }
          post({
            type: "progress",
            value: percent,
            status: key.includes("fetch")
              ? "Baixando modelos..."
              : "Processando IA...",
          });
        },
      });

      // Update Cache
      currentCache = { id: fileId, blob };
    }

    console.log("[StampWorker] Fundo removido, iniciando threshold...");
    post({
      type: "progress",
      value: 85,
      status: "Aplicando efeito carimbo...",
    });

    // 3. Processamento de Imagem (OffscreenCanvas)
    const bitmap = await createImageBitmap(blob);

    // Redimensionar para otimizar (Max 1024px)
    const maxDim = 1024;
    const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = new OffscreenCanvas(width, height);
    const ctx = canvas.getContext("2d");

    if (!ctx) throw new Error("Falha ao criar contexto 2D no Worker");

    // Desenhar a imagem sem fundo redimensionada
    ctx.drawImage(bitmap, 0, 0, width, height);

    // 4. Manipulação de Pixels (Realist Stamp Effect)
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    const rTinta = parseInt(colorHex.slice(1, 3), 16);
    const gTinta = parseInt(colorHex.slice(3, 5), 16);
    const bTinta = parseInt(colorHex.slice(5, 7), 16);

    // ALGORITMO DE CARIMBO REALISTA (Adaptive v3):
    // Problema da v2: Dependia de iluminação fixa/perfeita. Fotos escuras ficavam vazias, claras ficavam blocadas.
    // Solução v3: "Auto-Levels" (Normalização Adaptativa).

    // PASS 1: Análise de Histograma (Encontrar min/max do objeto)
    let minGray = 255;
    let maxGray = 0;

    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] < 20) continue; // Ignora fundo transparente

      const g = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      if (g < minGray) minGray = g;
      if (g > maxGray) maxGray = g;
    }

    // Margem de segurança para evitar ruído extremo em imagens planas
    if (maxGray - minGray < 20) {
      minGray = Math.max(0, minGray - 10);
      maxGray = Math.min(255, maxGray + 10);
    }

    // ALGORITMO DE CARIMBO v8 - NATURAL & ORGÂNICO
    // Refinamentos:
    //   - Linhas da mão mais visíveis (contraste antes do threshold)
    //   - Aspecto mais natural com textura orgânica
    //   - Transição suave entre tinta e papel

    // PASS 2: Aplicação do Filtro
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4;
        const oAlpha = data[i + 3];

        if (oAlpha < 10) continue;

        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const rawGray = 0.299 * r + 0.587 * g + 0.114 * b;

        // 1. Normalização (0 = mais escuro, 1 = mais claro)
        let norm = (rawGray - minGray) / (maxGray - minGray);
        norm = Math.max(0, Math.min(1, norm));

        // 2. AUMENTO DE CONTRASTE para destacar linhas
        // SmoothStep faz os escuros ficarem mais escuros, claros mais claros
        const enhanced = norm * norm * (3 - 2 * norm);

        // 3. Threshold para separar sulcos de pele
        const creaseThreshold = 0.35;

        let inkAlpha = 0;

        if (enhanced > creaseThreshold) {
          // Mapear threshold-1.0 para intensidade
          const pressure = (enhanced - creaseThreshold) / (1 - creaseThreshold);

          // 4. Curva gentil para transição natural
          // pow(0.7) = sobe moderadamente rápido
          inkAlpha = Math.pow(pressure, 0.7) * 255;

          // 5. Níveis de pressão mais suaves
          if (pressure > 0.2) {
            inkAlpha = Math.max(inkAlpha, 100);
          }
          if (pressure > 0.5) {
            inkAlpha = Math.max(inkAlpha, 180);
          }
          if (pressure > 0.8) {
            inkAlpha = Math.max(inkAlpha, 240);
          }
        }

        // 6. SIMULAÇÃO DE PRESSÃO nas bordas (pontas dos dedos)
        if (oAlpha < 245 && oAlpha > 60 && inkAlpha > 0) {
          inkAlpha = Math.min(255, inkAlpha * 1.25);
        }

        // 7. Textura ORGÂNICA mais pronunciada
        // Usando duas frequências para parecer mais natural
        const grain1 = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
        const grain2 = Math.sin(x * 37.5 + y * 127.1) * 43758.5453;
        const grainVal =
          (grain1 - Math.floor(grain1) + (grain2 - Math.floor(grain2))) / 2;

        // Variação de 15% na opacidade para aspecto natural
        const grainFactor = grainVal * 0.15 + 0.925; // 92.5% a 107.5%
        inkAlpha = inkAlpha * grainFactor;

        // 8. "Falhas de tinta" ocasionais para realismo
        // Em áreas de baixa pressão, pode ter buracos
        if (inkAlpha > 30 && inkAlpha < 150 && grainVal < 0.15) {
          inkAlpha = inkAlpha * 0.5; // Reduz 50% em alguns pontos
        }

        // 9. Clamp e mistura
        inkAlpha = Math.max(0, Math.min(255, inkAlpha));
        const finalAlpha = Math.round(inkAlpha * (oAlpha / 255));

        if (finalAlpha < 8) {
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

    post({ type: "progress", value: 90, status: "Finalizando..." });

    // 5. Converter de volta para Blob
    const resultBlob = await canvas.convertToBlob({ type: "image/png" });
    const processedFile = new File([resultBlob], "stamp_processed.png", {
      type: "image/png",
    });

    // Enviar sucesso
    post({ type: "complete", file: processedFile });
  } catch (error) {
    console.error(error);
    post({ type: "error", message: "Falha ao processar imagem." });
  }
};
