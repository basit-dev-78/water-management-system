const fs = require('fs');

const oldPaymentsHtml = `        <!-- Payments -->
        <div class="nav-group">
            <a href="#"
                class="nav-parent flex items-center justify-between text-on-surface-variant hover:bg-surface-variant/50 rounded-lg px-3 py-2 transition-all duration-200">
                <div class="flex items-center gap-stack-md">
                    <span class="material-symbols-outlined text-[18px]">payments</span>
                    <span class="text-[12px] font-bold">Payments</span>
                </div>
                <span
                    class="material-symbols-outlined text-[16px] transition-transform duration-300 expand-icon">expand_more</span>
            </a>
            <div class="nav-children overflow-hidden max-h-0 transition-all duration-300 ease-in-out">
                <div
                    class="flex flex-col gap-1 pl-8 pr-2 py-2 relative before:content-[''] before:absolute before:left-5 before:top-2 before:bottom-2 before:w-[2px] before:bg-outline-variant/20 before:rounded-full">
                    <a data-tab="panel-payment-customer-pending"
                        class="nav-link-sub relative text-[11px] font-medium text-on-surface-variant hover:text-primary hover:bg-primary/5 py-2 px-3 rounded-lg transition-all duration-200 flex items-center gap-2 group"
                        href="payment-customer-pending.html">
                        <div
                            class="sub-dot w-1.5 h-1.5 rounded-full bg-outline-variant/50 group-hover:bg-primary transition-colors">
                        </div>
                        <span>Customer pending payment</span>
                    </a>
                    <a data-tab="panel-payment-customer-received"
                        class="nav-link-sub relative text-[11px] font-medium text-on-surface-variant hover:text-primary hover:bg-primary/5 py-2 px-3 rounded-lg transition-all duration-200 flex items-center gap-2 group"
                        href="payment-customer-received.html">
                        <div
                            class="sub-dot w-1.5 h-1.5 rounded-full bg-outline-variant/50 group-hover:bg-primary transition-colors">
                        </div>
                        <span>Customer Payment Recived</span>
                    </a>
                    <a data-tab="panel-payment-supplier-pending"
                        class="nav-link-sub relative text-[11px] font-medium text-on-surface-variant hover:text-primary hover:bg-primary/5 py-2 px-3 rounded-lg transition-all duration-200 flex items-center gap-2 group"
                        href="payment-supplier-pending.html">
                        <div
                            class="sub-dot w-1.5 h-1.5 rounded-full bg-outline-variant/50 group-hover:bg-primary transition-colors">
                        </div>
                        <span>Supplier pending payments</span>
                    </a>
                    <a data-tab="panel-payment-supplier-received"
                        class="nav-link-sub relative text-[11px] font-medium text-on-surface-variant hover:text-primary hover:bg-primary/5 py-2 px-3 rounded-lg transition-all duration-200 flex items-center gap-2 group"
                        href="payment-supplier-received.html">
                        <div
                            class="sub-dot w-1.5 h-1.5 rounded-full bg-outline-variant/50 group-hover:bg-primary transition-colors">
                        </div>
                        <span>Supplier Payment Recived</span>
                    </a>
                </div>
            </div>
        </div>`;

const newPaymentsHtml = `        <!-- Payments -->
        <div class="nav-group">
            <a href="#"
                class="nav-parent flex items-center justify-between text-on-surface-variant hover:bg-surface-variant/50 rounded-lg px-3 py-2 transition-all duration-200">
                <div class="flex items-center gap-stack-md">
                    <span class="material-symbols-outlined text-[18px]">payments</span>
                    <span class="text-[12px] font-bold">Payments</span>
                </div>
                <span
                    class="material-symbols-outlined text-[16px] transition-transform duration-300 expand-icon">expand_more</span>
            </a>
            <div class="nav-children overflow-hidden max-h-0 transition-all duration-300 ease-in-out">
                <div
                    class="flex flex-col gap-1 pl-8 pr-1 py-2 relative before:content-[''] before:absolute before:left-5 before:top-2 before:bottom-2 before:w-[2px] before:bg-outline-variant/20 before:rounded-full">
                    <a data-tab="panel-payment-customer-pending"
                        class="nav-link-sub relative text-[9px] font-medium text-on-surface-variant hover:text-primary hover:bg-primary/5 py-2 px-2 rounded-lg transition-all duration-200 flex items-center gap-1.5 group"
                        href="payment-customer-pending.html">
                        <div
                            class="sub-dot w-1.5 h-1.5 rounded-full shrink-0 bg-outline-variant/50 group-hover:bg-primary transition-colors">
                        </div>
                        <span class="whitespace-nowrap tracking-tight">Customer pending payment</span>
                    </a>
                    <a data-tab="panel-payment-customer-received"
                        class="nav-link-sub relative text-[9px] font-medium text-on-surface-variant hover:text-primary hover:bg-primary/5 py-2 px-2 rounded-lg transition-all duration-200 flex items-center gap-1.5 group"
                        href="payment-customer-received.html">
                        <div
                            class="sub-dot w-1.5 h-1.5 rounded-full shrink-0 bg-outline-variant/50 group-hover:bg-primary transition-colors">
                        </div>
                        <span class="whitespace-nowrap tracking-tight">Customer Payment Recived</span>
                    </a>
                    <a data-tab="panel-payment-supplier-pending"
                        class="nav-link-sub relative text-[9px] font-medium text-on-surface-variant hover:text-primary hover:bg-primary/5 py-2 px-2 rounded-lg transition-all duration-200 flex items-center gap-1.5 group"
                        href="payment-supplier-pending.html">
                        <div
                            class="sub-dot w-1.5 h-1.5 rounded-full shrink-0 bg-outline-variant/50 group-hover:bg-primary transition-colors">
                        </div>
                        <span class="whitespace-nowrap tracking-tight">Supplier pending payments</span>
                    </a>
                    <a data-tab="panel-payment-supplier-received"
                        class="nav-link-sub relative text-[9px] font-medium text-on-surface-variant hover:text-primary hover:bg-primary/5 py-2 px-2 rounded-lg transition-all duration-200 flex items-center gap-1.5 group"
                        href="payment-supplier-received.html">
                        <div
                            class="sub-dot w-1.5 h-1.5 rounded-full shrink-0 bg-outline-variant/50 group-hover:bg-primary transition-colors">
                        </div>
                        <span class="whitespace-nowrap tracking-tight">Supplier Payment Recived</span>
                    </a>
                </div>
            </div>
        </div>`;

// Update sidebar.html
let htmlData = fs.readFileSync('components/sidebar.html', 'utf8');
if (htmlData.includes(oldPaymentsHtml)) {
    fs.writeFileSync('components/sidebar.html', htmlData.replace(oldPaymentsHtml, newPaymentsHtml));
    console.log('Updated sidebar.html');
}

// Update component-templates.js
let jsData = fs.readFileSync('assets/js/core/component-templates.js', 'utf8');
let jsOld = oldPaymentsHtml.replace(/"/g, '\\"').replace(/\\n/g, '\\n');
let jsNew = newPaymentsHtml.replace(/"/g, '\\"').replace(/\\n/g, '\\n');

if (jsData.includes(jsOld)) {
    fs.writeFileSync('assets/js/core/component-templates.js', jsData.replace(jsOld, jsNew));
    console.log('Updated component-templates.js');
} else {
    console.log('Failed to find block in component-templates.js');
}
