
export function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');

    // Type-specific config
    let icon = 'info';
    let iconColor = 'text-primary';
    let bgColor = 'bg-surface/90';
    let borderColor = 'border-primary/20';
    let accentColor = 'rgba(52,199,135,0.7)';
    let typeClass = '';
    let progressColor = 'var(--color-primary)';

    if (type === 'success') {
        icon = 'check_circle';
        iconColor = 'text-primary';
        bgColor = 'bg-primary-container/90';
        borderColor = 'border-primary/30';
        accentColor = 'rgba(52,199,135,0.9)';
        typeClass = 'toast-success';
        progressColor = 'var(--color-primary)';
    } else if (type === 'error') {
        icon = 'error';
        iconColor = 'text-red-500';
        bgColor = 'bg-red-50/90';
        borderColor = 'border-red-400/30';
        accentColor = 'rgba(239,83,80,0.9)';
        typeClass = 'toast-error';
        progressColor = '#ef5350';
    }

    toast.className = [
        'toast-enter', 'toast-item', typeClass,
        'relative', 'overflow-hidden',
        'flex', 'items-center', 'gap-3',
        'pl-4', 'pr-3', 'py-3',
        'rounded-2xl', 'shadow-xl', 'border', 'backdrop-blur-xl',
        'min-w-[300px]', 'max-w-[360px]', 'pointer-events-auto',
        bgColor, borderColor
    ].filter(Boolean).join(' ');

    toast.innerHTML = `
        <span class="material-symbols-outlined ${iconColor} shrink-0" style="font-size:22px;font-variation-settings:'FILL' 1;">${icon}</span>
        <span class="text-[13px] font-semibold text-on-surface flex-1 leading-snug">${message}</span>
        <button class="w-7 h-7 shrink-0 flex items-center justify-center rounded-full hover:bg-black/10 dark:hover:bg-white/10 text-on-surface-variant transition-all active:scale-90" onclick="this.closest('.toast-item').classList.add('toast-exit');setTimeout(()=>this.closest('.toast-item')?.remove(),300)">
            <span class="material-symbols-outlined" style="font-size:16px;">close</span>
        </button>
        <div class="toast-progress absolute bottom-0 left-0 h-[3px] rounded-b-2xl" style="background:${progressColor};width:100%;transform-origin:left;animation:toastProgress 3s linear forwards;"></div>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        if (!toast.parentElement) return;
        toast.classList.remove('toast-enter');
        toast.classList.add('toast-exit');
        setTimeout(() => toast.remove(), 320);
    }, 3300);
}

export function initComponents() {
    // Theme Toggle Logic
    const btnThemeToggle = document.getElementById('btn-theme-toggle');
    const htmlEl = document.documentElement;

    function applyTheme(theme) {
        const darkIcon = btnThemeToggle?.querySelector('.dark-icon');
        const lightIcon = btnThemeToggle?.querySelector('.light-icon');

        if (theme === 'dark') {
            htmlEl.classList.remove('light');
            htmlEl.classList.add('dark');
            if (darkIcon) darkIcon.classList.add('hidden');
            if (lightIcon) lightIcon.classList.remove('hidden');
        } else {
            htmlEl.classList.remove('dark');
            htmlEl.classList.add('light');
            if (darkIcon) darkIcon.classList.remove('hidden');
            if (lightIcon) lightIcon.classList.add('hidden');
        }
    }

    // Apply saved theme on startup
    const savedTheme = localStorage.getItem('aquaflow-theme') || 'light';
    applyTheme(savedTheme);

    if (btnThemeToggle) {
        btnThemeToggle.addEventListener('click', () => {
            const currentTheme = htmlEl.classList.contains('dark') ? 'dark' : 'light';
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            localStorage.setItem('aquaflow-theme', newTheme);
            applyTheme(newTheme);
            showToast(`Switched to ${newTheme} mode.`, "success");
        });
    }

    // Mobile Sidebar Toggle
    const sidebar = document.getElementById('sidebar');
    const btnMobileMenu = document.getElementById('btn-mobile-menu');
    const btnCloseSidebar = document.getElementById('close-sidebar-btn');

    if (btnMobileMenu && sidebar) {
        btnMobileMenu.addEventListener('click', () => {
            sidebar.classList.remove('hidden', '-translate-x-full');
            sidebar.classList.add('flex', 'translate-x-0');
        });
    }

    if (btnCloseSidebar && sidebar) {
        btnCloseSidebar.addEventListener('click', () => {
            sidebar.classList.remove('translate-x-0');
            sidebar.classList.add('-translate-x-full');
            setTimeout(() => {
                sidebar.classList.remove('flex');
                sidebar.classList.add('hidden');
            }, 300);
        });
    }

    // Glass card interactions
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

    // Deliveries Card Click Navigation
    const deliveriesCard = document.getElementById('dashboard-deliveries-card');
    if (deliveriesCard) {
        deliveriesCard.addEventListener('click', () => {
            window.location.href = 'deliveries.html';
        });
    }

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
            const activePanel = document.querySelector('.panel.active') || document.querySelector('.panel');
            if(activePanel) {
                // Search inside card lists
                const cardLists = activePanel.querySelectorAll('[id$="-card-list"] > div, .grid > .glass-card');
                if (cardLists.length > 0) {
                    cardLists.forEach(card => {
                        const text = card.textContent.toLowerCase();
                        if (text.includes(searchTerm)) {
                            card.style.display = '';
                        } else {
                            card.style.display = 'none';
                        }
                    });
                }

                // Fallback for standard tables
                const rows = activePanel.querySelectorAll('tbody tr');
                if (rows.length > 0) {
                    rows.forEach(row => {
                        const text = row.textContent.toLowerCase();
                        if (text.includes(searchTerm)) {
                            row.style.display = '';
                        } else {
                            row.style.display = 'none';
                        }
                    });
                }
            }
        });
    });

    // Profile dropdown
    const btnProfile = document.getElementById('btn-profile');
    const dropdownProfile = document.getElementById('dropdown-profile');
    
    if (btnProfile && dropdownProfile) {
        btnProfile.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdownProfile.classList.toggle('hidden');
        });

        document.addEventListener('click', (e) => {
            if (!dropdownProfile.contains(e.target) && !btnProfile.contains(e.target)) {
                dropdownProfile.classList.add('hidden');
            }
        });
    }
}

export function initFilterPanel() {
    const filterOverlay = document.getElementById('filter-overlay');
    const filterPanel = document.getElementById('filter-panel');
    const btnCloseFilters = document.getElementById('btn-close-filters');
    const btnResetFilters = document.getElementById('btn-reset-filters');
    const btnApplyFilters = document.getElementById('btn-apply-filters');

    function closeFilterPanel() {
        if(filterOverlay && filterPanel) {
            filterOverlay.classList.add('opacity-0', 'pointer-events-none');
            filterPanel.classList.add('translate-x-full');
        }
    }

    if(filterOverlay) filterOverlay.addEventListener('click', closeFilterPanel);
    if(btnCloseFilters) btnCloseFilters.addEventListener('click', closeFilterPanel);

    if(btnResetFilters) {
        btnResetFilters.addEventListener('click', () => {
            const kwInput = document.getElementById('filter-keyword');
            const stInput = document.getElementById('filter-status');
            const catInput = document.getElementById('filter-category');
            if(kwInput) kwInput.value = '';
            if(stInput) stInput.value = '';
            if(catInput) catInput.value = '';
            
            const activePanel = document.querySelector('.panel.active') || document.querySelector('.panel');
            if(activePanel) {
                const cards = activePanel.querySelectorAll('[id$="-card-list"] > div');
                cards.forEach(card => card.style.display = '');
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
            
            const activePanel = document.querySelector('.panel.active') || document.querySelector('.panel');
            if(activePanel) {
                const cards = activePanel.querySelectorAll('[id$="-card-list"] > div');
                cards.forEach(card => {
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
}

export function initGlobalButtons() {
    document.body.addEventListener('click', (e) => {
        const btn = e.target.closest('button');
        if (!btn) return;

        if (btn.classList.contains('form-btn-cancel') || btn.classList.contains('form-btn-save')) return;
        if (btn.closest('form') && !btn.textContent.includes('Add Line Item')) return;
        if (btn.closest('#filter-panel')) return;

        const text = btn.textContent.trim();
        const iconText = btn.querySelector('.material-symbols-outlined')?.textContent || '';

        // Routing buttons
        if (text.includes('Add Customer') || text.includes('New Customer')) {
            window.location.href = 'customer-add.html';
            return;
        }
        if (text.includes('Add Driver') || text.includes('New Driver')) {
            window.location.href = 'driver-add.html';
            return;
        }
        if ((text.includes('Add Supplier') || text.includes('New Supplier')) && !btn.closest('.fixed.bottom-0')) {
            window.location.href = 'supplier-add.html';
            return;
        }
        if (text.includes('Add Item') || text.includes('Add Stock')) {
            window.location.href = 'inventory-add.html';
            return;
        }
        if (text.includes('New Order')) {
            window.location.href = 'order-add.html';
            return;
        }

        // Generic Toast Triggers
        if (text.includes('Export')) {
            if (typeof window.exportCurrentPage === 'function') {
                window.exportCurrentPage();
            } else {
                showToast("Data exported successfully to CSV.", "success");
            }
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
}

export function updateMetrics() {
    if (!window.DB) return;
    const db = window.DB;
    const stats = db.getStats();
    const metrics = db.getMetrics();

    const setText = (id, text) => {
        const el = document.getElementById(id);
        if (el) el.textContent = text;
    };

    // Dashboard page metrics
    setText('dashboard-customers-count', stats.customerCount.toLocaleString());
    
    const dashboardDeliveries = document.getElementById('dashboard-deliveries-count');
    if (dashboardDeliveries) {
        dashboardDeliveries.innerHTML = `${stats.delivered} <span class="text-[12px] text-on-surface-variant font-normal">/ ${stats.orderCount}</span>`;
    }

    setText('dashboard-revenue-amount', `$${stats.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
    
    // Empty Bottles
    setText('dashboard-empty-bottles', stats.emptyBottles.toLocaleString());
    const dashboardEmptyBottlesBadge = document.getElementById('dashboard-empty-bottles-badge');
    if (dashboardEmptyBottlesBadge) {
        if (stats.emptyBottles > 200) {
            dashboardEmptyBottlesBadge.classList.remove('hidden');
        } else {
            dashboardEmptyBottlesBadge.classList.add('hidden');
        }
    }

    setText('dashboard-receivable', `$${stats.receivable.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
    setText('dashboard-payable', `$${stats.payable.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
    setText('dashboard-expenses', `$${stats.expenses.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);

    // Revenue chart rendering
    const chartContainer = document.getElementById('dashboard-revenue-chart');
    if (chartContainer) {
        const chartData = metrics.chartData || [];
        chartContainer.innerHTML = chartData.map(d => `
            <div class="flex-1 flex flex-col items-center group">
                <div class="w-full chart-bar-gradient rounded-t-md transition-all group-hover:opacity-80"
                    style="height: ${d.height}%;"></div>
                <span class="text-[9px] mt-2 font-bold text-on-surface-variant/50 uppercase">${d.day}</span>
            </div>
        `).join('');
    }

    // Dynamic Alerts rendering
    const alertsCount = document.getElementById('dashboard-alerts-count');
    const alertsList = document.getElementById('dashboard-alerts-list');
    if (alertsCount && alertsList) {
        const alerts = metrics.alerts || [];
        alertsCount.textContent = `${alerts.length} NEW`;
        if (alerts.length === 0) {
            alertsList.innerHTML = `
                <div class="h-full w-full flex flex-col items-center justify-center text-center p-6 opacity-60">
                    <span class="material-symbols-outlined text-[36px] text-on-surface-variant/40 mb-1">notifications_off</span>
                    <p class="text-[11px] font-bold text-on-surface-variant">No critical alerts</p>
                    <p class="text-[10px] text-on-surface-variant/80 mt-0.5">Your system is running smoothly.</p>
                </div>
            `;
        } else {
            alertsList.innerHTML = alerts.map(a => {
                let icon = 'warning';
                let colorCls = 'text-error';
                let bgCls = 'bg-error-container/10 border-error/10';
                if (a.type === 'inventory') {
                    icon = 'inventory_2';
                    colorCls = 'text-tertiary';
                    bgCls = 'bg-tertiary-container/5 border-outline-variant/20';
                } else if (a.type === 'success') {
                    icon = 'cloud_done';
                    colorCls = 'text-primary';
                    bgCls = 'bg-primary-container/5 border-primary/10';
                }
                return `
                    <div class="p-3 ${bgCls} rounded-lg border flex gap-3 relative group">
                        <div class="${colorCls}">
                            <span class="material-symbols-outlined text-[18px]"
                                style="font-variation-settings: 'FILL' 1;">${icon}</span>
                        </div>
                        <div class="flex-1 min-w-0">
                            <h5 class="text-[12px] font-bold text-on-surface leading-tight">${a.title}</h5>
                            <p class="text-[11px] text-on-surface-variant/80 mt-0.5 leading-tight">${a.desc}</p>
                            <span class="text-[9px] ${a.type === 'warning' ? 'text-error' : (a.type === 'success' ? 'text-primary' : 'text-on-surface-variant/60')} font-bold mt-1.5 inline-block uppercase">${a.time}</span>
                        </div>
                        <button onclick="event.stopPropagation(); window.DB.deleteAlert('${a.id}'); window.updateMetrics();" class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-on-surface-variant/50 hover:text-error" title="Dismiss Alert">
                            <span class="material-symbols-outlined text-[14px]">close</span>
                        </button>
                    </div>
                `;
            }).join('');
        }
    }
    
    // Customers page metrics
    setText('kpi-active-customers', stats.activeCustomers.toLocaleString());
    
    const kpiPendingDelivery = document.getElementById('kpi-pending-delivery');
    if (kpiPendingDelivery) {
        const pendingUnits = db.getOrders().filter(o => o.status === 'Processing').reduce((sum, o) => sum + (o.items || 0), 0);
        kpiPendingDelivery.innerHTML = `${pendingUnits} <span class="text-[11px] font-normal text-on-surface-variant">units</span>`;
    }
    
    // Orders page metrics
    setText('kpi-orders-new', stats.processing.toLocaleString());
    setText('kpi-orders-processing', stats.processing.toLocaleString());
    setText('kpi-orders-shipped', stats.shipped.toLocaleString());
    setText('kpi-orders-completed', stats.delivered.toLocaleString());

    // Inventory page metrics
    const invTotal = document.getElementById('kpi-inventory-total');
    if (invTotal) {
        const totalStock = db.getInventory().reduce((s, i) => s + (i.stock || 0), 0);
        invTotal.innerHTML = `${totalStock.toLocaleString()} <span class="text-[12px] font-normal text-on-surface-variant">units</span>`;
    }
    
    const kpiLow = document.getElementById('kpi-inventory-low');
    if (kpiLow) {
        kpiLow.innerHTML = `${stats.lowStock} <span class="text-[12px] font-normal text-on-surface-variant">items</span>`;
    }

    const kpiValue = document.getElementById('kpi-inventory-value');
    if (kpiValue) {
        const prices = { 'INV-001': 25, 'INV-002': 15, 'INV-003': 45, 'INV-004': 5 };
        const value = db.getInventory().reduce((s, i) => s + (i.stock || 0) * (prices[i.id] || 10), 0);
        kpiValue.textContent = `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
}
