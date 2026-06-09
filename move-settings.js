const fs = require('fs');

let settingsAccordionHtml = `
        <!-- Settings -->
        <div class="nav-group">
            <a href="#"
                class="nav-parent flex items-center justify-between text-on-surface-variant hover:bg-surface-variant/50 rounded-lg px-3 py-2 transition-all duration-200 mt-1">
                <div class="flex items-center gap-stack-md">
                    <span class="material-symbols-outlined text-[18px]">settings</span>
                    <span class="text-[12px] font-bold">Settings</span>
                </div>
                <span class="material-symbols-outlined text-[16px] transition-transform duration-300 expand-icon">expand_more</span>
            </a>
            <div class="nav-children overflow-hidden max-h-0 transition-all duration-300 ease-in-out">
                <div class="flex flex-col gap-1 pl-8 pr-2 py-2 relative before:content-[''] before:absolute before:left-5 before:top-2 before:bottom-2 before:w-[2px] before:bg-outline-variant/20 before:rounded-full">
                    <a data-tab="panel-settings-general"
                        class="nav-link-sub relative text-[11px] font-medium text-on-surface-variant hover:text-primary hover:bg-gradient-to-r hover:from-primary/10 hover:to-transparent py-2 px-3 rounded-lg transition-all duration-200 flex items-center gap-2 group"
                        href="settings-general.html">
                        <div class="sub-dot w-1.5 h-1.5 rounded-full shrink-0 bg-outline-variant/40 group-hover:bg-primary group-hover:w-3 group-hover:shadow-[0_0_6px_rgba(15,82,56,0.4)] transition-all duration-300 ease-out"></div>
                        <span>General Setting</span>
                    </a>
                    <a data-tab="panel-settings-receipt"
                        class="nav-link-sub relative text-[11px] font-medium text-on-surface-variant hover:text-primary hover:bg-gradient-to-r hover:from-primary/10 hover:to-transparent py-2 px-3 rounded-lg transition-all duration-200 flex items-center gap-2 group"
                        href="settings-receipt.html">
                        <div class="sub-dot w-1.5 h-1.5 rounded-full shrink-0 bg-outline-variant/40 group-hover:bg-primary group-hover:w-3 group-hover:shadow-[0_0_6px_rgba(15,82,56,0.4)] transition-all duration-300 ease-out"></div>
                        <span>Receipt Setting</span>
                    </a>
                </div>
            </div>
        </div>
`;

let settingsAccordionJs = `        <!-- Settings -->\\n        <div class=\\"nav-group\\">\\n            <a href=\\"#\\"\\n                class=\\"nav-parent flex items-center justify-between text-on-surface-variant hover:bg-surface-variant/50 rounded-lg px-3 py-2 transition-all duration-200 mt-1\\">\\n                <div class=\\"flex items-center gap-stack-md\\">\\n                    <span class=\\"material-symbols-outlined text-[18px]\\">settings<\\/span>\\n                    <span class=\\"text-[12px] font-bold\\">Settings<\\/span>\\n                <\\/div>\\n                <span class=\\"material-symbols-outlined text-[16px] transition-transform duration-300 expand-icon\\">expand_more<\\/span>\\n            <\\/a>\\n            <div class=\\"nav-children overflow-hidden max-h-0 transition-all duration-300 ease-in-out\\">\\n                <div class=\\"flex flex-col gap-1 pl-8 pr-2 py-2 relative before:content-[''] before:absolute before:left-5 before:top-2 before:bottom-2 before:w-[2px] before:bg-outline-variant/20 before:rounded-full\\">\\n                    <a data-tab=\\"panel-settings-general\\"\\n                        class=\\"nav-link-sub relative text-[11px] font-medium text-on-surface-variant hover:text-primary hover:bg-gradient-to-r hover:from-primary/10 hover:to-transparent py-2 px-3 rounded-lg transition-all duration-200 flex items-center gap-2 group\\"\\n                        href=\\"settings-general.html\\">\\n                        <div class=\\"sub-dot w-1.5 h-1.5 rounded-full shrink-0 bg-outline-variant/40 group-hover:bg-primary group-hover:w-3 group-hover:shadow-[0_0_6px_rgba(15,82,56,0.4)] transition-all duration-300 ease-out\\"><\\/div>\\n                        <span>General Setting<\\/span>\\n                    <\\/a>\\n                    <a data-tab=\\"panel-settings-receipt\\"\\n                        class=\\"nav-link-sub relative text-[11px] font-medium text-on-surface-variant hover:text-primary hover:bg-gradient-to-r hover:from-primary/10 hover:to-transparent py-2 px-3 rounded-lg transition-all duration-200 flex items-center gap-2 group\\"\\n                        href=\\"settings-receipt.html\\">\\n                        <div class=\\"sub-dot w-1.5 h-1.5 rounded-full shrink-0 bg-outline-variant/40 group-hover:bg-primary group-hover:w-3 group-hover:shadow-[0_0_6px_rgba(15,82,56,0.4)] transition-all duration-300 ease-out\\"><\\/div>\\n                        <span>Receipt Setting<\\/span>\\n                    <\\/a>\\n                <\\/div>\\n            <\\/div>\\n        <\\/div>\\n`;


let html = fs.readFileSync('components/sidebar.html', 'utf8');

// Remove old settings from footer
let startIdx = html.indexOf('<a data-tab="panel-settings"');
if (startIdx !== -1) {
    let endIdx = html.indexOf('</a>', startIdx);
    if (endIdx !== -1) {
        let fullMatch = html.substring(startIdx, endIdx + 4);
        html = html.replace(fullMatch, '');
    }
}

// Check if accordion already added
if (!html.includes('data-tab="panel-settings-general"')) {
    // Insert into nav
    let navEnd = html.indexOf('</nav>');
    if (navEnd !== -1) {
        html = html.substring(0, navEnd) + settingsAccordionHtml + '    ' + html.substring(navEnd);
        fs.writeFileSync('components/sidebar.html', html);
        console.log('Sidebar.html updated');
    }
}


let jsData = fs.readFileSync('assets/js/core/component-templates.js', 'utf8');

// Remove old settings from footer
let startJs = jsData.indexOf('<a data-tab=\\"panel-settings\\"');
if (startJs !== -1) {
    let endJs = jsData.indexOf('<\\/a>', startJs);
    if (endJs !== -1) {
        let fullMatch = jsData.substring(startJs, endJs + 6);
        jsData = jsData.replace(fullMatch, '');
    }
}

// Check if accordion already added
if (!jsData.includes('data-tab=\\"panel-settings-general\\"')) {
    // Insert into nav
    let navEndJs = jsData.indexOf('<\\/nav>');
    if (navEndJs !== -1) {
        jsData = jsData.substring(0, navEndJs) + settingsAccordionJs + '    ' + jsData.substring(navEndJs);
        fs.writeFileSync('assets/js/core/component-templates.js', jsData);
        console.log('Component-templates.js updated');
    }
}
