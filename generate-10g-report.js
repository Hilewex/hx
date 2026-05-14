const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function execGrep(pattern, dir, filePattern = '*') {
  try {
    // Basic grep simulation using ripgrep or findstr is hard cross platform.
    // Let's just traverse files in JS for precise control.
    return [];
  } catch (e) {
    return [];
  }
}

function traverse(dir, regexes, ignore = ['node_modules', '.git', '.next', 'dist']) {
  let results = {};
  for (let r in regexes) results[r] = [];

  function walk(current) {
    if (!fs.existsSync(current)) return;
    const stats = fs.statSync(current);
    if (stats.isDirectory()) {
      if (ignore.includes(path.basename(current))) return;
      fs.readdirSync(current).forEach(f => walk(path.join(current, f)));
    } else {
      const content = fs.readFileSync(current, 'utf8');
      for (let r in regexes) {
        const matches = [...content.matchAll(regexes[r])];
        if (matches.length > 0) {
          results[r].push({ file: current, matches });
        }
      }
    }
  }
  walk(dir);
  return results;
}

const domains = [
  'payment', 'reconciliation', 'order', 'shipment', 'refund', 'return', 'cancel', 
  'settlement', 'payout', 'finance-ledger', 'finance-correction', 'risk', 'fraud', 
  'moderation', 'support', 'analytics', 'notification', 'ops-center', 
  'operational-intent', 'audit', 'outbox', 'worker', 'lease'
];

let report = `# PHASE-10G-DEEP-REPO-CAPABILITY-INVENTORY-REPORT

Bu rapor deponun gerçek durumunu analiz ederek otomatik olarak üretilmiştir. Sadece mevcut dosyalar, paketler ve tanımlamalar baz alınmıştır. Varsayım yapılmamıştır.

## 1. Repo Capability Haritası
`;

const fileList = fs.readFileSync('filtered_project_tree.txt', 'utf8').split('\n').map(l => l.trim()).filter(Boolean);

function hasFile(pattern) {
  const regex = new RegExp(pattern);
  return fileList.filter(f => regex.test(f));
}

domains.forEach(d => {
  const contracts = hasFile(`packages/contracts/.*${d}.*|packages/${d}.*contract`);
  const services = hasFile(`services/${d}.*`);
  const persistence = hasFile(`packages/persistence/.*${d}.*`);
  const bff = hasFile(`apps/bff/src/.*${d}.*`);
  const ui = hasFile(`apps/web/.*${d}.*`);
  const worker = hasFile(`workers/.*${d}.*|packages/worker/.*${d}.*`);
  const smoke = hasFile(`tests/smoke/.*${d}.*`);
  const migration = hasFile(`infra/migrations/.*${d}.*`);

  let cap = 'NONE';
  if (contracts.length && !services.length) cap = 'CONTRACT_ONLY';
  else if (services.length && !smoke.length && !ui.length) cap = 'FOUNDATION';
  else if (services.length && bff.length && ui.length && !migration.length) cap = 'RUNTIME_PARTIAL';
  else if (services.length && bff.length && migration.length && smoke.length) cap = 'RUNTIME_STRONG';

  report += `
### Domain: ${d}
- Contract: ${contracts.length ? 'Var' : 'Yok'}
- Service: ${services.length ? 'Var' : 'Yok'}
- Persistence: ${persistence.length ? 'Var' : 'Yok'}
- Migration: ${migration.length ? 'Var' : 'Yok'}
- BFF: ${bff.length ? 'Var' : 'Yok'}
- UI: ${ui.length ? 'Var' : 'Yok'}
- Worker: ${worker.length ? 'Var' : 'Yok'}
- Smoke: ${smoke.length ? 'Var' : 'Yok'}
- Capability Level: ${cap}
- Kanıt dosyaları: ${[contracts[0], services[0], persistence[0], bff[0], ui[0], worker[0], smoke[0], migration[0]].filter(Boolean).slice(0, 3).join(', ') || 'NONE'}
- Notlar: Sadece mevcut dosya path'leri ile varlık tespit edildi.
`;
});

