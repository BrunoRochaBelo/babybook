#!/usr/bin/env node

/**
 * Script de segurança para pre-commit hook
 * Verifica arquivos staged para segredos antes do commit
 */

const { execSync } = require("child_process");

// Padrões que indicam possíveis segredos
const SECRET_PATTERNS = [
  // Chaves de API genéricas
  /(?:api[_-]?key|apikey)\s*[:=]\s*["']?([a-zA-Z0-9_\-]{20,})["']?/gi,
  // Tokens de autenticação
  /(?:auth[_-]?token|access[_-]?token|bearer)\s*[:=]\s*["']?([a-zA-Z0-9_\-\.]{20,})["']?/gi,
  // Senhas hardcoded (exceto placeholders)
  /(?:password|passwd|pwd|secret)\s*[:=]\s*["']([^"'${\s]{8,})["']/gi,
  // AWS Keys
  /(?:AKIA|ABIA|ACCA|ASIA)[0-9A-Z]{16}/g,
  // Chaves privadas
  /-----BEGIN (?:RSA |DSA |EC |OPENSSH )?PRIVATE KEY-----/g,
  // Tokens do GitHub
  /gh[pousr]_[A-Za-z0-9_]{36,}/g,
  // Tokens do npm
  /npm_[A-Za-z0-9]{36}/g,
  // Slack tokens
  /xox[baprs]-[0-9A-Za-z\-]{10,}/g,
  // Discord tokens
  /[MN][A-Za-z\d]{23,}\.[\w-]{6}\.[\w-]{27}/g,
  // Stripe keys
  /sk_live_[0-9a-zA-Z]{24}/g,
  /pk_live_[0-9a-zA-Z]{24}/g,
];

// Lista de arquivos/padrões a ignorar
const IGNORE_PATTERNS = [
  /\.example$/,
  /\.sample$/,
  /\.template$/,
  /\.md$/,
  /package-lock\.json$/,
  /pnpm-lock\.yaml$/,
  /yarn\.lock$/,
  /\.secrets\.baseline$/,
];

// Valores falso-positivos conhecidos (para desenvolvimento)
const ALLOWED_VALUES = [
  "change_me",
  "your-secret-here",
  "placeholder",
  "dev-secret-key",
  "dev-csrf-secret",
  "dev-jwt-key",
  "service-token",
  "minioadmin",
  "pro123", // Senha de desenvolvimento local
  "test123",
  "password123",
];

function getStagedFiles() {
  try {
    const output = execSync("git diff --cached --name-only --diff-filter=ACM", {
      encoding: "utf8",
    });
    return output.trim().split("\n").filter(Boolean);
  } catch {
    return [];
  }
}

function getFileContent(file) {
  try {
    return execSync(`git show :${file}`, { encoding: "utf8" });
  } catch {
    return "";
  }
}

function shouldIgnoreFile(file) {
  return IGNORE_PATTERNS.some((pattern) => pattern.test(file));
}

function isAllowedValue(match) {
  const value = match.toLowerCase();
  return ALLOWED_VALUES.some((allowed) => value.includes(allowed.toLowerCase()));
}

function scanFile(file, content) {
  const issues = [];
  const lines = content.split("\n");

  lines.forEach((line, index) => {
    SECRET_PATTERNS.forEach((pattern) => {
      const matches = line.match(pattern);
      if (matches) {
        const match = matches[0];
        if (!isAllowedValue(match)) {
          issues.push({
            line: index + 1,
            pattern: pattern.source.substring(0, 30) + "...",
            preview: line.substring(0, 80) + (line.length > 80 ? "..." : ""),
          });
        }
      }
    });
  });

  return issues;
}

function main() {
  console.log("🔒 Verificando segredos nos arquivos staged...\n");

  const stagedFiles = getStagedFiles();
  if (stagedFiles.length === 0) {
    console.log("✅ Nenhum arquivo staged para verificar.\n");
    process.exit(0);
  }

  let hasIssues = false;
  const results = [];

  for (const file of stagedFiles) {
    if (shouldIgnoreFile(file)) {
      continue;
    }

    const content = getFileContent(file);
    const issues = scanFile(file, content);

    if (issues.length > 0) {
      hasIssues = true;
      results.push({ file, issues });
    }
  }

  if (hasIssues) {
    console.log("❌ COMMIT BLOQUEADO: Possíveis segredos detectados!\n");
    results.forEach(({ file, issues }) => {
      console.log(`📄 ${file}:`);
      issues.forEach((issue) => {
        console.log(`   Linha ${issue.line}: ${issue.preview}`);
      });
      console.log("");
    });
    console.log("💡 Se for um falso positivo, adicione o valor em ALLOWED_VALUES");
    console.log("   no arquivo scripts/check-secrets.js\n");
    process.exit(1);
  }

  console.log(`✅ ${stagedFiles.length} arquivo(s) verificado(s), nenhum segredo detectado.\n`);
  process.exit(0);
}

main();
