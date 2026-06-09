const fs = require('fs');
let html = fs.readFileSync('settings-general.html', 'utf8');

let footerStartIdx = html.indexOf('<!-- Fixed Footer -->');
if (footerStartIdx !== -1) {
    let footerEndIdx = html.indexOf('</div>', html.indexOf('Save Settings', footerStartIdx)) + 6;
    let footerBlock = html.substring(footerStartIdx, footerEndIdx);
    
    // Remove the footer from its current location inside the form
    html = html.replace(footerBlock, '');
    
    // We need to add form="form-settings" to the submit button so it submits the form from outside
    let newFooterBlock = footerBlock.replace('<button type="submit"', '<button type="submit" form="form-settings"');
    
    // Add it just before the end of the panel: "        </div>\n    </main>"
    let panelEndIdx = html.indexOf('        </div>\n    </main>');
    if (panelEndIdx !== -1) {
        html = html.substring(0, panelEndIdx) + '\n' + newFooterBlock + '\n' + html.substring(panelEndIdx);
        fs.writeFileSync('settings-general.html', html);
        console.log('Moved footer outside the container and added form attribute');
    } else {
        // Alternatively insert before </main>
        let mainEndIdx = html.indexOf('</main>');
        if (mainEndIdx !== -1) {
            html = html.substring(0, mainEndIdx) + '\n' + newFooterBlock + '\n    ' + html.substring(mainEndIdx);
            fs.writeFileSync('settings-general.html', html);
            console.log('Moved footer before main end');
        } else {
            console.log('Could not find panel end');
        }
    }
} else {
    console.log('Could not find Fixed Footer');
}
