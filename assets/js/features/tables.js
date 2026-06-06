import { showToast } from '../ui/components.js';
import { renderDashboard } from './dashboard.js';
import { Printer } from '../core/printer.js';

// ─── Pagination State ───────────────────────────────────────────────────────
const PAGINATION = {
    customers: { page: 1, perPage: 12 },
    suppliers: { page: 1, perPage: 12 },
    inventory: { page: 1, perPage: 12 },
    orders: { page: 1, perPage: 12 }
};

function updatePaginationUI(type, totalItems) {
    const state = PAGINATION[type];
    const totalPages = Math.ceil(totalItems / state.perPage) || 1;

    if (state.page > totalPages) state.page = totalPages;
    if (state.page < 1) state.page = 1;

    const startItem = totalItems === 0 ? 0 : ((state.page - 1) * state.perPage) + 1;
    const endItem = Math.min(state.page * state.perPage, totalItems);

    const infoSpan = document.getElementById(`pagination-${type}-info`);
    if (infoSpan) infoSpan.textContent = `Showing ${startItem}–${endItem} of ${totalItems}`;

    const btnPrev = document.getElementById(`btn-prev-${type}`);
    const btnNext = document.getElementById(`btn-next-${type}`);
    if (btnPrev) btnPrev.disabled = state.page <= 1;
    if (btnNext) btnNext.disabled = state.page >= totalPages;
}

function getPage(items, type) {
    const { page, perPage } = PAGINATION[type];
    return items.slice((page - 1) * perPage, page * perPage);
}

// ─── Status Badge Helper ─────────────────────────────────────────────────────
function statusBadge(status) {
    const map = {
        'Active': 'bg-primary/10 text-primary',
        'Inactive': 'bg-outline-variant/30 text-on-surface-variant',
        'Review': 'bg-error-container/60 text-error',
        'In Stock': 'bg-primary/10 text-primary',
        'Low Stock': 'bg-error-container/60 text-error',
        'Out of Stock': 'bg-error text-on-error',
        'Processing': 'bg-primary-container/60 text-primary',
        'Shipped': 'bg-secondary/10 text-secondary',
        'Delivered': 'bg-primary/10 text-primary',
        'Pending': 'bg-tertiary-container/40 text-tertiary',
    };
    const cls = map[status] || 'bg-outline-variant/30 text-on-surface-variant';
    return `<span class="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${cls}">${status}</span>`;
}

window.showReceivableSlip = function (customerId) {
    if (!window.DB) return;
    const customer = window.DB.getCustomers().find(c => c.id === customerId);
    if (!customer) return;

    const settings = window.DB.getSettings();
    const currency = settings.general.currency || 'Rs.';

    const existing = document.getElementById('receivable-slip-modal');
    if (existing) existing.remove();

    if (typeof Printer.injectSimulatorStyles === 'function') {
        Printer.injectSimulatorStyles();
    }

    // Dynamic Ledger Calculation
    const outstandingOrders = window.DB.getOrders().filter(o => o.customerId === customerId && o.status !== 'Delivered');
    const sumOutstanding = outstandingOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
    const openingBalance = customer.pendingAmount - sumOutstanding;

    const ledgerItems = [];
    outstandingOrders.forEach(o => {
        ledgerItems.push({
            ref: o.id,
            description: `Order dispatch (${o.status})`,
            amount: Number(o.total)
        });
    });

    if (openingBalance !== 0 || ledgerItems.length === 0) {
        ledgerItems.push({
            ref: 'OPENING',
            description: 'Prior Unpaid Ledger Balance',
            amount: openingBalance
        });
    }

    const modal = document.createElement('div');
    modal.id = 'receivable-slip-modal';
    modal.className = 'fixed inset-0 bg-black/75 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-sim-fade-in';

    modal.innerHTML = `
        <div class="bg-surface rounded-3xl border border-outline-variant/20 p-6 shadow-[0_24px_50px_rgba(0,0,0,0.5)] max-w-[400px] w-full flex flex-col relative overflow-hidden animate-sim-slide-up text-on-surface">
            <!-- Close button -->
            <button id="btn-close-slip" class="absolute top-4 right-4 text-on-surface-variant hover:text-on-surface transition-colors">
                <span class="material-symbols-outlined">close</span>
            </button>

            <!-- Header -->
            <div class="flex items-center gap-2 mb-4">
                <span class="material-symbols-outlined text-primary text-[24px]">receipt_long</span>
                <h3 class="text-[16px] font-bold">Receivable Statement</h3>
            </div>

            <!-- Customer Meta -->
            <div class="bg-surface-container-low/40 rounded-xl p-3 border border-outline-variant/10 mb-4 text-[11px] space-y-1">
                <div><strong>Client:</strong> ${customer.name}</div>
                <div><strong>Phone:</strong> ${customer.phone || 'N/A'}</div>
                <div><strong>Date:</strong> ${new Date().toLocaleDateString()}</div>
                <div><strong>Statement ID:</strong> #REC-${customer.id}</div>
            </div>

            <!-- Receivable Excel-style Grid Table -->
            <div class="w-full bg-surface-container-low/40 rounded-xl p-3 border border-outline-variant/10 mb-4 flex justify-center">
                <table class="w-full text-left border-collapse border border-gray-400 text-[10px] bg-white text-black">
                    <thead>
                        <tr class="bg-gray-100 border-b border-gray-400 font-bold">
                            <th class="border border-gray-400 px-2 py-1 w-20">Ref/Date</th>
                            <th class="border border-gray-400 px-2 py-1">Description</th>
                            <th class="border border-gray-400 px-2 py-1 text-right w-20">Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${ledgerItems.map(item => `
                            <tr>
                                <td class="border border-gray-300 px-2 py-1 font-mono">${item.ref}</td>
                                <td class="border border-gray-300 px-2 py-1 text-gray-700">${item.description}</td>
                                <td class="border border-gray-300 px-2 py-1 text-right font-bold text-red-600">${currency}${item.amount.toFixed(2)}</td>
                            </tr>
                        `).join('')}
                        <tr class="bg-gray-50 font-bold">
                            <td colspan="2" class="border border-gray-300 px-2 py-1 text-right">TOTAL DUE:</td>
                            <td class="border border-gray-300 px-2 py-1 text-right text-red-600">${currency}${customer.pendingAmount.toFixed(2)}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <!-- Controls -->
            <div class="w-full flex flex-col gap-2">
                <div class="flex gap-2">
                    <button type="button" id="btn-print-slip" class="flex-1 bg-[#0f5238] hover:bg-[#1a734e] text-white py-2.5 rounded-xl text-[12px] font-bold shadow-sm transition-all flex items-center justify-center gap-1.5">
                        <span class="material-symbols-outlined text-[16px]">print</span> Print Slip
                    </button>
                    <button type="button" id="btn-whatsapp-slip" class="flex-1 bg-[#25d366] hover:bg-[#20ba5a] text-white py-2.5 rounded-xl text-[12px] font-bold shadow-sm transition-all flex items-center justify-center gap-1.5">
                        <span class="material-symbols-outlined text-[16px]">share</span> Share WhatsApp
                    </button>
                </div>
                <button type="button" id="btn-dismiss-slip" class="w-full py-2 border border-outline-variant rounded-xl text-on-surface-variant hover:bg-surface-container-low text-[12px] font-bold transition-all">
                    Close
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    const closeModal = () => {
        modal.classList.add('transition-opacity', 'duration-300', 'opacity-0');
        setTimeout(() => modal.remove(), 300);
    };

    document.getElementById('btn-close-slip').addEventListener('click', closeModal);
    document.getElementById('btn-dismiss-slip').addEventListener('click', closeModal);

    // Share on WhatsApp button
    document.getElementById('btn-whatsapp-slip').addEventListener('click', () => {
        const defaultMessageText = `*AQUAFLOW PRO - RECEIVABLE STATEMENT*\n\n` +
            `*Client:* ${customer.name}\n` +
            `*Statement ID:* #REC-${customer.id}\n` +
            `*Date:* ${new Date().toLocaleDateString()}\n` +
            `---------------------------\n` +
            `*Statement Ledger Breakdowns:*\n` +
            ledgerItems.map(item => `• ${item.ref}: ${item.description} - ${currency}${item.amount.toFixed(2)}`).join('\n') + `\n` +
            `---------------------------\n` +
            `*Total Outstanding Due:* ${currency}${customer.pendingAmount.toFixed(2)}\n` +
            `---------------------------\n` +
            `Please clear your outstanding balance at your earliest convenience. Thank you!`;

        const slipData = {
            title: "RECEIVABLE SLIP",
            address: settings.general.address || '456 Water Way, Aquapolis',
            phone: settings.general.phone || '',
            date: new Date().toLocaleDateString(),
            invoiceId: `#BAL-${customer.id}`,
            client: customer.name,
            operator: 'Alex Henderson',
            template: 'minimalist',
            subtotal: customer.pendingAmount,
            tax: 0,
            taxPct: 0,
            total: customer.pendingAmount,
            footer: "Please clear the outstanding balance.",
            items: ledgerItems.map(item => ({
                qty: item.ref,
                name: item.description,
                total: item.amount
            }))
        };

        window.showWhatsAppDispatchModal({
            customer: customer,
            messageText: defaultMessageText,
            receiptData: slipData,
            onDone: closeModal
        });
    });

    // Print slip button
    document.getElementById('btn-print-slip').addEventListener('click', async () => {
        const slipData = {
            title: "RECEIVABLE SLIP",
            address: settings.general.address || '456 Water Way, Aquapolis',
            phone: settings.general.phone || '',
            date: new Date().toLocaleDateString(),
            invoiceId: `#BAL-${customer.id}`,
            client: customer.name,
            operator: 'Alex Henderson',
            template: 'minimalist',
            subtotal: customer.pendingAmount,
            tax: 0,
            taxPct: 0,
            total: customer.pendingAmount,
            footer: "Please clear the outstanding balance.",
            items: ledgerItems.map(item => ({
                qty: item.ref,
                name: item.description,
                total: item.amount
            }))
        };

        closeModal();

        const printed = await Printer.printESC(slipData, settings);

        if (!printed) {
            const width = settings.printer.width || '80mm';
            Printer._triggerSystemPrint(slipData, settings, width);
        }
    });
};


