const fs = require('fs');
const path = require('path');

const root = process.cwd();
const requiredPaths = [
  'apps/web/.next/standalone/apps/web/server.js',
  'apps/web/.next/static',
];

const missing = requiredPaths.filter((relativePath) => {
  return !fs.existsSync(path.join(root, relativePath));
});

if (missing.length > 0) {
  console.error('Missing web standalone artifact paths:');
  for (const relativePath of missing) {
    console.error(`- ${relativePath}`);
  }
  process.exit(1);
}

console.log('Web standalone artifact OK');
