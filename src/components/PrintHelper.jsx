export function openPrintWindow() {
    const printContent = document.querySelector('.printable-document');
    if (!printContent) {
        window.print();
        return;
    }

    const printWindow = window.open('', '_blank', 'width=800,height=600');
    
    // Collect all styles from the current page
    const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
        .map(style => {
            if (style.tagName === 'STYLE') {
                return `<style>${style.textContent}</style>`;
            } else {
                return `<link rel="stylesheet" href="${style.href}">`;
            }
        })
        .join('\n');
    
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Print Document</title>
            <meta charset="UTF-8">
            ${styles}
        </head>
        <body>
            ${printContent.innerHTML}
            <script>
                setTimeout(function() {
                    window.print();
                    window.onafterprint = function() {
                        window.close();
                    };
                }, 500);
            </script>
        </body>
        </html>
    `);
    
    printWindow.document.close();
}