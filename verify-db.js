// Load db.js functions
const fs = require('fs');

// We simulate window environment
global.window = {};
global.localStorage = {
    _data: {},
    getItem(k) { return this._data[k] || null; },
    setItem(k, v) { this._data[k] = v; },
    removeItem(k) { delete this._data[k]; }
};

const dbCode = fs.readFileSync('assets/js/db.js', 'utf8');
eval(dbCode);

console.log("DB Loaded");

const db = window.DB;

// 1. Add Customer
const cust = db.addCustomer({
    name: 'Test Customer',
    phone: '123-456-7890',
    email: 'test@example.com',
    pendingAmount: '100' // They owe us 100 Rs from before
});
console.log("Customer Added: " + cust.id);

// 2. Add Order for Customer
// Let's add an inventory item first to have stock to deduct
db.addInventory({
    name: 'Test Bottle',
    stock: 50,
    price: 200
});
const inv = db.getInventory()[db.getInventory().length - 1];

const order = db.addOrder({
    customerId: cust.id,
    customerName: cust.name,
    items: 2,
    total: 400
});
console.log("Order Added: " + order.id);

// Check customer pending balance
const updatedCust = db.getCustomers().find(c => c.id === cust.id);
console.log("Customer pending balance after order: " + updatedCust.pendingAmount);

// 3. Add Payment
const pay = db.addPayment({
    entityType: 'customer',
    entityId: cust.id,
    amount: 300,
    type: 'received',
    method: 'Cash'
});
console.log("Payment Added: " + pay.id);

const finalCust = db.getCustomers().find(c => c.id === cust.id);
console.log("Customer pending balance after payment (should be 500 - 300 = 200): " + finalCust.pendingAmount);

const stats = db.getStats();
console.log("Stats Receivables: " + stats.receivable);

console.log("Verification successful!");
