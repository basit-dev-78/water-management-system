import { showToast } from '../ui/components.js';
import { Printer } from '../core/printer.js';

export function initSettings() {
    const form = document.getElementById('form-settings');
    if (!form || !window.DB) return;

    // Load Settings
    const settings = window.DB.getSettings();

    // Fill General Form Fields
    document.getElementById('company-name').value = settings.general.companyName || '';
    document.getElementById('company-phone').value = settings.general.phone || '';
    document.getElementById('company-email').value = settings.general.email || '';
    document.getElementById('company-address').value = settings.general.address || '';
    document.getElementById('currency-symbol').value = settings.general.currency || '';
    document.getElementById('date-format').value = settings.general.dateFormat || 'YYYY-MM-DD';

    // Fill Printer Form Fields
    document.getElementById('printer-width').value = settings.printer.width || '80mm';
    document.getElementById('printer-template').value = settings.printer.template || 'minimalist';
    document.getElementById('printer-connection').value = settings.printer.connection || 'browser';
    document.getElementById('printer-ip').value = settings.printer.ipAddress || '';
    document.getElementById('printer-header').value = settings.printer.headerText || '';
    document.getElementById('printer-footer').value = settings.printer.footerText || '';
    document.getElementById('printer-autoprint').checked = !!settings.printer.autoPrint;

    // Fill Notifications Form Fields
    document.getElementById('stock-threshold').value = settings.notifications.lowStockThreshold || 20;
    document.getElementById('email-alerts').checked = !!settings.notifications.emailAlerts;

    // Setup initial view
    toggleIpContainer(settings.printer.connection);
    togglePairButton(settings.printer.connection);
    updateConnectionStatusIndicator();
    updateReceiptPreview();

    // Tab Switching Logic
    const tabButtons = document.querySelectorAll('.settings-tab-btn');
    const tabContents = document.querySelectorAll('.settings-tab-content');

    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTab = btn.getAttribute('data-tab');

            // Toggle Buttons Style
            tabButtons.forEach(b => {
                b.className = "settings-tab-btn flex-1 md:flex-none text-center px-4 py-2 rounded-lg text-[11px] font-medium text-on-surface-variant hover:text-primary transition-all";
            });
            btn.className = "settings-tab-btn flex-1 md:flex-none text-center px-4 py-2 rounded-lg text-[11px] font-bold transition-all bg-primary text-on-primary shadow-sm";

            // Toggle Content Panels
            tabContents.forEach(content => {
                if (content.id === targetTab) {
                    content.classList.add('active');
                } else {
                    content.classList.remove('active');
                }
            });
        });
    });

    // Connection Change Listener (Show IP if WIFI, Show Pair if USB/Bluetooth)
    const connectionSelect = document.getElementById('printer-connection');
    connectionSelect.addEventListener('change', (e) => {
        const val = e.target.value;
        toggleIpContainer(val);
        togglePairButton(val);
    });

    // Pair Button Click Handler
    const pairBtn = document.getElementById('btn-pair-printer');
    pairBtn.addEventListener('click', async () => {
        const connType = document.getElementById('printer-connection').value;
        pairBtn.disabled = true;
        pairBtn.innerHTML = `<span class="material-symbols-outlined text-[16px] animate-spin">sync</span> Connecting...`;

        try {
            let res = { success: false, error: 'Invalid connection interface selected.' };
            if (connType === 'usb') {
                res = await Printer.connectUSB();
            } else if (connType === 'bluetooth') {
                res = await Printer.connectBluetooth();
            }

            if (res.success) {
                showToast(`Paired successfully: ${res.name}`, "success");
            } else {
                showToast(`Pairing failed: ${res.error || 'User cancelled'}`, "error");
            }
        } catch (e) {
            showToast("Pairing failed: " + e.message, "error");
        } finally {
            pairBtn.disabled = false;
            pairBtn.innerHTML = `<span class="material-symbols-outlined text-[16px]">sync</span> Pair Device`;
            updateConnectionStatusIndicator();
        }
    });

    // Inputs Live Update Listener for Receipt Preview
    const fieldsToWatch = [
        'company-name',
        'printer-header',
        'company-address',
        'company-phone',
        'printer-footer',
        'printer-template',
        'printer-width',
        'currency-symbol'
    ];

    fieldsToWatch.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('input', updateReceiptPreview);
            el.addEventListener('change', updateReceiptPreview);
        }
    });

    // Cancel Button
    const cancelBtn = document.getElementById('btn-settings-cancel');
    cancelBtn.addEventListener('click', () => {
        showToast("Changes discarded.");
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 500);
    });

    // Save Form
    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const updatedSettings = {
            general: {
                companyName: document.getElementById('company-name').value.trim(),
                phone: document.getElementById('company-phone').value.trim(),
                email: document.getElementById('company-email').value.trim(),
                address: document.getElementById('company-address').value.trim(),
                currency: document.getElementById('currency-symbol').value.trim() || '$',
                dateFormat: document.getElementById('date-format').value
            },
            printer: {
                width: document.getElementById('printer-width').value,
                template: document.getElementById('printer-template').value,
                connection: document.getElementById('printer-connection').value,
                ipAddress: document.getElementById('printer-ip').value.trim(),
                headerText: document.getElementById('printer-header').value.trim(),
                footerText: document.getElementById('printer-footer').value.trim(),
                autoPrint: document.getElementById('printer-autoprint').checked
            },
            notifications: {
                lowStockThreshold: parseInt(document.getElementById('stock-threshold').value) || 20,
                emailAlerts: document.getElementById('email-alerts').checked
            }
        };

        window.DB.saveSettings(updatedSettings);
        showToast("Configuration saved successfully!", "success");

        if (typeof window.updateMetrics === 'function') {
            window.updateMetrics();
        }
    });

    // Test Print Click
    const testPrintBtn = document.getElementById('btn-print-test');
    testPrintBtn.addEventListener('click', triggerTestPrint);

    // Database Actions: Export
    const exportBtn = document.getElementById('btn-db-export');
    exportBtn.addEventListener('click', () => {
        const fullData = window.DB.getData();
        const dataStr = JSON.stringify(fullData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);

        const link = document.createElement('a');
        const date = new Date().toISOString().split('T')[0];
        link.href = url;
        link.download = `aquaflow_backup_${date}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        showToast("Database exported successfully.", "success");
    });

    // Database Actions: Import Trigger
    const importBtn = document.getElementById('btn-db-import');
    const fileInput = document.getElementById('db-file-input');
    importBtn.addEventListener('click', () => {
        fileInput.click();
    });

    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const imported = JSON.parse(evt.target.result);
                if (imported.customers && imported.inventory && imported.orders) {
                    if (confirm("Warning: Restoring this backup will merge/overwrite the current active registry. Are you sure you want to proceed?")) {
                        window.DB.saveData(imported);
                        showToast("Database restored! Reloading system...", "success");
                        setTimeout(() => {
                            window.location.reload();
                        }, 1200);
                    }
                } else {
                    showToast("Error: Selected file is not a valid AquaFlow backup.", "error");
                }
            } catch (err) {
                showToast("Error: Failed to parse backup file.", "error");
            }
        };
        reader.readAsText(file);
    });

    // Database Actions: Reset Database
    const resetBtn = document.getElementById('btn-db-reset');
    resetBtn.addEventListener('click', () => {
        if (confirm("DANGER: This will wipe all orders, drivers, inventory alerts, custom clients, and reset settings back to default. This cannot be undone. Are you absolutely sure?")) {
            localStorage.removeItem('aquaflow_db_v1');
            showToast("Database wiped! Resetting parameters...", "error");
            setTimeout(() => {
                window.location.reload();
            }, 1200);
        }
    });
}

function toggleIpContainer(connType) {
    const ipContainer = document.getElementById('printer-ip-container');
    if (connType === 'wifi') {
        ipContainer.classList.remove('hidden');
    } else {
        ipContainer.classList.add('hidden');
    }
}

function togglePairButton(connType) {
    const pairBtn = document.getElementById('btn-pair-printer');
    if (connType === 'usb' || connType === 'bluetooth') {
        pairBtn.classList.remove('hidden');
    } else {
        pairBtn.classList.add('hidden');
    }
}

function updateConnectionStatusIndicator() {
    const indicator = document.getElementById('printer-connection-status');
    if (!indicator) return;

    const state = Printer.getConnectionState();
    if (state.status === 'connected') {
        indicator.innerHTML = `
            <span class="w-2.5 h-2.5 rounded-full bg-primary animate-pulse inline-block"></span>
            <span class="text-primary font-bold">Connected to ${state.name} (${state.type.toUpperCase()})</span>
        `;
    } else {
        const connType = document.getElementById('printer-connection').value;
        if (connType === 'usb' || connType === 'bluetooth') {
            indicator.innerHTML = `
                <span class="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
                <span class="text-amber-600 font-bold">Not Paired — Click "Pair Device" above</span>
            `;
        } else {
            indicator.innerHTML = `
                <span class="w-2.5 h-2.5 rounded-full bg-outline-variant/60 inline-block"></span>
                <span>System dialog will be used</span>
            `;
        }
    }
}

function updateReceiptPreview() {
    const container = document.getElementById('receipt-preview-container');
    if (!container) return;

    const template = document.getElementById('printer-template').value;
    const width = document.getElementById('printer-width').value;
    const currency = document.getElementById('currency-symbol').value.trim() || '$';
    
    // Header titles
    const headerVal = document.getElementById('printer-header').value.trim();
    const compNameVal = document.getElementById('company-name').value.trim();
    const titleText = (headerVal || compNameVal || 'AQUAFLOW PRO').toUpperCase();
    const addressText = document.getElementById('company-address').value.trim() || '456 Water Way, Aquapolis';
    const phoneText = document.getElementById('company-phone').value.trim();
    const footerText = document.getElementById('printer-footer').value.trim() || 'Thank you for your business!';
    
    const d = new Date();
    const dateText = d.toLocaleDateString();

    // Adjust paper width classes
    if (width === '58mm') {
        container.style.maxWidth = '250px';
        container.style.fontSize = '9px';
        container.classList.add('receipt-mono');
    } else if (width === '80mm') {
        container.style.maxWidth = '340px';
        container.style.fontSize = '11px';
        container.classList.add('receipt-mono');
    } else {
        container.style.maxWidth = '100%';
        container.style.fontSize = '13px';
        container.classList.remove('receipt-mono');
    }

    const receiptData = {
        title: titleText,
        address: addressText,
        phone: phoneText,
        date: dateText,
        invoiceId: '#INV-9408',
        client: 'City Plaza Offices',
        operator: 'Alex Henderson',
        template: template,
        subtotal: 90.00,
        tax: 4.50,
        taxPct: 5,
        total: 94.50,
        footer: footerText,
        items: [
            { name: '10 Gallon Jug Refill', qty: 3, total: 75.00 },
            { name: 'Empty Jug Return Deposit', qty: 3, total: 15.00 }
        ]
    };

    const settings = {
        general: {
            currency: currency
        }
    };

    container.innerHTML = Printer.renderReceiptHtml(receiptData, settings);
}

async function triggerTestPrint() {
    const width = document.getElementById('printer-width').value;
    const template = document.getElementById('printer-template').value;
    const connection = document.getElementById('printer-connection').value;
    const currency = document.getElementById('currency-symbol').value.trim() || '$';

    const receiptData = {
        title: document.getElementById('printer-header').value.trim() || document.getElementById('company-name').value.trim() || 'AquaFlow Pro',
        address: document.getElementById('company-address').value.trim(),
        phone: document.getElementById('company-phone').value.trim(),
        date: new Date().toLocaleDateString(),
        invoiceId: '#INV-TEST',
        client: 'City Plaza Offices',
        operator: 'Alex Henderson',
        template: template,
        subtotal: 90.00,
        tax: 4.50,
        taxPct: 5,
        total: 94.50,
        footer: document.getElementById('printer-footer').value.trim() || 'Thank you for your business!',
        items: [
            { name: '10 Gallon Jug Refill', qty: 3, total: 75.00 },
            { name: 'Empty Jug Return Deposit', qty: 3, total: 15.00 }
        ]
    };

    const settings = {
        general: {
            currency: currency
        },
        printer: {
            width: width,
            connection: connection
        }
    };

    // Attempt direct printing via USB/Bluetooth
    const isDirectPrinted = await Printer.printESC(receiptData, settings);

    if (!isDirectPrinted) {
        // Direct print failed or connection is System Print / Wifi
        if (connection === 'usb' || connection === 'bluetooth') {
            showToast("Falling back to system print dialog...", "info");
        }
        
        // Populate hidden print area
        const printArea = document.getElementById('print-receipt-container');
        if (printArea) {
            const previewEl = document.getElementById('receipt-preview-container');
            printArea.innerHTML = previewEl.innerHTML;
            printArea.className = previewEl.className;
            printArea.style.fontSize = previewEl.style.fontSize;
        }

        // Set printing variables
        let printWidth = '80mm';
        if (width === '58mm') {
            printWidth = '58mm';
        } else if (width === 'A4') {
            printWidth = '210mm';
        }

        document.documentElement.style.setProperty('--receipt-width', printWidth);
        window.print();
    }
}
