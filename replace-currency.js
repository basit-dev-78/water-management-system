const fs = require('fs');
const path = require('path');

function replaceCurrency(dir) {
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory() && file !== 'node_modules' && !file.startsWith('.')) {
            replaceCurrency(fullPath);
        } else if (file.endsWith('.html') || file.endsWith('.js')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let original = content;
            
            // 1. Replace Amount (Rs.) or similar
            content = content.replace(/\(\$\)/g, '(Rs.)');
            
            // 2. Replace e.g. Rs. placeholder
            content = content.replace(/e\.g\. \$/g, 'e.g. Rs.');
            
            // 3. Replace $ followed directly by a number (e.g. Rs.5.00, Rs. 0.00, Rs. 1,200)
            // It might be preceded by a > or space or quotation.
            // Using regex: replace $ when followed by a digit.
            content = content.replace(/\$(\d)/g, 'Rs. Rs. 1');
            
            // 4. Replace standalone $ if it's explicitly currency (e.g. placeholder="Rs.")
            content = content.replace(/placeholder="\$/g, 'placeholder="Rs.');
            
            // 5. Replace "$ " when it's clearly currency
            content = content.replace(/>\$\s/g, '>Rs. ');
            
            if (content !== original) {
                fs.writeFileSync(fullPath, content);
                console.log(`Updated currency in: ${fullPath}`);
            }
        }
    }
}

replaceCurrency(__dirname);
console.log('Currency replacement complete.');