// ─── Loading & Empty State Helpers ──────────────────────────────────────────
function renderWithSkeleton(list, html) {
    if (!list) return;
    const skeleton = Array(4).fill(
        '<div class="glass-card rounded-xl p-4 flex flex-col gap-3">' +
            '<div class="flex items-center gap-3">' +
                '<div class="w-10 h-10 rounded-full skeleton-loader shrink-0"></div>' +
                '<div class="flex-1 space-y-2">' +
                    '<div class="h-3 w-1/2 skeleton-loader"></div>' +
                    '<div class="h-2 w-1/3 skeleton-loader"></div>' +
                '</div>' +
            '</div>' +
            '<div class="border-t border-outline-variant/10 pt-3 space-y-2 mt-1">' +
                '<div class="h-2 w-full skeleton-loader"></div>' +
                '<div class="h-2 w-4/5 skeleton-loader"></div>' +
            '</div>' +
        '</div>'
    ).join('');

    list.innerHTML = skeleton;
    
    setTimeout(() => {
        list.innerHTML = html;
        const cards = list.querySelectorAll(':scope > div.glass-card');
        cards.forEach((c, i) => {
            const staggerClass = 'stagger-' + Math.min(i + 1, 6);
            c.classList.add(staggerClass);
        });
    }, 250);
}

function getEmptyStateHTML(icon, title, desc, linkUrl, linkText) {
    return '<div class="col-span-full py-16 flex flex-col items-center justify-center text-center">' +
        '<div class="w-20 h-20 rounded-full bg-surface-variant/30 flex items-center justify-center mb-4 border border-outline-variant/10">' +
            '<span class="material-symbols-outlined text-[40px] text-on-surface-variant/40">' + icon + '</span>' +
        '</div>' +
        '<h3 class="text-[16px] font-bold text-on-surface mb-1">' + title + '</h3>' +
        '<p class="text-[12px] text-on-surface-variant mb-4 max-w-xs">' + desc + '</p>' +
        '<a href="' + linkUrl + '" class="bg-primary text-on-primary px-5 py-2.5 rounded-lg text-[12px] font-bold shadow-md hover:shadow-lg transition-all ripple-btn">' + linkText + '</a>' +
    '</div>';
}

