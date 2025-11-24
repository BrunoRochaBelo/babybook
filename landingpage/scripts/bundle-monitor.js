#!/usr/bin/env node

/**
 * Bundle Size Monitoring Script
 *
 * Monitora tamanho de bundles e alerta sobre regressões.
 * Integrado com performance budget.
 *
 * Usage:
 *   node scripts/bundle-monitor.js
 *   node scripts/bundle-monitor.js --ci (fail on violations)
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Budget Limits (em KB)
const BUDGETS = {
  js: {
    main: 50, // Main bundle
    vendor: 30, // Vendor chunk (Lenis)
    core: 20, // Core features
    utils: 15, // Utils
    features: 25, // Features (animations, interactions)
    advanced: 20, // Advanced (lazy loaded)
    total: 150, // Total JS
  },
  css: {
    main: 60, // Main CSS
    total: 60, // Total CSS
  },
  assets: {
    images: 500, // Images
    fonts: 100, // Fonts
    total: 600, // Total assets
  },
  html: {
    index: 100, // Main HTML size (includes ~38KB inlined critical CSS for FCP optimization)
  },
};

// Thresholds
const WARNING_THRESHOLD = 0.85; // 85% do budget
const ERROR_THRESHOLD = 1.0; // 100% do budget

function getFileSize(filePath) {
  try {
    const stats = fs.statSync(filePath);
    return stats.size / 1024; // KB
  } catch (error) {
    return 0;
  }
}

function getFileSizeRecursive(dirPath, extensions = []) {
  let totalSize = 0;

  try {
    const files = fs.readdirSync(dirPath, { withFileTypes: true });

    for (const file of files) {
      const fullPath = path.join(dirPath, file.name);

      if (file.isDirectory()) {
        totalSize += getFileSizeRecursive(fullPath, extensions);
      } else if (file.isFile()) {
        if (
          extensions.length === 0 ||
          extensions.some((ext) => file.name.endsWith(ext))
        ) {
          totalSize += getFileSize(fullPath);
        }
      }
    }
  } catch (error) {
    // Directory doesn't exist
  }

  return totalSize;
}

function analyzeBundle(distPath) {
  const results = {
    js: {},
    css: {},
    assets: {},
    violations: [],
    warnings: [],
  };

  // Analyze JS files
  const assetsPath = path.join(distPath, "assets");

  if (fs.existsSync(assetsPath)) {
    const files = fs.readdirSync(assetsPath);

    // Group JS files
    let totalJS = 0;
    for (const file of files) {
      if (file.endsWith(".js")) {
        const size = getFileSize(path.join(assetsPath, file));
        totalJS += size;

        // Detect chunk type by filename pattern
        if (file.includes("vendor")) {
          results.js.vendor = (results.js.vendor || 0) + size;
        } else if (file.includes("core")) {
          results.js.core = (results.js.core || 0) + size;
        } else if (file.includes("utils")) {
          results.js.utils = (results.js.utils || 0) + size;
        } else if (file.includes("features")) {
          results.js.features = (results.js.features || 0) + size;
        } else if (file.includes("advanced")) {
          results.js.advanced = (results.js.advanced || 0) + size;
        } else if (file.includes("index")) {
          results.js.main = (results.js.main || 0) + size;
        }
      }
    }
    results.js.total = totalJS;

    // Group CSS files
    let totalCSS = 0;
    for (const file of files) {
      if (file.endsWith(".css")) {
        const size = getFileSize(path.join(assetsPath, file));
        totalCSS += size;

        if (file.includes("index")) {
          results.css.main = (results.css.main || 0) + size;
        }
      }
    }
    results.css.total = totalCSS;

    // Analyze assets
    results.assets.images = getFileSizeRecursive(assetsPath, [
      ".jpg",
      ".jpeg",
      ".png",
      ".gif",
      ".webp",
      ".avif",
      ".svg",
    ]);
    results.assets.fonts = getFileSizeRecursive(assetsPath, [
      ".woff",
      ".woff2",
      ".ttf",
      ".eot",
    ]);
    results.assets.total = results.assets.images + results.assets.fonts;
  }

  // Check violations
  checkBudget(results, "js", BUDGETS.js);
  checkBudget(results, "css", BUDGETS.css);
  checkBudget(results, "assets", BUDGETS.assets);
  // HTML index size
  const indexFile = path.join(distPath, "index.html");
  if (fs.existsSync(indexFile)) {
    const indexSize = getFileSize(indexFile);
    results.html = { index: indexSize };
  } else {
    results.html = { index: 0 };
  }
  checkBudget(results, "html", BUDGETS.html);

  return results;
}

function checkBudget(results, category, budgets) {
  for (const [key, budget] of Object.entries(budgets)) {
    const actual = results[category][key] || 0;
    const ratio = actual / budget;

    if (ratio >= ERROR_THRESHOLD) {
      results.violations.push({
        category,
        key,
        actual: actual.toFixed(2),
        budget,
        ratio: ratio.toFixed(2),
        exceeded: (actual - budget).toFixed(2),
      });
    } else if (ratio >= WARNING_THRESHOLD) {
      results.warnings.push({
        category,
        key,
        actual: actual.toFixed(2),
        budget,
        ratio: ratio.toFixed(2),
        remaining: (budget - actual).toFixed(2),
      });
    }
  }
}

function formatSize(kb) {
  const size = Number(kb) || 0;
  if (size >= 1024) {
    return `${(size / 1024).toFixed(2)} MB`;
  }
  return `${size.toFixed(2)} KB`;
}

function printReport(results) {
  console.log("\n📊 Bundle Size Report\n");
  console.log("=".repeat(60));

  // JS Report
  console.log("\n📦 JavaScript:");
  console.log("-".repeat(60));

  const jsCategories = [
    "main",
    "vendor",
    "core",
    "utils",
    "features",
    "advanced",
    "total",
  ];
  for (const key of jsCategories) {
    const actual = results.js[key] || 0;
    const budget = BUDGETS.js[key];
    const ratio = actual / budget;

    const status =
      ratio >= ERROR_THRESHOLD
        ? "❌"
        : ratio >= WARNING_THRESHOLD
          ? "⚠️"
          : "✅";
    const percent = (ratio * 100).toFixed(1);

    console.log(
      `${status} ${key.padEnd(12)} ${formatSize(actual).padEnd(12)} / ${formatSize(budget).padEnd(12)} (${percent}%)`,
    );
  }

  // CSS Report
  console.log("\n🎨 CSS:");
  console.log("-".repeat(60));

  const cssCategories = ["main", "total"];
  for (const key of cssCategories) {
    const actual = results.css[key] || 0;
    const budget = BUDGETS.css[key];
    const ratio = actual / budget;

    const status =
      ratio >= ERROR_THRESHOLD
        ? "❌"
        : ratio >= WARNING_THRESHOLD
          ? "⚠️"
          : "✅";
    const percent = (ratio * 100).toFixed(1);

    console.log(
      `${status} ${key.padEnd(12)} ${formatSize(actual).padEnd(12)} / ${formatSize(budget).padEnd(12)} (${percent}%)`,
    );
  }

  // Assets Report
  console.log("\n🖼️ Assets:");
  console.log("-".repeat(60));

  const assetCategories = ["images", "fonts", "total"];
  for (const key of assetCategories) {
    const actual = results.assets[key] || 0;
    const budget = BUDGETS.assets[key];
    const ratio = actual / budget;

    const status =
      ratio >= ERROR_THRESHOLD
        ? "❌"
        : ratio >= WARNING_THRESHOLD
          ? "⚠️"
          : "✅";
    const percent = (ratio * 100).toFixed(1);

    console.log(
      `${status} ${key.padEnd(12)} ${formatSize(actual).padEnd(12)} / ${formatSize(budget).padEnd(12)} (${percent}%)`,
    );
  }

  // HTML Report
  console.log("\n🌐 HTML:");
  console.log("-".repeat(60));
  const htmlIndex = results.html?.index || 0;
  const htmlBudget = BUDGETS.html.index;
  const htmlRatio = htmlIndex / htmlBudget;
  const htmlStatus =
    htmlRatio >= ERROR_THRESHOLD
      ? "❌"
      : htmlRatio >= WARNING_THRESHOLD
        ? "⚠️"
        : "✅";
  const htmlPercent = (htmlRatio * 100).toFixed(1);
  console.log(
    `${htmlStatus} index      ${formatSize(htmlIndex).padEnd(12)} / ${formatSize(htmlBudget).padEnd(12)} (${htmlPercent}%)`,
  );

  // Violations
  if (results.violations.length > 0) {
    console.log("\n❌ Budget Violations:");
    console.log("-".repeat(60));

    for (const violation of results.violations) {
      console.log(
        `  ${violation.category}/${violation.key}: ${formatSize(violation.actual)} (exceeded by ${formatSize(violation.exceeded)})`,
      );
    }
  }

  // Warnings
  if (results.warnings.length > 0) {
    console.log("\n⚠️  Warnings:");
    console.log("-".repeat(60));

    for (const warning of results.warnings) {
      console.log(
        `  ${warning.category}/${warning.key}: ${formatSize(warning.actual)} (${formatSize(warning.remaining)} remaining)`,
      );
    }
  }

  // Recommendations
  if (results.violations.length > 0 || results.warnings.length > 0) {
    console.log("\n💡 Recommendations:");
    console.log("-".repeat(60));

    if (results.js.total / BUDGETS.js.total >= WARNING_THRESHOLD) {
      console.log("  • Enable code splitting for large features");
      console.log("  • Use dynamic imports for optional components");
      console.log("  • Review and remove unused dependencies");
    }

    if (results.css.total / BUDGETS.css.total >= WARNING_THRESHOLD) {
      console.log("  • Enable PurgeCSS/Tailwind JIT");
      console.log("  • Remove unused CSS selectors");
      console.log("  • Consider critical CSS extraction");
    }

    if (results.assets.total / BUDGETS.assets.total >= WARNING_THRESHOLD) {
      console.log("  • Optimize images (WebP/AVIF)");
      console.log("  • Use responsive images");
      console.log("  • Subset fonts to used characters");
    }
  }

  console.log("\n" + "=".repeat(60) + "\n");

  // Summary
  const totalViolations = results.violations.length;
  const totalWarnings = results.warnings.length;

  if (totalViolations === 0 && totalWarnings === 0) {
    console.log("✅ All budgets passed!\n");
    return 0;
  } else if (totalViolations > 0) {
    console.log(
      `❌ ${totalViolations} budget violation(s), ${totalWarnings} warning(s)\n`,
    );
    return 1;
  } else {
    console.log(`⚠️  ${totalWarnings} warning(s)\n`);
    return 0;
  }
}

function saveBudgetHistory(results) {
  const historyPath = path.join(__dirname, "..", "dist", "budget-history.json");
  let history = [];

  if (fs.existsSync(historyPath)) {
    try {
      history = JSON.parse(fs.readFileSync(historyPath, "utf-8"));
    } catch (error) {
      // Invalid JSON, start fresh
    }
  }

  history.push({
    timestamp: new Date().toISOString(),
    js: results.js,
    css: results.css,
    assets: results.assets,
    html: results.html,
    violations: results.violations.length,
    warnings: results.warnings.length,
  });

  // Keep only last 50 builds
  if (history.length > 50) {
    history = history.slice(-50);
  }

  fs.writeFileSync(historyPath, JSON.stringify(history, null, 2));
}

// Main
const isCI = process.argv.includes("--ci");
const distPath = path.join(__dirname, "..", "dist");

if (!fs.existsSync(distPath)) {
  console.error("❌ Error: dist/ directory not found. Run build first.");
  process.exit(1);
}

const results = analyzeBundle(distPath);
const exitCode = printReport(results);

// Save history
try {
  saveBudgetHistory(results);
} catch (error) {
  console.warn("⚠️  Could not save budget history:", error.message);
}

// Exit with error code in CI mode
if (isCI && exitCode !== 0) {
  process.exit(exitCode);
}
