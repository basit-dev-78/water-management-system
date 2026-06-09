const fs = require('fs');

const files = [
    'components/sidebar.html',
    'assets/js/core/component-templates.js'
];

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');

    // Replace text-[9px] with text-[11px] specifically for nav-link-sub
    content = content.replace(/nav-link-sub relative text-\[9px\]/g, 'nav-link-sub relative text-[11px]');
    
    // Replace py-1 px-2 with py-2 px-3 specifically where it was added for these tabs
    // It's part of the nav-link-sub classes
    // E.g. hover:to-transparent py-1 px-2 rounded-lg
    content = content.replace(/hover:to-transparent py-1 px-2/g, 'hover:to-transparent py-2 px-3');

    fs.writeFileSync(file, content);
    console.log('Updated font size for payment subtabs in ' + file);
});
