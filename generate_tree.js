const fs = require('fs');
const path = require('path');

const IGNORE_DIRS = ['node_modules', '.git', '.next', 'dist', 'build', '.cache'];

function generateTree(dir, prefix = '') {
    let output = '';
    const files = fs.readdirSync(dir, { withFileTypes: true });
    
    // Sort directories first, then files
    files.sort((a, b) => {
        if (a.isDirectory() && !b.isDirectory()) return -1;
        if (!a.isDirectory() && b.isDirectory()) return 1;
        return a.name.localeCompare(b.name);
    });

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (IGNORE_DIRS.includes(file.name)) continue;

        const isLast = i === files.length - 1;
        const marker = isLast ? '└── ' : '├── ';
        const newPrefix = prefix + (isLast ? '    ' : '│   ');

        output += `${prefix}${marker}${file.name}\n`;

        if (file.isDirectory()) {
            output += generateTree(path.join(dir, file.name), newPrefix);
        }
    }
    return output;
}

const tree = generateTree(__dirname);
fs.writeFileSync('filtered_project_tree.txt', 'Project Root\n' + tree);
console.log('Tree generated in filtered_project_tree.txt');
