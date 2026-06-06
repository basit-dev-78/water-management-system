const fs = require('fs');

try {
    let code = fs.readFileSync('assets/js/core/component-templates.js', 'utf8');

    const sidebarStart = code.indexOf('sidebar: "') + 'sidebar: "'.length;
    const sidebarEnd = code.indexOf('",\n  header: "');

    let sidebarHtml = code.substring(sidebarStart, sidebarEnd);
    sidebarHtml = sidebarHtml.replace(/\\"/g, '"').replace(/\\n/g, '\n');

    fs.writeFileSync('components/sidebar.html', sidebarHtml);

    const header = fs.readFileSync('components/header.html', 'utf8');
    const filter = fs.readFileSync('components/filter-panel.html', 'utf8');
    const toast = fs.readFileSync('components/toast-container.html', 'utf8');
    const ai = fs.readFileSync('components/ai-panel.html', 'utf8');

    function escapeForJsString(str) {
        return str.replace(/\\/g, '\\\\')
                  .replace(/"/g, '\\"')
                  .replace(/\n/g, '\\n')
                  .replace(/\r/g, '');
    }

    const newCode = `export const TEMPLATES = {
  sidebar: "${escapeForJsString(sidebarHtml)}",
  header: "${escapeForJsString(header)}",
  filter: "${escapeForJsString(filter)}",
  toast: "${escapeForJsString(toast)}",
  ai: "${escapeForJsString(ai)}"
};
`;

    fs.writeFileSync('assets/js/core/component-templates.js', newCode);
    console.log("Successfully fixed component-templates.js and synced components/sidebar.html");
} catch (e) {
    console.error(e);
}
