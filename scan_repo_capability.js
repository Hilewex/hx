const fs = require('fs');
const path = require('path');

const root = __dirname;
const directoriesToScan = [
  'services',
  'packages',
  'apps/bff/src/server',
  'apps/web/app',
  'apps/web/src/components',
  'apps/web/src/lib/bff',
  'infra/migrations',
  'tests/smoke',
  'workers'
];

function findFilesWithKeyword(dir, keyword, ext = ['.ts', '.tsx', '.sql']) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = dir + '/' + file;
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(findFilesWithKeyword(file, keyword, ext));
    } else {
      if (ext.some(e => file.endsWith(e))) {
        const content = fs.readFileSync(file, 'utf8');
        if (content.toLowerCase().includes(keyword.toLowerCase())) {
          results.push(file.replace(root + '/', ''));
        }
      }
    }
  });
  return results;
}

function findFilesInDir(dir, pattern) {
    let results = [];
    if (!fs.existsSync(dir)) return results;
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        const fullPath = dir + '/' + file;
        const stat = fs.statSync(fullPath);
        if (stat && stat.isDirectory()) {
            results = results.concat(findFilesInDir(fullPath, pattern));
        } else {
            if (fullPath.match(pattern)) {
                results.push(fullPath.replace(root + '/', ''));
            }
        }
    });
    return results;
}

const report = { domains: {}, services: {}, workers: {}, opsCenter: {}, boundaries: {}, tests: {}, migrations: {} };

const domains = [
  'payment', 'reconciliation', 'order', 'shipment', 'refund', 'return', 'cancel', 'settlement', 'payout', 
  'finance-ledger', 'finance-correction', 'risk', 'fraud', 'moderation', 'support', 'analytics', 
  'notification', 'ops-center', 'operational-intent', 'audit', 'outbox', 'worker', 'lease'
];

console.log("Scanning domains...");
domains.forEach(d => {
  report.domains[d] = {
    contract: findFilesWithKeyword(path.join(root, 'packages'), d).slice(0, 5),
    service: findFilesWithKeyword(path.join(root, 'services'), d).slice(0, 5),
    persistence: findFilesWithKeyword(path.join(root, 'packages/persistence'), d).slice(0, 5),
    bff: findFilesWithKeyword(path.join(root, 'apps/bff/src/server'), d).slice(0, 5),
    ui: findFilesWithKeyword(path.join(root, 'apps/web/app'), d).concat(findFilesWithKeyword(path.join(root, 'apps/web/src/components'), d)).slice(0, 5),
    worker: findFilesWithKeyword(path.join(root, 'workers'), d).slice(0, 5),
    smoke: findFilesWithKeyword(path.join(root, 'tests/smoke'), d).slice(0, 5),
    migration: findFilesWithKeyword(path.join(root, 'infra/migrations'), d).slice(0, 5)
  };
});

console.log("Scanning boundaries...");
report.boundaries.bff_persistence = findFilesWithKeyword(path.join(root, 'apps/bff/src'), '@hx/persistence');
report.boundaries.bff_services = findFilesWithKeyword(path.join(root, 'apps/bff/src'), 'services/');
report.boundaries.ui_persistence = findFilesWithKeyword(path.join(root, 'apps/web'), '@hx/persistence');
report.boundaries.ui_services = findFilesWithKeyword(path.join(root, 'apps/web'), 'services/');

fs.writeFileSync('scan_results.json', JSON.stringify(report, null, 2));
console.log("Done scanning.");
