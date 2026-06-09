const fs = require('fs');

// 1. Create payment-customer-add.html and payment-supplier-add.html
const createGenericForm = (sourceFile, destFile, entityType) => {
    let content = fs.readFileSync(sourceFile, 'utf8');

    // Replace "Add Pending Payment" with "Add Payment Record"
    content = content.replace(/Add Pending Payment/g, 'Add Payment Record');
    // Change Back link to point to just the pending list (or maybe just dashboard? Let's point it to pending for now)

    // Add a Status Dropdown before Payment Date
    let dateInputBlock = `<div class="floating-label-group mb-2 pt-6">`;
    let statusDropdown = `
                    <div class="flex flex-col gap-1.5 pt-6">
                        <label class="text-[11px] font-bold text-on-surface-variant mb-1">Payment Status</label>
                        <select class="w-full bg-white/50 border border-outline-variant/30 rounded-lg py-2 px-3 text-[12px] focus:ring-2 focus:ring-[#0f5238]/30 outline-none cursor-pointer">
                            <option>Pending</option>
                            <option>Received</option>
                        </select>
                    </div>
                    `;

    // I need to be careful with string replacement, let's just do it directly on the <form> content
    // Actually, I can just replace the whole `<div class="col-span-1 md:col-span-2 h-24 md:h-8"></div>` to inject it right before

    content = content.replace(
        `<div class="col-span-1 md:col-span-2 h-24 md:h-8"></div>`,
        statusDropdown + `\n                    <div class="col-span-1 md:col-span-2 h-24 md:h-8"></div>`
    );

    fs.writeFileSync(destFile, content);
    console.log('Created ' + destFile);
}

createGenericForm('payment-customer-pending-add.html', 'payment-customer-add.html', 'Customer');
createGenericForm('payment-supplier-pending-add.html', 'payment-supplier-add.html', 'Supplier');


// 2. Update the Sidebar HTML and JS Templates
function insertSubtabs(html) {
    let paymentsStart = html.indexOf('<!-- Payments -->');
    let end = html.indexOf('<!-- Logistics (No subtabs needed) -->');
    if (paymentsStart === -1 || end === -1) return html;

    let pre = html.substring(0, paymentsStart);
    let post = html.substring(end);
    let middle = html.substring(paymentsStart, end);

    // We want to insert the "Add Payment" tab immediately after the headers.
    // For Customer:
    let customerHeader = '<span class="text-[8px] font-bold text-on-surface-variant/60 uppercase tracking-wider ml-2 mt-1 mb-0">Customer</span>';
    let customerTab = `
                    <a data-tab="panel-payment-customer-add"
                        class="nav-link-sub relative text-[9px] font-medium text-on-surface-variant hover:text-primary hover:bg-gradient-to-r hover:from-primary/10 hover:to-transparent py-1 px-2 rounded-lg transition-all duration-300 flex items-center gap-2.5 group"
                        href="payment-customer-add.html">
                        <div class="sub-dot w-1.5 h-1.5 rounded-full shrink-0 bg-outline-variant/40 group-hover:bg-primary group-hover:w-3 group-hover:shadow-[0_0_6px_rgba(15,82,56,0.4)] transition-all duration-300 ease-out"></div>
                        <span class="whitespace-nowrap tracking-tight">Add Payment Record</span>
                    </a>`;

    // For Supplier:
    let supplierHeader = '<span class="text-[8px] font-bold text-on-surface-variant/60 uppercase tracking-wider ml-2 mt-1 mb-0">Supplier</span>';
    let supplierTab = `
                    <a data-tab="panel-payment-supplier-add"
                        class="nav-link-sub relative text-[9px] font-medium text-on-surface-variant hover:text-primary hover:bg-gradient-to-r hover:from-primary/10 hover:to-transparent py-1 px-2 rounded-lg transition-all duration-300 flex items-center gap-2.5 group"
                        href="payment-supplier-add.html">
                        <div class="sub-dot w-1.5 h-1.5 rounded-full shrink-0 bg-outline-variant/40 group-hover:bg-primary group-hover:w-3 group-hover:shadow-[0_0_6px_rgba(15,82,56,0.4)] transition-all duration-300 ease-out"></div>
                        <span class="whitespace-nowrap tracking-tight">Add Payment Record</span>
                    </a>`;

    middle = middle.replace(customerHeader, customerHeader + customerTab);
    middle = middle.replace(supplierHeader, supplierHeader + supplierTab);

    return pre + middle + post;
}