// ─── Render: Customers ───────────────────────────────────────────────────────
function renderCustomers() {
    const list = document.getElementById('customers-card-list');
    if (!list || !window.DB) return;

    let all = window.DB.getCustomers();
    const path = window.location.pathname;

    if (path.includes('customer-balances.html')) {
        all = all.filter(c => c.pendingAmount > 0);
    } else if (path.includes('customer-segments.html')) {
        // Retail: <=10 orders, Wholesale: >10 orders
        all = all.sort((a, b) => b.totalOrders - a.totalOrders);
    }

    const settings = window.DB.getSettings();
    const currency = settings.general.currency || 'Rs.';
    updatePaginationUI('customers', all.length);
    const items = getPage(all, 'customers');

    if (items.length === 0) {
        const emptyHtml = getEmptyStateHTML('group_off', 'No Customers Found', 'You haven\'t added any customers yet. Add your first customer to start tracking.', 'customer-add.html', 'Add Customer');
        renderWithSkeleton(list, emptyHtml);
        return;
    }

    const html = items.map(c => `
        <div class="glass-card rounded-xl p-4 flex flex-col gap-2 group cursor-pointer">
            <div class="flex items-center justify-between gap-2">
                <div class="flex items-center gap-2 min-w-0">
                    <div class="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 font-bold text-[13px]">
                        ${c.name.charAt(0)}
                    </div>
                    <div class="min-w-0">
                        <p class="text-[12px] font-bold text-on-surface truncate leading-tight">${c.name}</p>
                        <p class="text-[10px] text-on-surface-variant truncate">${c.email}</p>
                    </div>
                </div>
                ${statusBadge(c.status)}
            </div>
            <div class="border-t border-outline-variant/10 pt-2 grid grid-cols-3 gap-1">
                <div>
                    <p class="text-[9px] uppercase text-on-surface-variant/60 font-bold tracking-wider">Orders</p>
                    <p class="text-[13px] font-bold text-on-surface">${c.totalOrders}</p>
                </div>
                <div>
                    <p class="text-[9px] uppercase text-on-surface-variant/60 font-bold tracking-wider">Pending</p>
                    <p class="text-[13px] font-bold text-error">${currency}${(c.pendingAmount || 0).toFixed(2)}</p>
                </div>
                <div>
                    <p class="text-[9px] uppercase text-on-surface-variant/60 font-bold tracking-wider">Last Order</p>
                    <p class="text-[11px] font-medium text-on-surface truncate">${c.lastOrder}</p>
                </div>
            </div>
            <p class="text-[10px] text-on-surface-variant/70 flex items-center justify-between gap-1 mt-1">
                <span class="flex items-center gap-1"><span class="material-symbols-outlined text-[12px]">call</span>${c.phone || 'N/A'}</span>
                <span class="flex items-center gap-1.5 shrink-0">
                    ${c.pendingAmount > 0 ? `
                        <button onclick="event.stopPropagation(); window.showReceivableSlip('${c.id}');" class="text-primary hover:bg-primary/10 px-2 py-0.5 rounded-md transition-colors flex items-center gap-0.5 border border-primary/20" title="Receivable Slip">
                            <span class="material-symbols-outlined text-[14px]">receipt_long</span>
                            <span class="text-[9px] font-bold">Slip</span>
                        </button>
                    ` : ''}
                    <button onclick="event.stopPropagation(); if(confirm('Are you sure you want to delete ${c.name}?')) { window.DB.deleteRecord('customers', '${c.id}'); window.renderAll(); }" class="text-error hover:bg-error-container/20 p-1 rounded-md transition-colors font-bold" title="Delete Customer">
                        <span class="material-symbols-outlined text-[15px]">delete</span>
                    </button>
                </span>
            </p>
        </div>
    `).join('');
    renderWithSkeleton(list, html);
}

// ─── Render: Suppliers ───────────────────────────────────────────────────────
function renderSuppliers() {
    const list = document.getElementById('suppliers-card-list');
    if (!list || !window.DB) return;

    let all = window.DB.getSuppliers();
    const path = window.location.pathname;

    if (path.includes('supplier-active.html')) {
        all = all.filter(s => s.status === 'Active');
    }
    updatePaginationUI('suppliers', all.length);
    const items = getPage(all, 'suppliers');

    if (items.length === 0) {
        const emptyHtml = getEmptyStateHTML('inventory_2', 'No Suppliers Found', 'Keep track of your vendors and suppliers by adding them to the system.', 'supplier-add.html', 'Add Supplier');
        renderWithSkeleton(list, emptyHtml);
        return;
    }

    const stars = (rating) => {
        const full = Math.floor(rating);
        return '★'.repeat(full) + '☆'.repeat(5 - full) + ` <span class="text-[10px] font-normal">${rating}</span>`;
    };

    const html = items.map(s => `
        <div class="glass-card rounded-xl p-4 flex flex-col gap-2 group cursor-pointer">
            <div class="flex items-center justify-between gap-2">
                <div class="flex items-center gap-2 min-w-0">
                    <div class="w-8 h-8 rounded-lg bg-secondary/10 text-secondary flex items-center justify-center shrink-0 font-bold text-[13px]">
                        ${s.name.charAt(0)}
                    </div>
                    <div class="min-w-0">
                        <p class="text-[12px] font-bold text-on-surface truncate leading-tight">${s.name}</p>
                        <p class="text-[10px] text-on-surface-variant truncate">${s.category}</p>
                    </div>
                </div>
                ${statusBadge(s.status)}
            </div>
            <div class="border-t border-outline-variant/10 pt-2 grid grid-cols-2 gap-1">
                <div>
                    <p class="text-[9px] uppercase text-on-surface-variant/60 font-bold tracking-wider">Contact</p>
                    <p class="text-[11px] font-medium text-on-surface">${s.contact}</p>
                </div>
                <div>
                    <p class="text-[9px] uppercase text-on-surface-variant/60 font-bold tracking-wider">Rating</p>
                    <p class="text-[13px] font-bold text-amber-500">${stars(s.rating)}</p>
                </div>
            </div>
            <p class="text-[10px] text-on-surface-variant/70 flex items-center justify-between gap-1 mt-1">
                <span class="flex items-center gap-1"><span class="material-symbols-outlined text-[12px]">call</span>${s.phone || 'N/A'}</span>
                <button onclick="event.stopPropagation(); if(confirm('Are you sure you want to delete ${s.name}?')) { window.DB.deleteRecord('suppliers', '${s.id}'); window.renderAll(); }" class="text-error hover:bg-error-container/20 p-1 rounded-md transition-colors" title="Delete Supplier">
                    <span class="material-symbols-outlined text-[16px]">delete</span>
                </button>
            </p>
        </div>
    `).join('');
    renderWithSkeleton(list, html);
}

