// === PERFORMANCE BUDGET ===
// Define e monitora limites de performance

import { logger } from "./logger";
import { performanceMonitor } from "./performance";

interface BudgetLimits {
  // Bundle sizes (in KB)
  javascript: number;
  css: number;
  images: number;
  fonts: number;
  total: number;

  // Performance metrics (in ms)
  fcp: number; // First Contentful Paint
  lcp: number; // Largest Contentful Paint
  fid: number; // First Input Delay
  cls: number; // Cumulative Layout Shift
  ttfb: number; // Time to First Byte
  tti: number; // Time to Interactive

  // Resource counts
  requests: number;
  domNodes: number;
}

const DEFAULT_BUDGET: BudgetLimits = {
  // Bundle sizes (KB)
  javascript: 200,
  css: 100,
  images: 500,
  fonts: 100,
  total: 1000,

  // Performance metrics (ms)
  fcp: 1800,
  lcp: 2500,
  fid: 100,
  cls: 0.1,
  ttfb: 600,
  tti: 3800,

  // Resource counts
  requests: 50,
  domNodes: 1500,
};

interface BudgetViolation {
  metric: string;
  current: number;
  budget: number;
  exceeded: number;
  percentage: number;
}

class PerformanceBudget {
  private budget: BudgetLimits;
  private violations: BudgetViolation[] = [];

  constructor(budget: Partial<BudgetLimits> = {}) {
    this.budget = { ...DEFAULT_BUDGET, ...budget };
  }

  // Calcula tamanho dos recursos
  private async calculateResourceSizes(): Promise<{
    javascript: number;
    css: number;
    images: number;
    fonts: number;
    total: number;
  }> {
    const resources = performance.getEntriesByType(
      "resource",
    ) as PerformanceResourceTiming[];

    let javascript = 0;
    let css = 0;
    let images = 0;
    let fonts = 0;

    resources.forEach((resource) => {
      const size = resource.transferSize / 1024; // Convert to KB

      if (resource.initiatorType === "script") {
        javascript += size;
      } else if (
        resource.initiatorType === "css" ||
        resource.name.includes(".css")
      ) {
        css += size;
      } else if (resource.initiatorType === "img") {
        images += size;
      } else if (resource.name.match(/\.(woff2?|ttf|otf|eot)$/)) {
        fonts += size;
      }
    });

    const total = javascript + css + images + fonts;

    return { javascript, css, images, fonts, total };
  }

  // Verifica violações de budget
  private checkViolation(
    metric: string,
    current: number,
    budget: number,
  ): void {
    if (current > budget) {
      const exceeded = current - budget;
      const percentage = (exceeded / budget) * 100;

      this.violations.push({
        metric,
        current,
        budget,
        exceeded,
        percentage,
      });

      logger.warn(
        "PerformanceBudget",
        `❌ ${metric}: ${current.toFixed(2)} exceeds budget of ${budget.toFixed(2)} by ${percentage.toFixed(1)}%`,
      );
    } else {
      logger.debug(
        "PerformanceBudget",
        `✅ ${metric}: ${current.toFixed(2)} (budget: ${budget.toFixed(2)})`,
      );
    }
  }

  // Monitora bundle sizes
  public async monitorBundleSizes(): Promise<void> {
    const sizes = await this.calculateResourceSizes();

    this.checkViolation("JavaScript", sizes.javascript, this.budget.javascript);
    this.checkViolation("CSS", sizes.css, this.budget.css);
    this.checkViolation("Images", sizes.images, this.budget.images);
    this.checkViolation("Fonts", sizes.fonts, this.budget.fonts);
    this.checkViolation("Total Size", sizes.total, this.budget.total);
  }

  // Monitora métricas de performance
  public async monitorPerformanceMetrics(): Promise<void> {
    const metrics = performanceMonitor.getMetrics();

    if (metrics.lcp) {
      this.checkViolation("LCP", metrics.lcp.value, this.budget.lcp);
    }

    if (metrics.fid) {
      this.checkViolation("FID", metrics.fid.value, this.budget.fid);
    }

    if (metrics.cls) {
      this.checkViolation("CLS", metrics.cls.value, this.budget.cls);
    }

    if (metrics.ttfb) {
      this.checkViolation("TTFB", metrics.ttfb, this.budget.ttfb);
    }

    if (metrics.tti) {
      this.checkViolation("TTI", metrics.tti, this.budget.tti);
    }
  }

  // Monitora contagem de recursos
  public monitorResourceCounts(): void {
    const resources = performance.getEntriesByType("resource");
    const domNodes = document.querySelectorAll("*").length;

    this.checkViolation("Requests", resources.length, this.budget.requests);
    this.checkViolation("DOM Nodes", domNodes, this.budget.domNodes);
  }

  // Executa todas as verificações
  public async monitor(): Promise<BudgetViolation[]> {
    logger.info("PerformanceBudget", "Starting budget monitoring...");

    this.violations = [];

    await this.monitorBundleSizes();
    await this.monitorPerformanceMetrics();
    this.monitorResourceCounts();

    if (this.violations.length > 0) {
      logger.error(
        "PerformanceBudget",
        `⚠️ ${this.violations.length} budget violations detected`,
      );
    } else {
      logger.info("PerformanceBudget", "✅ All budgets met!");
    }

    return this.violations;
  }

  // Retorna violações
  public getViolations(): BudgetViolation[] {
    return this.violations;
  }

  // Gera relatório
  public generateReport(): string {
    let report = "=== PERFORMANCE BUDGET REPORT ===\n\n";

    if (this.violations.length === 0) {
      report += "✅ All performance budgets met!\n";
    } else {
      report += `⚠️ ${this.violations.length} violations detected:\n\n`;

      this.violations.forEach((violation) => {
        report += `❌ ${violation.metric}\n`;
        report += `   Current: ${violation.current.toFixed(2)}\n`;
        report += `   Budget: ${violation.budget.toFixed(2)}\n`;
        report += `   Exceeded by: ${violation.exceeded.toFixed(2)} (${violation.percentage.toFixed(1)}%)\n\n`;
      });
    }

    return report;
  }
}

export const performanceBudget = new PerformanceBudget();

// Setup function
export const setupPerformanceBudget = async () => {
  // Aguarda métricas estarem disponíveis
  await new Promise((resolve) => setTimeout(resolve, 3000));

  await performanceBudget.monitor();

  // Log relatório
  const report = performanceBudget.generateReport();
  console.log(report);

  logger.info("setupPerformanceBudget", "Monitoring complete");
};

// Expõe globalmente para debug
if (typeof window !== "undefined") {
  (window as any).performanceBudget = performanceBudget;
}
