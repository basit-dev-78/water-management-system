const fs = require('fs');

let content = fs.readFileSync('assets/js/db.js', 'utf8');

// 1. Add payments array to defaultData if not exists
if (!content.includes('payments: [')) {
    content = content.replace('orders: [', 'payments: [],\n    orders: [');
}

// 2. Add payment methods
if (!content.includes('getPayments: function()')) {
    const paymentMethods = `
    // PAYMENTS
    getPayments: function() { 
        const data = this.getData();
        if (!data.payments) {
            data.payments = [];
            this.saveData(data);
        }
        return data.payments;
    },
    addPayment: function(payment) {
        const data = this.getData();
        if (!data.payments) data.payments = [];
        
        payment.id = 'PAY-' + Math.floor(1000 + Math.random() * 9000);
        payment.date = payment.date || new Date().toISOString().split('T')[0];
        payment.amount = parseFloat(payment.amount) || 0;
        
        // Update metrics based on entity
        if (payment.entityType === 'customer') {
            const cust = data.customers.find(c => c.name === payment.entityName || c.id === payment.entityId);
            if (cust) {
                payment.entityName = cust.name;
                cust.pendingAmount = Math.max(0, (parseFloat(cust.pendingAmount) || 0) - payment.amount);
            }
        } else if (payment.entityType === 'supplier') {
            const sup = data.suppliers.find(s => s.name === payment.entityName || s.id === payment.entityId);
            if (sup) {
                payment.entityName = sup.name;
                // Currently suppliers don't have a balance field, but we could add one
                sup.balance = Math.max(0, (parseFloat(sup.balance) || 0) - payment.amount);
            }
        }
        
        data.payments.push(payment);
        this.saveData(data);
        return payment;
    },
    `;
    
    content = content.replace('// SETTINGS MANAGEMENT', paymentMethods + '\n    // SETTINGS MANAGEMENT');
}

// 3. Ensure payments array is initialized on load
if (!content.includes('!data.payments')) {
    content = content.replace('if (!data.drivers) {', 'if (!data.payments) { data.payments = []; updated = true; }\n            if (!data.drivers) {');
}

fs.writeFileSync('assets/js/db.js', content);
console.log('Updated db.js with payment support');
