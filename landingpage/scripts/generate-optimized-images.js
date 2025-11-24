#!/usr/bin/env node
import fs from "fs";
import path from "path";
import sharp from "sharp";

const publicDir = path.join(process.cwd(), "public");
const imagesDir = path.join(publicDir, "images");

async function processImage(src, outName) {
  const imgPath = path.join(imagesDir, src);
  if (!fs.existsSync(imgPath)) return;
  const baseName = path.parse(src).name;
  const sizes = [320, 640, 1280, 1920];
  for (const w of sizes) {
    const webpOut = path.join(imagesDir, `${baseName}-${w}.webp`);
    const avifOut = path.join(imagesDir, `${baseName}-${w}.avif`);
    try {
      await sharp(imgPath)
        .resize({ width: w })
        .webp({ quality: 80 })
        .toFile(webpOut);
      await sharp(imgPath)
        .resize({ width: w })
        .avif({ quality: 60 })
        .toFile(avifOut);
      console.log("Generated", webpOut, avifOut);
    } catch (e) {
      console.error("Failed to generate", baseName, e);
    }
  }
}

async function main() {
  if (!fs.existsSync(imagesDir)) {
    console.warn("No images directory", imagesDir);
    return;
  }
  const files = fs.readdirSync(imagesDir);
  for (const f of files) {
    if (/.+\.(png|jpg|jpeg|webp)$/i.test(f)) {
      await processImage(f);
    }
  }
}

main().catch(console.error);
