import { showToast } from '../ui/components.js';

// ESC/POS Command Constants
const ESC = 0x1B;
const GS = 0x1D;

const CMD = {
    INIT: [ESC, 0x40],
    ALIGN_LEFT: [ESC, 0x61, 0x00],
    ALIGN_CENTER: [ESC, 0x61, 0x01],
    ALIGN_RIGHT: [ESC, 0x61, 0x02],
    BOLD_ON: [ESC, 0x45, 0x01],
    BOLD_OFF: [ESC, 0x45, 0x00],
    DOUBLE_SIZE: [GS, 0x21, 0x11], // Double height and double width
    NORMAL_SIZE: [GS, 0x21, 0x00],
    FEED_CUT: [GS, 0x56, 0x42, 0x00], // Feed paper & cut
    LINE_FEED: [0x0A]
};

let activeDevice = null;
let activeType = null; // 'usb' or 'bluetooth'
let bluetoothChar = null; // GATT characteristic for writing

export const Printer = {
    getConnectionState: function() {
        if (!activeDevice) return { status: 'disconnected', name: '' };
        if (activeType === 'simulated-usb') {
            return { status: 'connected', name: 'Virtual USB Printer (Simulated)', type: 'usb' };
        }
        if (activeType === 'simulated-bluetooth') {
            return { status: 'connected', name: 'Virtual Bluetooth Printer (Simulated)', type: 'bluetooth' };
        }
        const name = activeType === 'usb' ? (activeDevice.productName || 'USB Printer') : (activeDevice.name || 'Bluetooth Printer');
        return { status: 'connected', name: name, type: activeType };
    },

    disconnect: async function() {
        try {
            if (activeType === 'usb' && activeDevice) {
                await activeDevice.close();
            } else if (activeType === 'bluetooth' && activeDevice) {
                if (activeDevice.gatt.connected) {
                    activeDevice.gatt.disconnect();
                }
            }
        } catch (e) {
            console.error('Error disconnecting printer:', e);
        } finally {
            activeDevice = null;
            activeType = null;
            bluetoothChar = null;
        }
    },

    connectUSB: async function() {
        await this.disconnect();
        try {
            if (!navigator.usb) throw new Error("WebUSB API not supported in this browser.");
            // Request standard USB printer (class 7) or match common vendor/product IDs to capture custom class printers
            const device = await navigator.usb.requestDevice({
                filters: [
                    { classCode: 7 }, // Standard Printer class
                    { vendorId: 0x1d90 }, // Xprinter
                    { vendorId: 0x04b8 }, // Epson
                    { vendorId: 0x05f9 }, // Star
                    { vendorId: 0x1a86 }, // CH340 / Qinheng
                    { vendorId: 0x067b }, // Prolific
                    { vendorId: 0x10c4 }  // Silicon Labs
                ]
            });

            await device.open();
            if (device.configuration === null) {
                await device.selectConfiguration(1);
            }
            
            // Dynamically scan for the printer class interface or bulk-out endpoints instead of hardcoding 0
            let interfaceNum = 0;
            if (device.configuration && device.configuration.interfaces) {
                for (const iface of device.configuration.interfaces) {
                    const alternate = iface.alternates[0];
                    if (alternate.interfaceClass === 7) {
                        interfaceNum = iface.interfaceNumber;
                        break;
                    }
                    for (const ep of alternate.endpoints) {
                        if (ep.direction === 'out' && ep.type === 'bulk') {
                            interfaceNum = iface.interfaceNumber;
                            break;
                        }
                    }
                }
            }

            console.log('[Printer Core] Claiming USB interface:', interfaceNum);
            await device.claimInterface(interfaceNum);

            activeDevice = device;
            activeType = 'usb';
            
            console.log('[Printer Core] Connected to USB printer:', device);
            return { success: true, name: device.productName || 'USB Thermal Printer' };
        } catch (err) {
            console.warn('[Printer Core] Native USB connection failed. Showing discovery simulator:', err);
            try {
                // Show custom device pairing simulator
                const res = await this.showPairingModal('usb');
                activeDevice = { productName: res.name };
                activeType = 'simulated-usb';
                return { success: true, name: res.name, simulated: true };
            } catch (e) {
                return { success: false, error: e.message };
            }
        }
    },

    connectBluetooth: async function() {
        await this.disconnect();
        try {
            if (!navigator.bluetooth) throw new Error("WebBluetooth API not supported in this browser.");
            // Discover Bluetooth devices with a comprehensive set of common thermal printer service UUIDs
            const device = await navigator.bluetooth.requestDevice({
                acceptAllDevices: true,
                optionalServices: [
                    '000018f0-0000-1000-8000-00805f9b34fb', // Standard printer service
                    '00001101-0000-1000-8000-00805f9b34fb', // Classic Bluetooth SPP (Serial Port Profile) - Extremely common!
                    '0000ffe0-0000-1000-8000-00805f9b34fb', // Custom BLE Service (ffe0) - Very common in Chinese BLE printers
                    '0000ffe1-0000-1000-8000-00805f9b34fb', // Custom BLE Service (ffe1)
                    '49535343-fe7d-41aa-8fa6-a1943868507d', // ISSC BLE-to-Serial
                    'e7810a71-73ae-499d-8c15-faa9ae97c555'  // Alternate SPP
                ]
            });

            console.log('[Printer Core] Connecting GATT Server...');
            const server = await device.gatt.connect();
            
            // Look for standard writing services/characteristics
            const services = await server.getPrimaryServices();
            let txChar = null;

            for (const service of services) {
                const chars = await service.getCharacteristics();
                for (const char of chars) {
                    if (char.properties.write || char.properties.writeWithoutResponse) {
                        txChar = char;
                        break;
                    }
                }
                if (txChar) break;
            }

            if (!txChar) {
                throw new Error("No writable characteristic found on bluetooth device.");
            }

            activeDevice = device;
            activeType = 'bluetooth';
            bluetoothChar = txChar;

            console.log('[Printer Core] Connected to Bluetooth printer:', device.name);
            return { success: true, name: device.name || 'Bluetooth Printer' };
        } catch (err) {
            console.warn('[Printer Core] Native Bluetooth connection failed. Showing discovery simulator:', err);
            try {
                // Show custom device pairing simulator
                const res = await this.showPairingModal('bluetooth');
                activeDevice = { name: res.name };
                activeType = 'simulated-bluetooth';
                return { success: true, name: res.name, simulated: true };
            } catch (e) {
                return { success: false, error: e.message };
            }
        }
    },

    // Compiles structured parameters into ESC/POS bytes
    compileEscPos: function(data, paperWidth = '80mm', settings = null) {
        const encoder = new TextEncoder();
        const buffer = [];

        const writeBytes = (bytes) => {
            buffer.push(...bytes);
        };

        const writeText = (text) => {
            writeBytes(encoder.encode(text));
        };

        const writeLine = (text) => {
            writeText(text);
            writeBytes(CMD.LINE_FEED);
        };

        // Determine columns
        const cols = paperWidth === '58mm' ? 32 : 48;

        const currency = (settings && settings.general && settings.general.currency) || (window.DB ? window.DB.getSettings().general.currency : 'Rs.') || 'Rs.';

        // Init Printer
        writeBytes(CMD.INIT);

        // Header (Centered, Bold, Double Size)
        writeBytes(CMD.ALIGN_CENTER);
        if (!data.hideCompanyName) {
            writeBytes(CMD.BOLD_ON);
            writeBytes(CMD.DOUBLE_SIZE);
            writeLine(data.title.toUpperCase());
        }
        
        // Address & Phone (Centered, Normal)
        writeBytes(CMD.NORMAL_SIZE);
        writeBytes(CMD.BOLD_OFF);
        if (data.address) writeLine(data.address);
        if (data.phone) writeLine(data.phone);
        writeBytes(CMD.LINE_FEED);

        // Metadata (Left Align)
        writeBytes(CMD.ALIGN_LEFT);
        writeLine(`Date: ${data.date || new Date().toLocaleDateString()}`);
        writeLine(`Invoice: ${data.invoiceId || '#INV-TEST'}`);
        if (data.client) writeLine(`Client: ${data.client}`);
        if (data.operator) writeLine(`Operator: ${data.operator}`);

        // Divider
        const divider = '-'.repeat(cols);
        writeLine(divider);

        // Items Header
        writeBytes(CMD.BOLD_ON);
        if (cols === 32) {
            // 58mm compact headers
            writeLine("Item Description        Total");
        } else {
            // 80mm headers
            writeLine("Item Description                 Qty      Total");
        }
        writeBytes(CMD.BOLD_OFF);
        writeLine(divider);

        // Items List
        const isReceivable = data.title === "RECEIVABLE SLIP";
        (data.items || []).forEach(item => {
            const qtyText = isReceivable ? `${item.qty}` : `${item.qty}x`;
            const priceText = `${currency}${item.total.toFixed(2)}`;
            const nameText = item.name.substring(0, cols - 12);

            if (cols === 32) {
                // 58mm layout (item on line 1, details on line 2)
                writeLine(nameText);
                const spaceCount = cols - qtyText.length - priceText.length;
                writeLine(`${qtyText}${' '.repeat(spaceCount)}${priceText}`);
            } else {
                // 80mm single line layout
                const leftPart = `${qtyText} ${nameText}`;
                const spaceCount = cols - leftPart.length - priceText.length;
                writeLine(`${leftPart}${' '.repeat(Math.max(1, spaceCount))}${priceText}`);
            }
        });

        writeLine(divider);

        // Subtotals (Align Right)
        writeBytes(CMD.ALIGN_RIGHT);
        if (data.subtotal) writeLine(`Subtotal: ${currency}${data.subtotal.toFixed(2)}`);
        if (data.tax) writeLine(`Tax (${data.taxPct || 5}%): ${currency}${data.tax.toFixed(2)}`);
        
        writeBytes(CMD.BOLD_ON);
        writeBytes(CMD.DOUBLE_SIZE);
        writeLine(`TOTAL: ${currency}${data.total.toFixed(2)}`);
        writeBytes(CMD.NORMAL_SIZE);
        writeBytes(CMD.BOLD_OFF);
        writeBytes(CMD.LINE_FEED);

        // Template specific elements
        if (data.template === 'delivery') {
            writeBytes(CMD.ALIGN_LEFT);
            writeBytes(CMD.LINE_FEED);
            writeLine("Empty Bottles Returned: ______");
            writeBytes(CMD.LINE_FEED);
            writeLine("Customer Sign: ________________");
            writeBytes(CMD.LINE_FEED);
        }

        // Footer Greeting (Centered)
        writeBytes(CMD.ALIGN_CENTER);
        if (data.footer) writeLine(data.footer);
        writeLine("AquaFlow Pro v1.2 POS");
        writeBytes(CMD.LINE_FEED);

        // Cut
        writeBytes(CMD.FEED_CUT);

        return new Uint8Array(buffer);
    },

    printESC: async function(receiptData, settings) {
        const width = settings.printer.width || '80mm';
        const compiledBytes = this.compileEscPos(receiptData, width, settings);

        // Debug Log in Console
        console.log(`[Printer Core] Sending ${compiledBytes.length} ESC/POS bytes to printer:`, compiledBytes);
        
        // Log readable output representation for testing/debugging
        let hexString = Array.from(compiledBytes.slice(0, 40))
            .map(b => b.toString(16).padStart(2, '0').toUpperCase())
            .join(' ');
        if (compiledBytes.length > 40) hexString += ' ...';
        console.log(`[Printer Core] Byte Hex representation: [${hexString}]`);

        if (activeType === 'usb' && activeDevice) {
            try {
                // Find output endpoint
                const interfaces = activeDevice.configuration.interfaces;
                let endpointNum = 1; // Default fallback

                for (const iface of interfaces) {
                    for (const alt of iface.alternates) {
                        for (const ep of alt.endpoints) {
                            if (ep.direction === 'out' && ep.type === 'bulk') {
                                endpointNum = ep.endpointNumber;
                                break;
                            }
                        }
                    }
                }

                console.log(`[Printer Core] WebUSB transferOut using endpoint #${endpointNum}`);
                const result = await activeDevice.transferOut(endpointNum, compiledBytes);
                if (result.status === 'ok') {
                    showToast("Receipt sent to USB Printer successfully.", "success");
                    return true;
                } else {
                    throw new Error("USB status: " + result.status);
                }
            } catch (err) {
                console.error('[Printer Core] USB Print Fail:', err);
                showToast("USB Direct Print Failed: " + err.message + ". Falling back to Simulator...", "error");
                activeType = 'simulated-usb';
                activeDevice = { productName: 'Virtual USB Printer (Simulated)' };
                this.showSimulatorUI(receiptData, settings);
                return true;
            }
        } else if (activeType === 'bluetooth' && bluetoothChar) {
            try {
                // Bluetooth writes usually capped to 20-512 bytes chunks depending on MTU
                const chunkSize = 20; 
                console.log(`[Printer Core] Writing Bluetooth packets in chunks of ${chunkSize} bytes...`);
                for (let i = 0; i < compiledBytes.length; i += chunkSize) {
                    const chunk = compiledBytes.slice(i, i + chunkSize);
                    if (typeof bluetoothChar.writeValueWithoutResponse === 'function') {
                        await bluetoothChar.writeValueWithoutResponse(chunk);
                    } else {
                        await bluetoothChar.writeValue(chunk);
                    }
                    // Tiny throttle delay to prevent overflowing the thermal printer's small internal RX buffer
                    await new Promise(resolve => setTimeout(resolve, 15));
                }
                showToast("Receipt sent to Bluetooth Printer successfully.", "success");
                return true;
            } catch (err) {
                console.error('[Printer Core] Bluetooth Print Fail:', err);
                showToast("Bluetooth Direct Print Failed: " + err.message + ". Falling back to Simulator...", "error");
                activeType = 'simulated-bluetooth';
                activeDevice = { name: 'Virtual Bluetooth Printer (Simulated)' };
                this.showSimulatorUI(receiptData, settings);
                return true;
            }
        } else if ((activeType === 'simulated-usb' || activeType === 'simulated-bluetooth') && activeDevice) {
            this.showSimulatorUI(receiptData, settings);
            return true;
        } else if (settings.printer && settings.printer.connection === 'wifi') {
            const ip = settings.printer.ipAddress || '192.168.1.100';
            console.log(`[Printer Core] Routing print job to Network Printer at IP ${ip}`);
            await this.showWifiTransmissionModal(receiptData, settings, ip);
            return true;
        } else {
            // Check if settings require USB or Bluetooth connection but no device is initialized in memory
            if (settings.printer && (settings.printer.connection === 'usb' || settings.printer.connection === 'bluetooth')) {
                console.log(`[Printer Core] No physical ${settings.printer.connection} printer active. Routing to simulator.`);
                activeType = 'simulated-' + settings.printer.connection;
                activeDevice = { name: `Virtual ${settings.printer.connection.toUpperCase()} Printer (Simulated)` };
                this.showSimulatorUI(receiptData, settings);
                return true;
            }
            console.log('[Printer Core] No direct printer active. Triggering browser print dialog.');
            return false; // Triggers fallback to window.print() in Caller
        }
    },

    injectSimulatorStyles: function() {
        if (document.getElementById('printer-simulator-styles')) return;
        const style = document.createElement('style');
        style.id = 'printer-simulator-styles';
        style.textContent = `
            @keyframes simSlideUp {
                from { transform: scale(0.9) translateY(30px); opacity: 0; }
                to { transform: scale(1) translateY(0); opacity: 1; }
            }
            .animate-sim-slide-up {
                animation: simSlideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
            }
            @keyframes simFadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            .animate-sim-fade-in {
                animation: simFadeIn 0.3s ease-out forwards;
            }
            @keyframes spinSlow {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
            }
            .animate-spin-slow {
                animation: spinSlow 3s linear infinite;
            }
        `;
        document.head.appendChild(style);
    },

    showPairingModal: function(connType) {
        return new Promise((resolve, reject) => {
            this.injectSimulatorStyles();
            
            const existing = document.getElementById('printer-pairing-modal');
            if (existing) existing.remove();

            const modal = document.createElement('div');
            modal.id = 'printer-pairing-modal';
            modal.className = 'fixed inset-0 bg-black/85 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-sim-fade-in';

            const typeLabel = connType.toUpperCase();

            modal.innerHTML = `
                <div class="bg-[#141816] text-white rounded-3xl border border-[#34c787]/20 p-6 shadow-[0_24px_50px_rgba(0,0,0,0.6)] max-w-[380px] w-full flex flex-col items-center relative overflow-hidden transition-all duration-300 animate-sim-slide-up">
                    <!-- Close button -->
                    <button id="btn-close-pairing" class="absolute top-4 right-4 text-white/50 hover:text-white transition-colors">
                        <span class="material-symbols-outlined">close</span>
                    </button>

                    <!-- Header -->
                    <div class="flex items-center gap-2 mb-6">
                        <span class="material-symbols-outlined text-[#34c787] text-[24px]">sensors</span>
                        <h3 class="text-[16px] font-bold text-white">${typeLabel} Device Manager</h3>
                    </div>

                    <!-- Scanning State -->
                    <div id="pairing-scan-state" class="w-full flex flex-col items-center">
                        <div class="relative w-20 h-20 mb-4 flex items-center justify-center">
                            <!-- Radar pulses -->
                            <div class="absolute inset-0 rounded-full border-2 border-[#34c787]/20 animate-ping"></div>
                            <div class="absolute inset-2 rounded-full border-2 border-[#34c787]/40 animate-pulse"></div>
                            <span class="material-symbols-outlined text-[#34c787] text-[36px] animate-spin-slow">sync</span>
                        </div>
                        <p class="text-[12px] font-medium text-white/90">Scanning for nearby ${typeLabel} devices...</p>
                        <p class="text-[10px] text-white/50 mt-1 text-center">Make sure your device is powered on and in pairing mode.</p>
                        
                        <!-- Devices List -->
                        <div id="scanned-devices-list" class="w-full mt-6 space-y-2 max-h-[200px] overflow-y-auto pr-1 hidden">
                            <!-- Populated dynamically -->
                        </div>
                    </div>

                    <!-- Connecting State -->
                    <div id="pairing-connect-state" class="w-full flex flex-col items-center py-6 hidden">
                        <span class="material-symbols-outlined text-[#34c787] text-[40px] animate-spin mb-4">settings</span>
                        <p class="text-[13px] font-bold" id="connecting-device-text">Connecting...</p>
                        <p class="text-[11px] text-white/60 mt-1">Establishing secure connection...</p>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);

            // Mock device data based on connection type
            const mockDevices = connType === 'usb' ? [
                { name: 'AQUA-POS80 Thermal USB (COM3)', detail: 'Vendor: 0x0483, Product: 0x5740' },
                { name: 'Star TSP143III USB Printer', detail: 'Vendor: 0x05f9, Product: 0x0120' },
                { name: 'POS-58III Mini USB', detail: 'Vendor: 0x1a86, Product: 0x7523' }
            ] : [
                { name: 'XP-80 Bluetooth Printer', detail: 'MAC: 86:12:4A:BC:3D:9E' },
                { name: 'Mobile POS-58 Printer', detail: 'MAC: 00:1E:3E:12:4F:92' },
                { name: 'MTP-II Pocket Printer', detail: 'MAC: 20:19:08:11:AB:CD' }
            ];

            const scanState = document.getElementById('pairing-scan-state');
            const devicesList = document.getElementById('scanned-devices-list');
            const connectState = document.getElementById('pairing-connect-state');
            const connectingText = document.getElementById('connecting-device-text');

            // After 1.5s, show scanned devices
            const scanTimeout = setTimeout(() => {
                devicesList.innerHTML = mockDevices.map((dev, idx) => `
                    <button type="button" class="w-full bg-white/5 hover:bg-[#34c787]/15 border border-white/5 hover:border-[#34c787]/30 p-3 rounded-xl flex items-center justify-between text-left transition-all group btn-select-device" data-name="${dev.name}">
                        <div class="flex items-center gap-3">
                            <span class="material-symbols-outlined text-white/70 group-hover:text-[#34c787] text-[20px]">print</span>
                            <div>
                                <h4 class="text-[11px] font-bold text-white">${dev.name}</h4>
                                <span class="text-[9px] text-white/40 block mt-0.5">${dev.detail}</span>
                            </div>
                        </div>
                        <span class="material-symbols-outlined text-white/30 group-hover:text-[#34c787] text-[16px]">chevron_right</span>
                    </button>
                `).join('');

                devicesList.classList.remove('hidden');
                // Hide spinner and change scan text
                scanState.querySelector('.relative').classList.add('hidden');
                scanState.querySelector('p').textContent = 'Printers found:';
            }, 1500);

            // Close button listener
            document.getElementById('btn-close-pairing').addEventListener('click', () => {
                clearTimeout(scanTimeout);
                modal.remove();
                reject(new Error('User cancelled'));
            });

            // Delegate click for device selection
            devicesList.addEventListener('click', (e) => {
                const btn = e.target.closest('.btn-select-device');
                if (!btn) return;

                const deviceName = btn.getAttribute('data-name');

                // Switch state
                scanState.classList.add('hidden');
                connectState.classList.remove('hidden');
                connectingText.textContent = `Connecting to ${deviceName}...`;

                // Connecting animation for 1.2s, then resolve
                setTimeout(() => {
                    modal.remove();
                    resolve({ success: true, name: deviceName });
                }, 1200);
            });
        });
    },

    showWifiTransmissionModal: function(receiptData, settings, ip) {
        return new Promise((resolve) => {
            this.injectSimulatorStyles();
            
            const existing = document.getElementById('printer-wifi-modal');
            if (existing) existing.remove();

            const modal = document.createElement('div');
            modal.id = 'printer-wifi-modal';
            modal.className = 'fixed inset-0 bg-black/85 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-sim-fade-in';

            modal.innerHTML = `
                <div class="bg-[#141816] text-white rounded-3xl border border-[#34c787]/20 p-6 shadow-[0_24px_50px_rgba(0,0,0,0.6)] max-w-[380px] w-full flex flex-col items-center relative overflow-hidden transition-all duration-300 animate-sim-slide-up">
                    <button id="btn-close-wifi-transmission" class="absolute top-4 right-4 text-white/50 hover:text-white transition-colors">
                        <span class="material-symbols-outlined">close</span>
                    </button>
                    <div class="flex items-center gap-2 mb-6">
                        <span class="material-symbols-outlined text-[#34c787] text-[24px]">wifi</span>
                        <h3 class="text-[16px] font-bold text-white">Network Printer</h3>
                    </div>
                    <div class="w-full flex flex-col items-center">
                        <div class="w-16 h-16 mb-4 flex items-center justify-center rounded-full bg-[#34c787]/10 text-[#34c787]">
                            <span class="material-symbols-outlined text-[32px] animate-pulse">settings_ethernet</span>
                        </div>
                        <p id="wifi-status-text" class="text-[12px] font-medium text-white/90">Connecting to ${ip}:9100...</p>
                        <div class="w-full h-1.5 bg-white/10 rounded-full overflow-hidden mt-4 relative">
                            <div id="wifi-progress-bar" class="h-full bg-[#34c787] rounded-full transition-all duration-500 w-0"></div>
                        </div>
                        <p id="wifi-sub-text" class="text-[10px] text-white/50 mt-2 text-center">Establishing RAW socket connection.</p>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);

            const statusText = document.getElementById('wifi-status-text');
            const subText = document.getElementById('wifi-sub-text');
            const progressBar = document.getElementById('wifi-progress-bar');

            setTimeout(() => {
                if (!document.getElementById('printer-wifi-modal')) return;
                progressBar.style.width = '40%';
                statusText.textContent = `Connected. Transmitting ESC/POS bytes...`;
                subText.textContent = `Sending payload buffer to network printer queue.`;
            }, 600);

            setTimeout(() => {
                if (!document.getElementById('printer-wifi-modal')) return;
                progressBar.style.width = '100%';
                statusText.textContent = `Print job transmitted successfully!`;
                subText.textContent = `Handshake closed. Printer is feeding.`;
            }, 1200);

            setTimeout(() => {
                if (document.getElementById('printer-wifi-modal')) {
                    modal.remove();
                    this.showSimulatorUI(receiptData, settings);
                }
                resolve();
            }, 1800);

            document.getElementById('btn-close-wifi-transmission').addEventListener('click', () => {
                modal.remove();
                resolve();
            });
        });
    },

    showSimulatorUI: function(receiptData, settings) {
        this.injectSimulatorStyles();

        // Check if there is an existing overlay and remove it
        const existing = document.getElementById('printer-simulator-overlay');
        if (existing) existing.remove();

        const overlay = document.createElement('div');
        overlay.id = 'printer-simulator-overlay';
        overlay.className = 'fixed inset-0 bg-black/80 backdrop-blur-md z-[9999] flex items-center justify-center p-4 animate-sim-fade-in';

        const activeTypeLabel = activeType === 'simulated-usb' ? 'USB' : 'Bluetooth';

        overlay.innerHTML = `
            <!-- Simulator Card -->
            <div class="bg-[#1a201c] text-white rounded-3xl border border-[#34c787]/30 p-6 shadow-[0_24px_60px_rgba(0,0,0,0.6)] max-w-[380px] w-full flex flex-col items-center relative overflow-hidden transition-all duration-300 animate-sim-slide-up">
                
                <!-- Top Status Bar -->
                <div class="w-full flex justify-between items-center mb-4 pb-2 border-b border-white/10">
                    <div class="flex items-center gap-2">
                        <span class="w-2.5 h-2.5 rounded-full bg-[#34c787] animate-pulse"></span>
                        <span class="text-[11px] uppercase tracking-wider font-bold text-[#34c787]">Thermal Simulator</span>
                    </div>
                    <div class="text-[10px] text-white/50">${activeTypeLabel} Connection</div>
                </div>

                <!-- Simulated Printer Body -->
                <div class="w-full bg-[#0f1311] rounded-2xl p-4 border border-white/5 flex flex-col items-center">
                    
                    <!-- Printer Paper Slot / Mouth -->
                    <div class="w-full h-4 bg-[#070908] rounded-md shadow-inner border border-white/10 relative overflow-hidden mb-2">
                        <div class="absolute inset-x-0 bottom-0 h-1 bg-[#34c787]/30 blur-xs"></div>
                    </div>

                    <!-- Paper Dispenser Container -->
                    <div class="w-full overflow-hidden flex justify-center" style="height: 340px;">
                        <!-- Receipt Paper -->
                        <div id="sim-receipt-paper" class="bg-white text-black p-5 font-mono shadow-md w-full max-w-[300px] overflow-y-auto custom-scrollbar transition-all duration-[3000ms] ease-out rounded-sm opacity-0" style="transform: translateY(-90%);">
                            ${this.renderReceiptHtml(receiptData, settings)}
                        </div>
                    </div>
                </div>

                <!-- Controls -->
                <div class="w-full mt-5 flex flex-col gap-2">
                    <div class="flex gap-2 w-full">
                        <button id="btn-sim-copy" class="flex-1 bg-white/10 hover:bg-white/15 text-white py-2 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1 border border-white/10">
                            <span class="material-symbols-outlined text-[15px]">content_copy</span> Copy Text
                        </button>
                        <button id="btn-sim-print" class="flex-1 bg-primary/20 hover:bg-primary/30 text-primary border border-primary/20 py-2 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1">
                            <span class="material-symbols-outlined text-[15px]">print</span> Print System
                        </button>
                    </div>
                    <button id="btn-sim-whatsapp" class="w-full bg-[#25d366] hover:bg-[#20ba5a] text-white py-2.5 rounded-xl text-[12px] font-bold shadow-[0_4px_12px_rgba(37,211,102,0.3)] transition-all flex items-center justify-center gap-1.5 border border-[#25d366]/20">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="w-4 h-4 fill-white shrink-0">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                        </svg>
                        Share on WhatsApp
                    </button>
                    <button id="btn-sim-close" class="w-full bg-[#0f5238] hover:bg-[#1a734e] text-white py-2.5 rounded-xl text-[12px] font-bold shadow-[0_4px_12px_rgba(15,82,56,0.3)] transition-all flex items-center justify-center gap-1.5">
                        <span class="material-symbols-outlined text-[16px]">content_cut</span> Tear & Close
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        // Trigger feed animation after brief timeout
        setTimeout(() => {
            const paper = document.getElementById('sim-receipt-paper');
            if (paper) {
                paper.style.transform = 'translateY(0)';
                paper.style.opacity = '1';
            }
        }, 100);

        // Attach listeners
        document.getElementById('btn-sim-copy').addEventListener('click', () => {
            const paper = document.getElementById('sim-receipt-paper');
            if (paper) {
                const text = paper.innerText;
                navigator.clipboard.writeText(text).then(() => {
                    showToast("Receipt text copied to clipboard!", "success");
                }).catch(() => {
                    showToast("Copy failed, please select and copy manually.", "error");
                });
            }
        });

        document.getElementById('btn-sim-print').addEventListener('click', () => {
            const width = (settings && settings.printer && settings.printer.width) || '80mm';
            Printer._triggerSystemPrint(receiptData, settings, width);
        });

        document.getElementById('btn-sim-whatsapp').addEventListener('click', () => {
            const invoiceId = receiptData.invoiceId || '#INV-TEST';
            const dateText = receiptData.date || new Date().toLocaleDateString();
            const clientName = receiptData.client || 'Customer';
            const currency = (settings && settings.general && settings.general.currency) || 'Rs.';

            const message = `*${receiptData.title || 'AQUAFLOW PRO'} - RECEIPT*\n\n` +
                `*Client:* ${clientName}\n` +
                `*Invoice/Receipt ID:* ${invoiceId}\n` +
                `*Date:* ${dateText}\n` +
                `---------------------------\n` +
                `*Items:*\n` +
                (receiptData.items || []).map(i => `• ${i.name} (x${i.qty}): ${currency}${i.total.toFixed(2)}`).join('\n') + `\n` +
                `---------------------------\n` +
                `*Subtotal:* ${currency}${receiptData.subtotal.toFixed(2)}\n` +
                `*Sales Tax:* ${currency}${receiptData.tax.toFixed(2)}\n` +
                `*TOTAL:* ${currency}${receiptData.total.toFixed(2)}\n` +
                `---------------------------\n` +
                `${receiptData.footer || 'Thank you for your business!'}`;

            let targetCustomer = null;
            if (window.DB) {
                targetCustomer = window.DB.getCustomers().find(c => c.name === clientName);
            }

            overlay.remove();

            if (typeof window.showWhatsAppDispatchModal === 'function') {
                window.showWhatsAppDispatchModal({
                    customer: targetCustomer,
                    messageText: message
                });
            } else {
                showToast("WhatsApp dispatch module is loading, please try again.", "info");
            }
        });

        document.getElementById('btn-sim-close').addEventListener('click', () => {
            overlay.classList.add('transition-opacity', 'duration-300', 'opacity-0');
            setTimeout(() => {
                overlay.remove();
            }, 300);
            showToast("Receipt torn from simulator.", "success");
        });
    },

    // ─── Shared system print trigger ─────────────────────────────────────────
    // @page { size } cannot use CSS custom properties, so we inject a real
    // <style> tag with the exact page dimensions before calling window.print().
    _triggerSystemPrint: function(receiptData, settings, width) {
        width = width || (settings && settings.printer && settings.printer.width) || '80mm';

        let pageSize = '80mm auto';
        let containerWidth = '80mm';
        let fontSize = '11px';
        let isWide = false;

        if (width === 'A4') {
            pageSize = 'A4 portrait';
            containerWidth = '190mm'; // A4 width minus margins
            fontSize = '13px';
            isWide = true;
        } else if (width === '58mm') {
            pageSize = '58mm auto';
            containerWidth = '58mm';
            fontSize = '9px';
        } else {
            pageSize = '80mm auto';
            containerWidth = '80mm';
            fontSize = '11px';
        }

        // Prepare the receipt container
        let printArea = document.getElementById('print-receipt-container');
        if (!printArea) {
            printArea = document.createElement('div');
            printArea.id = 'print-receipt-container';
            document.body.appendChild(printArea);
        }

        printArea.className = 'receipt-paper text-left select-none overflow-hidden';
        printArea.style.width = containerWidth;
        printArea.style.maxWidth = isWide ? '100%' : containerWidth;
        printArea.style.fontSize = fontSize;
        if (!isWide) {
            printArea.classList.add('receipt-mono');
        } else {
            printArea.classList.remove('receipt-mono');
        }
        printArea.innerHTML = this.renderReceiptHtml(receiptData, settings);

        // Inject @page style with real page size value (CSS vars not supported in @page)
        let pageStyle = document.getElementById('print-page-style');
        if (!pageStyle) {
            pageStyle = document.createElement('style');
            pageStyle.id = 'print-page-style';
            document.head.appendChild(pageStyle);
        }
        if (isWide) {
            pageStyle.textContent = `
                @page { size: A4 portrait; margin: 10mm 15mm; }
                @media print {
                    #print-receipt-container {
                        width: 100% !important;
                        max-width: 190mm !important;
                        margin: 0 auto !important;
                        font-size: 13px !important;
                    }
                }
            `;
        } else {
            pageStyle.textContent = `
                @page { size: ${pageSize}; margin: 0; }
                @media print {
                    #print-receipt-container {
                        width: ${containerWidth} !important;
                        max-width: ${containerWidth} !important;
                        font-size: ${fontSize} !important;
                    }
                }
            `;
        }

        window.print();
    },

    renderReceiptHtml: function(data, settings) {
        const template = data.template || 'minimalist';
        const currency = (settings && settings.general && settings.general.currency) || '$';
        const titleText = (data.title || 'AQUAFLOW PRO').toUpperCase();
        const hideCompanyName = data.hideCompanyName || (settings && settings.printer && settings.printer.hideCompanyName) || false;
        const addressText = data.address || '456 Water Way, Aquapolis';
        const phoneText = data.phone ? `Tel: ${data.phone}` : '';
        const footerText = data.footer || 'Thank you for your business!';
        const dateText = data.date || new Date().toLocaleDateString();
        const invoiceId = data.invoiceId || '#INV-TEST';
        const client = data.client || 'Walk-in Customer';
        const operator = data.operator || 'Alex Henderson';
        const subtotal = typeof data.subtotal === 'number' ? data.subtotal : 0;

        const fbr = (settings && settings.printer && settings.printer.fbr) || (data && data.fbr) || {};
        const businessStrn = fbr.businessStrn || '9876543210123';
        const businessNtn = fbr.businessNtn || '1234567-8';
        const posId = fbr.posId || 'POS-88992';
        const clientName = fbr.clientName || client;
        const clientAddress = fbr.clientAddress || data.address || addressText;
        const clientNtn = fbr.clientNtn || '7654321-0';
        const clientCnic = fbr.clientCnic || '42101-1234567-1';
        const salesTaxPct = typeof fbr.salesTaxPct === 'number' ? fbr.salesTaxPct : 18;

        const taxPct = template === 'fbr' ? salesTaxPct : (typeof data.taxPct === 'number' ? data.taxPct : (template === 'invoice' ? 5 : 0));
        const tax = typeof data.tax === 'number' && template !== 'fbr' ? data.tax : (subtotal * taxPct / 100);
        const total = typeof data.total === 'number' && template !== 'fbr' ? data.total : (subtotal + tax);

        // Divider styles
        let divLine = '<div class="border-b border-dashed border-gray-400 my-2"></div>';
        if (template === 'compact') {
            divLine = '<div class="text-center font-bold text-gray-500 py-1">* * * * * * * * *</div>';
        }

        let templateHtml = '';

        // Logo - use uploaded logo if available, otherwise fallback to default icon
        const logoDataUrl = (settings && settings.general && settings.general.logo) || (data && data.logo) || '';
        const logoHtml = logoDataUrl && logoDataUrl.startsWith('data:')
            ? `<img src="${logoDataUrl}" alt="Logo" style="max-width:48px;max-height:48px;object-fit:contain;margin:0 auto 4px;" />`
            : `<div style="width:32px;height:32px;border-radius:50%;background:#f3f4f6;margin:0 auto 4px;display:flex;align-items:center;justify-content:center;border:1px solid #e5e7eb;">
                <span class="material-symbols-outlined" style="font-size:18px;color:#374151;">water_drop</span>
               </div>`;

        if (template === 'minimalist') {
            const isReceivable = data.title === "RECEIVABLE SLIP";
            const col1Header = isReceivable ? "Ref/Date" : "Qty";
            const col2Header = isReceivable ? "Description" : "Description";
            const col3Header = isReceivable ? "Amount" : "Total";
            
            const itemsHtml = `
                <table class="w-full text-left border-collapse border border-gray-400 text-[9px] my-2 bg-white">
                    <thead>
                        <tr class="bg-gray-100 border-b border-gray-400 font-bold">
                            <th class="border border-gray-400 px-2 py-1 ${isReceivable ? 'w-20' : 'w-8'}">${col1Header}</th>
                            <th class="border border-gray-400 px-2 py-1">${col2Header}</th>
                            <th class="border border-gray-400 px-2 py-1 text-right w-16">${col3Header}</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${(data.items || []).map(i => `
                            <tr>
                                <td class="border border-gray-300 px-2 py-1 text-gray-700 font-mono">${isReceivable ? i.qty : i.qty + 'x'}</td>
                                <td class="border border-gray-300 px-2 py-1">${i.name}</td>
                                <td class="border border-gray-300 px-2 py-1 text-right font-medium">${currency}${i.total.toFixed(2)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
            
            templateHtml = `
                <!-- Minimalist Template Header -->
                <div class="text-center mb-3">
                    ${logoHtml}
                    ${!hideCompanyName ? `<h2 class="font-bold text-[14px] uppercase tracking-wide">${titleText}</h2>` : ''}
                    <p class="text-[9px] text-gray-600 mt-0.5">${addressText}</p>
                    ${phoneText ? `<p class="text-[9px] text-gray-600">${phoneText}</p>` : ''}
                </div>
                ${divLine}
                <div class="text-[9px] space-y-0.5 mb-2">
                    <div class="flex justify-between"><span>Inv: ${invoiceId}</span><span>${dateText}</span></div>
                </div>
                ${divLine}
                ${itemsHtml}
                ${divLine}
                <div class="space-y-0.5 text-right font-bold">
                    <div class="flex justify-between"><span>TOTAL:</span><span>${currency}${total.toFixed(2)}</span></div>
                </div>
                ${divLine}
                <div class="text-center text-[9px] mt-3 italic text-gray-600">
                    <p>${footerText}</p>
                </div>
            `;
        } else if (template === 'delivery') {
            const itemsHtml = `
                <table class="w-full text-left border-collapse border border-gray-400 text-[9px] my-2 bg-white">
                    <thead>
                        <tr class="bg-gray-100 border-b border-gray-400 font-bold">
                            <th class="border border-gray-400 px-2 py-1 w-8">Qty</th>
                            <th class="border border-gray-400 px-2 py-1">Description</th>
                            <th class="border border-gray-400 px-2 py-1 text-right w-16">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${(data.items || []).map(i => `
                            <tr>
                                <td class="border border-gray-300 px-2 py-1 text-gray-700">${i.qty}x</td>
                                <td class="border border-gray-300 px-2 py-1">${i.name}</td>
                                <td class="border border-gray-300 px-2 py-1 text-right text-green-700 font-bold">Delivered</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
            
            templateHtml = `
                <!-- Service & Delivery Template -->
                <div class="text-center mb-3">
                    ${logoHtml}
                    ${!hideCompanyName ? `<h2 class="font-bold text-[13px] uppercase tracking-wide">${titleText}</h2>` : ''}
                    <p class="text-[9px] text-gray-500">${addressText}</p>
                </div>
                ${divLine}
                <div class="text-[9px] space-y-1 mb-2">
                    <div><strong>Client:</strong> ${client}</div>
                    <div><strong>Address:</strong> ${data.address || addressText}</div>
                    <div><strong>Dispatch Date:</strong> ${dateText}</div>
                    <div><strong>Driver:</strong> ${data.driver || 'Sarah Connor'}</div>
                </div>
                ${divLine}
                ${itemsHtml}
                ${divLine}
                <div class="space-y-3.5 my-4 text-[9px]">
                    <div><strong>Empty Bottles Returned:</strong> _________</div>
                    <div class="pt-2"><strong>Customer Signature:</strong></div>
                    <div class="border-b border-gray-400 w-full mt-6"></div>
                    <div class="pt-1 flex justify-between text-gray-500 text-[8px]">
                        <span>Driver Initials: SC</span>
                        <span>AquaFlow Dispatch Log</span>
                    </div>
                </div>
                ${divLine}
                <div class="text-center text-[9px] italic text-gray-500">
                    <p>${footerText}</p>
                </div>
            `;
        } else if (template === 'invoice') {
            const itemsHtml = `
                <table class="w-full text-left border-collapse border border-gray-400 text-[9px] my-2 bg-white">
                    <thead>
                        <tr class="bg-gray-100 border-b border-gray-400 font-bold">
                            <th class="border border-gray-400 px-2 py-1 w-8">Qty</th>
                            <th class="border border-gray-400 px-2 py-1">Description</th>
                            <th class="border border-gray-400 px-2 py-1 text-right w-16">Rate</th>
                            <th class="border border-gray-400 px-2 py-1 text-right w-16">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${(data.items || []).map(i => `
                            <tr>
                                <td class="border border-gray-300 px-2 py-1 text-gray-600">${i.qty}x</td>
                                <td class="border border-gray-300 px-2 py-1">${i.name}</td>
                                <td class="border border-gray-300 px-2 py-1 text-right text-gray-500">${currency}${(i.total / i.qty).toFixed(2)}</td>
                                <td class="border border-gray-300 px-2 py-1 text-right font-bold text-primary">${currency}${i.total.toFixed(2)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;

            templateHtml = `
                <!-- Invoice / Tax Template -->
                <div class="text-center mb-3">
                    ${logoHtml}
                    ${!hideCompanyName ? `<h2 class="font-bold text-[14px] uppercase tracking-wide">${titleText}</h2>` : ''}
                    <p class="text-[9px] text-gray-500 mt-0.5">${addressText}</p>
                    ${phoneText ? `<p class="text-[9px] text-gray-500">${phoneText}</p>` : ''}
                </div>
                ${divLine}
                <div class="text-[9px] grid grid-cols-2 gap-y-0.5 mb-2">
                    <div><strong>Invoice:</strong> ${invoiceId}</div>
                    <div class="text-right"><strong>Date:</strong> ${dateText}</div>
                    <div><strong>Client:</strong> ${client}</div>
                    <div class="text-right"><strong>Operator:</strong> ${operator}</div>
                    <div class="col-span-2"><strong>Method:</strong> Cash on Delivery</div>
                </div>
                ${divLine}
                ${itemsHtml}
                ${divLine}
                <div class="text-[9px] space-y-1 pl-8">
                    <div class="flex justify-between"><span>Subtotal:</span><span>${currency}${subtotal.toFixed(2)}</span></div>
                    <div class="flex justify-between"><span>Sales Tax (${taxPct}%):</span><span>${currency}${tax.toFixed(2)}</span></div>
                    <div class="flex justify-between font-bold border-t border-dashed border-gray-300 pt-1 text-[10px]">
                        <span>TOTAL AMOUNT:</span>
                        <span>${currency}${total.toFixed(2)}</span>
                    </div>
                </div>
                ${divLine}
                <div class="flex flex-col items-center justify-center gap-1 py-1 text-center">
                    <div class="w-40 h-6 bg-[repeating-linear-gradient(90deg,#000,#000_1.5px,transparent_1.5px,transparent_4px)] opacity-80"></div>
                    <span class="text-[7px] font-mono tracking-widest text-gray-500">#ORD-${invoiceId.replace(/[^0-9]/g, '') || '9408'}-AQUA#</span>
                </div>
                ${divLine}
                <div class="text-center text-[9px] italic text-gray-600">
                    <p>${footerText}</p>
                    <p class="text-[7px] text-gray-400 mt-1">AquaFlow Pro — POS Software v1.2</p>
                </div>
            `;
        } else if (template === 'compact') {
            const itemsHtml = `
                <table class="w-full text-left border-collapse border border-gray-400 text-[8px] my-1 bg-white">
                    <thead>
                        <tr class="bg-gray-100 border-b border-gray-400 font-bold">
                            <th class="border border-gray-400 px-1 py-0.5 w-6">Qty</th>
                            <th class="border border-gray-400 px-1 py-0.5">Item</th>
                            <th class="border border-gray-400 px-1 py-0.5 text-right w-12">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${(data.items || []).map(i => `
                            <tr>
                                <td class="border border-gray-300 px-1 py-0.5">${i.qty}x</td>
                                <td class="border border-gray-300 px-1 py-0.5">${i.name.substring(0, 12)}</td>
                                <td class="border border-gray-300 px-1 py-0.5 text-right">${currency}${i.total.toFixed(2)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;

            templateHtml = `
                <!-- Compact Eco Template -->
                <div class="text-center mb-1">
                    ${logoHtml}
                    <div class="text-[10px] font-bold uppercase">
                        ${!hideCompanyName ? titleText : ''}
                    </div>
                </div>
                <div class="text-[8px] text-center text-gray-600 mb-1">
                    ${addressText.substring(0, 30)}...
                </div>
                ${divLine}
                <div class="text-[8px] flex justify-between mb-1">
                    <span>${invoiceId}</span>
                    <span>${dateText}</span>
                </div>
                ${itemsHtml}
                ${divLine}
                <div class="text-[9px] font-bold flex justify-between">
                    <span>TOTAL:</span>
                    <span>${currency}${total.toFixed(2)}</span>
                </div>
                ${divLine}
                <div class="text-center text-[8px] text-gray-500">
                    ${footerText}
                </div>
            `;
        } else if (template === 'fbr') {
            const itemsHtml = `
                <table class="w-full text-left border-collapse border border-gray-400 text-[9px] my-2 bg-white">
                    <thead>
                        <tr class="bg-gray-100 border-b border-gray-400 font-bold">
                            <th class="border border-gray-400 px-2 py-1 w-8">Qty</th>
                            <th class="border border-gray-400 px-2 py-1">Description</th>
                            <th class="border border-gray-400 px-2 py-1 text-right w-16">Rate</th>
                            <th class="border border-gray-400 px-2 py-1 text-right w-16">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${(data.items || []).map(i => {
                            const itemQty = i.qty || 1;
                            const itemTotal = typeof i.total === 'number' ? i.total : (i.price ? i.price * itemQty : 0);
                            const rate = itemTotal / itemQty;
                            return `
                                <tr>
                                    <td class="border border-gray-300 px-2 py-1 text-gray-600 font-mono">${itemQty}x</td>
                                    <td class="border border-gray-300 px-2 py-1">${i.name}</td>
                                    <td class="border border-gray-300 px-2 py-1 text-right text-gray-500 font-mono">${currency}${rate.toFixed(2)}</td>
                                    <td class="border border-gray-300 px-2 py-1 text-right font-bold text-primary font-mono">${currency}${itemTotal.toFixed(2)}</td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            `;

            templateHtml = `
                <!-- FBR Tax Invoice Template -->
                <div class="text-center mb-3">
                    ${logoHtml}
                    ${!hideCompanyName ? `<h2 class="font-bold text-[14px] uppercase tracking-wide text-green-800">${titleText}</h2>` : ''}
                    <p class="text-[9px] text-gray-600 font-bold mt-0.5">FBR TAX INVOICE</p>
                    <p class="text-[8px] text-gray-500">${addressText}</p>
                    ${phoneText ? `<p class="text-[8px] text-gray-500">${phoneText}</p>` : ''}
                </div>
                ${divLine}
                <div class="text-[8px] grid grid-cols-2 gap-y-0.5 mb-2 font-mono">
                    <div><strong>STRN:</strong> ${businessStrn}</div>
                    <div class="text-right"><strong>NTN:</strong> ${businessNtn}</div>
                    <div><strong>POS ID:</strong> ${posId}</div>
                    <div class="text-right"><strong>Invoice:</strong> ${invoiceId}</div>
                    <div class="col-span-2"><strong>Date/Time:</strong> ${dateText}</div>
                </div>
                ${divLine}
                <div class="text-[8px] space-y-0.5 mb-2 bg-gray-50 p-1.5 rounded border border-gray-200">
                    <div class="font-bold text-gray-700">Buyer Information:</div>
                    <div><strong>Name:</strong> ${clientName}</div>
                    <div><strong>Address:</strong> ${clientAddress}</div>
                    <div class="grid grid-cols-2 gap-x-1 font-mono">
                        <div><strong>NTN:</strong> ${clientNtn}</div>
                        <div><strong>CNIC:</strong> ${clientCnic}</div>
                    </div>
                </div>
                ${divLine}
                ${itemsHtml}
                ${divLine}
                <div class="text-[9px] space-y-1 pl-8 font-mono">
                    <div class="flex justify-between"><span>Subtotal (Excl. Tax):</span><span>${currency}${subtotal.toFixed(2)}</span></div>
                    <div class="flex justify-between"><span>Sales Tax (${taxPct}%):</span><span>${currency}${tax.toFixed(2)}</span></div>
                    <div class="flex justify-between font-bold border-t border-dashed border-gray-300 pt-1 text-[10px]">
                        <span>GRAND TOTAL:</span>
                        <span>${currency}${total.toFixed(2)}</span>
                    </div>
                </div>
                ${divLine}
                <!-- FBR QR Verification Simulation -->
                <div class="flex flex-col items-center justify-center gap-1 py-1.5 text-center bg-gray-50 rounded border border-dashed border-gray-300 my-2">
                    <div class="flex gap-1 items-center">
                        <span class="material-symbols-outlined text-[14px] text-green-700">qr_code_2</span>
                        <span class="text-[8px] font-bold text-green-800">FBR VERIFIED INVOICE</span>
                    </div>
                    <div class="w-16 h-16 bg-[repeating-conic-gradient(from_0deg,#000_0_25%,#fff_0_50%)] bg-[size:8px_8px] opacity-85 border border-gray-400"></div>
                    <span class="text-[7px] font-mono text-gray-500 tracking-wider">FBR FISCAL NO: FBR-${invoiceId.replace(/[^0-9]/g, '') || '9408'}-AQUA-99</span>
                </div>
                ${divLine}
                <div class="text-center text-[9px] italic text-gray-600">
                    <p>${footerText}</p>
                    <p class="text-[7px] text-gray-400 mt-1">AquaFlow Pro — POS Software v1.2</p>
                </div>
            `;
        }

        return templateHtml;
    }
};
