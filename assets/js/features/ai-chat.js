import { showToast } from '../ui/components.js';

export function initAIChat() {
    const aiOverlay = document.getElementById('ai-overlay');
    const aiPanel = document.getElementById('ai-panel');
    const btnCloseAI = document.getElementById('btn-close-ai');
    const btnSendAI = document.getElementById('btn-send-ai');
    const aiInput = document.getElementById('ai-chat-input');
    const aiMessages = document.getElementById('ai-chat-messages');

    // Find and wire the sidebar AI assistant buttons
    // The sidebar is loaded asynchronously, so we search the document or delegate click events.
    document.body.addEventListener('click', (e) => {
        const btn = e.target.closest('button');
        if (btn && (btn.textContent.includes('Ask AI Assistant') || btn.querySelector('.material-symbols-outlined')?.textContent === 'auto_awesome')) {
            // Ignore if it's the close button or inner panel button
            if (btn.id === 'btn-close-ai' || btn.closest('#ai-panel')) return;
            openAIPanel();
        }
    });

    function openAIPanel() {
        if (aiOverlay && aiPanel) {
            aiOverlay.classList.remove('opacity-0', 'pointer-events-none');
            aiPanel.classList.remove('translate-x-full');
            if (aiInput) aiInput.focus();
        }
    }

    function closeAIPanel() {
        if (aiOverlay && aiPanel) {
            aiOverlay.classList.add('opacity-0', 'pointer-events-none');
            aiPanel.classList.add('translate-x-full');
        }
    }

    if (aiOverlay) aiOverlay.addEventListener('click', closeAIPanel);
    if (btnCloseAI) btnCloseAI.addEventListener('click', closeAIPanel);

    // Wire suggestions
    document.querySelectorAll('.ai-suggest-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const query = btn.textContent.trim();
            sendQuery(query);
        });
    });

    function appendMessage(text, isUser = false) {
        if (!aiMessages) return;

        const wrapper = document.createElement('div');
        wrapper.className = isUser 
            ? 'flex gap-2.5 items-start max-w-[85%] ml-auto justify-end' 
            : 'flex gap-2.5 items-start max-w-[85%]';

        const content = isUser
            ? `<div class="bg-primary text-on-primary p-3 rounded-2xl rounded-tr-none border border-primary/20 shadow-sm">
                   <p class="text-[11px] font-medium leading-normal">${text}</p>
               </div>
               <div class="w-7 h-7 bg-secondary-container text-on-secondary-container rounded-full flex items-center justify-center shrink-0 shadow-sm font-bold text-[10px]">
                   U
               </div>`
            : `<div class="w-7 h-7 bg-primary text-on-primary rounded-full flex items-center justify-center shrink-0 shadow-sm">
                   <span class="material-symbols-outlined text-[15px]" style="font-variation-settings: 'FILL' 1;">auto_awesome</span>
               </div>
               <div class="bg-surface-container-low p-3 rounded-2xl rounded-tl-none border border-outline-variant/10">
                   <p class="text-[11px] font-medium text-on-surface leading-normal whitespace-pre-wrap">${text}</p>
               </div>`;

        wrapper.innerHTML = content;
        aiMessages.appendChild(wrapper);
        
        // Scroll to bottom
        setTimeout(() => {
            aiMessages.scrollTop = aiMessages.scrollHeight;
        }, 80);
    }

    function generateResponse(query) {
        const q = query.toLowerCase();
        if (!window.DB) return "Database not initialized. Please refresh the page.";

        // 1. Stock / Inventory Alerts Query
        if (q.includes('stock') || q.includes('inventory') || q.includes('alert') || q.includes('ware')) {
            const inv = window.DB.getInventory();
            const lowItems = inv.filter(item => item.stock <= item.threshold);
            if (lowItems.length === 0) {
                return "All inventory levels are optimal. There are currently no items under their low stock alert threshold.";
            } else {
                let response = `I found ${lowItems.length} items with low or depleted stock:\n`;
                lowItems.forEach(item => {
                    response += `\n• **${item.name}** (${item.sku}): **${item.stock} left** (min threshold ${item.threshold}) - *${item.status}*`;
                });
                response += "\n\nI recommend placing a replenishment order with filtration and bottle suppliers soon.";
                return response;
            }
        }

        // 2. Revenue / Sales Query
        if (q.includes('revenue') || q.includes('sale') || q.includes('finance') || q.includes('money') || q.includes('earn')) {
            const orders = window.DB.getOrders();
            const customers = window.DB.getCustomers();
            const totalRevenue = orders.reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0);
            const activeOrders = orders.filter(o => o.status === 'Processing' || o.status === 'Shipped').length;
            
            const settings = window.DB.getSettings();
            const currency = settings.general.currency || 'Rs.';

            return `**Operational Finance Summary:**\n\n• **Total Cumulative Revenue:** ${currency}${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n• **Total Order Count:** ${orders.length} orders\n• **Active Pipeline Orders:** ${activeOrders} in progress\n• **Average Order Value:** ${currency}${(totalRevenue / (orders.length || 1)).toFixed(2)}\n\nThis data reflects real-time client contracts and order submissions.`;
        }

        // 3. Customers / Clients Query
        if (q.includes('customer') || q.includes('client') || q.includes('directory')) {
            const custs = window.DB.getCustomers();
            let response = `There are **${custs.length} registered clients** in your directory:\n`;
            custs.forEach(c => {
                response += `\n• **${c.name}** (${c.status}) - Last Order: ${c.lastOrder}`;
            });
            response += `\n\nUse the Clients tab to manage contracts or onboarding details.`;
            return response;
        }

        // 4. Suppliers Query
        if (q.includes('supplier') || q.includes('manufacture') || q.includes('partner')) {
            const sups = window.DB.getSuppliers();
            let response = `Your active supply network consists of **${sups.length} suppliers**:\n`;
            sups.forEach(s => {
                response += `\n• **${s.name}** - Category: ${s.category} (Rating: ${s.rating} ★)`;
            });
            return response;
        }

        // 5. Help / System status
        if (q.includes('status') || q.includes('system') || q.includes('health')) {
            return "All systems are **100% Operational**.\n\n• Telemetry synchronization: Active\n• Database instance: LocalStorage V1.0\n• API Sync Status: Online\n• Node grid mapping: Northern & Western districts synced.";
        }

        // Fallback response
        return `I received your operational query: "${query}".\n\nTo fetch live metrics, try asking queries containing keywords like:\n- **"Stock"** or **"Inventory"** (shows alert thresholds)\n- **"Revenue"** or **"Sales"** (sums pipeline financials)\n- **"Customers"** or **"Clients"** (directory status)\n- **"Suppliers"** (onboarded vendor details)`;
    }

    function sendQuery(text) {
        if (!text.trim()) return;

        // Append user query
        appendMessage(text, true);
        if (aiInput) aiInput.value = '';

        // Simulate typing animation
        setTimeout(() => {
            const reply = generateResponse(text);
            appendMessage(reply, false);
        }, 400);
    }

    if (btnSendAI && aiInput) {
        btnSendAI.addEventListener('click', () => sendQuery(aiInput.value));
        aiInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') sendQuery(aiInput.value);
        });
    }
}
