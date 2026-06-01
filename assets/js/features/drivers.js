import { showToast } from '../ui/components.js';

let searchQuery = '';

export function initDrivers() {
    const registryPanel = document.getElementById('panel-drivers');
    const addPanel = document.getElementById('panel-driver-add');
    if (!window.DB) return;

    if (registryPanel) {
        // Search bar event
        const searchInput = document.getElementById('drivers-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                searchQuery = e.target.value.toLowerCase();
                renderDrivers();
            });
        }

        // Expose helpers to window
        window.assignWork = function(driverId, selectId) {
            const select = document.getElementById(selectId);
            if (!select) return;
            
            const task = select.value;
            if (!task || task === "") {
                showToast("Please select an active order.");
                return;
            }

            if (window.DB.assignTaskToDriver(driverId, task)) {
                showToast(`Assigned ${task} successfully.`, 'success');
                renderDrivers();
            }
        };

        window.assignCustomWork = function(driverId, inputId) {
            const input = document.getElementById(inputId);
            if (!input) return;

            const task = input.value.trim();
            if (!task) {
                showToast("Task description cannot be empty.");
                return;
            }

            if (window.DB.assignTaskToDriver(driverId, task)) {
                showToast("Custom task assigned.", 'success');
                input.value = '';
                renderDrivers();
            }
        };

        window.removeAssignedWork = function(driverId, taskIndex) {
            if (window.DB.removeTaskFromDriver(driverId, taskIndex)) {
                showToast("Assigned work removed.", 'info');
                renderDrivers();
            }
        };

        window.deleteDriver = function(driverId, name) {
            if (confirm(`Are you sure you want to remove driver ${name}?`)) {
                window.DB.deleteDriver(driverId);
                showToast(`Driver ${name} removed from registry.`, 'info');
                renderDrivers();
            }
        };

        window.changeDriverStatus = function(driverId, selectId) {
            const select = document.getElementById(selectId);
            if (!select) return;
            const status = select.value;
            window.DB.updateDriverStatus(driverId, status);
            showToast("Driver status updated.", 'success');
            renderDrivers();
        };

        renderDrivers();
    }

    if (addPanel) {
        const cancelBtn = document.getElementById('cancel-driver-btn');
        const saveBtn = document.getElementById('save-driver-btn');
        const form = document.getElementById('form-driver-add');

        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                window.location.href = 'drivers.html';
            });
        }

        if (saveBtn && form) {
            saveBtn.addEventListener('click', () => {
                form.requestSubmit();
            });
        }

        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();

                const name = document.getElementById('driver-name').value.trim();
                const phone = document.getElementById('driver-phone').value.trim();
                const vehicle = document.getElementById('driver-vehicle').value;
                const status = document.getElementById('driver-status').value;

                if (!name || !phone) return;

                window.DB.addDriver({
                    name,
                    phone,
                    vehicle,
                    status,
                    tasks: []
                });

                showToast(`Driver ${name} registered successfully.`, 'success');
                
                if (typeof window.updateMetrics === 'function') {
                    window.updateMetrics();
                }

                setTimeout(() => {
                    window.location.href = 'drivers.html';
                }, 300);
            });
        }
    }
}

function statusBadge(status) {
    const map = {
        'Available': 'bg-primary/10 text-primary border border-primary/10',
        'On Delivery': 'bg-secondary/10 text-secondary border border-secondary/10',
        'Off Duty': 'bg-outline-variant/30 text-on-surface-variant border border-outline-variant/20',
    };
    const cls = map[status] || 'bg-outline-variant/30 text-on-surface-variant';
    return `<span class="text-[9px] font-bold uppercase px-2.5 py-0.5 rounded-full ${cls}">${status}</span>`;
}