// ─── Render: Inventory ───────────────────────────────────────────────────────
function renderInventory() {
    const list = document.getElementById('inventory-card-list');
    if (!list || !window.DB) return;

    let all = window.DB.getInventory();
    const path = window.location.pathname;

    if (path.includes('inventory-alerts.html')) {
        all = all.filter(i => i.stock <= i.threshold);
    }
    updatePaginationUI('inventory', all.length);
    const items = getPage(all, 'inventory');

    if (items.length === 0) {
        const emptyHtml = getEmptyStateHTML('water_bottle', 'Inventory is Empty', 'Add items to your inventory to keep track of stock levels and pricing.', 'inventory-add.html', 'Add Inventory Item');
        renderWithSkeleton(list, emptyHtml);
        return;
    }

    const html = items.map(item => {
        const pct = item.threshold > 0 ? Math.min(100, Math.round((item.stock / (item.threshold * 2)) * 100)) : 100;
        const barColor = item.stock === 0 ? 'bg-error' : (item.stock <= item.threshold ? 'bg-amber-400' : 'bg-primary');
        return `
        <div class="glass-card rounded-xl p-4 flex flex-col gap-2 group cursor-pointer">
            <div class="flex items-center justify-between gap-2">
                <div class="min-w-0">
                    <p class="text-[12px] font-bold text-on-surface truncate leading-tight">${item.name}</p>
                    <p class="text-[10px] text-on-surface-variant font-mono">${item.sku}</p>
                </div>
                <div class="flex items-center gap-1 shrink-0">
                    ${statusBadge(item.status)}
                    <button onclick="event.stopPropagation(); if(confirm('Are you sure you want to delete ${item.name}?')) { window.DB.deleteRecord('inventory', '${item.id}'); window.renderAll(); }" class="text-error hover:bg-error-container/20 p-1 rounded-md transition-colors" title="Delete Item">
                        <span class="material-symbols-outlined text-[16px]">delete</span>
                    </button>
                </div>
            </div>
            <div class="border-t border-outline-variant/10 pt-2">
                <div class="flex justify-between items-center mb-1">
                    <p class="text-[9px] uppercase text-on-surface-variant/60 font-bold tracking-wider">Stock Level</p>
                    <p class="text-[12px] font-bold text-on-surface">${item.stock} <span class="text-[9px] font-normal text-on-surface-variant">/ min ${item.threshold}</span></p>
                </div>
                <div class="w-full h-1.5 bg-outline-variant/20 rounded-full overflow-hidden">
                    <div class="h-full ${barColor} rounded-full transition-all" style="width:${pct}%"></div>
                </div>
            </div>
            <div class="grid grid-cols-2 gap-1">
                <div>
                    <p class="text-[9px] uppercase text-on-surface-variant/60 font-bold tracking-wider">Category</p>
                    <p class="text-[11px] font-medium text-on-surface">${item.category}</p>
                </div>
                <div>
                    <p class="text-[9px] uppercase text-on-surface-variant/60 font-bold tracking-wider">Last Restock</p>
                    <p class="text-[11px] font-medium text-on-surface">${item.lastRestock}</p>
                </div>
            </div>
        </div>`;
    }).join('');
    renderWithSkeleton(list, html);
}

// ─── Order Status Flow ───────────────────────────────────────────────────────
const ORDER_FLOW = ['Processing', 'Shipped', 'Delivered'];

window.advanceOrderStatus = function (id) {
    if (!window.DB) return;
    const order = window.DB.getOrders().find(o => o.id === id);
    if (!order) return;
    const idx = ORDER_FLOW.indexOf(order.status);
    if (idx < ORDER_FLOW.length - 1) {
        window.DB.updateOrderStatus(id, ORDER_FLOW[idx + 1]);
        showToast(`Order ${id} moved to ${ORDER_FLOW[idx + 1]}.`, 'success');
        window.renderAll();
    } else {
        showToast(`Order ${id} is already delivered.`);
    }
};

// ─── Render: Orders ──────────────────────────────────────────────────────────
function renderOrders() {
    const list = document.getElementById('orders-card-list');
    if (!list || !window.DB) return;

    let all = window.DB.getOrders();
    const path = window.location.pathname;

    if (path.includes('orders-pending.html')) {
        all = all.filter(o => o.status !== 'Delivered');
    } else if (path.includes('orders-completed.html')) {
        all = all.filter(o => o.status === 'Delivered');
    }

    const settings = window.DB.getSettings();
    const currency = settings.general.currency || 'Rs.';
    updatePaginationUI('orders', all.length);
    const items = getPage(all, 'orders');

    if (items.length === 0) {
        const emptyHtml = getEmptyStateHTML('shopping_cart_off', 'No Orders Yet', 'Ready to make a sale? Create your first order to get started.', 'order-add.html', 'Create Order');
        renderWithSkeleton(list, emptyHtml);
        return;
    }

    const html = items.map(o => `
        <div class="glass-card rounded-xl p-4 flex flex-col gap-2 group cursor-pointer">
            <div class="flex items-center justify-between gap-2">
                <p class="text-[12px] font-bold text-on-surface font-mono">${o.id}</p>
                <div class="flex items-center gap-1">
                    ${statusBadge(o.status)}
                    <button onclick="event.stopPropagation(); window.printOrder('${o.id}');" class="text-primary hover:bg-primary/10 p-1 rounded-md transition-colors" title="Print Receipt">
                        <span class="material-symbols-outlined text-[16px]">print</span>
                    </button>
                    <button onclick="event.stopPropagation(); if(confirm('Are you sure you want to cancel and delete order ${o.id}?')) { window.DB.deleteRecord('orders', '${o.id}'); window.renderAll(); }" class="text-error hover:bg-error-container/20 p-1 rounded-md transition-colors" title="Delete Order">
                        <span class="material-symbols-outlined text-[16px]">delete</span>
                    </button>
                </div>
            </div>
            <p class="text-[11px] text-on-surface-variant">${o.customerName || '—'}</p>
            <div class="border-t border-outline-variant/10 pt-2 grid grid-cols-2 gap-1">
                <div>
                    <p class="text-[9px] uppercase text-on-surface-variant/60 font-bold tracking-wider">Total</p>
                    <p class="text-[14px] font-bold text-primary">${currency}${Number(o.total).toFixed(2)}</p>
                </div>
                <div>
                    <p class="text-[9px] uppercase text-on-surface-variant/60 font-bold tracking-wider">Items</p>
                    <p class="text-[13px] font-bold text-on-surface">${o.items}</p>
                </div>
                <div>
                    <p class="text-[9px] uppercase text-on-surface-variant/60 font-bold tracking-wider">Ordered</p>
                    <p class="text-[11px] font-medium text-on-surface">${o.date}</p>
                </div>
                <div>
                    <p class="text-[9px] uppercase text-on-surface-variant/60 font-bold tracking-wider">Expected</p>
                    <p class="text-[11px] font-medium text-on-surface">${o.expectedDate || '—'}</p>
                </div>
            </div>
            ${o.status !== 'Delivered' ? `
            <button onclick="event.stopPropagation(); window.advanceOrderStatus('${o.id}')"
                class="mt-1 w-full py-1.5 rounded-lg bg-primary/10 text-primary text-[10px] font-bold hover:bg-primary/20 transition-colors flex items-center justify-center gap-1">
                <span class="material-symbols-outlined text-[14px]">local_shipping</span>
                Advance to ${ORDER_FLOW[ORDER_FLOW.indexOf(o.status) + 1] || 'Delivered'}
            </button>` : ''}
        </div>
    `).join('');
    renderWithSkeleton(list, html);
}

