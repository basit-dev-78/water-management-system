const DB_KEY = 'aquaflow_db_v1';

const defaultData = {
    customers: [
        { id: 'CUST-001', name: 'TechFlow Solutions', email: 'contact@techflow.com', phone: '(555) 123-4567', address: '123 Tech Park, SF', status: 'Active', totalOrders: 24, lastOrder: '2024-06-20' },
        { id: 'CUST-002', name: 'Green Valley Farms', email: 'orders@greenvalley.com', phone: '(555) 987-6543', address: '456 Farm Rd, Rural', status: 'Active', totalOrders: 12, lastOrder: '2024-06-18' },
        { id: 'CUST-003', name: 'City Plaza Offices', email: 'facilities@cityplaza.com', phone: '(555) 456-7890', address: '789 Business Blvd', status: 'Inactive', totalOrders: 3, lastOrder: '2024-01-15' }
    ],
    suppliers: [
        { id: 'SUP-001', name: 'Global Bottles Inc.', category: 'Plastics & Bottles', contact: 'Sarah Jenkins', phone: '(555) 111-2222', status: 'Active', rating: 4.8 },
        { id: 'SUP-002', name: 'PureFilter Tech', category: 'Water Filtration Systems', contact: 'Mike Chen', phone: '(555) 333-4444', status: 'Active', rating: 4.5 },
        { id: 'SUP-003', name: 'Rapid Logistics', category: 'Logistics & Fuel', contact: 'David Ross', phone: '(555) 555-6666', status: 'Review', rating: 3.2 }
    ],
    inventory: [
        { id: 'INV-001', name: '10 Gallon Jug', sku: 'JUG-10G', category: 'Containers', stock: 450, threshold: 100, status: 'In Stock', lastRestock: '2024-06-01' },
        { id: 'INV-002', name: '5 Gallon Jug', sku: 'JUG-05G', category: 'Containers', stock: 85, threshold: 100, status: 'Low Stock', lastRestock: '2024-05-15' },
        { id: 'INV-003', name: 'Carbon Filter Pro', sku: 'FIL-CARB', category: 'Filtration', stock: 12, threshold: 20, status: 'Low Stock', lastRestock: '2024-04-20' },
        { id: 'INV-004', name: 'Replacement Spigot', sku: 'PRT-SPIG', category: 'Parts', stock: 0, threshold: 50, status: 'Out of Stock', lastRestock: '2024-01-10' }
    ],
    orders: [
        { id: 'ORD-1001', customerName: 'TechFlow Solutions', customerId: 'CUST-001', date: '2024-06-22', expectedDate: '2024-06-25', status: 'Processing', total: 450.00, items: 3 },
        { id: 'ORD-1002', customerName: 'Green Valley Farms', customerId: 'CUST-002', date: '2024-06-21', expectedDate: '2024-06-23', status: 'Shipped', total: 1200.50, items: 12 },
        { id: 'ORD-1003', customerName: 'City Plaza Offices', customerId: 'CUST-003', date: '2024-06-20', expectedDate: '2024-06-20', status: 'Delivered', total: 85.00, items: 1 }
    ]
};

window.DB = {
    init: function() {
        if (!localStorage.getItem(DB_KEY)) {
            localStorage.setItem(DB_KEY, JSON.stringify(defaultData));
        }
    },
    
    getData: function() {
        return JSON.parse(localStorage.getItem(DB_KEY)) || defaultData;
    },
    
    saveData: function(data) {
        localStorage.setItem(DB_KEY, JSON.stringify(data));
    },

    // CUSTOMERS
    getCustomers: function() { return this.getData().customers; },
    addCustomer: function(customer) {
        const data = this.getData();
        customer.id = 'CUST-' + Math.floor(1000 + Math.random() * 9000);
        customer.totalOrders = 0;
        customer.lastOrder = 'N/A';
        customer.status = 'Active';
        data.customers.push(customer);
        this.saveData(data);
        return customer;
    },

    // SUPPLIERS
    getSuppliers: function() { return this.getData().suppliers; },
    addSupplier: function(supplier) {
        const data = this.getData();
        supplier.id = 'SUP-' + Math.floor(1000 + Math.random() * 9000);
        supplier.status = 'Active';
        supplier.rating = 5.0; // default
        data.suppliers.push(supplier);
        this.saveData(data);
        return supplier;
    },

    // INVENTORY
    getInventory: function() { return this.getData().inventory; },
    addInventory: function(item) {
        const data = this.getData();
        item.id = 'INV-' + Math.floor(1000 + Math.random() * 9000);
        item.stock = parseInt(item.stock) || 0;
        item.threshold = parseInt(item.threshold) || 0;
        item.status = item.stock === 0 ? 'Out of Stock' : (item.stock <= item.threshold ? 'Low Stock' : 'In Stock');
        item.lastRestock = new Date().toISOString().split('T')[0];
        data.inventory.push(item);
        this.saveData(data);
        return item;
    },

    // ORDERS
    getOrders: function() { return this.getData().orders; },
    addOrder: function(order) {
        const data = this.getData();
        order.id = 'ORD-' + Math.floor(1000 + Math.random() * 9000);
        order.status = 'Processing';
        order.date = new Date().toISOString().split('T')[0];
        order.items = parseInt(order.items) || 1;
        order.total = parseFloat(order.total) || 0;
        
        // Lookup customer name if not provided
        if(!order.customerName && order.customerId) {
            const cust = data.customers.find(c => c.id === order.customerId);
            if(cust) order.customerName = cust.name;
        }

        data.orders.push(order);
        this.saveData(data);
        return order;
    },

    // UTILS
    deleteRecord: function(collection, id) {
        const data = this.getData();
        if (data[collection]) {
            data[collection] = data[collection].filter(item => item.id !== id);
            this.saveData(data);
        }
    }
};

// Initialize DB on load
DB.init();
