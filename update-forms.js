const fs = require('fs');

let content = fs.readFileSync('assets/js/features/forms.js', 'utf8');

const targetStr = `                if (panelId.includes('payment')) {
                    successMessage = "Payment record saved successfully!";
                } else if (panelId.includes('customer') && window.DB) {`;

const replaceStr = `                if (panelId.includes('payment') && window.DB) {
                    if (panelId.includes('customer')) {
                        data.entityType = 'customer';
                        data.type = 'received';
                    } else if (panelId.includes('supplier')) {
                        data.entityType = 'supplier';
                        data.type = 'paid';
                    }
                    window.DB.addPayment(data);
                    successMessage = "Payment record saved successfully!";
                } else if (panelId.includes('customer') && window.DB) {`;

content = content.replace(targetStr, replaceStr);

fs.writeFileSync('assets/js/features/forms.js', content);
console.log('Updated forms.js for payments');
