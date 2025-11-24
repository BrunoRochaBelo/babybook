#!/usr/bin/env node
import fs from "fs";
import path from "path";
import sharp from "sharp";

const publicDir = path.join(process.cwd(), "public");
const sourceSVG512 = path.join(publicDir, "icon-512.svg");
const sourceSVG192 = path.join(publicDir, "icon-192.svg");

const targetPNG = async (svgPath, size, outName) => {
  try {
    if (!fs.existsSync(svgPath)) {
      console.warn("Source SVG not found:", svgPath);
      return;
    }
    const data = await sharp(svgPath).resize(size, size).png().toBuffer();
    const outPath = path.join(publicDir, outName);
    fs.writeFileSync(outPath, data);
    console.log("Generated", outPath);
  } catch (e) {
    console.error("Failed to generate", outName, e);
  }
};

(async () => {
  await targetPNG(sourceSVG512, 512, "icon-512.png");
  await targetPNG(sourceSVG192, 192, "icon-192.png");
  await targetPNG(sourceSVG192, 180, "apple-touch-icon.png");
  await targetPNG(sourceSVG192, 32, "favicon-32x32.png");
  await targetPNG(sourceSVG192, 16, "favicon-16x16.png");
  // Apple splash screens - common sizes
  const splashSizes = [
    [640, 1136],
    [750, 1334],
    [828, 1792],
    [1125, 2436],
    [1242, 2208],
    [1242, 2688],
    [1536, 2048],
    [1668, 2224],
    [2048, 2732],
  ];
  for (const [w, h] of splashSizes) {
    await targetPNG(sourceSVG512, Math.max(w, h), `apple-splash-${w}x${h}.png`);
  }
})();