// ─── Wire Pagination Buttons ─────────────────────────────────────────────────
function wirePagination(type, renderFn) {
    const btnPrev = document.getElementById(`btn-prev-${type}`);
    const btnNext = document.getElementById(`btn-next-${type}`);
    if (btnPrev) {
        btnPrev.addEventListener('click', () => {
            if (PAGINATION[type].page > 1) {
                PAGINATION[type].page--;
                renderFn();
            }
        });
    }
    if (btnNext) {
        btnNext.addEventListener('click', () => {
            PAGINATION[type].page++;
            renderFn();
        });
    }
}

// ─── Export ──────────────────────────────────────────────────────────────────
export function initTables() {
    wirePagination('customers', renderCustomers);
    wirePagination('suppliers', renderSuppliers);
    wirePagination('inventory', renderInventory);
    wirePagination('orders', renderOrders);

    window.renderAll = function () {
        renderCustomers();
        renderSuppliers();
        renderInventory();
        renderOrders();
        renderDashboard();
        if (typeof window.updateMetrics === 'function') {
            window.updateMetrics();
        }
    };

    // Initial render after a short delay to ensure DOM is ready
    setTimeout(window.renderAll, 120);
}

window.printOrder = async function (orderId) {
    if (!window.DB) return;
    const order = window.DB.getOrders().find(o => o.id === orderId);
    if (!order) return;

    const settings = window.DB.getSettings();
    const customer = window.DB.getCustomers().find(c => c.id === order.customerId);
    const currency = settings.general.currency || 'Rs.';

    const subtotal = order.total;
    const taxPct = 5;
    const tax = subtotal * taxPct / 100;
    const total = subtotal + tax;

    const printItems = order.itemsDetail || [
        { name: 'Water Delivery Refills', qty: order.items, total: order.total }
    ];

    const receiptData = {
        title: settings.printer.headerText || settings.general.companyName || 'AquaFlow Pro',
        address: settings.general.address || '',
        phone: settings.general.phone || '',
        date: order.date || new Date().toLocaleDateString(),
        invoiceId: order.id,
        client: customer ? customer.name : (order.customerName || 'Walk-in Customer'),
        operator: 'Alex Henderson',
        template: settings.printer.template || 'minimalist',
        subtotal: subtotal,
        tax: tax,
        taxPct: taxPct,
        total: total,
        footer: settings.printer.footerText || '',
        items: printItems
    };

    const printed = await Printer.printESC(receiptData, settings);

    if (!printed) {
        const width = settings.printer.width || '80mm';
        Printer._triggerSystemPrint(receiptData, settings, width);

        // Post system print trigger prompt to share on WhatsApp
        setTimeout(() => {
            if (confirm("Receipt print dialog opened. Would you like to share this receipt on WhatsApp?")) {
                const message = `*${receiptData.title || 'AQUAFLOW PRO'} - RECEIPT*\n\n` +
                    `*Client:* ${receiptData.client}\n` +
                    `*Invoice/Receipt ID:* ${receiptData.invoiceId}\n` +
                    `*Date:* ${receiptData.date}\n` +
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
                    customer: customer,
                    messageText: message,
                    receiptData: receiptData
                });
            }
        }, 1000);
    }
};

