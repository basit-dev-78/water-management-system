import { TEMPLATES } from './component-templates.js';

function getBasePath() {
    const path = window.location.pathname;
    const lastSlash = path.lastIndexOf('/');
    if (lastSlash <= 0) return './';
    return path.substring(0, lastSlash + 1);
}

async function loadHtml(path, fallbackKey) {
    try {
        const base = getBasePath();
        const res = await fetch(base + path);
        if (res.ok) return await res.text();
    } catch (_) { /* file:// or network error — use fallback */ }

    if (fallbackKey && TEMPLATES[fallbackKey]) {
        return TEMPLATES[fallbackKey];
    }
    return '';
}

export async function loadComponents() {
    try {
        const [sidebar, header, filter, toast, ai] = await Promise.all([
            loadHtml('components/sidebar.html', 'sidebar'),
            loadHtml('components/header.html', 'header'),
            loadHtml('components/filter-panel.html', 'filter'),
            loadHtml('components/toast-container.html', 'toast'),
            loadHtml('components/ai-panel.html', 'ai')
        ]);

        const sidebarEl = document.getElementById('sidebar-container');
        if (sidebarEl && sidebar) sidebarEl.innerHTML = sidebar;

        const headerEl = document.getElementById('header-container');
        if (headerEl && header) headerEl.innerHTML = header;

        if (filter) {
            const div = document.createElement('div');
            div.innerHTML = filter;
            document.body.appendChild(div);
        }

        if (toast) {
            const div = document.createElement('div');
            div.innerHTML = toast;
            if (div.firstElementChild) document.body.appendChild(div.firstElementChild);
        }

        if (ai) {
            const div = document.createElement('div');
            div.innerHTML = ai;
            while (div.firstChild) document.body.appendChild(div.firstChild);
        }
    } catch (e) {
        console.error('Error loading components:', e);
    }
}
