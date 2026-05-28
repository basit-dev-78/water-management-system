export async function loadComponents() {
    try {
        const cacheBuster = '?v=' + new Date().getTime();
        
        // Load sidebar
        const sidebarRes = await fetch('components/sidebar.html' + cacheBuster);
        if (sidebarRes.ok) {
            document.getElementById('sidebar-container').innerHTML = await sidebarRes.text();
        } else {
            console.error('Failed to load sidebar.html');
        }

        // Load header
        const headerRes = await fetch('components/header.html' + cacheBuster);
        if (headerRes.ok) {
            document.getElementById('header-container').innerHTML = await headerRes.text();
        } else {
            console.error('Failed to load header.html');
        }

        // Load filter panel
        const filterRes = await fetch('components/filter-panel.html' + cacheBuster);
        if (filterRes.ok) {
            // Append to body or a specific container
            const div = document.createElement('div');
            div.innerHTML = await filterRes.text();
            document.body.appendChild(div);
        }

        // Load toast container
        const toastRes = await fetch('components/toast-container.html' + cacheBuster);
        if (toastRes.ok) {
            const div = document.createElement('div');
            div.innerHTML = await toastRes.text();
            document.body.appendChild(div.firstElementChild);
        }

        // Load AI panel
        const aiRes = await fetch('components/ai-panel.html' + cacheBuster);
        if (aiRes.ok) {
            const div = document.createElement('div');
            div.innerHTML = await aiRes.text();
            while (div.firstChild) {
                document.body.appendChild(div.firstChild);
            }
        }

    } catch (e) {
        console.error('Error loading components:', e);
        // Fallback layout initialization could go here
    }
}