// Helper function to render a highly professional and colorful 80mm receipt HTML matching mobile transaction success style
function getColorfulReceiptHtml(receiptData, settings) {
    const currency = (settings && settings.general && settings.general.currency) || 'Rs.';
    const companyName = (settings && settings.general && settings.general.companyName) || 'AquaFlow Pro';
    const addressText = receiptData.address || (settings && settings.general && settings.general.address) || '456 Water Way, Aquapolis';
    const phoneText = receiptData.phone || (settings && settings.general && settings.general.phone) || '';
    const footerText = receiptData.footer || 'Thank you for choosing AquaFlow!';
    const dateText = receiptData.date || new Date().toLocaleDateString();
    const invoiceId = receiptData.invoiceId || '#INV-TEST';
    const client = receiptData.client || 'Walk-in Customer';
    const operator = receiptData.operator || 'System Operator';
    const subtotal = typeof receiptData.subtotal === 'number' ? receiptData.subtotal : 0;
    const taxPct = typeof receiptData.taxPct === 'number' ? receiptData.taxPct : 0;
    const tax = typeof receiptData.tax === 'number' ? receiptData.tax : (subtotal * taxPct / 100);
    const total = typeof receiptData.total === 'number' ? receiptData.total : (subtotal + tax);
    const items = receiptData.items || [];

    // Formatted date text like: 04-Jun-2026 05:47:58 PM
    let formattedDate = dateText;
    try {
        const d = new Date();
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const day = String(d.getDate()).padStart(2, '0');
        const month = months[d.getMonth()];
        const year = d.getFullYear();
        let hours = d.getHours();
        const minutes = String(d.getMinutes()).padStart(2, '0');
        const seconds = String(d.getSeconds()).padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12; // the hour '0' should be '12'
        const hoursStr = String(hours).padStart(2, '0');
        formattedDate = `${day}-${month}-${year} ${hoursStr}:${minutes}:${seconds} ${ampm}`;
    } catch(e) {}

    const titleText = receiptData.title || 'RECEIPT';

    return `
    <div id="wa-receipt-capture-outer" style="background-color: transparent; padding: 0 0 8px 0; display: inline-block; box-sizing: border-box;">
        <div id="wa-receipt-capture-target" style="width: 320px; background-color: #ffffff; color: #1e293b; font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; box-sizing: border-box; border-radius: 16px 16px 0 0; position: relative; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.06), 0 4px 6px -2px rgba(0, 0, 0, 0.03); overflow: visible;">
            <!-- Top Red Accent Bar -->
            <div style="height: 8px; background-color: #e53e3e; border-radius: 16px 16px 0 0; width: 100%;"></div>
            
            <div style="padding: 24px 20px 20px 20px; position: relative;">
                <!-- Concentric Circle Stamp next to the Ref# and Date lines -->
                <div style="position: absolute; top: 34px; right: 12px; width: 56px; height: 56px; transform: rotate(-20deg); opacity: 0.85; box-sizing: border-box;">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 56 56" style="width: 56px; height: 56px; display: block;">
                        <!-- Outer Solid Circle -->
                        <circle cx="28" cy="28" r="26.5" stroke="#10b981" stroke-width="1.8" fill="none" />
                        
                        <!-- Inner Dashed Circle -->
                        <circle cx="28" cy="28" r="22.5" stroke="#10b981" stroke-width="0.8" stroke-dasharray="2 2" fill="none" />
                        
                        <!-- White Masking Rectangle behind the text band -->
                        <rect x="6.5" y="21.5" width="43" height="13" fill="#ffffff" />
                        
                        <!-- Top Parallel Line -->
                        <line x1="6.5" y1="21.5" x2="49.5" y2="21.5" stroke="#10b981" stroke-width="0.8" />
                        
                        <!-- Bottom Parallel Line -->
                        <line x1="6.5" y1="34.5" x2="49.5" y2="34.5" stroke="#10b981" stroke-width="0.8" />
                        
                        <!-- Text "PAID BY AQUA" -->
                        <text x="28" y="29.8" font-family="'Plus Jakarta Sans', -apple-system, sans-serif" font-size="5px" font-weight="bold" fill="#10b981" text-anchor="middle" textLength="30" lengthAdjust="spacingAndGlyphs">PAID BY AQUA</text>
                        
                        <!-- Top Stars -->
                        <text x="28" y="16.0" font-family="'Plus Jakarta Sans', -apple-system, sans-serif" font-size="4px" fill="#10b981" text-anchor="middle">★ ★ ★</text>
                        
                        <!-- Bottom Stars -->
                        <text x="28" y="43.0" font-family="'Plus Jakarta Sans', -apple-system, sans-serif" font-size="4px" fill="#10b981" text-anchor="middle">★ ★ ★</text>
                    </svg>
                </div>



                <!-- Transaction Status Details -->
                <div style="text-align: center; margin-bottom: 16px;">
                    <div style="font-size: 14.5px; font-weight: 800; color: #334155; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.05em;">${titleText}</div>
                    <div style="font-size: 11px; color: #64748b; font-family: monospace;">Ref#${invoiceId.replace('#', '')}</div>
                    <div style="font-size: 10.5px; color: #64748b; margin-top: 4px;">${formattedDate}</div>
                </div>

                <!-- Large amount display in currency layout -->
                <div style="text-align: center; font-size: 24px; font-weight: 800; color: #1e293b; margin: 18px 0 16px 0; font-family: 'Plus Jakarta Sans', sans-serif;">
                    ${currency} ${total.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                </div>

                <!-- Gray dashed divider -->
                <div style="border-top: 1.5px dashed #cbd5e1; margin: 16px 0;"></div>

                <!-- Key-value detail block -->
                <div style="display: flex; flex-direction: column; gap: 10px; font-size: 11.5px; line-height: 1.4;">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                        <span style="font-weight: 700; color: #334155; min-width: 90px; text-align: left;">Client</span>
                        <span style="color: #475569; text-align: right; word-break: break-word; max-width: 180px; font-weight: 500;">${client}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                        <span style="font-weight: 700; color: #334155; min-width: 90px; text-align: left;">Company</span>
                        <span style="color: #475569; text-align: right; font-weight: 500;">${companyName}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                        <span style="font-weight: 700; color: #334155; min-width: 90px; text-align: left;">Invoice No</span>
                        <span style="color: #475569; text-align: right; font-family: monospace; font-weight: 600;">${invoiceId}</span>
                    </div>
                    
                    ${receiptData.driver || operator ? `
                    <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                        <span style="font-weight: 700; color: #334155; min-width: 90px; text-align: left;">Operator/Driver</span>
                        <span style="color: #475569; text-align: right; font-weight: 500;">${receiptData.driver || operator}</span>
                    </div>` : ''}

                    <!-- Gray dashed divider before items list -->
                    <div style="border-top: 1.5px dashed #e2e8f0; margin: 8px 0 4px 0;"></div>
                    
                    <!-- Itemized block headers -->
                    <div style="font-size: 10px; color: #64748b; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; text-align: left; margin-bottom: 2px;">Items Purchased</div>
                    
                    ${items.map(item => {
                        const qty = item.qty || 1;
                        const price = typeof item.price === 'number' ? item.price : (item.total / qty) || 0;
                        return `
                        <div style="display: flex; justify-content: space-between; align-items: flex-start; font-size: 11px;">
                            <div style="display: flex; flex-direction: column; text-align: left; max-width: 190px;">
                                <span style="font-weight: 700; color: #1e293b;">${item.name}</span>
                                <span style="font-size: 9px; color: #64748b; margin-top: 1px;">${qty} x ${currency}${price.toFixed(2)}</span>
                            </div>
                            <span style="color: #0f172a; font-weight: 700; font-family: monospace; margin-top: 2px;">${currency}${item.total.toFixed(2)}</span>
                        </div>
                        `;
                    }).join('')}

                    ${tax > 0 ? `
                    <div style="border-top: 1px dashed #e2e8f0; margin: 4px 0;"></div>
                    <div style="display: flex; justify-content: space-between; font-size: 11px;">
                        <span style="font-weight: 700; color: #64748b; text-align: left;">Subtotal</span>
                        <span style="color: #475569; font-family: monospace;">${currency}${subtotal.toFixed(2)}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; font-size: 11px;">
                        <span style="font-weight: 700; color: #64748b; text-align: left;">Sales Tax (${taxPct}%)</span>
                        <span style="color: #475569; font-family: monospace;">${currency}${tax.toFixed(2)}</span>
                    </div>
                    ` : ''}
                </div>

                <div style="text-align: center; border-top: 1px dashed #cbd5e1; padding-top: 14px; margin-top: 16px; font-size: 10px; color: #64748b; font-style: italic; line-height: 1.4;">
                    Thank you for choosing ${companyName}!
                </div>
            </div>

            <!-- CSS Zigzag teeth at the bottom -->
            <div style="position: absolute; bottom: -8px; left: 0; right: 0; height: 8px; background-image: linear-gradient(-135deg, #ffffff 4px, transparent 0), linear-gradient(135deg, #ffffff 4px, transparent 0); background-size: 8px 8px; background-position: bottom left; z-index: 10;"></div>
        </div>
    </div>
    `;
}

