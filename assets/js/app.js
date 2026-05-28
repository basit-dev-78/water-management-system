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

                // If valid, show success, reset, and route back
                let successMessage = "Entry saved successfully!";
                if (panelId.includes('customer')) successMessage = "Customer saved successfully!";
                if (panelId.includes('supplier')) successMessage = "Supplier onboarded successfully!";
                if (panelId.includes('inventory')) successMessage = "Stock item added successfully!";
                if (panelId.includes('order')) successMessage = "Order created successfully!";

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
            showToast("Advanced filter panel opened.");
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
});
