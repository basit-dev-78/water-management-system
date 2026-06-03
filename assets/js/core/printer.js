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
            // Request standard USB printer (class 7)
            const device = await navigator.usb.requestDevice({
                filters: [{ classCode: 7 }]
            });

            await device.open();
            if (device.configuration === null) {
                await device.selectConfiguration(1);
            }
            
            // Claim interface (usually interface 0 for simple printer classes)
            await device.claimInterface(0);

            activeDevice = device;
            activeType = 'usb';
            
            console.log('[Printer Core] Connected to USB printer:', device);
            return { success: true, name: device.productName || 'USB Thermal Printer' };
        } catch (err) {
            console.error('[Printer Core] WebUSB Connection Error:', err);
            return { success: false, error: err.message };
        }
    },

    connectBluetooth: async function() {
        await this.disconnect();
        try {
            // Discover Bluetooth devices
            const device = await navigator.bluetooth.requestDevice({
                acceptAllDevices: true,
                optionalServices: [
                    '000018f0-0000-1000-8000-00805f9b34fb', // Standard thermal printer service
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
            console.error('[Printer Core] WebBluetooth Connection Error:', err);
            return { success: false, error: err.message };
        }
    },

    // Compiles structured parameters into ESC/POS bytes
    compileEscPos: function(data, paperWidth = '80mm') {
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

        // Init Printer
        writeBytes(CMD.INIT);

        // Header (Centered, Bold, Double Size)
        writeBytes(CMD.ALIGN_CENTER);
        writeBytes(CMD.BOLD_ON);
        writeBytes(CMD.DOUBLE_SIZE);
        writeLine(data.title.toUpperCase());
        
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
        (data.items || []).forEach(item => {
            const qtyText = `${item.qty}x`;
            const priceText = `$${item.total.toFixed(2)}`;
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
        if (data.subtotal) writeLine(`Subtotal: $${data.subtotal.toFixed(2)}`);
        if (data.tax) writeLine(`Tax (${data.taxPct || 5}%): $${data.tax.toFixed(2)}`);
        
        writeBytes(CMD.BOLD_ON);
        writeBytes(CMD.DOUBLE_SIZE);
        writeLine(`TOTAL: $${data.total.toFixed(2)}`);
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
        const compiledBytes = this.compileEscPos(receiptData, width);

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
                showToast("USB Direct Print Failed: " + err.message + ". Falling back to System Print...", "error");
                return false;
            }
        } else if (activeType === 'bluetooth' && bluetoothChar) {
            try {
                // Bluetooth writes usually capped to 20-512 bytes chunks depending on MTU
                const chunkSize = 20; 
                console.log(`[Printer Core] Writing Bluetooth packets in chunks of ${chunkSize} bytes...`);
                for (let i = 0; i < compiledBytes.length; i += chunkSize) {
                    const chunk = compiledBytes.slice(i, i + chunkSize);
                    await bluetoothChar.writeValue(chunk);
                }
                showToast("Receipt sent to Bluetooth Printer successfully.", "success");
                return true;
            } catch (err) {
                console.error('[Printer Core] Bluetooth Print Fail:', err);
                showToast("Bluetooth Direct Print Failed: " + err.message + ". Falling back to System Print...", "error");
                return false;
            }
        } else {
            console.log('[Printer Core] No direct printer active. Triggering browser print dialog.');
            return false; // Triggers fallback to window.print() in Caller
        }
    },

    renderReceiptHtml: function(data, settings) {
        const template = data.template || 'minimalist';
        const currency = (settings && settings.general && settings.general.currency) || '$';
        const titleText = (data.title || 'AQUAFLOW PRO').toUpperCase();
        const addressText = data.address || '456 Water Way, Aquapolis';
        const phoneText = data.phone ? `Tel: ${data.phone}` : '';
        const footerText = data.footer || 'Thank you for your business!';
        const dateText = data.date || new Date().toLocaleDateString();
        const invoiceId = data.invoiceId || '#INV-TEST';
        const client = data.client || 'Walk-in Customer';
        const operator = data.operator || 'Alex Henderson';
        const subtotal = typeof data.subtotal === 'number' ? data.subtotal : 0;
        const taxPct = typeof data.taxPct === 'number' ? data.taxPct : 5;
        const tax = typeof data.tax === 'number' ? data.tax : (subtotal * taxPct / 100);
        const total = typeof data.total === 'number' ? data.total : (subtotal + tax);

        // Divider styles
        let divLine = '<div class="border-b border-dashed border-gray-400 my-2"></div>';
        if (template === 'compact') {
            divLine = '<div class="text-center font-bold text-gray-500 py-1">* * * * * * * * *</div>';
        }

        let templateHtml = '';

        if (template === 'minimalist') {
            const itemsHtml = (data.items || []).map(i => `
                <div class="flex justify-between"><span>${i.qty}x ${i.name}</span><span>${currency}${i.total.toFixed(2)}</span></div>
            `).join('');
            
            templateHtml = `
                <!-- Minimalist Template Header -->
                <div class="text-center mb-3">
                    <h2 class="font-bold text-[14px] uppercase tracking-wide">${titleText}</h2>
                    <p class="text-[9px] text-gray-600 mt-0.5">${addressText}</p>
                    ${phoneText ? `<p class="text-[9px] text-gray-600">${phoneText}</p>` : ''}
                </div>
                ${divLine}
                <div class="text-[9px] space-y-0.5 mb-2">
                    <div class="flex justify-between"><span>Inv: ${invoiceId}</span><span>${dateText}</span></div>
                </div>
                ${divLine}
                <div class="space-y-1 my-2">
                    ${itemsHtml}
                </div>
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
            const itemsHtml = (data.items || []).map(i => `
                <div class="flex justify-between"><span>${i.qty}x ${i.name}</span><span>Delivered</span></div>
            `).join('');
            
            templateHtml = `
                <!-- Service & Delivery Template -->
                <div class="text-center mb-3">
                    <h2 class="font-bold text-[13px] uppercase tracking-wide">${titleText}</h2>
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
                <div class="space-y-1 my-2">
                    ${itemsHtml}
                </div>
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
            const itemsHtml = (data.items || []).map(i => `
                <div class="flex justify-between"><span>${i.qty}x ${i.name}</span><span>${currency}${i.total.toFixed(2)}</span></div>
                <div class="text-gray-500 pl-2 text-[8px]">@ ${currency}${(i.total / i.qty).toFixed(2)} each</div>
            `).join('');

            templateHtml = `
                <!-- Invoice / Tax Template -->
                <div class="text-center mb-3">
                    <div class="w-6 h-6 rounded-full bg-gray-100 mx-auto flex items-center justify-center mb-1 border border-gray-200">
                        <span class="material-symbols-outlined text-[14px] text-gray-700">water_drop</span>
                    </div>
                    <h2 class="font-bold text-[14px] uppercase tracking-wide">${titleText}</h2>
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
                <div class="text-[9px]">
                    <div class="flex justify-between font-bold pb-1 border-b border-dashed border-gray-300 mb-1.5">
                        <span>Description</span>
                        <span>Total</span>
                    </div>
                    <div class="space-y-1">
                        ${itemsHtml}
                    </div>
                </div>
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
            const itemsHtml = (data.items || []).map(i => `
                <div class="flex justify-between"><span>${i.qty}x ${i.name.substring(0, 12)}</span><span>${currency}${i.total.toFixed(2)}</span></div>
            `).join('');

            templateHtml = `
                <!-- Compact Eco Template -->
                <div class="text-center text-[10px] font-bold uppercase mb-1">
                    ${titleText}
                </div>
                <div class="text-[8px] text-center text-gray-600 mb-1">
                    ${addressText.substring(0, 30)}...
                </div>
                ${divLine}
                <div class="text-[8px] flex justify-between mb-1">
                    <span>${invoiceId}</span>
                    <span>${dateText}</span>
                </div>
                <div class="text-[8px] space-y-0.5 my-1">
                    ${itemsHtml}
                </div>
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
        }

        return templateHtml;
    }
};
