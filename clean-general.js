const fs = require('fs');
let html = fs.readFileSync('settings-general.html', 'utf8');

// Remove Receipt settings section from settings-general.html
html = html.replace(/<!-- TAB 5: RECEIPT ITEMS \(UNIFIED RECEIPT SETTINGS\) -->[\s\S]*?<!-- Footer Save Button -->/, '<!-- Footer Save Button -->');

// We also need to change the grid layout since there's no receipt preview
html = html.replace(/<!-- Left Column: Settings Options -->\s*<div class="col-span-12 lg:col-span-8 flex flex-col gap-gutter-md">/, '<!-- Centered Column: Settings Options -->\n                <div class="col-span-12 lg:col-span-8 lg:col-start-3 flex flex-col gap-gutter-md">');

// Remove Right Column (Live receipt preview) entirely from settings-general.html
html = html.replace(/<!-- Right Column: Live Receipt Preview -->[\s\S]*?<!-- END SETTINGS PANEL -->/, '<!-- END SETTINGS PANEL -->');

fs.writeFileSync('settings-general.html', html);
console.log('Cleaned up settings-general.html');
