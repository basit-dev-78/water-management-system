const fs = require('fs');
let html = fs.readFileSync('settings-general.html', 'utf8');

// 1. Update the form card wrapper class to match exactly what is in Add Payment Record
let oldCardStr = 'class="glass-card rounded-2xl p-6 border border-outline-variant/15 shadow-md flex-1"';
let newCardStr = 'class="glass-card rounded-xl p-6 md:p-8 shadow-sm max-w-4xl mb-8 border border-outline-variant/20"';
html = html.replace(oldCardStr, newCardStr);

// Also remove col-span-12 flex flex-col gap-gutter-md
html = html.replace('class="col-span-12 flex flex-col gap-gutter-md"', 'class="col-span-12"');

// 2. Replace the footer with the Add Payment Record footer styling
let oldFooterStr = `<div class="fixed bottom-0 right-0 left-0 md:left-[270px] p-4 bg-surface-container-low/90 backdrop-blur-md border-t border-outline-variant/20 z-40 flex justify-end gap-3 transition-all duration-300">
                                <button type="button" tabindex="-1" class="btn-cancel px-5 py-2.5 rounded-lg text-[12px] font-bold transition-all flex items-center gap-1.5 border border-outline-variant hover:bg-surface-variant/50 text-on-surface-variant">
                                    <span class="material-symbols-outlined text-[16px]">close</span>
                                    Cancel
                                </button>
                                <button type="submit" id="btn-settings-save" class="btn-primary px-6 py-2.5 bg-primary hover:opacity-95 text-on-primary rounded-lg text-[12px] font-bold shadow-[0_4px_12px_rgba(15,82,56,0.3)] transition-all flex items-center gap-1.5">
                                    <span class="material-symbols-outlined text-[16px]">save</span>
                                    Save Settings
                                </button>
                            </div>`;

// If the previous footer doesn't match exactly because of formatting, we can use regex
let footerStartIdx = html.indexOf('<!-- Footer Actions Fixed -->');
if (footerStartIdx !== -1) {
    let footerEndIdx = html.indexOf('</div>', html.indexOf('Save Settings') + 15) + 6;
    let footerBlock = html.substring(footerStartIdx, footerEndIdx);
    
    let newFooterHtml = `<!-- Fixed Footer -->
            <div class="fixed bottom-[calc(68px+env(safe-area-inset-bottom,0px))] md:bottom-0 right-0 left-0 md:left-[270px] bg-white/70 backdrop-blur-xl border-t border-white/60 px-4 md:px-8 py-3 md:py-4 flex justify-end gap-3 z-[40] shadow-[0_-4px_24px_rgba(0,0,0,0.05)]">
                <a href="#" class="px-5 py-2 text-[12px] font-bold text-on-surface-variant bg-surface-variant/30 hover:bg-surface-variant/50 rounded-lg transition-colors inline-block">Cancel</a>
                <button type="submit" id="btn-settings-save" class="px-5 py-2 text-[12px] font-bold text-white bg-gradient-to-r from-[#0f5238] to-[#1a734e] rounded-lg shadow-md hover:shadow-lg hover:scale-105 transition-all">Save Settings</button>
            </div>`;
    
    html = html.replace(footerBlock, newFooterHtml);
} else {
    // try the other comment
    footerStartIdx = html.indexOf('<!-- Footer Save Button Fixed -->');
    if (footerStartIdx !== -1) {
        let footerEndIdx = html.indexOf('</div>', html.indexOf('Save Settings')) + 6;
        footerEndIdx = html.indexOf('</div>', footerEndIdx) + 6; // because there are multiple inner tags
        
        // Actually easiest is to just replace everything from the comment to </form>
        let formEnd = html.indexOf('</form>');
        let footerBlock = html.substring(footerStartIdx, formEnd);
        
        let newFooterHtml = `<!-- Fixed Footer -->
            </div>
            <div class="fixed bottom-[calc(68px+env(safe-area-inset-bottom,0px))] md:bottom-0 right-0 left-0 md:left-[270px] bg-white/70 backdrop-blur-xl border-t border-white/60 px-4 md:px-8 py-3 md:py-4 flex justify-end gap-3 z-[40] shadow-[0_-4px_24px_rgba(0,0,0,0.05)]">
                <a href="#" class="px-5 py-2 text-[12px] font-bold text-on-surface-variant bg-surface-variant/30 hover:bg-surface-variant/50 rounded-lg transition-colors inline-block">Cancel</a>
                <button type="submit" id="btn-settings-save" class="px-5 py-2 text-[12px] font-bold text-white bg-gradient-to-r from-[#0f5238] to-[#1a734e] rounded-lg shadow-md hover:shadow-lg hover:scale-105 transition-all">Save Settings</button>
            `;
            
        // Wait, the footer is inside the <form> because the button is type="submit"
        // Let's keep it inside the form
        newFooterHtml = `<!-- Fixed Footer -->
            <div class="fixed bottom-[calc(68px+env(safe-area-inset-bottom,0px))] md:bottom-0 right-0 left-0 md:left-[270px] bg-white/70 backdrop-blur-xl border-t border-white/60 px-4 md:px-8 py-3 md:py-4 flex justify-end gap-3 z-[40] shadow-[0_-4px_24px_rgba(0,0,0,0.05)]">
                <a href="#" class="px-5 py-2 text-[12px] font-bold text-on-surface-variant bg-surface-variant/30 hover:bg-surface-variant/50 rounded-lg transition-colors inline-block">Cancel</a>
                <button type="submit" id="btn-settings-save" class="px-5 py-2 text-[12px] font-bold text-white bg-gradient-to-r from-[#0f5238] to-[#1a734e] rounded-lg shadow-md hover:shadow-lg hover:scale-105 transition-all">Save Settings</button>
            </div>
        `;
        html = html.replace(footerBlock, newFooterHtml);
    }
}

