const fs = require('fs');
let html = fs.readFileSync('settings-general.html', 'utf8');

const fields = [
    { id: 'company-name', label: 'Company Name *', type: 'text' },
    { id: 'company-phone', label: 'Contact Phone *', type: 'text' },
    { id: 'company-email', label: 'Contact Email', type: 'email' },
    { id: 'company-address', label: 'Office Address', type: 'text' },
    { id: 'currency-symbol', label: 'Currency Symbol', type: 'text' }
];

let gridStart = html.indexOf('<div class="grid grid-cols-1 md:grid-cols-2 gap-5">');
let formEnd = html.indexOf('</form>');

if (gridStart !== -1 && formEnd !== -1) {
    let newGridHtml = `<div class="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                            
                            <div class="floating-label-group mb-2">
                                <input type="text" id="company-name" name="companyName" required class="w-full bg-white/50 border border-outline-variant/30 rounded-lg py-2 px-3 text-[12px] focus:ring-2 focus:ring-[#0f5238]/30 outline-none" placeholder=" ">
                                <label for="company-name">Company Name *</label>
                            </div>
                            
                            <div class="floating-label-group mb-2">
                                <input type="text" id="company-phone" name="phone" required class="w-full bg-white/50 border border-outline-variant/30 rounded-lg py-2 px-3 text-[12px] focus:ring-2 focus:ring-[#0f5238]/30 outline-none" placeholder=" ">
                                <label for="company-phone">Contact Phone *</label>
                            </div>

                            <div class="floating-label-group mb-2">
                                <input type="email" id="company-email" name="email" class="w-full bg-white/50 border border-outline-variant/30 rounded-lg py-2 px-3 text-[12px] focus:ring-2 focus:ring-[#0f5238]/30 outline-none" placeholder=" ">
                                <label for="company-email">Contact Email</label>
                            </div>

                            <div class="floating-label-group mb-2">
                                <input type="text" id="company-address" name="address" class="w-full bg-white/50 border border-outline-variant/30 rounded-lg py-2 px-3 text-[12px] focus:ring-2 focus:ring-[#0f5238]/30 outline-none" placeholder=" ">
                                <label for="company-address">Office Address</label>
                            </div>

                            <div class="floating-label-group mb-2">
                                <input type="text" id="currency-symbol" name="currency" maxlength="5" class="w-full bg-white/50 border border-outline-variant/30 rounded-lg py-2 px-3 text-[12px] focus:ring-2 focus:ring-[#0f5238]/30 outline-none" placeholder=" ">
                                <label for="currency-symbol">Currency Symbol</label>
                            </div>

                            <div class="flex flex-col gap-1.5">
                                <label class="text-[11px] font-bold text-on-surface-variant mb-1">Date Format</label>
                                <select id="date-format" name="dateFormat" class="w-full bg-white/50 border border-outline-variant/30 rounded-lg py-2 px-3 text-[12px] focus:ring-2 focus:ring-[#0f5238]/30 outline-none cursor-pointer">
                                    <option value="YYYY-MM-DD">YYYY-MM-DD (e.g. 2026-06-03)</option>
                                    <option value="DD/MM/YYYY">DD/MM/YYYY (e.g. 03/06/2026)</option>
                                    <option value="MM/DD/YYYY">MM/DD/YYYY (e.g. 06/03/2026)</option>
                                </select>
                            </div>
                        </div>`;
                        
    let blockToRemove = html.substring(gridStart, formEnd);
    html = html.replace(blockToRemove, newGridHtml + '\n                        ');
    
    fs.writeFileSync('settings-general.html', html);
    console.log('Updated settings-general.html with professional floating labels');
} else {
    console.log('Could not find grid');
}
