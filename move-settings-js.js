const fs = require('fs');

let jsData = fs.readFileSync('assets/js/core/component-templates.js', 'utf8');

// Regex to capture the entire Settings nav-group block that follows help.html
let regex = /<div class=\\"nav-group\\">[^{}]*?Settings<\\\/span>[^{}]*?<\\\/div>\\n\s*<\\\/div>\\n\s*<\\\/div>/;
let match = jsData.match(regex);

if (match) {
    let blockToMove = match[0];
    
    // Remove it from the footer
    jsData = jsData.replace(blockToMove, '');
    
    // Insert into nav
    let navEndIdx = jsData.indexOf('</nav>'); // wait it is </nav> without escape
    if (navEndIdx === -1) navEndIdx = jsData.indexOf('<\\/nav>'); // fallback
    
    if (navEndIdx !== -1) {
        jsData = jsData.substring(0, navEndIdx) + '        <!-- Settings -->\\n        ' + blockToMove + '\\n    ' + jsData.substring(navEndIdx);
        fs.writeFileSync('assets/js/core/component-templates.js', jsData);
        console.log('Successfully moved settings to nav in component-templates.js');
    } else {
        console.log('navEndIdx not found');
    }
} else {
    console.log('Could not find Settings nav-group using regex');
}

// ALSO handle the user's NEW request: Remove Notifications and Database Tools from settings-general.html
let html = fs.readFileSync('settings-general.html', 'utf8');
// Remove Notifications tab button
html = html.replace(/<button id="btn-tab-notifications"[\s\S]*?<\/button>/g, '');
// Remove Database Tools tab button
html = html.replace(/<button id="btn-tab-database"[\s\S]*?<\/button>/g, '');
// Remove Notifications content panel
html = html.replace(/<div id="settings-notifications"[\s\S]*?<\/div>\s*<\/div>\s*<!-- TAB 3: DATABASE TOOLS -->/g, '<!-- TAB 3: DATABASE TOOLS -->');
html = html.replace(/<div id="settings-notifications"[\s\S]*?(?=<!-- TAB 3: DATABASE TOOLS -->)/g, '');
// Remove Database content panel
html = html.replace(/<!-- TAB 3: DATABASE TOOLS -->[\s\S]*?(?=<\/form>)/g, '');

// Also make the "General" button take full width if we want, or just leave it
html = html.replace(/<button id="btn-tab-general"[\s\S]*?data-tab="settings-general">/, `<button id="btn-tab-general" class="settings-tab-btn flex-1 md:flex-none text-center px-4 py-2 rounded-lg text-[11px] font-bold transition-all bg-primary text-on-primary shadow-sm" data-tab="settings-general">`);

fs.writeFileSync('settings-general.html', html);
console.log('Updated settings-general.html to remove extra tabs');

