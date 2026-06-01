import { showToast } from '../ui/components.js';

let currentTab = 'today';
let searchQuery = '';

function getTodayDateString() {
    return new Date().toISOString().split('T')[0];
}

function statusBadge(status) {
    const map = {
        'Processing': 'bg-primary-container/60 text-primary border border-primary/10',
        'Shipped': 'bg-secondary/10 text-secondary border border-secondary/10',
        'Delivered': 'bg-primary/10 text-primary border border-primary/10',
    };
    const cls = map[status] || 'bg-outline-variant/30 text-on-surface-variant';
    return `<span class="text-[9px] font-bold uppercase px-2.5 py-0.5 rounded-full ${cls}">${status}</span>`;
}

export function initDeliveries() {
    const panel = document.getElementById('panel-deliveries');
    if (!panel || !window.DB) return;

    // Attach tab click handlers to window so HTML inline onclick works
    window.switchDeliveryTab = function(tabId) {
        currentTab = tabId;
        
        // Update Tab Button Styles
        const tabs = ['today', 'pending', 'completed'];
        tabs.forEach(t => {
            const btn = document.getElementById(`tab-${t}`);
            if (!btn) return;
            if (t === tabId) {
                btn.className = "tab-btn flex-1 md:flex-none text-center px-4 py-2 rounded-lg text-[11px] font-bold transition-all bg-primary text-on-primary shadow-sm";
            } else {
                btn.className = "tab-btn flex-1 md:flex-none text-center px-4 py-2 rounded-lg text-[11px] font-medium text-on-surface-variant hover:text-primary transition-all";
            }
        });

        renderDeliveries();
    };

    // Attach search event
    const searchInput = document.getElementById('deliveries-search');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value.toLowerCase();
            renderDeliveries();
        });
    }

    // Attach custom status advance handler to window
    window.advanceDeliveryStatus = function(id) {
        const order = window.DB.getOrders().find(o => o.id === id);
        if (!order) return;

        const flow = ['Processing', 'Shipped', 'Delivered'];
        const idx = flow.indexOf(order.status);
        if (idx !== -1 && idx < flow.length - 1) {
            const nextStatus = flow[idx + 1];
            window.DB.updateOrderStatus(id, nextStatus);
            showToast(`Delivery ${id} advanced to ${nextStatus}.`, 'success');
            
            // Re-render and update metrics
            renderDeliveries();
            if (typeof window.updateMetrics === 'function') {
                window.updateMetrics();
            }
        }
    };

    // Initial Render
    renderDeliveries();
}

