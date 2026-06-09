const fs = require('fs');

let content = fs.readFileSync('assets/js/features/tables.js', 'utf8');

const renderPaymentsLogic = `
// ─── Render: Payments ────────────────────────────────────────────────────────
function renderPayments() {
    if (!window.DB) return;
    const settings = window.DB.getSettings();
    const currency = settings.general.currency || 'Rs.';
    const path = window.location.pathname;

    const renderList = (listId, items, emptyTitle, emptyDesc, icon) => {
        const list = document.getElementById(listId);
        if (!list) return;

        if (items.length === 0) {
            list.innerHTML = getEmptyStateHTML(icon, emptyTitle, emptyDesc, '#', 'No Records Yet');
            return;
        }

        const html = items.map(p => \`
            <div class="glass-card rounded-xl p-4 flex flex-col gap-2 group cursor-pointer hover:border-primary/30 transition-all">
                <div class="flex items-center justify-between gap-2">
                    <p class="text-[12px] font-bold text-on-surface font-mono">\${p.id || 'PAY-XXXX'}</p>
                    <div class="flex items-center gap-1">
                        \${statusBadge('Delivered')} <!-- Generic badge for completed payment -->
                        <button onclick="event.stopPropagation(); if(confirm('Delete payment record?')) { window.DB.deleteRecord('payments', '\${p.id}'); window.renderAll(); }" class="text-error hover:bg-error-container/20 p-1 rounded-md transition-colors">
                            <span class="material-symbols-outlined text-[16px]">delete</span>
                        </button>
                    </div>
                </div>
                <div class="border-t border-outline-variant/10 pt-2 grid grid-cols-2 md:grid-cols-4 gap-2">
                    <div>
                        <p class="text-[9px] uppercase text-on-surface-variant/60 font-bold tracking-wider">Entity Name</p>
                        <p class="text-[11px] font-medium text-on-surface truncate">\${p.entityName || '—'}</p>
                    </div>
                    <div>
                        <p class="text-[9px] uppercase text-on-surface-variant/60 font-bold tracking-wider">Amount</p>
                        <p class="text-[14px] font-bold \${p.type==='received' ? 'text-primary' : 'text-error'}">\${currency}\${Number(p.amount).toFixed(2)}</p>
                    </div>
                    <div>
                        <p class="text-[9px] uppercase text-on-surface-variant/60 font-bold tracking-wider">Date</p>
                        <p class="text-[11px] font-medium text-on-surface">\${p.date || '—'}</p>
                    </div>
                    <div>
                        <p class="text-[9px] uppercase text-on-surface-variant/60 font-bold tracking-wider">Method</p>
                        <p class="text-[11px] font-medium text-on-surface">\${p.method || 'Cash'}</p>
                    </div>
                </div>
            </div>
        \`).join('');
        renderWithSkeleton(list, html);
    };

    const allPayments = window.DB.getPayments ? window.DB.getPayments() : [];

    if (path.includes('payment-customer-received.html')) {
        const items = allPayments.filter(p => p.entityType === 'customer' && p.type === 'received');
        renderList('payment-customer-received-list', items, 'No Received Payments', 'You have not received any payments from customers yet.', 'account_balance_wallet');
    }
    
    if (path.includes('payment-supplier-received.html')) { // meaning paid to supplier
        const items = allPayments.filter(p => p.entityType === 'supplier' && p.type === 'paid');
        renderList('payment-supplier-received-list', items, 'No Payments Made', 'You have not made any payments to suppliers yet.', 'account_balance_wallet');
    }

    // For Pending tabs, we'll just list customers/suppliers with a balance
    if (path.includes('payment-customer-pending.html')) {
        const items = window.DB.getCustomers().filter(c => c.pendingAmount > 0).map(c => ({
            id: c.id, entityName: c.name, amount: c.pendingAmount, type: 'received', date: c.lastOrder, method: 'Pending'
        }));
        renderList('payment-customer-pending-list', items, 'No Pending Balances', 'All customers are fully paid up.', 'check_circle');
    }

    if (path.includes('payment-supplier-pending.html')) {
        const items = window.DB.getSuppliers().filter(s => s.balance > 0).map(s => ({
            id: s.id, entityName: s.name, amount: s.balance, type: 'paid', date: 'N/A', method: 'Pending'
        }));
        renderList('payment-supplier-pending-list', items, 'No Pending Payables', 'You have settled all supplier balances.', 'check_circle');
    }
}
`;

if (!content.includes('function renderPayments()')) {
    content = content.replace('// ─── Wire Pagination Buttons', renderPaymentsLogic + '\n// ─── Wire Pagination Buttons');
}

if (content.includes('window.renderAll = function () {')) {
    content = content.replace('renderOrders();', 'renderOrders();\n        renderPayments();');
}

fs.writeFileSync('assets/js/features/tables.js', content);
console.log('Added renderPayments to tables.js');