let htmlData = fs.readFileSync('components/sidebar.html', 'utf8');
fs.writeFileSync('components/sidebar.html', insertSubtabs(htmlData));
console.log('Updated sidebar.html');

let jsData = fs.readFileSync('assets/js/core/component-templates.js', 'utf8');
let newJsData = jsData.split('<!-- Payments -->');
if (newJsData.length > 1) {
    let pre = newJsData[0];
    let afterPay = newJsData[1].split('<!-- Logistics (No subtabs needed) -->');
    let middle = afterPay[0];
    let post = afterPay[1];

    // Same insertion for JS templates, but we need to watch out for string literals.
    // The safest way is to use exactly what we matched.
    // In component-templates.js, the headers have literal \n and escaped quotes if we exported it that way.
    // Wait, earlier I fixed newlines! The JS file NOW contains actual \\n strings and double quotes \" !
    // Let's dynamically find the headers using regex that allows optional escaping.

    let customerHeaderRegex = /<span class=\\?"text-\[8px\] font-bold text-on-surface-variant\/60 uppercase tracking-wider ml-2 mt-1 mb-0\\?">Customer<\\?\/span>/;
    let customerTabJs = `\\n                    <a data-tab=\\"panel-payment-customer-add\\"\\n                        class=\\"nav-link-sub relative text-[9px] font-medium text-on-surface-variant hover:text-primary hover:bg-gradient-to-r hover:from-primary/10 hover:to-transparent py-1 px-2 rounded-lg transition-all duration-300 flex items-center gap-2.5 group\\"\\n                        href=\\"payment-customer-add.html\\">\\n                        <div class=\\"sub-dot w-1.5 h-1.5 rounded-full shrink-0 bg-outline-variant/40 group-hover:bg-primary group-hover:w-3 group-hover:shadow-[0_0_6px_rgba(15,82,56,0.4)] transition-all duration-300 ease-out\\"><\\/div>\\n                        <span class=\\"whitespace-nowrap tracking-tight\\">Add Payment Record<\\/span>\\n                    <\\/a>`;

    let supplierHeaderRegex = /<span class=\\?"text-\[8px\] font-bold text-on-surface-variant\/60 uppercase tracking-wider ml-2 mt-1 mb-0\\?">Supplier<\\?\/span>/;
    let supplierTabJs = `\\n                    <a data-tab=\\"panel-payment-supplier-add\\"\\n                        class=\\"nav-link-sub relative text-[9px] font-medium text-on-surface-variant hover:text-primary hover:bg-gradient-to-r hover:from-primary/10 hover:to-transparent py-1 px-2 rounded-lg transition-all duration-300 flex items-center gap-2.5 group\\"\\n                        href=\\"payment-supplier-add.html\\">\\n                        <div class=\\"sub-dot w-1.5 h-1.5 rounded-full shrink-0 bg-outline-variant/40 group-hover:bg-primary group-hover:w-3 group-hover:shadow-[0_0_6px_rgba(15,82,56,0.4)] transition-all duration-300 ease-out\\"><\\/div>\\n                        <span class=\\"whitespace-nowrap tracking-tight\\">Add Payment Record<\\/span>\\n                    <\\/a>`;

    middle = middle.replace(customerHeaderRegex, match => match + customerTabJs);
    middle = middle.replace(supplierHeaderRegex, match => match + supplierTabJs);

    fs.writeFileSync('assets/js/core/component-templates.js', pre + '<!-- Payments -->' + middle + '<!-- Logistics (No subtabs needed) -->' + post);
    console.log('Updated component-templates.js');
}

