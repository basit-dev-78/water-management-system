const fs = require('fs');

function removeTabsHeader(filename) {
    let html = fs.readFileSync(filename, 'utf8');
    
    // The tabs navigation header starts with <!-- Tabs Navigation Header -->
    // and ends with </div>
    let startIdx = html.indexOf('<!-- Tabs Navigation Header -->');
    if (startIdx !== -1) {
        // Find the next <!-- Settings Form Card -->
        let endIdx = html.indexOf('<!-- Settings Form Card -->', startIdx);
        if (endIdx !== -1) {
            let blockToRemove = html.substring(startIdx, endIdx);
            html = html.replace(blockToRemove, '');
            fs.writeFileSync(filename, html);
            console.log('Removed tabs header from ' + filename);
        } else {
            console.log('Could not find Settings Form Card in ' + filename);
        }
    } else {
        console.log('Could not find Tabs Navigation Header in ' + filename);
    }
}

removeTabsHeader('settings-general.html');
removeTabsHeader('settings-receipt.html');
