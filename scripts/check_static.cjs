#!/usr/bin/env node
/**
 * Static Data Guard Script - Mediate Healthcare React Native Mobile App
 *
 * Scans `src/` (excluding `src/mocks/`, test files, and generated schema)
 * to ensure that all business data is dynamic and not hardcoded.
 * Exits with code 1 if violations are found.
 */

const fs = require("fs");
const path = require("path");

const SRC_DIR = path.resolve(__dirname, "../src");
const FORBIDDEN_WORDS = [
  /\bfaker\b/i,
  /\blorem\b/i,
  /\bdummy\b/i,
  /\bsimulate\b/i,
  /\bRahul\b/,
  /\bDeshmukh\b/,
  /\bAnurag\b/,
];

// Patterns representing suspicious static business object arrays
const SUSPICIOUS_BUSINESS_PATTERNS = [
  /DEFAULT_AREAS\s*=\s*\[/i,
  /DEFAULT_TERRITORIES\s*=\s*\[/i,
  /DEFAULT_TRACKABLE_USERS\s*=\s*\[/i,
  /getRoleSeedNotifications\s*=\s*\(/i,
  /\[\s*\{\s*role:\s*["'][A-Z]+["'],\s*email:/i,
];

let totalFilesChecked = 0;
let violationsCount = 0;

function isExcluded(filePath) {
  const normalized = filePath.replace(/\\/g, "/");
  return (
    normalized.includes("/src/mocks/") ||
    normalized.includes("/__tests__/") ||
    normalized.endsWith(".test.ts") ||
    normalized.endsWith(".test.tsx") ||
    normalized.endsWith("schema.d.ts")
  );
}

function scanFile(filePath) {
  if (isExcluded(filePath)) return;
  totalFilesChecked++;

  const content = fs.readFileSync(filePath, "utf8");
  const lines = content.split("\n");

  lines.forEach((line, index) => {
    const lineNum = index + 1;
    const trimmed = line.trim();

    // Skip empty lines or pure comments
    if (!trimmed || trimmed.startsWith("//") || trimmed.startsWith("/*") || trimmed.startsWith("*")) {
      return;
    }

    // Check forbidden words
    for (const pattern of FORBIDDEN_WORDS) {
      if (pattern.test(line)) {
        console.error(
          `\x1b[31m[STATIC DATA GUARD]\x1b[0m Forbidden keyword match in ${path.relative(
            SRC_DIR,
            filePath
          )}:${lineNum}`
        );
        console.error(`   Line ${lineNum}: ${trimmed}`);
        violationsCount++;
      }
    }

    // Check suspicious static business arrays
    for (const pattern of SUSPICIOUS_BUSINESS_PATTERNS) {
      if (pattern.test(line)) {
        console.error(
          `\x1b[31m[STATIC DATA GUARD]\x1b[0m Hardcoded business data array in ${path.relative(
            SRC_DIR,
            filePath
          )}:${lineNum}`
        );
        console.error(`   Line ${lineNum}: ${trimmed}`);
        violationsCount++;
      }
    }
  });
}

function traverseDirectory(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      traverseDirectory(fullPath);
    } else if (entry.isFile() && /\.(ts|tsx|js|jsx)$/.test(entry.name)) {
      scanFile(fullPath);
    }
  }
}

console.log("🔍 Scanning Mediateappfrontent/src for hardcoded static business data...");
traverseDirectory(SRC_DIR);

if (violationsCount > 0) {
  console.error(
    `\n\x1b[31mFAILED: Found ${violationsCount} static data violation(s) across ${totalFilesChecked} source files.\x1b[0m`
  );
  console.error("All business data MUST be loaded dynamically from the backend API via TanStack Query/API hooks.");
  process.exit(1);
} else {
  console.log(
    `\x1b[32mPASSED: Clean! Checked ${totalFilesChecked} source files with 0 static data violations.\x1b[0m\n`
  );
  process.exit(0);
}