function renderDeliveries() {
    const list = document.getElementById('deliveries-card-list');
    if (!list) return;

    const orders = window.DB.getOrders() || [];
    const customers = window.DB.getCustomers() || [];
    const todayStr = getTodayDateString();

    // 1. Calculate and display Stats
    const todayTotalCount = orders.filter(o => o.date === todayStr || o.expectedDate === todayStr).length;
    const pendingCount = orders.filter(o => o.status === 'Processing' || o.status === 'Shipped').length;
    const completedTodayCount = orders.filter(o => o.status === 'Delivered' && (o.date === todayStr || o.expectedDate === todayStr || true)).length; // show all completed as fallback

    const todayStatEl = document.getElementById('delivery-stat-today');
    const pendingStatEl = document.getElementById('delivery-stat-pending');
    const completedStatEl = document.getElementById('delivery-stat-completed');

    if (todayStatEl) todayStatEl.textContent = todayTotalCount;
    if (pendingStatEl) pendingStatEl.textContent = pendingCount;
    if (completedStatEl) completedStatEl.textContent = orders.filter(o => o.status === 'Delivered').length;

    // 2. Filter orders by Tab
    let filtered = [];
    if (currentTab === 'today') {
        filtered = orders.filter(o => o.date === todayStr || o.expectedDate === todayStr);
        // Fallback: If no deliveries scheduled exactly today, display all processing & shipped as today's work
        if (filtered.length === 0) {
            filtered = orders.filter(o => o.status === 'Processing' || o.status === 'Shipped');
        }
    } else if (currentTab === 'pending') {
        filtered = orders.filter(o => o.status === 'Processing' || o.status === 'Shipped');
    } else if (currentTab === 'completed') {
        filtered = orders.filter(o => o.status === 'Delivered');
    }

    // 3. Filter by Search Query
    if (searchQuery) {
        filtered = filtered.filter(o => {
            const customer = customers.find(c => c.id === o.customerId) || {};
            const custName = (o.customerName || '').toLowerCase();
            const custAddress = (customer.address || '').toLowerCase();
            const custPhone = (customer.phone || '').toLowerCase();
            const orderId = (o.id || '').toLowerCase();
            return custName.includes(searchQuery) ||
                   custAddress.includes(searchQuery) ||
                   custPhone.includes(searchQuery) ||
                   orderId.includes(searchQuery);
        });
    }

    // 4. Render Cards
    if (filtered.length === 0) {
        list.innerHTML = `
            <div class="col-span-1 md:col-span-2 lg:col-span-3 py-16 text-center text-on-surface-variant/60 bg-surface-container-low/40 rounded-2xl border border-outline-variant/10">
                <span class="material-symbols-outlined text-[48px] text-on-surface-variant/30 mb-2">local_shipping</span>
                <p class="text-[13px] font-bold text-on-surface">No deliveries found</p>
                <p class="text-[11px] text-on-surface-variant/80 mt-1">There are no deliveries matching your selection.</p>
            </div>
        `;
        return;
    }

    const flow = ['Processing', 'Shipped', 'Delivered'];

    list.innerHTML = filtered.map(o => {
        // Find full customer details
        const customer = customers.find(c => c.id === o.customerId || c.name === o.customerName) || {
            address: 'Central Hub Dispatch',
            phone: '(555) 019-2831',
            email: 'support@aquaflow.com'
        };

        const nextStatus = flow[flow.indexOf(o.status) + 1] || 'Delivered';

        return `
            <div class="glass-card rounded-2xl p-5 flex flex-col gap-4 border border-outline-variant/15 hover:border-primary/20 hover:shadow-md transition-all duration-300">
                <!-- Card Header -->
                <div class="flex items-center justify-between gap-2 border-b border-outline-variant/10 pb-3">
                    <div class="flex items-center gap-2">
                        <div class="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-[12px]">
                            ${(o.customerName || 'A').charAt(0)}
                        </div>
                        <div>
                            <p class="text-[13px] font-bold text-on-surface leading-tight">${o.customerName || 'Standard Client'}</p>
                            <p class="text-[10px] text-on-surface-variant/70 font-mono mt-0.5">${o.id}</p>
                        </div>
                    </div>
                    ${statusBadge(o.status)}
                </div>

                <!-- Customer Details -->
                <div class="flex flex-col gap-2.5 text-[11px] text-on-surface-variant/90">
                    <div class="flex items-start gap-2">
                        <span class="material-symbols-outlined text-[16px] text-primary/70 shrink-0 mt-0.5">location_on</span>
                        <span class="font-medium text-on-surface leading-tight">${customer.address}</span>
                    </div>
                    <div class="flex items-center gap-2">
                        <span class="material-symbols-outlined text-[16px] text-primary/70 shrink-0">call</span>
                        <a href="tel:${customer.phone}" class="font-semibold text-primary hover:underline">${customer.phone}</a>
                    </div>
                    <div class="flex items-center gap-2">
                        <span class="material-symbols-outlined text-[16px] text-primary/70 shrink-0">mail</span>
                        <a href="mailto:${customer.email}" class="hover:underline">${customer.email}</a>
                    </div>
                </div>

                <!-- Logistics Specs Grid -->
                <div class="grid grid-cols-2 gap-3 bg-surface-container-low/40 p-3 rounded-xl border border-outline-variant/10 text-[11px]">
                    <div>
                        <span class="text-on-surface-variant/60 block text-[9px] uppercase tracking-wider font-bold">Volume / Items</span>
                        <span class="font-bold text-on-surface">${o.items} units</span>
                    </div>
                    <div>
                        <span class="text-on-surface-variant/60 block text-[9px] uppercase tracking-wider font-bold">Total Bill</span>
                        <span class="font-bold text-primary">$${Number(o.total).toFixed(2)}</span>
                    </div>
                    <div>
                        <span class="text-on-surface-variant/60 block text-[9px] uppercase tracking-wider font-bold">Order Date</span>
                        <span class="font-medium text-on-surface">${o.date}</span>
                    </div>
                    <div>
                        <span class="text-on-surface-variant/60 block text-[9px] uppercase tracking-wider font-bold">Expected Date</span>
                        <span class="font-bold text-on-surface">${o.expectedDate || '—'}</span>
                    </div>
                </div>

                <!-- Interactive Actions -->
                <div class="flex gap-2 mt-1">
                    ${o.status !== 'Delivered' ? `
                        <button onclick="window.advanceDeliveryStatus('${o.id}')" class="flex-1 py-2 rounded-xl bg-primary text-on-primary text-[11px] font-bold hover:shadow-md hover:bg-primary/95 transition-all flex items-center justify-center gap-1.5 active:scale-[0.98]">
                            <span class="material-symbols-outlined text-[16px]">local_shipping</span>
                            <span>Mark as ${nextStatus}</span>
                        </button>
                    ` : `
                        <div class="flex-1 py-2 rounded-xl bg-primary/10 text-primary text-[11px] font-bold flex items-center justify-center gap-1.5 border border-primary/20">
                            <span class="material-symbols-outlined text-[16px]">check_circle</span>
                            <span>Completed & Delivered</span>
                        </div>
                    `}
                </div>
            </div>
        `;
    }).join('');
}
