
export function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast-enter flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border backdrop-blur-md min-w-[280px] pointer-events-auto';

    let icon = 'info';
    let iconColor = 'text-primary';
    let bgColor = 'bg-surface/90';
    let borderColor = 'border-primary/20';

    if (type === 'success') {
        icon = 'check_circle';
        iconColor = 'text-primary';
        bgColor = 'bg-primary-container/90';
        borderColor = 'border-primary/30';
    } else if (type === 'error') {
        icon = 'error';
        iconColor = 'text-error';
        bgColor = 'bg-error-container/90';
        borderColor = 'border-error/30';
    }

    toast.classList.add(bgColor, borderColor);

    toast.innerHTML = `
        <span class="material-symbols-outlined ${iconColor}" style="font-variation-settings: 'FILL' 1;">${icon}</span>
        <span class="text-[12px] font-bold text-on-surface flex-1">${message}</span>
        <button class="w-6 h-6 flex items-center justify-center rounded-full hover:bg-black/5 text-on-surface-variant transition-colors" onclick="this.parentElement.remove()">
            <span class="material-symbols-outlined text-[16px]">close</span>
        </button>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        if (!toast.parentElement) return;
        toast.classList.remove('toast-enter');
        toast.classList.add('toast-exit');
        setTimeout(() => {
            toast.remove();
        }, 400); 
    }, 3000);
}

export function initComponents() {
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
}
