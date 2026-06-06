export function initRouter() {
    const sidebarLinks = document.querySelectorAll('aside nav a');
    const headerTitle = document.getElementById('header-title');
    const mobileBottomLinks = document.querySelectorAll('#mobile-bottom-nav a');

    function applyActiveState() {
        const path = window.location.pathname;
        let page = path.split('/').pop();
        if (!page || page === '') page = 'index.html';
        if (!page.includes('.')) page = page + '.html';

        let activeTabId = null;
        let titleText = 'Dashboard';

        // Find the active link based on href
        sidebarLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (href === page) {
                activeTabId = link.getAttribute('data-tab');
                titleText = link.textContent.trim();
                const textSpan = link.querySelector('span:not(.material-symbols-outlined)');
                if(textSpan) titleText = textSpan.textContent.trim();
            }
        });

        if (page === 'settings.html') {
            titleText = 'Settings';
            activeTabId = 'panel-settings';
        } else if (page === 'profile.html') {
            titleText = 'My Profile';
            activeTabId = 'panel-profile';
        } else if (page === 'help.html') {
            titleText = 'Help & Support';
            activeTabId = 'panel-help';
        } else if (page === 'drivers.html') {
            titleText = 'Drivers';
        } else if (page === 'driver-add.html') {
            titleText = 'Add Driver';
        }

        // Update Header Title
        if(headerTitle) {
            headerTitle.textContent = titleText;
        }

        if (!activeTabId) return;

        // Update Sidebar Active State
        sidebarLinks.forEach(link => {
            if (link.classList.contains('nav-parent')) return; // handled by accordion

            const isSub = link.classList.contains('nav-link-sub');
            const spanIcon = link.querySelector('span.material-symbols-outlined');
            
            if (link.getAttribute('data-tab') === activeTabId) {
                if (isSub) {
                    link.className = "nav-link-sub relative text-[11px] text-primary bg-primary/10 font-bold py-2 px-3 rounded-lg transition-all duration-200 flex items-center gap-2 group";
                    const dot = link.querySelector('.sub-dot');
                    if (dot) dot.className = "sub-dot w-1.5 h-1.5 rounded-full bg-primary transition-colors";
                    
                    // Auto-open parent accordion if it's a subtab
                    const group = link.closest('.nav-group');
                    if (group) {
                        const children = group.querySelector('.nav-children');
                        const icon = group.querySelector('.expand-icon');
                        if (children && icon) {
                            setTimeout(() => {
                                children.style.maxHeight = children.scrollHeight + "px";
                                icon.style.transform = 'rotate(180deg)';
                            }, 50);
                        }
                    }
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

        // Update Mobile Bottom Nav Active State
        mobileBottomLinks.forEach(link => {
            const linkTab = link.getAttribute('data-tab') || '';
            const normalizedLink = linkTab.replace('-add', '').replace(/s$/, '');
            const normalizedActive = (activeTabId || '').replace('-add', '').replace(/s$/, '');

            if (linkTab === activeTabId || (normalizedActive && normalizedActive === normalizedLink)) {
                link.classList.remove('text-on-surface-variant');
                link.classList.add('text-[#0f5238]', 'scale-110');
                const span = link.querySelector('span');
                if(span) span.style.fontVariationSettings = "'FILL' 1";
            } else {
                link.classList.add('text-on-surface-variant');
                link.classList.remove('text-[#0f5238]', 'scale-110');
                const span = link.querySelector('span');
                if(span) span.style.fontVariationSettings = "'FILL' 0";
            }
        });
    }

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
                // Close all other accordions first
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

    setTimeout(applyActiveState, 100);
}
