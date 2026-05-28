import { showToast } from '../ui/components.js';

// ─── Pagination State ───────────────────────────────────────────────────────
const PAGINATION = {
    customers: { page: 1, perPage: 12 },
    suppliers: { page: 1, perPage: 12 },
    inventory: { page: 1, perPage: 12 },
    orders:    { page: 1, perPage: 12 }
};

function updatePaginationUI(type, totalItems) {
    const state = PAGINATION[type];
    const totalPages = Math.ceil(totalItems / state.perPage) || 1;

    if (state.page > totalPages) state.page = totalPages;
    if (state.page < 1) state.page = 1;

    const startItem = totalItems === 0 ? 0 : ((state.page - 1) * state.perPage) + 1;
    const endItem   = Math.min(state.page * state.perPage, totalItems);

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
        'Active':       'bg-primary/10 text-primary',
        'Inactive':     'bg-outline-variant/30 text-on-surface-variant',
        'Review':       'bg-error-container/60 text-error',
        'In Stock':     'bg-primary/10 text-primary',
        'Low Stock':    'bg-error-container/60 text-error',
        'Out of Stock': 'bg-error text-on-error',
        'Processing':   'bg-primary-container/60 text-primary',
        'Shipped':      'bg-secondary/10 text-secondary',
        'Delivered':    'bg-primary/10 text-primary',
        'Pending':      'bg-tertiary-container/40 text-tertiary',
    };
    const cls = map[status] || 'bg-outline-variant/30 text-on-surface-variant';
    return `<span class="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${cls}">${status}</span>`;
}

// ─── Render: Customers ───────────────────────────────────────────────────────
function renderCustomers() {
    const list = document.getElementById('customers-card-list');
    if (!list || !window.DB) return;

    const all = window.DB.getCustomers();
    updatePaginationUI('customers', all.length);
    const items = getPage(all, 'customers');

    if (items.length === 0) {
        list.innerHTML = `<div class="col-span-3 py-12 text-center text-on-surface-variant text-[12px]">
            <span class="material-symbols-outlined text-[40px] opacity-30 block mb-2">group_off</span>
            No customers yet. <a href="customer-add.html" class="text-primary font-bold hover:underline">Add one →</a>
        </div>`;
        return;
    }

    list.innerHTML = items.map(c => `
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
            <div class="border-t border-outline-variant/10 pt-2 grid grid-cols-2 gap-1">
                <div>
                    <p class="text-[9px] uppercase text-on-surface-variant/60 font-bold tracking-wider">Orders</p>
                    <p class="text-[13px] font-bold text-on-surface">${c.totalOrders}</p>
                </div>
                <div>
                    <p class="text-[9px] uppercase text-on-surface-variant/60 font-bold tracking-wider">Last Order</p>
                    <p class="text-[11px] font-medium text-on-surface">${c.lastOrder}</p>
                </div>
            </div>
            <p class="text-[10px] text-on-surface-variant/70 flex items-center gap-1">
                <span class="material-symbols-outlined text-[12px]">call</span>${c.phone}
            </p>
        </div>
    `).join('');
}

// ─── Render: Suppliers ───────────────────────────────────────────────────────
function renderSuppliers() {
    const list = document.getElementById('suppliers-card-list');
    if (!list || !window.DB) return;

    const all = window.DB.getSuppliers();
    updatePaginationUI('suppliers', all.length);
    const items = getPage(all, 'suppliers');

    if (items.length === 0) {
        list.innerHTML = `<div class="col-span-3 py-12 text-center text-on-surface-variant text-[12px]">
            <span class="material-symbols-outlined text-[40px] opacity-30 block mb-2">inventory_2</span>
            No suppliers yet. <a href="supplier-add.html" class="text-primary font-bold hover:underline">Add one →</a>
        </div>`;
        return;
    }

    const stars = (rating) => {
        const full = Math.floor(rating);
        return '★'.repeat(full) + '☆'.repeat(5 - full) + ` <span class="text-[10px] font-normal">${rating}</span>`;
    };

    list.innerHTML = items.map(s => `
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
            <p class="text-[10px] text-on-surface-variant/70 flex items-center gap-1">
                <span class="material-symbols-outlined text-[12px]">call</span>${s.phone}
            </p>
        </div>
    `).join('');
}

// ─── Render: Inventory ───────────────────────────────────────────────────────
function renderInventory() {
    const list = document.getElementById('inventory-card-list');
    if (!list || !window.DB) return;

    const all = window.DB.getInventory();
    updatePaginationUI('inventory', all.length);
    const items = getPage(all, 'inventory');

    if (items.length === 0) {
        list.innerHTML = `<div class="col-span-3 py-12 text-center text-on-surface-variant text-[12px]">
            <span class="material-symbols-outlined text-[40px] opacity-30 block mb-2">water_bottle</span>
            No inventory items yet. <a href="inventory-add.html" class="text-primary font-bold hover:underline">Add one →</a>
        </div>`;
        return;
    }

    list.innerHTML = items.map(item => {
        const pct = item.threshold > 0 ? Math.min(100, Math.round((item.stock / (item.threshold * 2)) * 100)) : 100;
        const barColor = item.stock === 0 ? 'bg-error' : (item.stock <= item.threshold ? 'bg-amber-400' : 'bg-primary');
        return `
        <div class="glass-card rounded-xl p-4 flex flex-col gap-2 group cursor-pointer">
            <div class="flex items-center justify-between gap-2">
                <div class="min-w-0">
                    <p class="text-[12px] font-bold text-on-surface truncate leading-tight">${item.name}</p>
                    <p class="text-[10px] text-on-surface-variant font-mono">${item.sku}</p>
                </div>
                ${statusBadge(item.status)}
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
}

// ─── Render: Orders ──────────────────────────────────────────────────────────
function renderOrders() {
    const list = document.getElementById('orders-card-list');
    if (!list || !window.DB) return;

    const all = window.DB.getOrders();
    updatePaginationUI('orders', all.length);
    const items = getPage(all, 'orders');

    if (items.length === 0) {
        list.innerHTML = `<div class="col-span-3 py-12 text-center text-on-surface-variant text-[12px]">
            <span class="material-symbols-outlined text-[40px] opacity-30 block mb-2">shopping_cart_off</span>
            No orders yet. <a href="order-add.html" class="text-primary font-bold hover:underline">Create one →</a>
        </div>`;
        return;
    }

    list.innerHTML = items.map(o => `
        <div class="glass-card rounded-xl p-4 flex flex-col gap-2 group cursor-pointer">
            <div class="flex items-center justify-between gap-2">
                <p class="text-[12px] font-bold text-on-surface font-mono">${o.id}</p>
                ${statusBadge(o.status)}
            </div>
            <p class="text-[11px] text-on-surface-variant">${o.customerName || '—'}</p>
            <div class="border-t border-outline-variant/10 pt-2 grid grid-cols-2 gap-1">
                <div>
                    <p class="text-[9px] uppercase text-on-surface-variant/60 font-bold tracking-wider">Total</p>
                    <p class="text-[14px] font-bold text-primary">$${Number(o.total).toFixed(2)}</p>
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
        </div>
    `).join('');
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
    wirePagination('orders',    renderOrders);

    window.renderAll = function () {
        renderCustomers();
        renderSuppliers();
        renderInventory();
        renderOrders();
    };

    // Initial render after a short delay to ensure DOM is ready
    setTimeout(window.renderAll, 120);
}
