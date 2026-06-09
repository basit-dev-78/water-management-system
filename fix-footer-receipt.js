const fs = require('fs');
let html = fs.readFileSync('settings-receipt.html', 'utf8');

let footerStartIdx = html.indexOf('<!-- Footer Save Button -->');
if (footerStartIdx !== -1) {
    let footerEndIdx = html.indexOf('</div>', html.indexOf('Save Config', footerStartIdx)) + 6;
    let footerBlock = html.substring(footerStartIdx, footerEndIdx);
    
    // Remove the footer from its current location inside the form
    html = html.replace(footerBlock, '');
    
    // We need to add form="form-settings" to the submit button so it submits the form from outside
    let newFooterBlock = `<!-- Fixed Footer -->
            <div class="fixed bottom-[calc(68px+env(safe-area-inset-bottom,0px))] md:bottom-0 right-0 left-0 md:left-[270px] bg-white/70 backdrop-blur-xl border-t border-white/60 px-4 md:px-8 py-3 md:py-4 flex justify-end gap-3 z-[40] shadow-[0_-4px_24px_rgba(0,0,0,0.05)]">
                <a href="#" class="px-5 py-2 text-[12px] font-bold text-on-surface-variant bg-surface-variant/30 hover:bg-surface-variant/50 rounded-lg transition-colors inline-block">Cancel</a>
                <button type="submit" form="form-settings" id="btn-settings-save" class="px-5 py-2 text-[12px] font-bold text-white bg-gradient-to-r from-[#0f5238] to-[#1a734e] rounded-lg shadow-md hover:shadow-lg hover:scale-105 transition-all">Save Settings</button>
            </div>`;
    
    // Add it just before the end of the panel: "        </div>\n    </main>"
    let panelEndIdx = html.indexOf('        </div>\n        <!-- END SETTINGS PANEL -->\n    </main>');
    if (panelEndIdx !== -1) {
        html = html.substring(0, panelEndIdx) + '\n' + newFooterBlock + '\n' + html.substring(panelEndIdx);
        fs.writeFileSync('settings-receipt.html', html);
        console.log('Moved footer outside the container and added form attribute in receipt');
    } else {
        let mainEndIdx = html.indexOf('</main>');
        if (mainEndIdx !== -1) {
            html = html.substring(0, mainEndIdx) + '\n' + newFooterBlock + '\n    ' + html.substring(mainEndIdx);
            fs.writeFileSync('settings-receipt.html', html);
            console.log('Moved footer before main end in receipt');
        } else {
            console.log('Could not find panel end in receipt');
        }
    }
} else {
    console.log('Could not find Fixed Footer in receipt');
}
