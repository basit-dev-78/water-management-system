const fs = require('fs');

const files = [
    'payment-customer-pending.html',
    'payment-customer-received.html',
    'payment-supplier-pending.html',
    'payment-supplier-received.html'
];

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    
    // Replace the empty state div with a wrapper id
    const emptyStateHTML = `<div class="p-8 text-center text-on-surface-variant">
                    <span class="material-symbols-outlined text-[48px] opacity-50 mb-2">inventory_2</span>
                    <p class="text-[14px] font-medium">No records found for this view.</p>
                </div>`;
                
    const listId = file.replace('.html', '-list');
    
    if (content.includes(emptyStateHTML)) {
        content = content.replace(emptyStateHTML, `<div id="${listId}" class="p-4 grid grid-cols-1 gap-3">\n${emptyStateHTML}\n</div>`);
        fs.writeFileSync(file, content);
        console.log('Added list container to ' + file);
    }
});
