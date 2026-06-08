const fs = require('fs');

function reduceSpacing(html) {
    // We only want to target the Payments section
    let paymentsStart = html.indexOf('<!-- Payments -->');
    let end = html.indexOf('<!-- Logistics (No subtabs needed) -->');
    if (paymentsStart === -1 || end === -1) return html;

    let pre = html.substring(0, paymentsStart);
    let post = html.substring(end);
    let middle = html.substring(paymentsStart, end);

    // Reduce padding on the sub-links from py-2 to py-1.5
    middle = middle.replace(/py-2 px-2/g, 'py-1.5 px-2');
    
    // Reduce gap between links from gap-1 to gap-0.5 if it exists in the flex-col div
    // The div is: class="flex flex-col gap-1 pl-8 pr-1 py-2 ...
    middle = middle.replace(/gap-1 pl-8 pr-1 py-2/g, 'gap-0.5 pl-8 pr-1 py-1.5');
    
    // Reduce margins on headers
    middle = middle.replace(/mt-1 mb-0\.5/g, 'mt-1 mb-0');
    middle = middle.replace(/mt-2 mb-0\.5/g, 'mt-1 mb-0');

    return pre + middle + post;
}

// 1. Sidebar HTML
let htmlData = fs.readFileSync('components/sidebar.html', 'utf8');
fs.writeFileSync('components/sidebar.html', reduceSpacing(htmlData));
console.log('Updated sidebar.html');

// 2. JS Templates
let jsData = fs.readFileSync('assets/js/core/component-templates.js', 'utf8');
fs.writeFileSync('assets/js/core/component-templates.js', reduceSpacing(jsData));
console.log('Updated component-templates.js');
