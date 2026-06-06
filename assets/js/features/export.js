import { showToast } from '../ui/components.js';

function downloadCSV(filename, rows) {
    if (!rows.length) {
        showToast('No data to export.', 'error');
        return;
    }
    const headers = Object.keys(rows[0]);
    const csv = [
        headers.join(','),
        ...rows.map(row => headers.map(h => {
            const val = String(row[h] ?? '').replace(/"/g, '""');
            return `"${val}"`;
        }).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
    showToast(`Exported ${rows.length} records to ${filename}`, 'success');
}

export function exportCurrentPage() {
    if (!window.DB) return;

    const page = window.location.pathname.split('/').pop() || 'dashboard.html';

    if (page.includes('customer')) {
        downloadCSV('customers.csv', window.DB.getCustomers());
    } else if (page.includes('supplier')) {
        downloadCSV('suppliers.csv', window.DB.getSuppliers());
    } else if (page.includes('inventory')) {
        downloadCSV('inventory.csv', window.DB.getInventory());
    } else if (page.includes('order')) {
        downloadCSV('orders.csv', window.DB.getOrders());
    } else if (page.includes('report')) {
        const orders = window.DB.getOrders();
        downloadCSV('reports-orders.csv', orders);
    } else {
        downloadCSV('aquaflow-data.csv', [
            ...window.DB.getCustomers().map(c => ({ type: 'Customer', ...c })),
            ...window.DB.getOrders().map(o => ({ type: 'Order', ...o }))
        ]);
    }
}