// 3. Add a page header like "Add Payment Record" but say "General Settings"
// The image has a big "Add Payment Record" header with a back button.
// In settings-general we can have:
let settingsHeaderHtml = `
            <a class="flex items-center gap-1.5 text-[12px] font-bold text-on-surface-variant hover:text-primary transition-colors mb-4 w-fit" href="#">
                <span class="material-symbols-outlined text-[16px]">arrow_back</span>
                Back to Settings
            </a>
            <div class="flex items-center gap-3 mb-6">
                <h1 class="text-[24px] font-bold text-[#0f5238]">General Settings</h1>
            </div>
`;

// Insert the header right after <div id="panel-settings" class="panel active"> and the grid
let panelStart = html.indexOf('<div class="grid grid-cols-12">');
if (panelStart !== -1) {
    html = html.substring(0, panelStart) + settingsHeaderHtml + html.substring(panelStart);
} else {
    // Wait, the grid cols might be different
    let gridStart = html.indexOf('<div class="grid grid-cols-12 gap-gutter-md">');
    if (gridStart !== -1) {
        // Just replace the grid since we don't need it for a single column page
        html = html.substring(0, gridStart) + settingsHeaderHtml + html.substring(gridStart);
    }
}

// The inputs in Add Payment Record look like: 
// bg-white/50 border border-outline-variant/30 rounded-lg py-2 px-3 text-[12px] focus:ring-2 focus:ring-[#0f5238]/30 outline-none
// Let's replace the input classes in settings-general
let oldInputClass = 'bg-surface-container-low/50 border border-outline-variant/30 rounded-lg py-2 px-3 text-[12px] focus:ring-2 focus:ring-primary/30 outline-none transition-all';
let newInputClass = 'bg-white/50 border border-outline-variant/30 rounded-lg py-2 px-3 text-[12px] focus:ring-2 focus:ring-[#0f5238]/30 outline-none transition-all';
html = html.split(oldInputClass).join(newInputClass);

fs.writeFileSync('settings-general.html', html);
console.log('Updated settings-general.html theme');
