import * as fs from 'fs';
import * as path from 'path';

const BFF_SERVER_DIR = __dirname;

function checkFileContent(filePath: string, forbiddenPatterns: RegExp[], allowedPatterns: RegExp[] = []): string[] {
  const content = fs.readFileSync(filePath, 'utf8');
  const violations: string[] = [];

  for (const pattern of forbiddenPatterns) {
    if (pattern.test(content)) {
      violations.push(`Violation in ${path.basename(filePath)}: Pattern ${pattern.toString()} found.`);
    }
  }
  return violations;
}

const forbiddenPatterns = [
  /\|\| result\.data/g,
  /sendJson\(200, result\)/g,
  /res\.end\('Not Found'\)/g,
  /from '\.\.\/\.\.\/\.\.\/\.\.\/services\//g,
  /from "@hx\/\*\/src"/g,
  /\{ status: \.\.\., data:/g,
  /\{ error: error\.message \}/g,
  /\{ error: err\.message \}/g,
  /\{ error: e\.message \}/g,
  /errors: \[error\.message\]/g,
  /errors: \[err\.message\]/g,
  /errors: \[e\.message\]/g,
  /internalError\(\.\.\., error\.message\)/g,
  /internalError\(\.\.\., err\.message\)/g,
  /internalError\(\.\.\., e\.message\)/g
];

console.log('--- P50 Smoke Test: Response Hardening ---');

let totalViolations = 0;
const files = fs.readdirSync(BFF_SERVER_DIR)
  .filter(f => f.endsWith('.ts'))
  .filter(f => !f.includes('smoke-test'));

for (const file of files) {
  const filePath = path.join(BFF_SERVER_DIR, file);
  const violations = checkFileContent(filePath, forbiddenPatterns);
  if (violations.length > 0) {
    violations.forEach(v => console.error(v));
    totalViolations += violations.length;
  }
}

// Special check for index.ts cleanup
const indexContent = fs.readFileSync(path.join(BFF_SERVER_DIR, 'index.ts'), 'utf8');
if (indexContent.includes('res.end(\'Not Found\')')) {
  console.error('index.ts still contains res.end(\'Not Found\')');
  totalViolations++;
}

if (totalViolations === 0) {
  console.log('P50 Smoke Test: SUCCESS');
  process.exit(0);
} else {
  console.error(`P50 Smoke Test: FAILED with ${totalViolations} violations`);
  process.exit(1);
}
