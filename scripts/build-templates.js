const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const files = {
    sidebar: 'components/sidebar.html',
    header: 'components/header.html',
    filter: 'components/filter-panel.html',
    toast: 'components/toast-container.html',
    ai: 'components/ai-panel.html'
};

let out = 'export const TEMPLATES = {\n';
for (const [key, file] of Object.entries(files)) {
    const content = fs.readFileSync(path.join(root, file), 'utf8');
    out += `  ${key}: ${JSON.stringify(content)},\n`;
}
out += '};\n';

fs.writeFileSync(path.join(root, 'assets/js/core/component-templates.js'), out);
console.log('component-templates.js generated');
