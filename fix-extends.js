const fs = require('fs');
const path = require('path');

const workspaces = ['apps', 'packages', 'services'];

workspaces.forEach(ws => {
  if (!fs.existsSync(ws)) return;
  const dirs = fs.readdirSync(ws);
  dirs.forEach(dir => {
    const fullPath = path.join(ws, dir);
    if (!fs.statSync(fullPath).isDirectory()) return;
    const tsconfigPath = path.join(fullPath, 'tsconfig.json');
    if (fs.existsSync(tsconfigPath)) {
      try {
        let content = fs.readFileSync(tsconfigPath, 'utf8');
        // Simple regex check if it extends something
        if (!content.includes('"extends"')) {
          const config = JSON.parse(content);
          config.extends = "../../tsconfig.base.json";
          fs.writeFileSync(tsconfigPath, JSON.stringify(config, null, 2) + '\n');
          console.log('Added extends to', fullPath);
        }
      } catch (e) {
        console.log('Failed parsing', fullPath, e.message);
      }
    }
  });
});
