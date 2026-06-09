const fs = require('fs');

let content = fs.readFileSync('assets/js/features/settings.js', 'utf8');

// Function to safely get value
const safeValueCode = `
    const safeVal = (id) => {
        const el = document.getElementById(id);
        return el ? el.value.trim() : null;
    };
    const safeChecked = (id) => {
        const el = document.getElementById(id);
        return el ? el.checked : false;
    };
`;

// Replace `document.getElementById(x).value` with `safeVal(x)` in the saving logic
let saveStart = content.indexOf('const updatedSettings = {');
let saveEnd = content.indexOf('};', saveStart);

if (saveStart !== -1 && saveEnd !== -1) {
    let block = content.substring(saveStart, saveEnd + 2);
    let originalBlock = block;
    
    // Replace all document.getElementById('...').value.trim() and .value
    block = block.replace(/document\.getElementById\('([^']+)'\)\.value\.trim\(\)/g, "safeVal('$1') || settings.general.$1 || ''"); // Rough fallback needed, actually we should merge with existing settings
    
    // A better approach is to load existing settings first, then overwrite with whatever is on the page
    const newSaveLogic = `
        const currentSettings = window.DB.getSettings();
        const updatedSettings = JSON.parse(JSON.stringify(currentSettings)); // deep copy

        // Helper to safely read a field if it exists on the page
        const safeRead = (id, obj, key) => {
            const el = document.getElementById(id);
            if (el) obj[key] = el.type === 'checkbox' ? el.checked : el.value.trim();
        };

        // Update General Settings if elements exist
        safeRead('company-name', updatedSettings.general, 'companyName');
        safeRead('company-phone', updatedSettings.general, 'phone');
        safeRead('company-email', updatedSettings.general, 'email');
        safeRead('company-address', updatedSettings.general, 'address');
        safeRead('currency-symbol', updatedSettings.general, 'currency');
        safeRead('date-format', updatedSettings.general, 'dateFormat');
        if (currentLogoData) updatedSettings.general.logo = currentLogoData;

        // Update Printer Settings
        safeRead('printer-width', updatedSettings.printer, 'width');
        safeRead('printer-template', updatedSettings.printer, 'template');
        safeRead('printer-connection', updatedSettings.printer, 'connection');
        safeRead('printer-ip', updatedSettings.printer, 'ipAddress');
        safeRead('printer-header', updatedSettings.printer, 'headerText');
        safeRead('printer-hide-company-name', updatedSettings.printer, 'hideCompanyName');
        safeRead('printer-footer', updatedSettings.printer, 'footerText');
        safeRead('printer-autoprint', updatedSettings.printer, 'autoPrint');

        // Update Items list only if we are on the receipt page (itemRows exist)
        const itemRows = document.querySelectorAll('.receipt-item-row');
        if (itemRows.length > 0) {
            const itemsList = [];
            itemRows.forEach(row => {
                const name = row.querySelector('.item-name').value.trim();
                const qty = parseInt(row.querySelector('.item-qty').value) || 1;
                const price = parseFloat(row.querySelector('.item-price').value) || 0;
                if (name) {
                    itemsList.push({ name, qty, price });
                }
            });
            updatedSettings.printer.items = itemsList;
        }

        // FBR Settings
        safeRead('fbr-business-strn', updatedSettings.printer.fbr, 'businessStrn');
        safeRead('fbr-business-ntn', updatedSettings.printer.fbr, 'businessNtn');
        safeRead('fbr-pos-id', updatedSettings.printer.fbr, 'posId');
        safeRead('fbr-sales-tax-pct', updatedSettings.printer.fbr, 'salesTaxPct');
        safeRead('fbr-client-name', updatedSettings.printer.fbr, 'clientName');
        safeRead('fbr-client-address', updatedSettings.printer.fbr, 'clientAddress');
        safeRead('fbr-client-ntn', updatedSettings.printer.fbr, 'clientNtn');
        safeRead('fbr-client-cnic', updatedSettings.printer.fbr, 'clientCnic');

        // Delivery Settings
        safeRead('delivery-driver', updatedSettings.printer.delivery, 'driver');
        safeRead('delivery-client', updatedSettings.printer.delivery, 'client');
        safeRead('delivery-address', updatedSettings.printer.delivery, 'address');

        // Notifications
        safeRead('stock-threshold', updatedSettings.notifications, 'lowStockThreshold');
        safeRead('email-alerts', updatedSettings.notifications, 'emailAlerts');
    `;
    
    // We also need to remove the previous itemList parsing block:
    const itemRowsBlockStart = content.indexOf('const itemRows = document.querySelectorAll(\'.receipt-item-row\');');
    const oldCodeBlock = content.substring(itemRowsBlockStart, saveEnd + 2);
    
    content = content.replace(oldCodeBlock, newSaveLogic);
    
    // Also fix the loading logic so it doesn't crash
    // Let's replace document.getElementById('company-name').value = ... with safe write
    const oldFillGeneral = `document.getElementById('company-name').value = settings.general.companyName || '';
    document.getElementById('company-phone').value = settings.general.phone || '';
    document.getElementById('company-email').value = settings.general.email || '';
    document.getElementById('company-address').value = settings.general.address || '';
    document.getElementById('currency-symbol').value = settings.general.currency || '';
    document.getElementById('date-format').value = settings.general.dateFormat || 'YYYY-MM-DD';`;
    
    const safeWriteHelper = `
    const safeWrite = (id, val) => {
        const el = document.getElementById(id);
        if (el) {
            if (el.type === 'checkbox') el.checked = !!val;
            else el.value = val;
        }
    };
    `;
    
    const newFillGeneral = safeWriteHelper + `
    safeWrite('company-name', settings.general.companyName || '');
    safeWrite('company-phone', settings.general.phone || '');
    safeWrite('company-email', settings.general.email || '');
    safeWrite('company-address', settings.general.address || '');
    safeWrite('currency-symbol', settings.general.currency || '');
    safeWrite('date-format', settings.general.dateFormat || 'YYYY-MM-DD');`;
    
    content = content.replace(oldFillGeneral, newFillGeneral);
    
    // Now replace all other document.getElementById(...).value = ... with safeWrite
    content = content.replace(/document\.getElementById\('([^']+)'\)\.value = ([^;]+);/g, "safeWrite('$1', $2);");
    content = content.replace(/document\.getElementById\('([^']+)'\)\.checked = !!([^;]+);/g, "safeWrite('$1', $2);");
    content = content.replace(/document\.getElementById\('([^']+)'\)\.checked = ([^;]+);/g, "safeWrite('$1', !!($2));");
    
    fs.writeFileSync('assets/js/features/settings.js', content);
    console.log('Updated settings.js to handle split pages safely');
} else {
    console.log('Failed to find save block');
}