function renderDrivers() {
    const list = document.getElementById('drivers-card-list');
    if (!list) return;

    const drivers = window.DB.getDrivers() || [];
    const orders = window.DB.getOrders() || [];

    // Calculate dynamic stats
    const availableCount = drivers.filter(d => d.status === 'Available').length;
    const onDeliveryCount = drivers.filter(d => d.status === 'On Delivery').length;
    const offDutyCount = drivers.filter(d => d.status === 'Off Duty').length;

    const statAvailable = document.getElementById('driver-stat-available');
    const statOnDelivery = document.getElementById('driver-stat-ondelivery');
    const statOffDuty = document.getElementById('driver-stat-offduty');

    if (statAvailable) statAvailable.textContent = availableCount;
    if (statOnDelivery) statOnDelivery.textContent = onDeliveryCount;
    if (statOffDuty) statOffDuty.textContent = offDutyCount;

    // Filter drivers
    let filtered = drivers;
    if (searchQuery) {
        filtered = drivers.filter(d => {
            const name = (d.name || '').toLowerCase();
            const phone = (d.phone || '').toLowerCase();
            const vehicle = (d.vehicle || '').toLowerCase();
            const status = (d.status || '').toLowerCase();
            const tasksString = (d.tasks || []).join(' ').toLowerCase();

            return name.includes(searchQuery) ||
                   phone.includes(searchQuery) ||
                   vehicle.includes(searchQuery) ||
                   status.includes(searchQuery) ||
                   tasksString.includes(searchQuery);
        });
    }

    // Render list
    if (filtered.length === 0) {
        list.innerHTML = `
            <div class="col-span-1 md:col-span-2 lg:col-span-3 py-16 text-center text-on-surface-variant/60 bg-surface-container-low/40 rounded-2xl border border-outline-variant/10">
                <span class="material-symbols-outlined text-[48px] text-on-surface-variant/30 mb-2">contacts</span>
                <p class="text-[13px] font-bold text-on-surface">No drivers found</p>
                <p class="text-[11px] text-on-surface-variant/80 mt-1">There are no drivers matching your search.</p>
            </div>
        `;
        return;
    }

    // Get active orders (not Delivered) to populate assignment selector
    const activeOrders = orders.filter(o => o.status !== 'Delivered');

    list.innerHTML = filtered.map(d => {
        const selectId = `assign-select-${d.id}`;
        const inputId = `assign-input-${d.id}`;
        const statusSelectId = `status-select-${d.id}`;

        // Render assigned tasks
        let tasksHtml = '';
        if (!d.tasks || d.tasks.length === 0) {
            tasksHtml = `<p class="text-[10px] text-on-surface-variant/60 italic font-medium">No active tasks assigned.</p>`;
        } else {
            tasksHtml = d.tasks.map((task, idx) => {
                // Check if task is an order ID
                const order = orders.find(o => o.id === task);
                const desc = order ? `${task} - ${order.customerName}` : task;
                return `
                    <div class="flex items-center justify-between gap-2 bg-surface-container-low/50 px-2.5 py-1.5 rounded-lg border border-outline-variant/10 text-[11px] font-medium text-on-surface group">
                        <span class="truncate pr-1">${desc}</span>
                        <button onclick="window.removeAssignedWork('${d.id}', ${idx})" class="text-on-surface-variant/50 hover:text-error transition-colors shrink-0" title="Remove Task">
                            <span class="material-symbols-outlined text-[15px]">close</span>
                        </button>
                    </div>
                `;
            }).join('');
        }

        return `
            <div class="glass-card rounded-2xl p-5 flex flex-col gap-4 border border-outline-variant/15 hover:border-primary/20 hover:shadow-md transition-all duration-300">
                <!-- Driver Header -->
                <div class="flex items-center justify-between gap-2 border-b border-outline-variant/10 pb-3">
                    <div class="flex items-center gap-2">
                        <div class="w-8 h-8 rounded-lg bg-secondary/10 text-secondary flex items-center justify-center font-bold text-[12px]">
                            ${(d.name || 'D').charAt(0)}
                        </div>
                        <div>
                            <p class="text-[13px] font-bold text-on-surface leading-tight">${d.name || 'Fleet Driver'}</p>
                            <p class="text-[10px] text-on-surface-variant/70 font-mono mt-0.5">${d.id}</p>
                        </div>
                    </div>
                    <div class="flex items-center gap-1.5">
                        ${statusBadge(d.status)}
                        <button onclick="window.deleteDriver('${d.id}', '${d.name}')" class="text-error hover:bg-error-container/20 p-1 rounded-md transition-colors" title="Delete Driver">
                            <span class="material-symbols-outlined text-[16px]">delete</span>
                        </button>
                    </div>
                </div>

                <!-- Driver Info Details -->
                <div class="grid grid-cols-2 gap-2 text-[11px] bg-surface-container-low/20 p-2.5 rounded-xl border border-outline-variant/10">
                    <div>
                        <span class="text-on-surface-variant/60 block text-[9px] uppercase tracking-wider font-bold">Assigned Truck</span>
                        <span class="font-bold text-on-surface flex items-center gap-1 mt-0.5">
                            <span class="material-symbols-outlined text-[14px] text-primary">local_shipping</span>
                            ${d.vehicle || 'None'}
                        </span>
                    </div>
                    <div>
                        <span class="text-on-surface-variant/60 block text-[9px] uppercase tracking-wider font-bold">Contact Coordinates</span>
                        <a href="tel:${d.phone}" class="font-semibold text-primary hover:underline flex items-center gap-1 mt-0.5">
                            <span class="material-symbols-outlined text-[14px]">call</span>
                            ${d.phone}
                        </a>
                    </div>
                </div>

                <!-- Assigned Work Section -->
                <div>
                    <h5 class="text-[10px] uppercase tracking-wider text-on-surface-variant/60 font-bold mb-2">Assigned Deliveries & Tasks</h5>
                    <div class="space-y-1.5 max-h-[120px] overflow-y-auto pr-0.5 custom-scrollbar">
                        ${tasksHtml}
                    </div>
                </div>

                <!-- Quick Duty Selector -->
                <div class="flex flex-col gap-1">
                    <label class="text-[9px] font-bold uppercase text-on-surface-variant/60">Update Duty Status</label>
                    <select id="${statusSelectId}" onchange="window.changeDriverStatus('${d.id}', '${statusSelectId}')" class="w-full bg-white/50 border border-outline-variant/30 rounded-lg py-1.5 px-2 text-[11px] focus:ring-1 focus:ring-primary/20 outline-none cursor-pointer">
                        <option value="Available" ${d.status === 'Available' ? 'selected' : ''}>Available for Dispatch</option>
                        <option value="On Delivery" ${d.status === 'On Delivery' ? 'selected' : ''}>On Route (Active Duty)</option>
                        <option value="Off Duty" ${d.status === 'Off Duty' ? 'selected' : ''}>Off Duty (Resting)</option>
                    </select>
                </div>

                <!-- Assignment Form -->
                <div class="border-t border-outline-variant/10 pt-3 flex flex-col gap-2.5">
                    <h5 class="text-[10px] uppercase tracking-wider text-on-surface-variant/60 font-bold">Assign New Work</h5>
                    
                    <!-- Order Assignment dropdown -->
                    <div class="flex items-center gap-1.5">
                        <select id="${selectId}" class="flex-1 bg-white/50 border border-outline-variant/30 rounded-lg py-1.5 px-2 text-[11px] focus:ring-1 focus:ring-primary/20 outline-none cursor-pointer">
                            <option value="">-- Assign Active Order --</option>
                            ${activeOrders.map(o => `
                                <option value="${o.id}">${o.id} (${o.customerName})</option>
                            `).join('')}
                        </select>
                        <button onclick="window.assignWork('${d.id}', '${selectId}')" class="px-3 py-1.5 bg-primary text-on-primary rounded-lg text-[11px] font-bold shadow-sm hover:bg-primary/95 transition-all">Assign</button>
                    </div>

                    <!-- Custom Task Assignment text input -->
                    <div class="flex items-center gap-1.5">
                        <input id="${inputId}" type="text" placeholder="Or custom task description..." class="flex-1 bg-white/50 border border-outline-variant/30 rounded-lg py-1.5 px-2 text-[11px] placeholder:text-on-surface-variant/40 focus:ring-1 focus:ring-primary/20 outline-none" />
                        <button onclick="window.assignCustomWork('${d.id}', '${inputId}')" class="w-8 h-8 flex items-center justify-center bg-secondary text-on-secondary rounded-lg font-bold shadow-sm hover:opacity-95 transition-all shrink-0">
                            <span class="material-symbols-outlined text-[16px]">add</span>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}
