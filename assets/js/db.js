const DB_KEY = 'aquaflow_db_v1';

const defaultData = {
    customers: [
        { id: 'CUST-001', name: 'TechFlow Solutions', email: 'contact@techflow.com', phone: '(555) 123-4567', address: '123 Tech Park, SF', status: 'Active', totalOrders: 24, lastOrder: '2024-06-20', pendingAmount: 150.00 },
        { id: 'CUST-002', name: 'Green Valley Farms', email: 'orders@greenvalley.com', phone: '(555) 987-6543', address: '456 Farm Rd, Rural', status: 'Active', totalOrders: 12, lastOrder: '2024-06-18', pendingAmount: 320.00 },
        { id: 'CUST-003', name: 'City Plaza Offices', email: 'facilities@cityplaza.com', phone: '(555) 456-7890', address: '789 Business Blvd', status: 'Inactive', totalOrders: 3, lastOrder: '2024-01-15', pendingAmount: 0.00 }
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
    ],
    drivers: [
        { id: 'DRV-001', name: 'Mark Wilson', phone: '(555) 019-2831', status: 'On Delivery', vehicle: 'TRK-01', tasks: ['ORD-1002'] },
        { id: 'DRV-002', name: 'Sarah Connor', phone: '(555) 043-9821', status: 'On Delivery', vehicle: 'TRK-02', tasks: ['ORD-1001'] },
        { id: 'DRV-003', name: 'David Miller', phone: '(555) 091-3482', status: 'Available', vehicle: 'TRK-03', tasks: [] }
    ],
    metrics: {
        receivable: 4820.00,
        payable: 1250.00,
        expenses: 3680.00,
        emptyBottles: 342,
        alerts: [
            { id: 'ALT-001', type: 'warning', title: 'Supply Delay: West Coast', desc: 'Shipment #AQ-908 delayed by 4 hours.', time: '12 min ago' },
            { id: 'ALT-002', type: 'inventory', title: 'Low Inventory: Filters', desc: 'Central Hub reporting < 15% stock.', time: '1 hour ago' },
            { id: 'ALT-003', type: 'success', title: 'Sensor Sync', desc: '32 new sensors mapped to northern grid.', time: '3 hours ago' }
        ],
        chartData: [
            { day: 'Mon', height: 45 },
            { day: 'Tue', height: 60 },
            { day: 'Wed', height: 55 },
            { day: 'Thu', height: 85 },
            { day: 'Fri', height: 70 },
            { day: 'Sat', height: 30 },
            { day: 'Sun', height: 40 }
        ]
    },
    settings: {
        printer: {
            width: '80mm',
            connection: 'browser',
            template: 'minimalist',
            ipAddress: '192.168.1.100',
            autoPrint: false,
            headerText: 'AquaFlow Pro',
            footerText: 'Thank you for your business!',
            items: [
                { name: '10 Gallon Jug Refill', qty: 3, price: 25.00 },
                { name: 'Empty Jug Return Deposit', qty: 3, price: 5.00 }
            ],
            fbr: {
                businessNtn: '1234567-8',
                businessStrn: '9876543210123',
                posId: 'POS-88992',
                clientNtn: '7654321-0',
                clientCnic: '42101-1234567-1',
                clientName: 'City Plaza Offices',
                clientAddress: '789 Business Blvd',
                salesTaxPct: 18
            },
            delivery: {
                driver: 'Sarah Connor',
                client: 'City Plaza Offices',
                address: '789 Business Blvd'
            }
        },
        general: {
            companyName: 'AquaFlow Pro',
            phone: '(555) 019-8833',
            email: 'support@aquaflowpro.com',
            address: '456 Water Way, Aquapolis',
            currency: 'Rs.',
            dateFormat: 'YYYY-MM-DD'
        },
        notifications: {
            emailAlerts: true,
            lowStockThreshold: 20
        }
    }
};

