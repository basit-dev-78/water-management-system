export function initGlobalPrint() {
    // We listen on the document body because the header is loaded dynamically
    document.body.addEventListener('click', (e) => {
        const btn = e.target.closest('#btn-global-print');
        if (!btn) return;

        console.log('Global Print triggered');

        // Check if printJS is available
        if (typeof printJS === 'undefined') {
            alert('Print.js library is not loaded. Please ensure it is in the HTML head.');
            return;
        }

        const mainContent = document.querySelector('main');
        const printHeader = document.getElementById('global-print-header');
        const printFooter = document.getElementById('global-print-footer');

        if (!mainContent) {
            console.error('No <main> content found to print.');
            return;
        }

        // Create or get the hidden printable container
        let printContainer = document.getElementById('global-printjs-container');
        if (!printContainer) {
            printContainer = document.createElement('div');
            printContainer.id = 'global-printjs-container';
            printContainer.style.display = 'none';
            document.body.appendChild(printContainer);
        }

        // We clone the main content so we don't accidentally modify the real DOM
        // We also want to remove any elements that shouldn't be printed
        const clonedMain = mainContent.cloneNode(true);
        const noPrintElements = clonedMain.querySelectorAll('.no-print, #header-container');
        noPrintElements.forEach(el => el.remove());

        // Strip flex and height constraints to allow natural page breaks
        clonedMain.style.minHeight = 'auto';
        clonedMain.style.height = 'auto';
        clonedMain.style.display = 'block';
        clonedMain.classList.remove('flex', 'flex-col', 'min-h-[calc(100vh-32px)]', 'min-h-screen');

        // Ensure inner elements can also break
        const childBlocks = clonedMain.querySelectorAll('div, section, article');
        childBlocks.forEach(el => {
            el.style.pageBreakInside = 'auto';
            el.style.breakInside = 'auto';
        });

        const headerHtml = printHeader ? printHeader.innerHTML : '<h1 style="text-align:center;">AquaFlow Pro</h1>';
        const footerHtml = printFooter ? printFooter.innerHTML : '<div style="text-align:center;">Generated automatically</div>';
        
        // Wrap everything in the repeating table structure
        // Bulletproof repeating header/footer trick:
        // 1. Visually, the header and footer are position: fixed, which repeats on every page.
        // 2. Structurally, we use an empty <thead> and <tfoot> inside a table to reserve space on every page.
        printContainer.innerHTML = `
            <div style="position: fixed; top: 0; left: 0; right: 0; height: 70px; background: white; z-index: 999; text-align: center; border-bottom: 2px solid #0f5238; padding-top: 10px;">
                ${headerHtml}
            </div>
            
            <table style="width: 100%; border: none;">
                <thead style="display: table-header-group;">
                    <tr>
                        <td>
                            <!-- Spacer for the fixed header on every page -->
                            <div style="height: 80px;">&nbsp;</div>
                        </td>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td style="padding: 0;">
                            <div>
                                ${clonedMain.innerHTML}
                            </div>
                        </td>
                    </tr>
                </tbody>
                <tfoot style="display: table-footer-group;">
                    <tr>
                        <td>
                            <!-- Spacer for the fixed footer on every page -->
                            <div style="height: 60px;">&nbsp;</div>
                        </td>
                    </tr>
                </tfoot>
            </table>
            
            <div style="position: fixed; bottom: 0; left: 0; right: 0; height: 40px; background: white; z-index: 999; text-align: center; border-top: 1px solid #ccc; padding-top: 10px; font-size: 12px; color: #666;">
                ${footerHtml}
            </div>
        `;

        // Execute Print.js
        printJS({
            printable: 'global-printjs-container',
            type: 'html',
            css: './assets/css/style.css',
            style: '@page { size: A4; margin: 15mm; }',
            documentTitle: 'AquaFlow Pro Document'
        });
    });
}
