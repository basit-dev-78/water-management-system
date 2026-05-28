import { showToast } from '../ui/components.js';

function routeToParent(currentPanelId) {
    let targetPage = '';
    if (currentPanelId === 'panel-customer-add') targetPage = 'customers.html';
    if (currentPanelId === 'panel-supplier-add') targetPage = 'suppliers.html';
    if (currentPanelId === 'panel-inventory-add') targetPage = 'inventory.html';
    if (currentPanelId === 'panel-order-add') targetPage = 'orders.html';

    if (targetPage) {
        window.location.href = targetPage;
    }
}

export function initForms() {
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

                const formData = new FormData(form);
                const data = Object.fromEntries(formData.entries());

                let successMessage = "Entry saved successfully!";
                if (panelId.includes('customer') && window.DB) {
                    window.DB.addCustomer(data);
                    successMessage = "Customer saved successfully!";
                } else if (panelId.includes('supplier') && window.DB) {
                    window.DB.addSupplier(data);
                    successMessage = "Supplier onboarded successfully!";
                } else if (panelId.includes('inventory') && window.DB) {
                    window.DB.addInventory(data);
                    successMessage = "Stock item added successfully!";
                } else if (panelId.includes('order') && window.DB) {
                    data.total = Math.floor(Math.random() * 500) + 50; 
                    window.DB.addOrder(data);
                    successMessage = "Order created successfully!";
                }

                if (window.renderAll) window.renderAll();

                showToast(successMessage, "success");
                
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
}
