const fs = require('fs');

const files = [
    'payment-customer-pending-add.html',
    'payment-customer-received-add.html',
    'payment-supplier-pending-add.html',
    'payment-supplier-received-add.html'
];

files.forEach(file => {
    if (!fs.existsSync(file)) {
        console.log("Skipping " + file + " (not found)");
        return;
    }
    let content = fs.readFileSync(file, 'utf8');
    
    // Add names to the inputs
    content = content.replace('id="pay-entity" required', 'id="pay-entity" name="entityName" required');
    content = content.replace('id="pay-amount" required', 'id="pay-amount" name="amount" required');
    content = content.replace('<select class="w-full bg-white/50', '<select name="method" class="w-full bg-white/50');
    content = content.replace('id="pay-date" required', 'id="pay-date" name="date" required');
    
    fs.writeFileSync(file, content);
    console.log('Fixed names in ' + file);
});
