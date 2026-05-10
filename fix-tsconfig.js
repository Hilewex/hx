const fs = require('fs');
const path = require('path');

const workspaces = ['apps', 'packages', 'services'];
const projectMap = {};

workspaces.forEach(ws => {
  if (!fs.existsSync(ws)) return;
  const dirs = fs.readdirSync(ws);
  dirs.forEach(dir => {
    const fullPath = path.join(ws, dir);
    if (!fs.statSync(fullPath).isDirectory()) return;
    const pkgPath = path.join(fullPath, 'package.json');
    if (fs.existsSync(pkgPath)) {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      projectMap[pkg.name] = fullPath;
    }
  });
});

Object.keys(projectMap).forEach(name => {
  const fullPath = projectMap[name];
  const pkgPath = path.join(fullPath, 'package.json');
  const tsconfigPath = path.join(fullPath, 'tsconfig.json');
  
  if (fs.existsSync(pkgPath) && fs.existsSync(tsconfigPath)) {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };
    const refs = [];
    
    Object.keys(deps).forEach(dep => {
      if (projectMap[dep]) {
        const relPath = path.relative(fullPath, projectMap[dep]).replace(/\\/g, '/');
        refs.push({ path: relPath });
      }
    });
    
    if (refs.length > 0) {
      let content = fs.readFileSync(tsconfigPath, 'utf8');
      if (!content.includes('"references"')) {
        const refsStr = '\n  "references": ' + JSON.stringify(refs, null, 2).replace(/\n/g, '\n  ') + ',\n';
        content = content.replace('{', '{' + refsStr);
        fs.writeFileSync(tsconfigPath, content);
        console.log('Injected references for', name);
      }
    }
  }
});