window.DB = {
    init: function() {
        if (!localStorage.getItem(DB_KEY)) {
            localStorage.setItem(DB_KEY, JSON.stringify(defaultData));
        } else {
            const data = JSON.parse(localStorage.getItem(DB_KEY));
            let updated = false;
            if (!data.drivers) {
                data.drivers = defaultData.drivers;
                updated = true;
            }
            if (!data.settings) {
                data.settings = defaultData.settings;
                updated = true;
            } else {
                if (data.settings.general && (data.settings.general.currency === '$' || !data.settings.general.currency)) {
                    data.settings.general.currency = 'Rs.';
                    updated = true;
                }
                if (!data.settings.printer.items) {
                    data.settings.printer.items = defaultData.settings.printer.items;
                    updated = true;
                }
                if (!data.settings.printer.fbr) {
                    data.settings.printer.fbr = defaultData.settings.printer.fbr;
                    updated = true;
                }
                if (!data.settings.printer.delivery) {
                    data.settings.printer.delivery = defaultData.settings.printer.delivery;
                    updated = true;
                }
            }
            if (updated) {
                localStorage.setItem(DB_KEY, JSON.stringify(data));
            }
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
        customer.pendingAmount = parseFloat(customer.pendingAmount) || 0.00;
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
        
        // Lookup customer name and update their order count/last order date
        if (order.customerId) {
            const cust = data.customers.find(c => c.id === order.customerId);
            if (cust) {
                order.customerName = cust.name;
                cust.totalOrders = (cust.totalOrders || 0) + 1;
                cust.lastOrder = order.date;
                cust.pendingAmount = (parseFloat(cust.pendingAmount) || 0) + order.total;
            }
        }

        data.orders.push(order);
        this.saveData(data);
        return order;
    },

    updateOrderStatus: function(id, status) {
        const data = this.getData();
        const order = data.orders.find(o => o.id === id);
        if (order) {
            order.status = status;
            this.saveData(data);
            return order;
        }
        return null;
    },

    getStats: function() {
        const data = this.getData();
        const orders = data.orders || [];
        const customers = data.customers || [];
        const inventory = data.inventory || [];

        const revenue = orders.reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0);
        const delivered = orders.filter(o => o.status === 'Delivered').length;
        const processing = orders.filter(o => o.status === 'Processing').length;
        const shipped = orders.filter(o => o.status === 'Shipped').length;
        const emptyBottles = inventory
            .filter(i => i.category === 'Containers')
            .reduce((sum, i) => sum + Math.max(0, i.threshold * 2 - i.stock), 0);
        const lowStock = inventory.filter(i => i.stock <= i.threshold).length;
        const receivable = orders
            .filter(o => o.status !== 'Delivered')
            .reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0);
        const payable = (data.suppliers || []).length * 250;
        const expenses = Math.round(revenue * 0.28);

        return {
            customerCount: customers.length,
            activeCustomers: customers.filter(c => c.status === 'Active').length,
            orderCount: orders.length,
            delivered,
            processing,
            shipped,
            revenue,
            receivable,
            payable,
            expenses,
            emptyBottles: emptyBottles || inventory.reduce((s, i) => s + (i.stock <= i.threshold ? i.threshold - i.stock : 0), 0),
            lowStock
        };
    },

    // UTILS
    deleteRecord: function(collection, id) {
        const data = this.getData();
        if (data[collection]) {
            // If deleting an order, decrement the customer's totalOrders and update lastOrder date
            if (collection === 'orders') {
                const order = data.orders.find(item => item.id === id);
                if (order && order.customerId) {
                    const cust = data.customers.find(c => c.id === order.customerId);
                    if (cust) {
                        cust.totalOrders = Math.max(0, (cust.totalOrders || 0) - 1);
                        const remainingOrders = data.orders.filter(o => o.id !== id && o.customerId === order.customerId);
                        if (remainingOrders.length > 0) {
                            remainingOrders.sort((a, b) => new Date(b.date) - new Date(a.date));
                            cust.lastOrder = remainingOrders[0].date;
                        } else {
                            cust.lastOrder = 'N/A';
                        }
                    }
                }
            }

            data[collection] = data[collection].filter(item => item.id !== id);

            // If deleting a customer, also delete all orders associated with them
            if (collection === 'customers') {
                if (data.orders) {
                    data.orders = data.orders.filter(order => order.customerId !== id);
                }
            }

            this.saveData(data);
        }
    },

    // METRICS & DASHBOARD UTILS
    getMetrics: function() {
        const data = this.getData();
        if (!data.metrics) {
            data.metrics = defaultData.metrics;
            this.saveData(data);
        }
        return data.metrics;
    },
    
    deleteAlert: function(alertId) {
        const data = this.getData();
        if (data.metrics && data.metrics.alerts) {
            data.metrics.alerts = data.metrics.alerts.filter(a => a.id !== alertId);
            this.saveData(data);
        }
    },

    // DRIVERS
    getDrivers: function() { 
        return this.getData().drivers || []; 
    },
    addDriver: function(driver) {
        const data = this.getData();
        if (!data.drivers) data.drivers = [];
        driver.id = 'DRV-' + Math.floor(1000 + Math.random() * 9000);
        driver.tasks = driver.tasks || [];
        driver.status = driver.status || 'Available';
        driver.vehicle = driver.vehicle || 'None';
        data.drivers.push(driver);
        this.saveData(data);
        return driver;
    },
    deleteDriver: function(id) {
        const data = this.getData();
        if (data.drivers) {
            data.drivers = data.drivers.filter(d => d.id !== id);
            this.saveData(data);
        }
    },
    assignTaskToDriver: function(driverId, task) {
        const data = this.getData();
        if (data.drivers) {
            const driver = data.drivers.find(d => d.id === driverId);
            if (driver) {
                driver.tasks = driver.tasks || [];
                if (!driver.tasks.includes(task)) {
                    driver.tasks.push(task);
                    driver.status = 'On Delivery';
                    this.saveData(data);
                    return true;
                }
            }
        }
        return false;
    },
    removeTaskFromDriver: function(driverId, taskIndex) {
        const data = this.getData();
        if (data.drivers) {
            const driver = data.drivers.find(d => d.id === driverId);
            if (driver && driver.tasks) {
                driver.tasks.splice(taskIndex, 1);
                if (driver.tasks.length === 0) {
                    driver.status = 'Available';
                }
                this.saveData(data);
                return true;
            }
        }
        return false;
    },
    updateDriverStatus: function(driverId, status) {
        const data = this.getData();
        if (data.drivers) {
            const driver = data.drivers.find(d => d.id === driverId);
            if (driver) {
                driver.status = status;
                this.saveData(data);
                return true;
            }
        }
        return false;
    },

    // SETTINGS MANAGEMENT
    getSettings: function() {
        const data = this.getData();
        if (!data.settings) {
            data.settings = defaultData.settings;
            this.saveData(data);
        }
        return data.settings;
    },
    saveSettings: function(settings) {
        const data = this.getData();
        data.settings = settings;
        this.saveData(data);
        return settings;
    }
};

// Initialize DB on load
DB.init();
