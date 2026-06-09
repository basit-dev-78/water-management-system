const fs = require('fs');
let html = fs.readFileSync('settings-general.html', 'utf8');

let newGridHtml = `<div class="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                            <div class="col-span-1 md:col-span-2">
                                <h3 class="text-[14px] font-bold text-on-surface border-b border-outline-variant/20 pb-2 mb-4">
                                    General Information</h3>
                            </div>
                            
                            <div class="floating-label-group mb-2">`;
                            
html = html.replace('<div class="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">\n                            \n                            <div class="floating-label-group mb-2">', newGridHtml);

fs.writeFileSync('settings-general.html', html);
console.log('Added header');
