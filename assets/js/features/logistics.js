const TRUCK_DATA = {
    1: {
        id: 'TRK-01',
        driver: 'Mark Wilson',
        cargo: '120 jugs (5 Gallon)',
        status: 'ON TIME',
        statusClass: 'bg-primary/10 text-primary',
        destination: 'TechFlow Solutions',
        speed: '42 mph',
        fuel: '84%'
    },
    2: {
        id: 'TRK-02',
        driver: 'Sarah Connor',
        cargo: '80 jugs (10 Gallon)',
        status: 'DELAYED',
        statusClass: 'bg-error-container/60 text-error',
        destination: 'Green Valley Farms',
        speed: '18 mph',
        fuel: '45%'
    },
    3: {
        id: 'TRK-03',
        driver: 'David Miller',
        cargo: '15 Filtration Cores',
        status: 'LOADING',
        statusClass: 'bg-secondary/15 text-secondary',
        destination: 'City Plaza Offices',
        speed: '0 mph',
        fuel: '98%'
    }
};

export function selectTruck(id) {
    const data = TRUCK_DATA[id];
    if (!data) return;
    
    const emptyEl = document.getElementById('telemetry-empty');
    const detailsEl = document.getElementById('telemetry-details');
    
    if (emptyEl) emptyEl.classList.add('hidden');
    if (detailsEl) {
        detailsEl.classList.remove('hidden');
        detailsEl.classList.add('flex');
    }
    
    const elId = document.getElementById('telemetry-id');
    const elDriver = document.getElementById('telemetry-driver');
    const elCargo = document.getElementById('telemetry-cargo');
    const elDest = document.getElementById('telemetry-destination');
    const elSpeed = document.getElementById('telemetry-speed');
    const elFuel = document.getElementById('telemetry-fuel');
    const statusEl = document.getElementById('telemetry-status');
    
    if (elId) elId.textContent = data.id;
    if (elDriver) elDriver.textContent = data.driver;
    if (elCargo) elCargo.textContent = data.cargo;
    if (elDest) elDest.textContent = data.destination;
    if (elSpeed) elSpeed.textContent = data.speed;
    if (elFuel) elFuel.textContent = data.fuel;
    
    if (statusEl) {
        statusEl.textContent = data.status;
        statusEl.className = `px-2 py-0.5 rounded-full text-[9px] font-bold ${data.statusClass}`;
    }
    
    // Highlight selected truck in SVG
    for (let i = 1; i <= 3; i++) {
        const trkEl = document.getElementById('map-truck-' + i);
        if (trkEl) {
            const circle = trkEl.querySelector('circle:nth-child(2)');
            if (circle) {
                if (i === id) {
                    circle.setAttribute('stroke', 'var(--color-on-surface)');
                    circle.setAttribute('stroke-width', '2');
                } else {
                    circle.removeAttribute('stroke');
                }
            }
        }
    }
}

export function initLogistics() {
    // Expose selectTruck to window so onclick attributes in SVG continue to work
    window.selectTruck = selectTruck;
}
