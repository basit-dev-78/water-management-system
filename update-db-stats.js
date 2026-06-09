const fs = require('fs');

let content = fs.readFileSync('assets/js/db.js', 'utf8');

let startStats = content.indexOf('getStats: function() {');
let endStats = content.indexOf('return {', startStats);

if (startStats !== -1 && endStats !== -1) {
    let block = content.substring(startStats, endStats);
    
    // Replace the mocked receivable and payable logic
    let newBlock = block.replace(
        /const receivable = [\s\S]*?(?=const payable)/,
        `const receivable = customers.reduce((sum, c) => sum + (parseFloat(c.pendingAmount) || 0), 0);\n        `
    );
    newBlock = newBlock.replace(
        /const payable = [\s\S]*?(?=const expenses)/,
        `const payable = (data.suppliers || []).reduce((sum, s) => sum + (parseFloat(s.balance) || 0), 0);\n        `
    );
    
    content = content.replace(block, newBlock);
    fs.writeFileSync('assets/js/db.js', content);
    console.log('Updated getStats with real metrics');
} else {
    console.log('Could not find getStats');
}
