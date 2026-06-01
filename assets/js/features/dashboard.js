const PRODUCT_PRICES = {
    'INV-001': 25.00,
    'INV-002': 15.00,
    'INV-003': 45.00,
    'INV-004': 5.00
};

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function getOrderRevenueByDay() {
    const totals = [0, 0, 0, 0, 0, 0, 0];
    if (!window.DB) return totals;

    window.DB.getOrders().forEach(order => {
        const day = new Date(order.date).getDay();
        const idx = day === 0 ? 6 : day - 1;
        totals[idx] += parseFloat(order.total) || 0;
    });
    return totals;
}

function renderRevenueChart() {
    const container = document.getElementById('dashboard-revenue-chart');
    if (!container) return;

    const totals = getOrderRevenueByDay();
    const max = Math.max(...totals, 1);

    container.innerHTML = DAY_LABELS.map((label, i) => {
        const pct = Math.round((totals[i] / max) * 100);
        return `
            <div class="flex-1 flex flex-col items-center group">
                <div class="w-full chart-bar-gradient rounded-t-md transition-all group-hover:opacity-80"
                    style="height: ${Math.max(pct, 8)}%;" title="$${totals[i].toFixed(2)}"></div>
                <span class="text-[9px] mt-2 font-bold text-on-surface-variant/50 uppercase">${label}</span>
            </div>`;
    }).join('');
}

function renderCriticalAlerts() {
    const container = document.getElementById('dashboard-alerts-list');
    const badge = document.getElementById('dashboard-alerts-count');
    if (!container || !window.DB) return;

    const alerts = [];
    const lowStock = window.DB.getInventory().filter(i => i.stock <= i.threshold);
    lowStock.forEach(item => {
        alerts.push({
            type: 'error',
            icon: 'inventory_2',
            title: `Low Inventory: ${item.name}`,
            message: `${item.stock} units remaining (min threshold ${item.threshold}).`,
            time: 'Just now'
        });
    });

    const processing = window.DB.getOrders().filter(o => o.status === 'Processing');
    if (processing.length > 0) {
        alerts.push({
            type: 'primary',
            icon: 'local_shipping',
            title: `${processing.length} Orders Pending Dispatch`,
            message: `Orders ${processing.map(o => o.id).slice(0, 3).join(', ')}${processing.length > 3 ? '…' : ''} awaiting shipment.`,
            time: 'Active'
        });
    }

    const reviewSuppliers = window.DB.getSuppliers().filter(s => s.status === 'Review');
    reviewSuppliers.forEach(s => {
        alerts.push({
            type: 'tertiary',
            icon: 'warning',
            title: `Supplier Review: ${s.name}`,
            message: `Rating ${s.rating} — requires performance review.`,
            time: 'Pending'
        });
    });

    if (badge) badge.textContent = `${alerts.length} NEW`;

    if (alerts.length === 0) {
        container.innerHTML = `
            <div class="p-3 bg-primary-container/5 rounded-lg border border-primary/10 flex gap-3">
                <div class="text-primary">
                    <span class="material-symbols-outlined text-[18px]" style="font-variation-settings: 'FILL' 1;">check_circle</span>
                </div>
                <div>
                    <h5 class="text-[12px] font-bold text-on-surface leading-tight">All Clear</h5>
                    <p class="text-[11px] text-on-surface-variant/80 mt-0.5 leading-tight">No critical alerts at this time.</p>
                </div>
            </div>`;
        return;
    }

    const styles = {
        error: { bg: 'bg-error-container/10', border: 'border-error/10', text: 'text-error' },
        tertiary: { bg: 'bg-tertiary-container/5', border: 'border-outline-variant/20', text: 'text-tertiary' },
        primary: { bg: 'bg-primary-container/5', border: 'border-primary/10', text: 'text-primary' }
    };

    container.innerHTML = alerts.slice(0, 5).map(a => {
        const s = styles[a.type] || styles.primary;
        return `
            <div class="p-3 ${s.bg} rounded-lg border ${s.border} flex gap-3">
                <div class="${s.text}">
                    <span class="material-symbols-outlined text-[18px]" style="font-variation-settings: 'FILL' 1;">${a.icon}</span>
                </div>
                <div>
                    <h5 class="text-[12px] font-bold text-on-surface leading-tight">${a.title}</h5>
                    <p class="text-[11px] text-on-surface-variant/80 mt-0.5 leading-tight">${a.message}</p>
                    <span class="text-[9px] ${s.text} font-bold mt-1.5 inline-block uppercase">${a.time}</span>
                </div>
            </div>`;
    }).join('');
}

export function renderDashboard() {
    if (!document.getElementById('panel-dashboard')) return;
    renderRevenueChart();
    renderCriticalAlerts();
}

export function getInventoryStats() {
    if (!window.DB) return { totalStock: 0, lowCount: 0, totalValue: 0 };
    const items = window.DB.getInventory();
    const totalStock = items.reduce((sum, i) => sum + (i.stock || 0), 0);
    const lowCount = items.filter(i => i.stock <= i.threshold).length;
    const totalValue = items.reduce((sum, i) => sum + (i.stock || 0) * (PRODUCT_PRICES[i.id] || 10), 0);
    return { totalStock, lowCount, totalValue, itemCount: items.length };
}