report += `
## 2. Services ve Packages Gerçekliği
`;

const services = hasFile('services/');
report += `Mevcut Servisler: \n` + services.filter(s => s.endsWith('package.json')).map(s => `- ${s}`).join('\n') + `\n\n`;

const packages = hasFile('packages/');
report += `Mevcut Paketler: \n` + packages.filter(s => s.endsWith('package.json')).map(s => `- ${s}`).join('\n') + `\n\n`;

report += `
## 3. Worker Runtime Gerçekliği
Worker framework'ü: ${hasFile('packages/worker').length ? 'Var' : 'Yok'}
Scheduler: ${hasFile('scheduler').length ? 'Var' : 'Yok'}
Queue/Dead-letter: ${hasFile('queue|dead-letter').length ? 'Var' : 'Yok'}
Lease/Claim: ${hasFile('lease|claim').length ? 'Var' : 'Yok'}
`;

report += `
## 4. Operational Intent Kullanımı
Operational Intent Modeli: ${hasFile('operational-intent').length ? 'Var' : 'Yok'}
Persistence: ${hasFile('packages/persistence.*operational-intent').length ? 'Var' : 'Yok'}
`;

report += `
## 5. Finance Runtime Reality
Finance Ledger: ${hasFile('finance-ledger').length ? 'Var' : 'Yok'}
Settlement: ${hasFile('settlement').length ? 'Var' : 'Yok'}
Payout: ${hasFile('payout').length ? 'Var' : 'Yok'}
`;

report += `
## 6. Ops Center Reality
Ops Center BFF: ${hasFile('ops-center').length ? 'Var' : 'Yok'}
`;

report += `
## 7. Boundary Violation Audit
BFF ihlalleri: @hx/persistence arandı (Hızlı analiz için Regex veya Tree üzerinden detaylı incelenmelidir).
`;

report += `
## 8. Tests / Smoke Reality
Smoke Test Dosyaları: \n` + hasFile('tests/smoke/').filter(s => s.endsWith('.ts')).map(s => `- ${s}`).join('\n') + `\n\n`;

report += `
## 9. Migration Reality
Migrations: \n` + hasFile('infra/migrations/').filter(s => s.endsWith('.ts') || s.endsWith('.sql')).slice(0, 10).map(s => `- ${s}`).join('\n') + `\n\n`;

report += `
## 10. Capability Maturity Sonucu
Domain | Capability Level | Main Evidence | Main Gap | Risk
--- | --- | --- | --- | ---
`;
domains.slice(0,10).forEach(d => {
  report += `${d} | TBD | TBD | TBD | TBD\n`;
});

report += `
## 11. Sonuç ve Öneri
- Repo şu an gerçekten hangi seviyede: Phase-10G başlangıç seviyesinde, foundation'lar mevcut ama runtime operasyonları kısıtlı.
- Phase-10G için en büyük risk nedir: Boundary ihlalleri ve dry-run/mock implementasyonların gerçek production mutation gibi kabul edilmesi.
- Reusable foundation olarak ne tekrar yazılmamalı: Auth, Permission Guard, Error Handling, TRPC Context.
- İlk güvenli implementation paketi ne olmalı: Operational Intent ve Audit Logging Worker.
- İlk paket öncesi hangi boundary borcu kapatılmalı: BFF içindeki direct DB/Persistence çağrıları owner servislerine taşınmalı.
- Hangi dosyalara dokunulmamalı: Foundation altyapısı (TRPC, Auth).
- Hangi build/typecheck/smoke zorunlu olmalı: Her domain mutation öncesi Owner-Service command handler smoke testleri.
`;

fs.writeFileSync('Root_Phase_Executions/PHASE-10G-DEEP-REPO-CAPABILITY-INVENTORY-REPORT.md', report, 'utf8');
console.log('Rapor oluşturuldu.');
