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

    // Fill Logo Preview from saved settings
    const logoPreviewImg = document.getElementById('logo-preview-img');
    const logoPlaceholder = document.getElementById('logo-placeholder');
    const btnRemoveLogo = document.getElementById('btn-remove-logo');
    let currentLogoData = settings.general.logo || '';

    function updateLogoPreview(dataUrl) {
        if (dataUrl) {
            logoPreviewImg.src = dataUrl;
            logoPreviewImg.classList.remove('hidden');
            logoPlaceholder.classList.add('hidden');
            btnRemoveLogo.style.display = 'flex';
            document.getElementById('logo-preview-wrapper').classList.remove('border-dashed');
            document.getElementById('logo-preview-wrapper').classList.add('border-solid', 'border-primary/30');
        } else {
            logoPreviewImg.src = '';
            logoPreviewImg.classList.add('hidden');
            logoPlaceholder.classList.remove('hidden');
            btnRemoveLogo.style.display = 'none';
            document.getElementById('logo-preview-wrapper').classList.add('border-dashed');
            document.getElementById('logo-preview-wrapper').classList.remove('border-solid', 'border-primary/30');
        }
        currentLogoData = dataUrl || '';
        updateReceiptPreview();
    }

    if (currentLogoData) {
        updateLogoPreview(currentLogoData);
    }

    // Logo Upload Button
    const logoFileInput = document.getElementById('logo-file-input');
    document.getElementById('btn-upload-logo').addEventListener('click', () => {
        logoFileInput.click();
    });

    logoFileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file size (max 500KB)
        if (file.size > 500 * 1024) {
            showToast('Logo file too large. Maximum 500KB allowed.', 'error');
            logoFileInput.value = '';
            return;
        }

        // Validate file type
        const validTypes = ['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp'];
        if (!validTypes.includes(file.type)) {
            showToast('Invalid file type. Use PNG, JPEG, SVG, or WebP.', 'error');
            logoFileInput.value = '';
            return;
        }

        const reader = new FileReader();
        reader.onload = (evt) => {
            updateLogoPreview(evt.target.result);
            showToast('Logo loaded! Click "Save Config" to apply.', 'success');
        };
        reader.readAsDataURL(file);
        logoFileInput.value = '';
    });

    // Remove Logo Button
    btnRemoveLogo.addEventListener('click', () => {
        updateLogoPreview('');
        showToast('Logo removed. Click "Save Config" to apply.', 'info');
    });

    // Fill Printer Form Fields
    document.getElementById('printer-width').value = settings.printer.width || '80mm';
    document.getElementById('printer-template').value = settings.printer.template || 'minimalist';
    document.getElementById('printer-connection').value = settings.printer.connection || 'browser';
    document.getElementById('printer-ip').value = settings.printer.ipAddress || '';
    document.getElementById('printer-header').value = settings.printer.headerText || '';
    document.getElementById('printer-hide-company-name').checked = !!settings.printer.hideCompanyName;
    document.getElementById('printer-footer').value = settings.printer.footerText || '';
    document.getElementById('printer-autoprint').checked = !!settings.printer.autoPrint;

    // Fill FBR Form Fields
    const fbr = settings.printer.fbr || {};
    document.getElementById('fbr-business-strn').value = fbr.businessStrn || '';
    document.getElementById('fbr-business-ntn').value = fbr.businessNtn || '';
    document.getElementById('fbr-pos-id').value = fbr.posId || '';
    document.getElementById('fbr-sales-tax-pct').value = fbr.salesTaxPct !== undefined ? fbr.salesTaxPct : 18;
    document.getElementById('fbr-client-name').value = fbr.clientName || '';
    document.getElementById('fbr-client-address').value = fbr.clientAddress || '';
    document.getElementById('fbr-client-ntn').value = fbr.clientNtn || '';
    document.getElementById('fbr-client-cnic').value = fbr.clientCnic || '';

    // Fill Delivery Form Fields
    const delivery = settings.printer.delivery || {};
    document.getElementById('delivery-driver').value = delivery.driver || '';
    document.getElementById('delivery-client').value = delivery.client || '';
    document.getElementById('delivery-address').value = delivery.address || '';

    // Populate Receipt Items rows
    const itemsContainer = document.getElementById('receipt-items-container');
    const items = settings.printer.items || [];

    function renderItemRow(item = { name: '', qty: 1, price: 0.00 }) {
        const currencySymbol = document.getElementById('currency-symbol')?.value.trim() || settings.general.currency || 'Rs.';
        const row = document.createElement('tr');
        row.className = 'hover:bg-surface-container-low/50 transition-all receipt-item-row group';
        row.innerHTML = `
            <td class="border-r border-outline-variant/30 p-0 relative">
                <input type="text" class="w-full bg-transparent border-0 focus:ring-inset focus:ring-2 focus:ring-primary/50 py-2.5 px-3 text-[12px] font-medium item-name outline-none" placeholder="Enter item description" value="${item.name}" required />
            </td>
            <td class="border-r border-outline-variant/30 p-0 relative">
                <input type="number" class="w-full bg-transparent border-0 focus:ring-inset focus:ring-2 focus:ring-primary/50 py-2.5 px-3 text-center text-[12px] font-medium item-qty outline-none" placeholder="1" value="${item.qty}" min="1" required />
            </td>
            <td class="border-r border-outline-variant/30 p-0 relative">
                <span class="absolute left-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant/60 text-[11px] font-bold currency-label select-none pointer-events-none">${currencySymbol}</span>
                <input type="number" step="0.01" class="w-full bg-transparent border-0 focus:ring-inset focus:ring-2 focus:ring-primary/50 py-2.5 pl-8 pr-3 text-right text-[12px] font-medium item-price outline-none" placeholder="0.00" value="${item.price}" min="0" required />
            </td>
            <td class="p-0 text-center relative">
                <button type="button" tabindex="-1" class="text-on-surface-variant/40 hover:text-error hover:bg-error/10 w-full h-full flex items-center justify-center py-2.5 btn-remove-receipt-item transition-all opacity-0 group-hover:opacity-100 focus:opacity-100" title="Remove Row">
                    <span class="material-symbols-outlined text-[18px]">close</span>
                </button>
            </td>
        `;

        row.querySelector('.btn-remove-receipt-item').addEventListener('click', () => {
            row.remove();
            updateReceiptPreview();
        });

        // Custom Tab navigation: price → next row's name, or Save Config if last row
        const priceInput = row.querySelector('.item-price');
        priceInput.addEventListener('keydown', (e) => {
            if (e.key === 'Tab' && !e.shiftKey) {
                const allRows = Array.from(itemsContainer.querySelectorAll('.receipt-item-row'));
                const currentIndex = allRows.indexOf(row);
                if (currentIndex < allRows.length - 1) {
                    // Jump to next row's item-name
                    e.preventDefault();
                    const nextName = allRows[currentIndex + 1].querySelector('.item-name');
                    if (nextName) nextName.focus();
                } else {
                    // Last row — jump to Save Config button
                    e.preventDefault();
                    const saveBtn = document.getElementById('btn-settings-save');
                    if (saveBtn) saveBtn.focus();
                }
            }
        });

        // Add listeners to input changes to update preview immediately
        row.querySelectorAll('input').forEach(input => {
            input.addEventListener('input', updateReceiptPreview);
            input.addEventListener('change', updateReceiptPreview);
        });

        itemsContainer.appendChild(row);
    }

    if (itemsContainer) {
        itemsContainer.innerHTML = '';
        if (items.length > 0) {
            items.forEach(item => renderItemRow(item));
        } else {
            // Seed a default row if empty
            renderItemRow({ name: '10 Gallon Jug Refill', qty: 3, price: 25.00 });
            renderItemRow({ name: 'Empty Jug Return Deposit', qty: 3, price: 5.00 });
        }

        const addRowBtn = document.getElementById('btn-add-receipt-item');
        addRowBtn.tabIndex = -1; // Skip Add Row in tab order
        addRowBtn.addEventListener('click', () => {
            renderItemRow();
            updateReceiptPreview();
        });

        // Listen for currency symbol changes to update the inline currency badges
        const currencyInput = document.getElementById('currency-symbol');
        if (currencyInput) {
            currencyInput.addEventListener('input', (e) => {
                const sym = e.target.value.trim() || 'Rs.';
                document.querySelectorAll('.receipt-item-row .currency-label').forEach(span => {
                    span.textContent = sym;
                });
            });
        }
    }

    // Fill Notifications Form Fields
    document.getElementById('stock-threshold').value = settings.notifications.lowStockThreshold || 20;
    document.getElementById('email-alerts').checked = !!settings.notifications.emailAlerts;

    // Setup initial view
    toggleIpContainer(settings.printer.connection);
    togglePairButton(settings.printer.connection);
    updateConnectionStatusIndicator();

    // Template Change Listener (Toggle template-specific fields in single tab)
    const templateSelect = document.getElementById('printer-template');
    function handleTemplateFieldsToggle(templateValue) {
        const taxSection = document.getElementById('receipt-tax-section');
        const deliverySection = document.getElementById('receipt-delivery-section');

        if (taxSection && deliverySection) {
            taxSection.classList.add('hidden');
            deliverySection.classList.add('hidden');

            if (templateValue === 'invoice' || templateValue === 'fbr') {
                taxSection.classList.remove('hidden');
            } else if (templateValue === 'delivery') {
                deliverySection.classList.remove('hidden');
            }
        }
    }

    // Check initially
    handleTemplateFieldsToggle(settings.printer.template);
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
        updateConnectionStatusIndicator();
    });

    templateSelect.addEventListener('change', (e) => {
        handleTemplateFieldsToggle(e.target.value);
        updateReceiptPreview();
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
        'currency-symbol',
        'fbr-business-strn',
        'fbr-business-ntn',
        'fbr-pos-id',
        'fbr-sales-tax-pct',
        'fbr-client-name',
        'fbr-client-address',
        'fbr-client-ntn',
        'fbr-client-cnic',
        'delivery-driver',
        'delivery-client',
        'delivery-address',
        'printer-hide-company-name'
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
            window.location.href = 'dashboard.html';
        }, 500);
    });

    // Save Form
    form.addEventListener('submit', (e) => {
        e.preventDefault();

        // Gather dynamic items
        const itemRows = document.querySelectorAll('.receipt-item-row');
        const itemsList = [];
        itemRows.forEach(row => {
            const name = row.querySelector('.item-name').value.trim();
            const qty = parseInt(row.querySelector('.item-qty').value) || 1;
            const price = parseFloat(row.querySelector('.item-price').value) || 0;
            if (name) {
                itemsList.push({ name, qty, price });
            }
        });

        const updatedSettings = {
            general: {
                companyName: document.getElementById('company-name').value.trim(),
                phone: document.getElementById('company-phone').value.trim(),
                email: document.getElementById('company-email').value.trim(),
                address: document.getElementById('company-address').value.trim(),
                currency: document.getElementById('currency-symbol').value.trim() || 'Rs.',
                dateFormat: document.getElementById('date-format').value,
                logo: currentLogoData
            },
            printer: {
                width: document.getElementById('printer-width').value,
                template: document.getElementById('printer-template').value,
                connection: document.getElementById('printer-connection').value,
                ipAddress: document.getElementById('printer-ip').value.trim(),
                headerText: document.getElementById('printer-header').value.trim(),
                hideCompanyName: document.getElementById('printer-hide-company-name').checked,
                footerText: document.getElementById('printer-footer').value.trim(),
                autoPrint: document.getElementById('printer-autoprint').checked,
                items: itemsList,
                fbr: {
                    businessStrn: document.getElementById('fbr-business-strn').value.trim(),
                    businessNtn: document.getElementById('fbr-business-ntn').value.trim(),
                    posId: document.getElementById('fbr-pos-id').value.trim(),
                    salesTaxPct: parseFloat(document.getElementById('fbr-sales-tax-pct').value) || 18,
                    clientName: document.getElementById('fbr-client-name').value.trim(),
                    clientAddress: document.getElementById('fbr-client-address').value.trim(),
                    clientNtn: document.getElementById('fbr-client-ntn').value.trim(),
                    clientCnic: document.getElementById('fbr-client-cnic').value.trim()
                },
                delivery: {
                    driver: document.getElementById('delivery-driver').value.trim(),
                    client: document.getElementById('delivery-client').value.trim(),
                    address: document.getElementById('delivery-address').value.trim()
                }
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
        } else if (connType === 'wifi') {
            indicator.innerHTML = `
                <span class="w-2.5 h-2.5 rounded-full bg-primary inline-block"></span>
                <span class="text-primary font-bold">Network Printing Enabled (IP)</span>
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

    // Gather dynamic items
    const itemRows = document.querySelectorAll('.receipt-item-row');
    const itemsList = [];
    let subtotal = 0;
    itemRows.forEach(row => {
        const nameEl = row.querySelector('.item-name');
        const qtyEl = row.querySelector('.item-qty');
        const priceEl = row.querySelector('.item-price');
        if (nameEl && qtyEl && priceEl) {
            const name = nameEl.value.trim();
            const qty = parseInt(qtyEl.value) || 1;
            const price = parseFloat(priceEl.value) || 0;
            if (name) {
                const total = qty * price;
                itemsList.push({ name, qty, total });
                subtotal += total;
            }
        }
    });

    if (itemsList.length === 0) {
        itemsList.push({ name: '10 Gallon Jug Refill', qty: 3, total: 75.00 });
        itemsList.push({ name: 'Empty Jug Return Deposit', qty: 3, total: 15.00 });
        subtotal = 90.00;
    }

    const fbrBusinessStrn = document.getElementById('fbr-business-strn')?.value.trim() || '9876543210123';
    const fbrBusinessNtn = document.getElementById('fbr-business-ntn')?.value.trim() || '1234567-8';
    const fbrPosId = document.getElementById('fbr-pos-id')?.value.trim() || 'POS-88992';
    const fbrSalesTaxPct = parseFloat(document.getElementById('fbr-sales-tax-pct')?.value) || 18;
    const fbrClientName = document.getElementById('fbr-client-name')?.value.trim() || 'City Plaza Offices';
    const fbrClientAddress = document.getElementById('fbr-client-address')?.value.trim() || addressText;
    const fbrClientNtn = document.getElementById('fbr-client-ntn')?.value.trim() || '7654321-0';
    const fbrClientCnic = document.getElementById('fbr-client-cnic')?.value.trim() || '42101-1234567-1';

    const deliveryDriver = document.getElementById('delivery-driver')?.value.trim() || 'Sarah Connor';
    const deliveryClient = document.getElementById('delivery-client')?.value.trim() || 'City Plaza Offices';
    const deliveryAddress = document.getElementById('delivery-address')?.value.trim() || addressText;

    const taxPct = template === 'fbr' ? fbrSalesTaxPct : (template === 'invoice' ? 5 : 0);
    const tax = subtotal * taxPct / 100;
    const total = subtotal + tax;

    const hideCompanyName = document.getElementById('printer-hide-company-name')?.checked || false;

    const receiptData = {
        title: titleText,
        hideCompanyName: hideCompanyName,
        address: template === 'delivery' ? deliveryAddress : addressText,
        phone: phoneText,
        date: dateText,
        invoiceId: '#INV-9408',
        client: template === 'delivery' ? deliveryClient : (template === 'fbr' ? fbrClientName : 'City Plaza Offices'),
        operator: 'Alex Henderson',
        template: template,
        subtotal: subtotal,
        tax: tax,
        taxPct: taxPct,
        total: total,
        footer: footerText,
        items: itemsList,
        driver: deliveryDriver
    };

    const settings = {
        general: {
            currency: currency,
            logo: document.getElementById('logo-preview-img')?.src || ''
        },
        printer: {
            width: width,
            fbr: {
                businessStrn: fbrBusinessStrn,
                businessNtn: fbrBusinessNtn,
                posId: fbrPosId,
                salesTaxPct: fbrSalesTaxPct,
                clientName: fbrClientName,
                clientAddress: fbrClientAddress,
                clientNtn: fbrClientNtn,
                clientCnic: fbrClientCnic
            },
            delivery: {
                driver: deliveryDriver,
                client: deliveryClient,
                address: deliveryAddress
            }
        }
    };

    container.innerHTML = Printer.renderReceiptHtml(receiptData, settings);
}

function showPrintPreviewModal(receiptData, settings, onConfirm) {
    // Inject custom simulator styles if not already present
    if (typeof Printer.injectSimulatorStyles === 'function') {
        Printer.injectSimulatorStyles();
    }

    const existing = document.getElementById('print-preview-modal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'print-preview-modal';
    modal.className = 'fixed inset-0 bg-black/75 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-sim-fade-in';

    const connType = settings.printer.connection;
    let connLabel = 'System Print Dialog';
    if (connType === 'usb') connLabel = 'USB Direct Printer';
    if (connType === 'bluetooth') connLabel = 'Bluetooth Printer';
    if (connType === 'wifi') connLabel = 'Network Printer';

    modal.innerHTML = `
        <div class="bg-surface rounded-3xl border border-outline-variant/20 p-6 shadow-[0_24px_50px_rgba(0,0,0,0.5)] max-w-[400px] w-full flex flex-col relative overflow-hidden animate-sim-slide-up text-on-surface transition-all duration-300">
            <!-- Close button -->
            <button type="button" id="btn-close-preview" class="absolute top-4 right-4 text-on-surface-variant hover:text-on-surface transition-colors">
                <span class="material-symbols-outlined">close</span>
            </button>

            <!-- Header -->
            <div class="flex items-center gap-2 mb-4">
                <span class="material-symbols-outlined text-primary text-[24px]">print_preview</span>
                <h3 class="text-[16px] font-bold">Print Preview</h3>
            </div>

            <p class="text-[11px] text-on-surface-variant/80 mb-4 leading-normal">
                Review the layout below. This will be transmitted via <strong class="text-primary">${connLabel}</strong>.
            </p>

            <!-- Receipt Scroll Container -->
            <div class="w-full overflow-hidden flex justify-center bg-surface-container-low/40 rounded-xl p-3 border border-outline-variant/10">
                <div class="w-full max-h-[300px] overflow-y-auto custom-scrollbar flex justify-center">
                    <div id="modal-receipt-paper" class="receipt-paper shadow-sm w-full max-w-[300px] p-4 text-left text-[10px] select-none overflow-hidden bg-white">
                        <!-- Rendered receipt content -->
                    </div>
                </div>
            </div>

            <!-- Controls -->
            <div class="w-full mt-5 flex gap-2">
                <button type="button" id="btn-cancel-print" class="flex-1 px-3 py-2.5 border border-outline-variant rounded-xl text-on-surface-variant hover:bg-surface-container-low text-[12px] font-bold transition-all">
                    Cancel
                </button>
                <button type="button" id="btn-wa-share" class="flex-1 bg-[#25d366] hover:bg-[#20ba5a] text-white py-2.5 rounded-xl text-[12px] font-bold shadow-[0_4px_12px_rgba(37,211,102,0.3)] transition-all flex items-center justify-center gap-1.5" title="Share as Image">
                    <span class="material-symbols-outlined text-[16px]">share</span> Share WA
                </button>
                <button type="button" id="btn-confirm-print" class="flex-1 bg-[#0f5238] hover:bg-[#1a734e] text-white py-2.5 rounded-xl text-[12px] font-bold shadow-[0_4px_12px_rgba(15,82,56,0.3)] transition-all flex items-center justify-center gap-1.5">
                    <span class="material-symbols-outlined text-[16px]">print</span> Print
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    const paper = document.getElementById('modal-receipt-paper');
    if (paper && typeof Printer.renderReceiptHtml === 'function') {
        paper.innerHTML = Printer.renderReceiptHtml(receiptData, settings);

        // Match receipt styling width but compress font sizes/scaling for a compact software preview
        const width = settings.printer.width || '80mm';
        if (width === '58mm') {
            paper.style.maxWidth = '220px';
            paper.style.fontSize = '7px';
            paper.style.lineHeight = '1.2';
            paper.classList.add('receipt-mono');
        } else if (width === '80mm') {
            paper.style.maxWidth = '280px';
            paper.style.fontSize = '8px';
            paper.style.lineHeight = '1.2';
            paper.classList.add('receipt-mono');
        } else if (width === 'A4') {
            paper.style.width = '794px'; // Standard A4 width in pixels
            paper.style.maxWidth = 'none';
            paper.style.zoom = '0.35'; // Perfect compact scaling for software preview
            paper.classList.remove('receipt-mono');
        } else {
            paper.style.maxWidth = '100%';
            paper.style.fontSize = '9px';
            paper.style.lineHeight = '1.2';
            paper.classList.remove('receipt-mono');
        }
    }

    const closeModal = () => {
        modal.classList.add('transition-opacity', 'duration-300', 'opacity-0');
        setTimeout(() => modal.remove(), 300);
    };

    document.getElementById('btn-close-preview').addEventListener('click', closeModal);
    document.getElementById('btn-cancel-print').addEventListener('click', closeModal);

    document.getElementById('btn-confirm-print').addEventListener('click', () => {
        closeModal();
        if (typeof onConfirm === 'function') {
            onConfirm();
        }
    });

    document.getElementById('btn-wa-share').addEventListener('click', async () => {
        closeModal(); // Close print preview modal

        if (typeof window.showWhatsAppDispatchModal === 'function') {
            const invoiceId = receiptData.invoiceId || '#INV-TEST';
            const dateText = receiptData.date || new Date().toLocaleDateString();
            const clientName = receiptData.client || 'Customer';
            const currency = (settings && settings.general && settings.general.currency) || 'Rs.';

            const message = `*${receiptData.title || 'AQUAFLOW PRO'} - RECEIPT*\n\n` +
                `*Client:* ${clientName}\n` +
                `*Invoice/Receipt ID:* ${invoiceId}\n` +
                `*Date:* ${dateText}\n` +
                `---------------------------\n` +
                `*Items:*\n` +
                (receiptData.items || []).map(i => `• ${i.name} (x${i.qty}): ${currency}${i.total.toFixed(2)}`).join('\n') + `\n` +
                `---------------------------\n` +
                `*Subtotal:* ${currency}${receiptData.subtotal.toFixed(2)}\n` +
                `*Sales Tax:* ${currency}${receiptData.tax.toFixed(2)}\n` +
                `*TOTAL:* ${currency}${receiptData.total.toFixed(2)}\n` +
                `---------------------------\n` +
                `${receiptData.footer || 'Thank you for your business!'}`;

            window.showWhatsAppDispatchModal({
                customer: { name: clientName, phone: receiptData.phone || '' },
                messageText: message,
                receiptData: receiptData,
                onDone: () => { }
            });
        } else {
            alert("WhatsApp dispatch module not loaded.");
        }
    });
}

async function triggerTestPrint() {
    const width = document.getElementById('printer-width').value;
    const template = document.getElementById('printer-template').value;
    const connection = document.getElementById('printer-connection').value;
    const currency = document.getElementById('currency-symbol').value.trim() || '$';

    // Gather dynamic items
    const itemRows = document.querySelectorAll('.receipt-item-row');
    const itemsList = [];
    let subtotal = 0;
    itemRows.forEach(row => {
        const nameEl = row.querySelector('.item-name');
        const qtyEl = row.querySelector('.item-qty');
        const priceEl = row.querySelector('.item-price');
        if (nameEl && qtyEl && priceEl) {
            const name = nameEl.value.trim();
            const qty = parseInt(qtyEl.value) || 1;
            const price = parseFloat(priceEl.value) || 0;
            if (name) {
                const total = qty * price;
                itemsList.push({ name, qty, total });
                subtotal += total;
            }
        }
    });

    if (itemsList.length === 0) {
        itemsList.push({ name: '10 Gallon Jug Refill', qty: 3, total: 75.00 });
        itemsList.push({ name: 'Empty Jug Return Deposit', qty: 3, total: 15.00 });
        subtotal = 90.00;
    }

    const fbrBusinessStrn = document.getElementById('fbr-business-strn')?.value.trim() || '9876543210123';
    const fbrBusinessNtn = document.getElementById('fbr-business-ntn')?.value.trim() || '1234567-8';
    const fbrPosId = document.getElementById('fbr-pos-id')?.value.trim() || 'POS-88992';
    const fbrSalesTaxPct = parseFloat(document.getElementById('fbr-sales-tax-pct')?.value) || 18;
    const fbrClientName = document.getElementById('fbr-client-name')?.value.trim() || 'City Plaza Offices';
    const fbrClientAddress = document.getElementById('fbr-client-address')?.value.trim() || document.getElementById('company-address').value.trim();
    const fbrClientNtn = document.getElementById('fbr-client-ntn')?.value.trim() || '7654321-0';
    const fbrClientCnic = document.getElementById('fbr-client-cnic')?.value.trim() || '42101-1234567-1';

    const deliveryDriver = document.getElementById('delivery-driver')?.value.trim() || 'Sarah Connor';
    const deliveryClient = document.getElementById('delivery-client')?.value.trim() || 'City Plaza Offices';
    const deliveryAddress = document.getElementById('delivery-address')?.value.trim() || document.getElementById('company-address').value.trim();

    const taxPct = template === 'fbr' ? fbrSalesTaxPct : (template === 'invoice' ? 5 : 0);
    const tax = subtotal * taxPct / 100;
    const total = subtotal + tax;

    const receiptData = {
        title: document.getElementById('printer-header').value.trim() || document.getElementById('company-name').value.trim() || 'AquaFlow Pro',
        hideCompanyName: document.getElementById('printer-hide-company-name')?.checked || false,
        address: template === 'delivery' ? deliveryAddress : document.getElementById('company-address').value.trim(),
        phone: document.getElementById('company-phone').value.trim(),
        date: new Date().toLocaleDateString(),
        invoiceId: '#INV-TEST',
        client: template === 'delivery' ? deliveryClient : (template === 'fbr' ? fbrClientName : 'City Plaza Offices'),
        operator: 'Alex Henderson',
        template: template,
        subtotal: subtotal,
        tax: tax,
        taxPct: taxPct,
        total: total,
        footer: document.getElementById('printer-footer').value.trim() || 'Thank you for your business!',
        items: itemsList,
        driver: deliveryDriver
    };

    const settings = {
        general: {
            currency: currency,
            logo: document.getElementById('logo-preview-img')?.src || ''
        },
        printer: {
            width: width,
            connection: connection,
            fbr: {
                businessStrn: fbrBusinessStrn,
                businessNtn: fbrBusinessNtn,
                posId: fbrPosId,
                salesTaxPct: fbrSalesTaxPct,
                clientName: fbrClientName,
                clientAddress: fbrClientAddress,
                clientNtn: fbrClientNtn,
                clientCnic: fbrClientCnic
            },
            delivery: {
                driver: deliveryDriver,
                client: deliveryClient,
                address: deliveryAddress
            }
        }
    };

    // Show print preview modal
    showPrintPreviewModal(receiptData, settings, async () => {
        // Attempt direct printing via USB/Bluetooth
        const isDirectPrinted = await Printer.printESC(receiptData, settings);

        if (!isDirectPrinted) {
            // Direct print failed or connection is System Print / Wifi
            if (connection === 'usb' || connection === 'bluetooth') {
                showToast("Falling back to system print dialog...", "info");
            }

            Printer._triggerSystemPrint(receiptData, settings, width);
        }
    });
}
