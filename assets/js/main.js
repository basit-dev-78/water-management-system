import { loadComponents } from './core/loader.js';
import { initRouter } from './core/router.js';
import { initComponents, initFilterPanel, initGlobalButtons } from './ui/components.js';
import { initForms } from './features/forms.js';
import { initTables } from './features/tables.js';
import { initAIChat } from './features/ai-chat.js';

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Load HTML Components (Sidebar, Header, Filter, Toast, AI Panel)
    await loadComponents();

    // 2. Initialize Routing (Active states based on URL)
    initRouter();

    // 3. Initialize UI Components
    initComponents();
    initFilterPanel();
    initGlobalButtons();

    // 4. Initialize AI Assistant
    initAIChat();

    // 5. Initialize Forms
    initForms();

    // 6. Initialize Tables
    initTables();

    // 7. Render Data if DB is ready
    if (window.renderAll) {
        window.renderAll();
    }
});
