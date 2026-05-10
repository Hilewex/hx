const fs = require('fs');
const path = require('path');

const workspaces = ['apps', 'packages', 'services'];
workspaces.forEach(ws => {
  if (!fs.existsSync(ws)) return;
  fs.readdirSync(ws).forEach(dir => {
    const pkgPath = path.join(ws, dir, 'package.json');
    if (fs.existsSync(pkgPath)) {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      let modified = false;
      if (!pkg.scripts) {
        pkg.scripts = {};
        modified = true;
      }
      if (!pkg.scripts.build && pkg.name !== '@hx/hx' && pkg.name !== 'hx-monorepo') {
        pkg.scripts.build = 'tsc';
        modified = true;
      }
      if (!pkg.scripts.typecheck && pkg.name !== '@hx/hx' && pkg.name !== 'hx-monorepo') {
        pkg.scripts.typecheck = 'tsc --noEmit';
        modified = true;
      }
      if (modified) {
        fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
        console.log('Added build scripts to', pkg.name);
      }
    }
  });
});
