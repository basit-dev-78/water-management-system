import { loadComponents } from './core/loader.js';
import { initRouter } from './core/router.js';
import { initComponents, initFilterPanel, initGlobalButtons, updateMetrics } from './ui/components.js';
import { initForms } from './features/forms.js';
import { initTables } from './features/tables.js';
import { initAIChat } from './features/ai-chat.js';
import { initLogistics } from './features/logistics.js';
import { initReports } from './features/reports.js';
import { initDeliveries } from './features/deliveries.js';
import { initDrivers } from './features/drivers.js';
import { renderDashboard } from './features/dashboard.js';
import { exportCurrentPage } from './features/export.js';

document.addEventListener('DOMContentLoaded', async () => {
    await loadComponents();
    initRouter();
    initComponents();
    initFilterPanel();
    initGlobalButtons();
    
    window.updateMetrics = updateMetrics;
    window.exportCurrentPage = exportCurrentPage;
    updateMetrics();
    renderDashboard();

    initAIChat();
    initForms();
    initTables();
    initLogistics();
    initReports();
    initDeliveries();
    initDrivers();

    if (window.renderAll) {
        window.renderAll();
    }
});
