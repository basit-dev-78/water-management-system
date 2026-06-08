const fs = require('fs');

let sidebarStr = fs.readFileSync('components/sidebar.html', 'utf8');
sidebarStr = sidebarStr.replace('</div>\\n\\n        <!-- Inventory -->', '</div>\\n\\n        <!-- Inventory -->'); // remove literal \n
fs.writeFileSync('components/sidebar.html', sidebarStr);

let jsStr = fs.readFileSync('assets/js/core/component-templates.js', 'utf8');
jsStr = jsStr.replace('</div>\\\\n        <!-- Inventory -->', '</div>\\n        <!-- Inventory -->');
fs.writeFileSync('assets/js/core/component-templates.js', jsStr);

console.log("Cleaned literal escaped newlines");