// Global showWhatsAppDispatchModal Helper
window.showWhatsAppDispatchModal = function ({ customer, messageText, receiptData, onDone }) {
    if (!customer) {
        customer = { id: 'WALK-IN', name: 'Walk-in Customer', phone: '' };
    }
    const rawPhone = customer.phone || '';
    let cleanPhone = rawPhone.replace(/[^0-9]/g, '');
    let selectedPrefix = '92'; // default PK
    let displayPhone = rawPhone;

    // Try to parse prefix and local digits
    if (rawPhone.startsWith('+')) {
        const match = rawPhone.match(/^\+(\d{1,4})/);
        if (match) {
            selectedPrefix = match[1];
            displayPhone = rawPhone.substring(match[0].length).trim();
        }
    } else if (cleanPhone.length > 10) {
        const commonPrefixes = ['92', '1', '44', '966', '971', '91'];
        for (const pref of commonPrefixes) {
            if (cleanPhone.startsWith(pref)) {
                selectedPrefix = pref;
                displayPhone = cleanPhone.substring(pref.length);
                break;
            }
        }
    } else if (cleanPhone.startsWith('0')) {
        displayPhone = cleanPhone;
    }

    displayPhone = displayPhone.replace(/^[0]+/g, '').replace(/[^0-9]/g, '');

    // Inject Plus Jakarta Sans font link for premium receipt rendering if not exists
    if (!document.getElementById('wa-receipt-font')) {
        const link = document.createElement('link');
        link.id = 'wa-receipt-font';
        link.rel = 'stylesheet';
        link.href = 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap';
        document.head.appendChild(link);
    }

    // Open WhatsApp Customizer Modal
    const existingCustomizer = document.getElementById('whatsapp-customizer-modal');
    if (existingCustomizer) existingCustomizer.remove();

    const customizer = document.createElement('div');
    customizer.id = 'whatsapp-customizer-modal';
    customizer.className = 'fixed inset-0 bg-black/85 backdrop-blur-sm z-[10000] flex items-center justify-center p-4 animate-sim-fade-in text-on-surface';

    const hasReceipt = !!receiptData;
    const modalWidthClass = hasReceipt ? 'max-w-[780px]' : 'max-w-[420px]';
    const settings = window.DB ? window.DB.getSettings() : null;

    customizer.innerHTML = `
        <div class="bg-surface rounded-3xl border border-outline-variant/35 p-6 shadow-[0_24px_60px_rgba(0,0,0,0.6)] ${modalWidthClass} w-full flex flex-col relative overflow-hidden animate-sim-slide-up">
            <button id="btn-close-wa-customizer" class="absolute top-4 right-4 text-on-surface-variant hover:text-on-surface transition-colors z-10">
                <span class="material-symbols-outlined">close</span>
            </button>
            
            <div class="flex items-center gap-2 mb-4">
                <span class="material-symbols-outlined text-[#25d366] text-[26px]">chat</span>
                <h3 class="text-[16px] font-bold">WhatsApp Dispatch Portal</h3>
            </div>
            
            <div class="flex flex-col md:flex-row gap-6">
                <!-- Left panel: Customizer details -->
                <div class="flex-1 space-y-4 text-[12px] min-w-0">
                    <div class="flex flex-col gap-1.5">
                        <label for="wa-phone" class="font-bold text-on-surface-variant">Recipient Phone Number</label>
                        <div class="flex gap-2">
                            <select id="wa-country-prefix" class="bg-surface-container-low border border-outline-variant/30 rounded-lg py-2 px-2 text-[11px] outline-none">
                                <option value="92" ${selectedPrefix === '92' ? 'selected' : ''}>PK (+92)</option>
                                <option value="1" ${selectedPrefix === '1' ? 'selected' : ''}>US/CA (+1)</option>
                                <option value="44" ${selectedPrefix === '44' ? 'selected' : ''}>UK (+44)</option>
                                <option value="966" ${selectedPrefix === '966' ? 'selected' : ''}>SA (+966)</option>
                                <option value="971" ${selectedPrefix === '971' ? 'selected' : ''}>AE (+971)</option>
                                <option value="91" ${selectedPrefix === '91' ? 'selected' : ''}>IN (+91)</option>
                            </select>
                            <input type="text" id="wa-phone" class="flex-1 bg-surface-container-low border border-outline-variant/30 rounded-lg py-2 px-3 text-[12px] focus:ring-2 focus:ring-primary/30 outline-none font-mono" placeholder="e.g. 3211234567 or 5551234567" value="${displayPhone}" />
                        </div>
                        <p class="text-[9px] text-on-surface-variant/70 mt-0.5">Automated prefixing will clean spaces, parentheses, and leading zeros.</p>
                    </div>
                    
                    <!-- Message Body textarea removed per user request -->


                    <div class="flex flex-col gap-1.5">
                        <label for="wa-dispatch-type" class="font-bold text-on-surface-variant">WhatsApp Protocol</label>
                        <select id="wa-dispatch-type" class="w-full bg-surface-container-low border border-outline-variant/30 rounded-lg py-2 px-3 text-[11px] cursor-pointer">
                            <option value="universal" selected>Universal Link (wa.me) - Mobile App & Web</option>
                            <option value="web">WhatsApp Web (web.whatsapp.com) - Desktop Browser</option>
                        </select>
                    </div>

                    ${hasReceipt ? `
                    <div class="pt-2 text-[10px] text-on-surface-variant/80 flex items-start gap-1.5 bg-[#0284c7]/5 p-3 rounded-xl border border-[#0284c7]/15">
                        <span class="material-symbols-outlined text-[#0284c7] text-[16px] shrink-0 mt-0.5">info</span>
                        <div>
                            <strong>Instant Clipboard Flow:</strong> Clicking "Launch Chat" generates a premium colorful receipt image and copies it to your clipboard. Once WhatsApp opens, simply press <strong>Ctrl + V</strong> to paste and send.
                        </div>
                    </div>
                    ` : ''}

                    <div class="w-full mt-4 flex gap-3">
                        <button type="button" id="btn-cancel-wa-dispatch" class="flex-1 py-2.5 border border-outline-variant rounded-xl text-on-surface-variant hover:bg-surface-container-low text-[12px] font-bold transition-all">
                            Cancel
                        </button>
                        <button type="button" id="btn-send-wa-dispatch" class="flex-1 bg-[#25d366] hover:bg-[#20ba5a] text-white py-2.5 rounded-xl text-[12px] font-bold shadow-[0_4px_12px_rgba(37,211,102,0.3)] transition-all flex items-center justify-center gap-1.5">
                            <span class="material-symbols-outlined text-[16px]">send</span> Launch Chat
                        </button>
                    </div>
                </div>

                <!-- Right panel: Receipt Preview -->
                ${hasReceipt ? `
                <div class="w-full md:w-[340px] flex flex-col items-center shrink-0 border-t md:border-t-0 md:border-l border-outline-variant/20 pt-4 md:pt-0 md:pl-6">
                    <h4 class="text-[11px] font-bold text-on-surface-variant mb-2.5 self-start flex items-center gap-1.5">
                        <span class="material-symbols-outlined text-primary text-[16px]">receipt_long</span> 
                        Receipt Preview (80mm / 3" Image)
                    </h4>
                    <div class="w-full max-h-[350px] overflow-y-auto custom-scrollbar p-1.5 bg-surface-container-low rounded-2xl border border-outline-variant/20 flex justify-center items-start shadow-inner">
                        <div id="wa-receipt-preview-wrapper" class="origin-top scale-[0.95] md:scale-100">
                            <!-- Colorful receipt rendered here -->
                        </div>
                    </div>
                </div>
                ` : ''}
            </div>
        </div>
    `;

    document.body.appendChild(customizer);

    // Render preview of the colorful receipt
    if (hasReceipt) {
        const previewWrapper = document.getElementById('wa-receipt-preview-wrapper');
        if (previewWrapper) {
            previewWrapper.innerHTML = getColorfulReceiptHtml(receiptData, settings);
        }
    }

    const closeCustomizer = () => {
        customizer.classList.add('transition-opacity', 'duration-300', 'opacity-0');
        setTimeout(() => customizer.remove(), 300);
        if (typeof onDone === 'function') onDone();
    };

    document.getElementById('btn-close-wa-customizer').addEventListener('click', closeCustomizer);
    document.getElementById('btn-cancel-wa-dispatch').addEventListener('click', closeCustomizer);

    document.getElementById('btn-send-wa-dispatch').addEventListener('click', async () => {
        const sendBtn = document.getElementById('btn-send-wa-dispatch');
        const originalText = sendBtn.innerHTML;
        sendBtn.innerHTML = `<span class="material-symbols-outlined text-[15px] animate-spin">sync</span> Generating Image...`;
        sendBtn.disabled = true;

        try {
            // Check if we need to copy a colorful receipt image to clipboard
            if (hasReceipt) {
                // Dynamically load html2canvas if not present
                if (typeof html2canvas === 'undefined') {
                    await new Promise((resolve, reject) => {
                        const script = document.createElement('script');
                        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
                        script.onload = resolve;
                        script.onerror = reject;
                        document.head.appendChild(script);
                    });
                }

                // Render in a clean offscreen element to avoid parent styles/dimensions issues
                const tempDiv = document.createElement('div');
                tempDiv.style.position = 'absolute';
                tempDiv.style.top = '-9999px';
                tempDiv.style.left = '-9999px';
                tempDiv.innerHTML = getColorfulReceiptHtml(receiptData, settings);
                document.body.appendChild(tempDiv);

                // Force font loading in canvas rendering
                await document.fonts.ready;

                const targetEl = tempDiv.firstElementChild;
                const canvas = await html2canvas(targetEl, {
                    scale: 2.5, // 2.5x resolution for crystal clear POS receipts on high-dpi screens
                    backgroundColor: '#ffffff',
                    useCORS: true,
                    logging: false
                });

                // Remove temp element
                tempDiv.remove();

                // Convert canvas to blob and write to clipboard
                await new Promise((resolve, reject) => {
                    canvas.toBlob(async (blob) => {
                        try {
                            const item = new ClipboardItem({ "image/png": blob });
                            await navigator.clipboard.write([item]);
                            resolve();
                        } catch (err) {
                            console.error("Failed to copy image to clipboard:", err);
                            reject(err);
                        }
                    }, 'image/png');
                });
            }

            // WhatsApp dispatch
            const prefix = document.getElementById('wa-country-prefix').value;
            let localPhone = document.getElementById('wa-phone').value.replace(/[^0-9]/g, '');
            if (localPhone.startsWith('0')) {
                localPhone = localPhone.substring(1);
            }

            const finalPhone = prefix + localPhone;
            const protocol = document.getElementById('wa-dispatch-type').value;

            // Save updated number to database for persistent correctness
            if (customer.id && customer.id !== 'WALK-IN') {
                const formattedRawNumber = `+${prefix} ${document.getElementById('wa-phone').value.trim()}`;
                if (customer.phone !== formattedRawNumber) {
                    const data = window.DB.getData();
                    const dbCust = data.customers.find(c => c.id === customer.id);
                    if (dbCust) {
                        dbCust.phone = formattedRawNumber;
                        window.DB.saveData(data);
                        if (window.renderAll) {
                            window.renderAll();
                        }
                    }
                }
            }

            let url = '';
            if (protocol === 'web') {
                url = `https://web.whatsapp.com/send/?phone=${encodeURIComponent(finalPhone)}`;
            } else {
                url = `https://api.whatsapp.com/send/?phone=${encodeURIComponent(finalPhone)}&type=phone_number&app_absent=0`;
            }

            window.open(url, '_blank');
            closeCustomizer();

            if (hasReceipt) {
                showToast("Receipt image copied! Paste (Ctrl+V) in WhatsApp to attach the colorful receipt.", "success");
            } else {
                showToast("WhatsApp dispatch launched!", "success");
            }
        } catch (err) {
            console.error("WhatsApp copy/dispatch error:", err);
            // Revert button status
            sendBtn.innerHTML = originalText;
            sendBtn.disabled = false;
            
            if (hasReceipt) {
                alert("Failed to copy receipt image to clipboard. Please check browser clipboard permissions.");
            } else {
                alert("An error occurred launching WhatsApp.");
            }
        }
    });
};
