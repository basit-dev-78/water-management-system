import { showToast } from '../ui/components.js';

export function initReports() {
    const btnGenerate = document.getElementById('btn-generate-report');
    if (!btnGenerate) return;

    btnGenerate.addEventListener('click', () => {
        const typeEl = document.getElementById('report-type');
        const formatEl = document.querySelector('input[name="report-format"]:checked');
        const previewEl = document.getElementById('report-preview');

        if (!typeEl || !formatEl) return;

        const type = typeEl.value;
        const format = formatEl.value;
        const db = window.DB;
        
        if (!db) {
            alert("Database not ready!");
            return;
        }
        
        let data = [];
        let filename = `aquaflow_${type}_report_${new Date().toISOString().split('T')[0]}`;
        let outputText = '';
        
        if (type === 'financial') {
            const orders = db.getOrders();
            const customers = db.getCustomers();
            const activeCustomerIds = new Set(customers.map(c => c.id));
            data = orders
                .filter(o => activeCustomerIds.has(o.customerId))
                .map(o => ({
                    OrderID: o.id,
                    Client: o.customerName,
                    Date: o.date,
                    TotalAmount: o.total,
                    ItemsCount: o.items,
                    Status: o.status
                }));
        } else if (type === 'inventory') {
            const inv = db.getInventory();
            data = inv.map(i => ({
                ItemID: i.id,
                Name: i.name,
                SKU: i.sku,
                Category: i.category,
                StockLevel: i.stock,
                Threshold: i.threshold,
                Status: i.status
            }));
        } else if (type === 'clients') {
            const custs = db.getCustomers();
            data = custs.map(c => ({
                ClientID: c.id,
                Name: c.name,
                Email: c.email,
                Phone: c.phone,
                Status: c.status,
                TotalOrders: c.totalOrders,
                LastOrderDate: c.lastOrder
            }));
        }
        
        if (format === 'json') {
            outputText = JSON.stringify(data, null, 2);
            filename += '.json';
        } else {
            // Convert to CSV
            if (data.length > 0) {
                const headers = Object.keys(data[0]);
                const rows = data.map(obj => headers.map(h => `"${String(obj[h]).replace(/"/g, '""')}"`).join(','));
                outputText = [headers.join(','), ...rows].join('\n');
            } else {
                outputText = 'No data available.';
            }
            filename += '.csv';
        }
        
        // Render preview
        if (previewEl) {
            previewEl.value = outputText;
        }
        
        // Trigger download
        const blob = new Blob([outputText], { type: format === 'json' ? 'application/json' : 'text/csv' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        if (showToast) {
            showToast("Report generated & downloaded successfully!", "success");
        } else if (window.showToast) {
            window.showToast("Report generated & downloaded successfully!", "success");
        } else {
            alert("Report generated & downloaded successfully!");
        }
    });
}
