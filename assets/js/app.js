document.addEventListener('DOMContentLoaded', async () => {
    // ----------------------------------------------------
    // LOAD EXTERNAL COMPONENTS (Sidebar & Header)
    // ----------------------------------------------------
    try {
        const cacheBuster = '?v=' + new Date().getTime();
        const sidebarRes = await fetch('sidebar.html' + cacheBuster);
        if (sidebarRes.ok) {
            document.getElementById('sidebar-container').innerHTML = await sidebarRes.text();
        } else {
            console.error('Failed to load sidebar.html');
        }

        const headerRes = await fetch('header.html' + cacheBuster);
        if (headerRes.ok) {
            document.getElementById('header-container').innerHTML = await headerRes.text();
        } else {
            console.error('Failed to load header.html');
        }
    } catch (e) {
        console.error("Error fetching components. Ensure you are running a local server to avoid CORS issues with file:// protocol.", e);
        document.body.innerHTML = `<div style="padding: 50px; text-align: center; font-family: sans-serif; color: #ef4444;">
            <h1 style="font-size: 24px; margin-bottom: 10px;">Local Server Required</h1>
            <p>Because the app now fetches external HTML files (sidebar & header), your browser's security policy blocked the load.</p>
            <p><strong>Please open this project using a Local Web Server (e.g., VS Code "Live Server").</strong></p>
        </div>`;
        return; // stop initialization
    }

    // Now query the DOM elements because they have been injected
    const sidebarLinks = document.querySelectorAll('aside nav a');
    const panels = document.querySelectorAll('.panel');
    const headerTitle = document.getElementById('header-title');

    // DOM queries for mobile nav
    const mobileBottomLinks = document.querySelectorAll('#mobile-bottom-nav a');

    function switchPanel(tabId, titleText) {
        // Update Sidebar Active State
        sidebarLinks.forEach(link => {
            if (link.classList.contains('nav-parent')) return; // handled by accordion

            const isSub = link.classList.contains('nav-link-sub');
            const spanIcon = link.querySelector('span.material-symbols-outlined');
            
            if (link.getAttribute('data-tab') === tabId) {
                if (isSub) {
                    link.className = "nav-link-sub relative text-[11px] text-primary bg-primary/10 font-bold py-2 px-3 rounded-lg transition-all duration-200 flex items-center gap-2 group";
                    const dot = link.querySelector('.sub-dot');
                    if (dot) dot.className = "sub-dot w-1.5 h-1.5 rounded-full bg-primary transition-colors";
                } else {
                    link.className = "nav-link-primary flex items-center gap-stack-md bg-gradient-to-r from-[#c2edc4]/40 to-transparent text-[#0f5238] border-l-4 border-[#0f5238] font-bold rounded-r-lg px-3 py-2.5 transition-all duration-200 mt-1";
                    if(spanIcon) spanIcon.style.fontVariationSettings = "'FILL' 1";
                }
            } else {
                if (isSub) {
                    link.className = "nav-link-sub relative text-[11px] font-medium text-on-surface-variant hover:text-primary hover:bg-primary/5 py-2 px-3 rounded-lg transition-all duration-200 flex items-center gap-2 group";
                    const dot = link.querySelector('.sub-dot');
                    if (dot) dot.className = "sub-dot w-1.5 h-1.5 rounded-full bg-outline-variant/50 group-hover:bg-primary transition-colors";
                } else {
                    link.className = "nav-link-primary flex items-center gap-stack-md text-on-surface-variant hover:bg-surface-variant/50 rounded-lg px-3 py-2 transition-all duration-200 mt-1";
                    if(spanIcon) spanIcon.style.fontVariationSettings = "'FILL' 0";
                }
            }
        });

        // Update Header Title
        if(headerTitle) {
            headerTitle.textContent = titleText;
        }

        // Show specific panel
        panels.forEach(panel => {
            if (panel.id === tabId) {
                panel.classList.add('active');
            } else {
                panel.classList.remove('active');
            }
        });

        // Update Mobile Bottom Nav Active State
        mobileBottomLinks.forEach(link => {
            if (link.getAttribute('data-tab') === tabId) {
                link.classList.remove('text-on-surface-variant');
                link.classList.add('text-[#0f5238]', 'scale-110');
                link.querySelector('span').style.fontVariationSettings = "'FILL' 1";
            } else {
                link.classList.add('text-on-surface-variant');
                link.classList.remove('text-[#0f5238]', 'scale-110');
                link.querySelector('span').style.fontVariationSettings = "'FILL' 0";
            }
        });
    }

    // Attach event listeners to mobile bottom nav
    mobileBottomLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const tabId = link.getAttribute('data-tab');
            // Hardcode or map titles for primary tabs
            let titleText = 'Dashboard';
            if (tabId === 'panel-customers') titleText = 'Customers';
            if (tabId === 'panel-suppliers') titleText = 'Suppliers';
            if (tabId === 'panel-inventory') titleText = 'Inventory';
            if (tabId === 'panel-orders') titleText = 'Orders';
            
            if (tabId) {
                switchPanel(tabId, titleText);
            }
        });
    });

    // Attach event listeners to sidebar
    
    // 1. Handle accordion toggle for parent tabs
    document.querySelectorAll('.nav-parent').forEach(parent => {
        parent.addEventListener('click', (e) => {
            e.preventDefault();
            const group = parent.closest('.nav-group');
            const children = group.querySelector('.nav-children');
            const icon = parent.querySelector('.expand-icon');
            
            // Toggle current accordion
            if (children.style.maxHeight) {
                children.style.maxHeight = null;
                icon.style.transform = 'rotate(0deg)';
            } else {
                // Close all other accordions first (optional, but good UX)
                document.querySelectorAll('.nav-children').forEach(child => {
                    child.style.maxHeight = null;
                    const childIcon = child.closest('.nav-group').querySelector('.expand-icon');
                    if(childIcon) childIcon.style.transform = 'rotate(0deg)';
                });
                // Open this one
                children.style.maxHeight = children.scrollHeight + "px";
                icon.style.transform = 'rotate(180deg)';
            }
        });
    });

    // 2. Handle subtab switching
    sidebarLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            // Ignore if it's a parent tab (handled above)
            if (link.classList.contains('nav-parent')) return;

            e.preventDefault();
            const tabId = link.getAttribute('data-tab');
            
            // derive title from the text content of the link
            let titleText = link.textContent.trim();
            // Fallback for icons if they exist in standard tabs
            const textSpan = link.querySelector('span:not(.material-symbols-outlined)');
            if(textSpan) titleText = textSpan.textContent.trim();
            
            if (tabId) {
                switchPanel(tabId, titleText);
            }
        });
    });

    // Handle internal glass-card effects
    document.querySelectorAll('.glass-card, .glass-panel').forEach(card => {
        card.addEventListener('mouseenter', () => {
            card.classList.add('border-primary/20');
            card.style.transform = 'translateY(-2px)';
            card.style.transition = 'transform 0.2s, border-color 0.2s';
        });
        card.addEventListener('mouseleave', () => {
            card.classList.remove('border-primary/20');
            card.style.transform = 'translateY(0)';
        });
    });

    // Handle table row micro-interactions
    document.querySelectorAll('tbody tr').forEach(row => {
        row.addEventListener('mouseenter', () => {
            const btn = row.querySelector('.material-symbols-outlined');
            if(btn) btn.classList.add('text-primary');
        });
        row.addEventListener('mouseleave', () => {
            const btn = row.querySelector('.material-symbols-outlined');
            if(btn) btn.classList.remove('text-primary');
        });
    });

    // Sidebar search interaction and Global Search Filtering
    const searchInputs = document.querySelectorAll('input[type="text"]');
    searchInputs.forEach(searchInput => {
        searchInput.addEventListener('focus', () => {
            searchInput.parentElement.classList.add('ring-1', 'ring-primary/20');
        });
        searchInput.addEventListener('blur', () => {
            searchInput.parentElement.classList.remove('ring-1', 'ring-primary/20');
        });

        // Add real-time filtering logic
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            // Find the currently active panel
            const activePanel = document.querySelector('.panel.active');
            if(activePanel) {
                // Find all table rows in the active panel
                const rows = activePanel.querySelectorAll('tbody tr');
                rows.forEach(row => {
                    const text = row.textContent.toLowerCase();
                    if(text.includes(searchTerm)) {
                        row.style.display = '';
                    } else {
                        row.style.display = 'none';
                    }
                });
            }
        });
    });

    // ----------------------------------------------------
    // DYNAMIC DATA RENDERING
    // ----------------------------------------------------
    function renderCustomers() {
        const tbody = document.getElementById('customers-table-body');
        if(!tbody) return;
        const customers = window.DB.getCustomers();
        tbody.innerHTML = '';
        customers.forEach(cust => {
            const tr = document.createElement('tr');
            tr.className = 'hover:bg-surface-container-low/30 transition-colors group';
            tr.innerHTML = `
                <td class="px-container-margin py-2">
                    <div class="flex items-center gap-2.5">
                        <div class="w-8 h-8 rounded-lg bg-secondary-fixed text-on-secondary-fixed flex items-center justify-center font-bold text-[10px]">
                            ${cust.name ? cust.name.substring(0,2).toUpperCase() : 'NA'}</div>
                        <div>
                            <p class="text-[12px] font-bold text-on-surface leading-tight">${cust.name || 'Unknown'}</p>
                            <p class="text-[9px] text-on-surface-variant">${cust.id}</p>
                        </div>
                    </div>
                </td>
                <td class="px-4 py-2">
                    <p class="text-[11px] font-medium text-on-surface">${cust.phone || cust.contact || 'N/A'}</p>
                    <p class="text-[10px] text-on-surface-variant/70">${cust.email || 'N/A'}</p>
                </td>
                <td class="px-4 py-2">
                    <span class="bg-surface-variant/50 px-2 py-0.5 rounded text-[10px] text-on-surface-variant font-medium">${cust.address ? cust.address.split(',')[0] : 'Unknown'}</span>
                </td>
                <td class="px-4 py-2 text-[11px] font-semibold">$4.50</td>
                <td class="px-4 py-2">
                    <div class="flex items-center gap-1">
                        <span class="text-[11px] font-bold text-primary">${cust.totalOrders || 0}</span>
                        <span class="text-[9px] text-on-surface-variant">orders</span>
                    </div>
                </td>
                <td class="px-4 py-2 text-[10px] text-on-surface-variant font-medium">${cust.lastOrder || 'N/A'}</td>
                <td class="px-4 py-2">
                    <span class="${cust.status === 'Active' ? 'bg-primary/10 text-primary' : 'bg-surface-variant text-on-surface-variant'} px-2 py-0.5 rounded-full text-[9px] font-bold inline-flex items-center gap-1">
                        <span class="w-1 h-1 rounded-full ${cust.status === 'Active' ? 'bg-primary' : 'bg-on-surface-variant'}"></span> ${cust.status}
                    </span>
                </td>
                <td class="px-container-margin py-2 text-right">
                    <button class="material-symbols-outlined text-on-surface-variant hover:text-error transition-colors p-1" onclick="DB.deleteRecord('customers', '${cust.id}'); window.renderAll();">delete</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    function renderSuppliers() {
        const tbody = document.getElementById('suppliers-table-body');
        const mobileList = document.getElementById('suppliers-mobile-list');
        if(!tbody || !mobileList) return;
        
        const suppliers = window.DB.getSuppliers();
        tbody.innerHTML = '';
        mobileList.innerHTML = '';
        
        suppliers.forEach(supp => {
            // Desktop Row
            const tr = document.createElement('tr');
            tr.className = 'hover:bg-surface-container-lowest transition-colors group';
            tr.innerHTML = `
                <td class="px-container-margin py-2">
                    <div class="flex items-center gap-3">
                        <div class="w-7 h-7 rounded-full bg-secondary-fixed text-on-secondary-fixed flex items-center justify-center font-bold text-[10px]">
                            ${supp.name ? supp.name.substring(0,2).toUpperCase() : 'NA'}</div>
                        <div>
                            <p class="font-body-md text-body-md font-bold text-on-surface">${supp.name || 'Unknown'}</p>
                            <p class="font-label-xs text-label-xs text-on-surface-variant">ID: ${supp.id}</p>
                        </div>
                    </div>
                </td>
                <td class="px-6 py-2">
                    <p class="font-body-md text-body-md text-on-surface">${supp.phone || supp.contact || 'N/A'}</p>
                    <p class="text-[10px] text-on-surface-variant">${supp.category || ''}</p>
                </td>
                <td class="px-6 py-2">
                    <span class="bg-primary-container/10 text-primary-container px-2.5 py-1 rounded-full font-label-xs text-label-xs font-bold inline-flex items-center gap-1.5">
                        <span class="w-1.5 h-1.5 rounded-full bg-primary-container"></span> ${supp.status || 'Active'}
                    </span>
                </td>
                <td class="px-container-margin text-right py-2">
                    <button class="material-symbols-outlined text-on-surface-variant hover:text-error transition-colors" onclick="DB.deleteRecord('suppliers', '${supp.id}'); window.renderAll();">delete</button>
                </td>
            `;
            tbody.appendChild(tr);

            // Mobile Card
            const card = document.createElement('div');
            card.className = 'bg-surface-container-low/30 rounded-xl p-4 border border-outline-variant/20 shadow-sm';
            card.innerHTML = `
                <div class="flex justify-between items-start mb-3">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-full bg-secondary-fixed text-on-secondary-fixed flex items-center justify-center font-bold text-[12px]">
                            ${supp.name ? supp.name.substring(0,2).toUpperCase() : 'NA'}</div>
                        <div>
                            <p class="font-body-md font-bold text-on-surface leading-tight">${supp.name}</p>
                            <p class="font-label-xs text-on-surface-variant mt-0.5">ID: ${supp.id}</p>
                        </div>
                    </div>
                    <button class="material-symbols-outlined text-on-surface-variant hover:text-error transition-colors p-1" onclick="DB.deleteRecord('suppliers', '${supp.id}'); window.renderAll();">delete</button>
                </div>
                <div class="flex justify-between items-center pt-3 border-t border-outline-variant/10 mt-1">
                    <div class="flex items-center gap-1.5 text-on-surface-variant">
                        <span class="material-symbols-outlined text-[14px]">call</span>
                        <p class="text-[11px] font-medium">${supp.phone || supp.contact || 'N/A'}</p>
                    </div>
                    <span class="bg-primary-container/10 text-primary-container px-2.5 py-1 rounded-full font-label-xs font-bold inline-flex items-center gap-1.5">
                        <span class="w-1.5 h-1.5 rounded-full bg-primary-container"></span> ${supp.status || 'Active'}
                    </span>
                </div>
            `;
            mobileList.appendChild(card);
        });
    }

    function renderInventory() {
        const tbody = document.getElementById('inventory-table-body');
        if(!tbody) return;
        const inventory = window.DB.getInventory();
        tbody.innerHTML = '';
        inventory.forEach(item => {
            const isLow = item.stock <= item.threshold;
            const tr = document.createElement('tr');
            tr.className = 'hover:bg-surface-container-low/50 transition-colors group';
            tr.innerHTML = `
                <td class="px-container-margin py-3">
                    <p class="text-[13px] font-bold text-on-surface leading-tight">${item.name}</p>
                </td>
                <td class="px-4 py-3">
                    <p class="text-[12px] font-medium text-on-surface-variant">${item.sku || 'N/A'}</p>
                </td>
                <td class="px-4 py-3"><span class="bg-surface-variant/50 px-2.5 py-1 rounded-md text-[11px] font-medium">${item.category || 'General'}</span></td>
                <td class="px-4 py-3">
                    <p class="text-[13px] font-bold ${isLow ? 'text-error' : 'text-primary'}">${item.stock}</p>
                </td>
                <td class="px-4 py-3"><span class="${isLow ? 'bg-error/10 text-error animate-pulse-slow' : 'bg-primary/10 text-primary'} px-3 py-1 rounded-full text-[10px] font-bold">${item.status}</span></td>
            `;
            tbody.appendChild(tr);
        });
    }

    function renderOrders() {
        const tbody = document.getElementById('orders-table-body');
        const mobileList = document.getElementById('orders-mobile-list');
        if(!tbody || !mobileList) return;
        const orders = window.DB.getOrders();
        tbody.innerHTML = '';
        mobileList.innerHTML = '';
        orders.forEach(order => {
            let statusClass = 'bg-primary-container/20 text-primary-container'; // processing
            if(order.status === 'Shipped' || order.status === 'Out for Delivery') statusClass = 'bg-secondary/20 text-secondary';
            if(order.status === 'Delivered' || order.status === 'Completed') statusClass = 'bg-primary/10 text-primary';
            
            // Desktop Table Row
            const tr = document.createElement('tr');
            tr.className = 'hover:bg-surface-container-low/50 transition-colors group';
            tr.innerHTML = `
                <td class="px-container-margin py-3">
                    <p class="text-[13px] font-bold text-on-surface">${order.id}</p>
                </td>
                <td class="px-4 py-3">
                    <p class="text-[12px] font-medium text-on-surface-variant">${order.customerName}</p>
                </td>
                <td class="px-4 py-3">
                    <p class="text-[13px] font-bold text-on-surface">$${(order.total || 0).toFixed(2)}</p>
                </td>
                <td class="px-4 py-3"><span class="${statusClass} px-3 py-1 rounded-full text-[10px] font-bold">${order.status}</span></td>
                <td class="px-4 py-3">
                    <p class="text-[12px] text-on-surface-variant">${order.date}</p>
                </td>
            `;
            tbody.appendChild(tr);

            // Mobile Card
            const card = document.createElement('div');
            card.className = 'bg-surface-container-low/30 rounded-xl p-4 border border-outline-variant/20 shadow-sm';
            card.innerHTML = `
                <div class="flex justify-between items-start mb-2">
                    <div>
                        <p class="font-body-md font-bold text-on-surface leading-tight">${order.customerName}</p>
                        <p class="font-label-xs text-on-surface-variant mt-0.5">Order ID: ${order.id}</p>
                    </div>
                    <span class="${statusClass} px-2.5 py-1 rounded-full text-[10px] font-bold inline-block">${order.status}</span>
                </div>
                <div class="flex justify-between items-center pt-2 border-t border-outline-variant/10 mt-2">
                    <div class="flex items-center gap-1.5 text-on-surface-variant">
                        <span class="material-symbols-outlined text-[14px]">calendar_today</span>
                        <p class="text-[11px] font-medium">${order.date}</p>
                    </div>
                    <p class="text-[14px] font-bold text-on-surface">$${(order.total || 0).toFixed(2)}</p>
                </div>
            `;
            mobileList.appendChild(card);
        });
    }

    // Expose renderAll globally so inline onclick events can call it
    window.renderAll = function() {
        renderCustomers();
        renderSuppliers();
        renderInventory();
        renderOrders();
    };
    
    // Call render once after a short delay to ensure DOM is ready
    setTimeout(window.renderAll, 100);

    // ----------------------------------------------------
    // FORM FUNCTIONALITY & NOTIFICATIONS
    // ----------------------------------------------------

    // Toast Notification System
    function showToast(message, type = 'success') {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `glass-card p-4 rounded-xl shadow-lg flex items-center gap-3 toast-enter border-l-4 ${type === 'success' ? 'border-[#0f5238] bg-[#f0f4f2]/90' : 'border-red-500 bg-red-50/90'}`;
        
        const icon = document.createElement('span');
        icon.className = 'material-symbols-outlined';
        icon.textContent = type === 'success' ? 'check_circle' : 'error';
        icon.style.color = type === 'success' ? '#0f5238' : '#ef4444';
        
        const text = document.createElement('p');
        text.className = 'text-[13px] font-bold text-on-surface m-0';
        text.textContent = message;

        toast.appendChild(icon);
        toast.appendChild(text);
        container.appendChild(toast);

        // Remove toast after 3 seconds
        setTimeout(() => {
            toast.classList.remove('toast-enter');
            toast.classList.add('toast-exit');
            setTimeout(() => {
                toast.remove();
            }, 400); // match animation duration
        }, 3000);
    }

    // Form Routing Helper
    function routeToParent(currentPanelId) {
        let targetPanelId = '';
        if (currentPanelId === 'panel-customer-add') targetPanelId = 'panel-customers';
        if (currentPanelId === 'panel-supplier-add') targetPanelId = 'panel-suppliers';
        if (currentPanelId === 'panel-inventory-add') targetPanelId = 'panel-inventory';
        if (currentPanelId === 'panel-order-add') targetPanelId = 'panel-orders';

        if (targetPanelId) {
            const sidebarLink = document.querySelector(`a[data-tab="${targetPanelId}"]`);
            if (sidebarLink) {
                sidebarLink.click();
            }
        }
    }

    // Form Functionality for all Add pages
    const addPanels = ['panel-customer-add', 'panel-supplier-add', 'panel-inventory-add', 'panel-order-add'];
    
    addPanels.forEach(panelId => {
        const panel = document.getElementById(panelId);
        if (!panel) return;

        const form = panel.querySelector('form');
        const btnCancel = panel.querySelector('.form-btn-cancel');
        const btnSave = panel.querySelector('.form-btn-save');
        
        if (btnCancel && btnSave) {

            btnCancel.addEventListener('click', () => {
                if(form) form.reset();
                routeToParent(panelId);
            });

            btnSave.addEventListener('click', () => {
                // Basic Validation: Check if any required field is empty.
                // We'll consider a field required if its preceding label contains '*'
                let isValid = true;
                let firstInvalidInput = null;

                if (form) {
                    const inputs = form.querySelectorAll('input, select');
                    inputs.forEach(input => {
                        const label = input.previousElementSibling;
                        if (label && label.tagName === 'LABEL' && label.textContent.includes('*')) {
                            if (!input.value.trim()) {
                                isValid = false;
                                input.classList.add('ring-2', 'ring-red-500/50', 'border-red-500/50');
                                // Remove highlight when user starts typing
                                input.addEventListener('input', () => {
                                    input.classList.remove('ring-2', 'ring-red-500/50', 'border-red-500/50');
                                }, { once: true });
                                if (!firstInvalidInput) firstInvalidInput = input;
                            }
                        }
                    });
                }

                if (!isValid) {
                    showToast("Please fill in all required fields.", "error");
                    if (firstInvalidInput) firstInvalidInput.focus();
                    return;
                }

                // Collect Form Data
                const formData = new FormData(form);
                const data = Object.fromEntries(formData.entries());

                // Save to Local DB
                let successMessage = "Entry saved successfully!";
                if (panelId.includes('customer')) {
                    window.DB.addCustomer(data);
                    successMessage = "Customer saved successfully!";
                } else if (panelId.includes('supplier')) {
                    window.DB.addSupplier(data);
                    successMessage = "Supplier onboarded successfully!";
                } else if (panelId.includes('inventory')) {
                    window.DB.addInventory(data);
                    successMessage = "Stock item added successfully!";
                } else if (panelId.includes('order')) {
                    // Quick calculation for mock total
                    data.total = Math.floor(Math.random() * 500) + 50; 
                    window.DB.addOrder(data);
                    successMessage = "Order created successfully!";
                }

                // Re-render all tables
                if (window.renderAll) window.renderAll();

                showToast(successMessage, "success");
                
                // Optional: Delay clearing form slightly for a smoother transition
                setTimeout(() => {
                    if(form) form.reset();
                    routeToParent(panelId);
                }, 600); 
            });
        }
    });

    // Special case for "+ Add Line Item" button in orders
    const btnAddLineItem = document.querySelector('#panel-order-add button.text-primary');
    if (btnAddLineItem) {
        btnAddLineItem.addEventListener('click', (e) => {
            e.preventDefault();
            showToast("Product line item added to order", "success");
        });
    }

    // ----------------------------------------------------
    // GLOBAL BUTTON HANDLER (Prototype Functionality)
    // ----------------------------------------------------
    document.body.addEventListener('click', (e) => {
        // Find if a button was clicked (or an element inside a button)
        const btn = e.target.closest('button');
        if (!btn) return;

        // Ignore buttons that are inside forms (Cancel/Save) as they are handled above
        if (btn.classList.contains('form-btn-cancel') || btn.classList.contains('form-btn-save')) return;
        if (btn.closest('form') && !btn.textContent.includes('Add Line Item')) return;

        const text = btn.textContent.trim();
        const iconText = btn.querySelector('.material-symbols-outlined')?.textContent || '';

        // Routing buttons
        if (text.includes('Add Customer') || text.includes('New Customer')) {
            const link = document.querySelector(`a[data-tab="panel-customer-add"]`);
            if (link) link.click();
            return;
        }
        if ((text.includes('Add Supplier') || text.includes('New Supplier')) && !btn.closest('.fixed.bottom-0')) {
            const link = document.querySelector(`a[data-tab="panel-supplier-add"]`);
            if (link) link.click();
            return;
        }
        if (text.includes('Add Item') || text.includes('Add Stock')) {
            const link = document.querySelector(`a[data-tab="panel-inventory-add"]`);
            if (link) link.click();
            return;
        }
        if (text.includes('New Order')) {
            const link = document.querySelector(`a[data-tab="panel-order-add"]`);
            if (link) link.click();
            return;
        }

        // Generic Toast Triggers
        if (text.includes('Export')) {
            showToast("Data exported successfully to CSV.", "success");
        } else if (text.includes('Filter') || iconText === 'filter_list') {
            const overlay = document.getElementById('filter-overlay');
            const panel = document.getElementById('filter-panel');
            if(overlay && panel) {
                overlay.classList.remove('opacity-0', 'pointer-events-none');
                panel.classList.remove('translate-x-full');
            }
        } else if (text.includes('New Report')) {
            showToast("Generating new report...");
        } else if (text.includes('Explore Feature')) {
            showToast("Redirecting to interactive tutorial...");
        } else if (text.includes('Read Documentation')) {
            showToast("Opening documentation portal...");
        } else if (iconText === 'more_vert' || text === 'more_vert') {
            showToast("Action menu opened.");
        } else if (iconText === 'chevron_right' || text === 'chevron_right') {
            showToast("Loading next page...");
        } else if (iconText === 'chevron_left' || text === 'chevron_left') {
            showToast("Loading previous page...");
        } else if (iconText === 'notifications' || text === 'notifications_active') {
            showToast("You have 3 new notifications.");
        } else if (btn.classList.contains('rounded-full') && !text) {
            showToast("User profile opened.");
        }
    });

    // Initialize first panel if available
    const activeTab = document.querySelector('aside nav a[data-tab="panel-dashboard"]');
    if (activeTab) {
        const tabId = activeTab.getAttribute('data-tab');
        const titleText = activeTab.querySelector('span:not(.material-symbols-outlined)').textContent.trim();
        switchPanel(tabId, titleText);
    }

    // ----------------------------------------------------
    // FILTER PANEL LOGIC
    // ----------------------------------------------------
    const filterOverlay = document.getElementById('filter-overlay');
    const filterPanel = document.getElementById('filter-panel');
    const btnCloseFilters = document.getElementById('btn-close-filters');
    const btnApplyFilters = document.getElementById('btn-apply-filters');
    const btnResetFilters = document.getElementById('btn-reset-filters');

    function closeFilterPanel() {
        if(filterOverlay && filterPanel) {
            filterOverlay.classList.add('opacity-0', 'pointer-events-none');
            filterPanel.classList.add('translate-x-full');
        }
    }

    if(btnCloseFilters) btnCloseFilters.addEventListener('click', closeFilterPanel);
    if(filterOverlay) filterOverlay.addEventListener('click', closeFilterPanel);

    if(btnResetFilters) {
        btnResetFilters.addEventListener('click', () => {
            const kw = document.getElementById('filter-keyword');
            const st = document.getElementById('filter-status');
            const cat = document.getElementById('filter-category');
            if(kw) kw.value = '';
            if(st) st.value = '';
            if(cat) cat.value = '';
            
            // Reset active rows
            const activePanel = document.querySelector('.panel.active');
            if(activePanel) {
                const rows = activePanel.querySelectorAll('tbody tr');
                rows.forEach(row => row.style.display = '');
                // Also reset mobile cards
                const cards = activePanel.querySelectorAll('.glass-card.rounded-xl.p-4');
                cards.forEach(card => {
                    if(card.parentElement && card.parentElement.id.includes('list')) card.style.display = '';
                });
            }
            closeFilterPanel();
        });
    }

    if(btnApplyFilters) {
        btnApplyFilters.addEventListener('click', () => {
            const kwInput = document.getElementById('filter-keyword');
            const stInput = document.getElementById('filter-status');
            const catInput = document.getElementById('filter-category');
            
            const keyword = kwInput ? kwInput.value.toLowerCase() : '';
            const status = stInput ? stInput.value.toLowerCase() : '';
            const category = catInput ? catInput.value.toLowerCase() : '';
            
            const activePanel = document.querySelector('.panel.active');
            if(activePanel) {
                const rows = activePanel.querySelectorAll('tbody tr');
                rows.forEach(row => {
                    const text = row.textContent.toLowerCase();
                    let matchKeyword = keyword === '' || text.includes(keyword);
                    let matchStatus = status === '' || text.includes(status);
                    let matchCategory = category === '' || text.includes(category);
                    
                    if(matchKeyword && matchStatus && matchCategory) {
                        row.style.display = '';
                    } else {
                        row.style.display = 'none';
                    }
                });
                
                // Also filter mobile cards
                const cards = activePanel.querySelectorAll('.glass-card.rounded-xl.p-4');
                cards.forEach(card => {
                    if(card.parentElement && !card.parentElement.id.includes('list')) return; // Ensure it's a list card
                    const text = card.textContent.toLowerCase();
                    let matchKeyword = keyword === '' || text.includes(keyword);
                    let matchStatus = status === '' || text.includes(status);
                    let matchCategory = category === '' || text.includes(category);
                    
                    if(matchKeyword && matchStatus && matchCategory) {
                        card.style.display = '';
                    } else {
                        card.style.display = 'none';
                    }
                });
            }
            closeFilterPanel();
            showToast("Filters applied.");
        });
    }
});
