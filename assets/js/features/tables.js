
const PAGINATION = {
        customers: { page: 1, perPage: 12 },
        suppliers: { page: 1, perPage: 12 },
        inventory: { page: 1, perPage: 12 },
        orders: { page: 1, perPage: 12 }
    };

    function updatePaginationUI(type, totalItems) {
        const state = PAGINATION[type];
        const totalPages = Math.ceil(totalItems / state.perPage) || 1;
        
        if (state.page > totalPages) state.page = totalPages;
        if (state.page < 1) state.page = 1;
        
        const startItem = totalItems === 0 ? 0 : ((state.page - 1) * state.perPage) + 1;
        const endItem = Math.min(state.page * state.perPage, totalItems);
        
        const infoSpan = document.getElementById(`pagination-${type}-info`);
        if (infoSpan) infoSpan.textContent = `Showing ${startItem}-${endItem} of ${totalItems}`;
        
        const btnPrev = document.getElementById(`btn-prev-${type}`);
        const btnNext = document.getElementById(`btn-next-${type}`);
        
        if (btnPrev) btnPrev.disabled = state.page <= 1;
        if (btnNext) btnNext.disabled = state.page >= totalPages;
    }

    

export function initTables() {
    window.renderAll = function() {
        if(typeof renderCustomers === 'function') renderCustomers();
        if(typeof renderSuppliers === 'function') renderSuppliers();
        if(typeof renderInventory === 'function') renderInventory();
        if(typeof renderOrders === 'function') renderOrders();
    };

    // Call render once after a short delay to ensure DOM is ready
    setTimeout(window.renderAll, 100);
}
