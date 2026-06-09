import { showToast } from '../ui/components.js';
import { Printer } from '../core/printer.js';

function routeToParent(currentPanelId) {
    let targetPage = '';
    if (currentPanelId === 'panel-customer-add') targetPage = 'customers.html';
    if (currentPanelId === 'panel-supplier-add') targetPage = 'suppliers.html';
    if (currentPanelId === 'panel-inventory-add') targetPage = 'inventory.html';
    if (currentPanelId === 'panel-order-add') targetPage = 'orders.html';
    if (currentPanelId === 'panel-payment-customer-add') targetPage = 'payment-customer-pending.html';
    if (currentPanelId === 'panel-payment-customer-pending-add') targetPage = 'payment-customer-pending.html';
    if (currentPanelId === 'panel-payment-customer-received-add') targetPage = 'payment-customer-received.html';
    if (currentPanelId === 'panel-payment-supplier-add') targetPage = 'payment-supplier-pending.html';
    if (currentPanelId === 'panel-payment-supplier-pending-add') targetPage = 'payment-supplier-pending.html';
    if (currentPanelId === 'panel-payment-supplier-received-add') targetPage = 'payment-supplier-received.html';

    if (targetPage) {
        window.location.href = targetPage;
    }
}

const PRODUCT_PRICES = {
    'INV-001': 25.00, // 10 Gallon Jug
    'INV-002': 15.00, // 5 Gallon Jug
    'INV-003': 45.00, // Carbon Filter Pro
    'INV-004': 5.00   // Replacement Spigot
};

