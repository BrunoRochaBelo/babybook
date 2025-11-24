import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function readBudget() {
  const historyPath = path.join(__dirname, "..", "dist", "budget-history.json");
  if (!fs.existsSync(historyPath)) return null;
  const content = fs.readFileSync(historyPath, "utf-8");
  const arr = JSON.parse(content);
  return arr.length ? arr[arr.length - 1] : null;
}

function formatBudget(b) {
  if (!b) return "No data";
  return `JS: ${b.js.total?.toFixed(1) || 0} KB, CSS: ${b.css.total?.toFixed(1) || 0} KB, Images: ${b.assets.images?.toFixed(1) || 0} KB, HTML: ${b.html?.index?.toFixed(1) || 0} KB`;
}

const entry = readBudget();
if (!entry) {
  console.log("No budget history available.");
  process.exit(0);
}

console.log("BUDGET_SNAPSHOT:", formatBudget(entry));