export function initForms() {
    // 1. Populate Dropdowns for Order Form if panel is active
    const orderCustomerSelect = document.getElementById('order-customer');
    const orderProductSelect = document.getElementById('line-item-product');
    const orderItemsList = document.getElementById('order-items-list');
    const btnAddLineItem = document.getElementById('btn-add-line-item');
    const txtOrderTotal = document.getElementById('order-total-amount');
    const inputHiddenTotal = document.getElementById('hidden-order-total');
    const inputHiddenItems = document.getElementById('hidden-order-items-count');

    let addedItems = [];

    if (orderCustomerSelect && window.DB) {
        const customers = window.DB.getCustomers();
        if (customers.length === 0) {
            orderCustomerSelect.innerHTML = '<option value="">No customers — add one first</option>';
        } else {
            orderCustomerSelect.innerHTML = customers.map(c =>
                `<option value="${c.id}">${c.name} (${c.id})</option>`
            ).join('');
        }

        orderCustomerSelect.addEventListener('change', () => {
            updateBillBreakdown();
        });
        setTimeout(updateBillBreakdown, 50);
    }

    if (orderProductSelect && window.DB) {
        const inventory = window.DB.getInventory();
        const settings = window.DB.getSettings();
        const currency = settings.general.currency || 'Rs.';
        orderProductSelect.innerHTML = inventory.map(item =>
            `<option value="${item.id}">${item.name} (${currency}${(PRODUCT_PRICES[item.id] || 10.00).toFixed(2)}) - Stock: ${item.stock}</option>`
        ).join('');
    }

    function updateBillBreakdown() {
        const customerSelect = document.getElementById('order-customer');
        const txtSubtotal = document.getElementById('order-subtotal-disp');
        const txtPending = document.getElementById('customer-pending-disp');
        const txtTotal = document.getElementById('order-total-amount');

        let subtotal = 0;
        addedItems.forEach(item => {
            subtotal += item.price * item.qty;
        });

        let pending = 0;
        if (customerSelect && window.DB) {
            const custId = customerSelect.value;
            const customer = window.DB.getCustomers().find(c => c.id === custId);
            if (customer) {
                pending = parseFloat(customer.pendingAmount) || 0;
            }
        }

        const totalBill = subtotal + pending;
        const settings = window.DB ? window.DB.getSettings() : null;
        const currency = settings ? settings.general.currency || 'Rs.' : 'Rs.';

        if (txtSubtotal) txtSubtotal.textContent = `${currency}${subtotal.toFixed(2)}`;
        if (txtPending) txtPending.textContent = `${currency}${pending.toFixed(2)}`;
        if (txtTotal) txtTotal.textContent = `${currency}${totalBill.toFixed(2)}`;
        if (inputHiddenTotal) inputHiddenTotal.value = subtotal.toFixed(2);
    }

    function renderOrderItems() {
        if (!orderItemsList) return;
        if (addedItems.length === 0) {
            orderItemsList.innerHTML = `<p class="text-[11px] text-on-surface-variant/50 text-center py-2">No items added to order yet.</p>`;
            if (inputHiddenItems) inputHiddenItems.value = '0';
            updateBillBreakdown();
            return;
        }

        let totalAmount = 0;
        let totalCount = 0;
        const settings = window.DB ? window.DB.getSettings() : null;
        const currency = settings ? settings.general.currency || 'Rs.' : 'Rs.';

        orderItemsList.innerHTML = addedItems.map((item, idx) => {
            const itemTotal = item.price * item.qty;
            totalAmount += itemTotal;
            totalCount += item.qty;
            return `
                <div class="flex items-center justify-between bg-white/40 p-2 rounded-lg border border-outline-variant/10 text-[11px] font-medium">
                    <div class="flex flex-col">
                        <span class="font-bold text-on-surface">${item.name}</span>
                        <span class="text-on-surface-variant/70">Qty: ${item.qty} × ${currency}${item.price.toFixed(2)}</span>
                    </div>
                    <div class="flex items-center gap-3">
                        <span class="font-bold text-primary">${currency}${itemTotal.toFixed(2)}</span>
                        <button type="button" class="text-error hover:bg-error-container/20 p-1 rounded-md btn-remove-item" data-idx="${idx}">
                            <span class="material-symbols-outlined text-[14px]">close</span>
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        if (inputHiddenItems) inputHiddenItems.value = totalCount.toString();
        updateBillBreakdown();

        // Wire delete buttons
        orderItemsList.querySelectorAll('.btn-remove-item').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = parseInt(btn.getAttribute('data-idx'));
                addedItems.splice(idx, 1);
                renderOrderItems();
            });
        });
    }

    if (btnAddLineItem && orderProductSelect) {
        btnAddLineItem.addEventListener('click', (e) => {
            e.preventDefault();
            const prodId = orderProductSelect.value;
            const qtyInput = document.getElementById('line-item-qty');
            const qty = parseInt(qtyInput?.value) || 1;

            if (!prodId) return;

            const inventory = window.DB.getInventory();
            const prod = inventory.find(item => item.id === prodId);

            if (!prod) return;

            if (prod.stock < qty) {
                showToast(`Insufficient stock! Only ${prod.stock} items left.`, "error");
                return;
            }

            // Check if already added
            const existing = addedItems.find(item => item.id === prodId);
            if (existing) {
                if (prod.stock < (existing.qty + qty)) {
                    showToast(`Insufficient stock! Total requested (${existing.qty + qty}) exceeds available stock (${prod.stock}).`, "error");
                    return;
                }
                existing.qty += qty;
            } else {
                addedItems.push({
                    id: prodId,
                    name: prod.name,
                    qty: qty,
                    price: PRODUCT_PRICES[prodId] || 10.00
                });
            }

            if (qtyInput) qtyInput.value = 1;
            renderOrderItems();
            showToast(`${prod.name} added to order.`, "success");
        });
    }

    // 2. Setup standard Cancel / Save handling
    const addPanels = ['panel-customer-add', 'panel-supplier-add', 'panel-inventory-add', 'panel-order-add', 'panel-payment-customer-add', 'panel-payment-supplier-add', 'panel-payment-customer-pending-add', 'panel-payment-supplier-pending-add', 'panel-payment-customer-received-add', 'panel-payment-supplier-received-add'];

    addPanels.forEach(panelId => {
        const panel = document.getElementById(panelId);
        if (!panel) return;

        const form = panel.querySelector('form');
        const btnCancel = panel.querySelector('.form-btn-cancel');
        const btnSave = panel.querySelector('.form-btn-save');

        if (btnCancel && btnSave) {
            btnCancel.addEventListener('click', () => {
                if (form) form.reset();
                routeToParent(panelId);
            });

            btnSave.addEventListener('click', () => {
                let isValid = true;
                let firstInvalidInput = null;

                if (form) {
                    const inputs = form.querySelectorAll('input, select');
                    inputs.forEach(input => {
                        const label = input.previousElementSibling;
                        const isRequired = input.hasAttribute('required') || (label && label.tagName === 'LABEL' && label.textContent.includes('*'));
                        if (isRequired) {
                            if (!input.value.trim()) {
                                isValid = false;
                                input.classList.add('ring-2', 'ring-red-500/50', 'border-red-500/50');
                                input.addEventListener('input', () => {
                                    input.classList.remove('ring-2', 'ring-red-500/50', 'border-red-500/50');
                                }, { once: true });
                                if (!firstInvalidInput) firstInvalidInput = input;
                            }
                        }
                    });
                }

                if (panelId === 'panel-order-add' && addedItems.length === 0) {
                    isValid = false;
                    showToast("Please add at least one item to the order.", "error");
                    return;
                }

                if (!isValid) {
                    if (firstInvalidInput) {
                        showToast("Please fill in all required fields.", "error");
                        firstInvalidInput.focus();
                    }
                    return;
                }

                const formData = new FormData(form);
                const data = Object.fromEntries(formData.entries());

                let successMessage = "Entry saved successfully!";
                if (panelId.includes('payment') && window.DB) {
                    if (panelId.includes('customer')) {
                        data.entityType = 'customer';
                        data.type = 'received';
                    } else if (panelId.includes('supplier')) {
                        data.entityType = 'supplier';
                        data.type = 'paid';
                    }
                    window.DB.addPayment(data);
                    successMessage = "Payment record saved successfully!";
                } else if (panelId.includes('customer') && window.DB) {
                    window.DB.addCustomer(data);
                    successMessage = "Customer saved successfully!";
                } else if (panelId.includes('supplier') && window.DB) {
                    window.DB.addSupplier(data);
                    successMessage = "Supplier onboarded successfully!";
                } else if (panelId.includes('inventory') && window.DB) {
                    window.DB.addInventory(data);
                    successMessage = "Stock item added successfully!";
                } else if (panelId.includes('order') && window.DB) {
                    data.total = parseFloat(inputHiddenTotal.value) || 0;
                    data.items = parseInt(inputHiddenItems.value) || 0;

                    // Attach detailed items list for receipt printing
                    data.itemsDetail = addedItems.map(item => ({
                        name: item.name,
                        qty: item.qty,
                        total: item.price * item.qty
                    }));

                    // Add order to DB
                    const savedOrder = window.DB.addOrder(data);

                    // Decrement Inventory Stock in DB!
                    const dbData = window.DB.getData();
                    addedItems.forEach(item => {
                        const invItem = dbData.inventory.find(i => i.id === item.id);
                        if (invItem) {
                            invItem.stock = Math.max(0, invItem.stock - item.qty);
                            invItem.status = invItem.stock === 0 ? 'Out of Stock' : (invItem.stock <= invItem.threshold ? 'Low Stock' : 'In Stock');
                        }
                    });
                    window.DB.saveData(dbData);

                    successMessage = "Order created successfully!";

                    // Auto-print receipt if enabled in settings
                    const settings = window.DB.getSettings();
                    if (settings.printer && settings.printer.autoPrint) {
                        const printItems = addedItems.map(item => ({
                            name: item.name,
                            qty: item.qty,
                            total: item.price * item.qty
                        }));
                        const customer = window.DB.getCustomers().find(c => c.id === data.customerId);

                        const receiptData = {
                            title: settings.printer.headerText || settings.general.companyName || 'AquaFlow Pro',
                            hideCompanyName: !!settings.printer.hideCompanyName,
                            address: settings.general.address || '',
                            phone: settings.general.phone || '',
                            date: savedOrder.date || new Date().toLocaleDateString(),
                            invoiceId: savedOrder.id || `#ORD-${Math.floor(1000 + Math.random() * 9000)}`,
                            client: customer ? customer.name : 'Walk-in Customer',
                            operator: 'Alex Henderson',
                            template: settings.printer.template || 'minimalist',
                            subtotal: savedOrder.total,
                            tax: savedOrder.total * 0.05,
                            taxPct: 5,
                            total: savedOrder.total * 1.05,
                            footer: settings.printer.footerText || 'Thank you for your business!',
                            items: printItems
                        };

                        (async () => {
                            const printed = await Printer.printESC(receiptData, settings);
                            if (!printed) {
                                let printArea = document.getElementById('print-receipt-container');
                                if (!printArea) {
                                    printArea = document.createElement('div');
                                    printArea.id = 'print-receipt-container';
                                    document.body.appendChild(printArea);
                                }

                                // Apply classes and styles matching the preview container
                                printArea.className = 'receipt-paper text-left select-none overflow-hidden';
                                const width = settings.printer.width || '80mm';
                                if (width === '58mm') {
                                    printArea.style.maxWidth = '250px';
                                    printArea.style.fontSize = '9px';
                                    printArea.classList.add('receipt-mono');
                                } else if (width === '80mm') {
                                    printArea.style.maxWidth = '340px';
                                    printArea.style.fontSize = '11px';
                                    printArea.classList.add('receipt-mono');
                                } else {
                                    printArea.style.maxWidth = '100%';
                                    printArea.style.fontSize = '13px';
                                    printArea.classList.remove('receipt-mono');
                                }

                                printArea.innerHTML = Printer.renderReceiptHtml(receiptData, settings);

                                let printWidth = '80mm';
                                if (settings.printer.width === '58mm') {
                                    printWidth = '58mm';
                                } else if (settings.printer.width === 'A4') {
                                    printWidth = '210mm';
                                }
                                document.documentElement.style.setProperty('--receipt-width', printWidth);

                                window.print();

                                // Post system print trigger prompt to share on WhatsApp
                                setTimeout(() => {
                                    if (confirm("Receipt print dialog opened. Would you like to share this receipt on WhatsApp?")) {
                                        const currencySymbol = settings.general.currency || 'Rs.';
                                        const message = `*${receiptData.title || 'AQUAFLOW PRO'} - RECEIPT*\n\n` +
                                            `*Client:* ${receiptData.client}\n` +
                                            `*Invoice/Receipt ID:* ${receiptData.invoiceId}\n` +
                                            `*Date:* ${receiptData.date}\n` +
                                            `---------------------------\n` +
                                            `*Items:*\n` +
                                            (receiptData.items || []).map(i => `• ${i.name} (x${i.qty}): ${currencySymbol}${i.total.toFixed(2)}`).join('\n') + `\n` +
                                            `---------------------------\n` +
                                            `*Subtotal:* ${currencySymbol}${receiptData.subtotal.toFixed(2)}\n` +
                                            `*Sales Tax:* ${currencySymbol}${receiptData.tax.toFixed(2)}\n` +
                                            `*TOTAL:* ${currencySymbol}${receiptData.total.toFixed(2)}\n` +
                                            `---------------------------\n` +
                                            `${receiptData.footer || 'Thank you for your business!'}`;

                                        if (typeof window.showWhatsAppDispatchModal === 'function') {
                                            window.showWhatsAppDispatchModal({
                                                customer: customer,
                                                messageText: message,
                                                receiptData: receiptData
                                            });
                                        }
                                    }
                                }, 1000);
                            }
                        })();
                    }
                }

                if (window.renderAll) window.renderAll();

                showToast(successMessage, "success");

                setTimeout(() => {
                    if (form) form.reset();
                    addedItems = [];
                    routeToParent(panelId);
                }, 600);
            });
        }
    });
}
