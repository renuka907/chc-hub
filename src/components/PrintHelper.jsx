/**
 * Unified Print Service for CHC Hub
 * Replaces the old popup-window approach with reliable CSS @media print.
 * 
 * Strategy: Use window.print() directly with CSS @media print rules.
 * The PrintableDocument component already has @media print CSS that hides
 * everything except .printable-document. We just need to call window.print().
 * 
 * For cases where we need to print custom HTML (not on-screen), we use
 * a hidden iframe approach that's more reliable than window.open.
 */

// Simple: print the current page (relies on PrintableDocument's @media print CSS)
export function openPrintWindow() {
    const printContent = document.querySelector('.printable-document');
    if (!printContent) {
        window.print();
        return;
    }
    // The PrintableDocument CSS @media print rules handle hiding everything else
    window.print();
}

// Print custom HTML content via hidden iframe (more reliable than popup)
export function printHTML(html, title = 'Print') {
    return new Promise((resolve) => {
        const iframe = document.createElement('iframe');
        iframe.style.position = 'fixed';
        iframe.style.right = '0';
        iframe.style.bottom = '0';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.style.border = '0';
        document.body.appendChild(iframe);

        const doc = iframe.contentDocument || iframe.contentWindow.document;
        doc.open();
        doc.write(`<!DOCTYPE html>
<html>
<head>
    <title>${title}</title>
    <style>
        @page { size: letter; margin: 0.5in; }
        body { 
            font-family: 'Times New Roman', serif; 
            font-size: 11pt; 
            line-height: 1.4;
            color: #000;
            margin: 0;
            padding: 0;
        }
        img { max-width: 100%; }
        h1, h2, h3 { margin: 12px 0 8px; }
        p { margin: 8px 0; }
        ul, ol { padding-left: 30px; }
        li { margin: 5px 0; }
        .text-center { text-align: center; }
        .font-bold, strong { font-weight: bold; }
        .border-b { border-bottom: 1px solid #ccc; }
        .mb-4 { margin-bottom: 16px; }
        .mb-6 { margin-bottom: 24px; }
        .mt-8 { margin-top: 32px; }
        .pb-2 { padding-bottom: 8px; }
        .pb-3 { padding-bottom: 12px; }
        .pt-3 { padding-top: 12px; }
        .text-xs { font-size: 9pt; }
        .text-xl { font-size: 16pt; }
        .uppercase { text-transform: uppercase; }
        .tracking-wide { letter-spacing: 0.05em; }
        .ql-align-center { text-align: center; }
        .ql-align-right { text-align: right; }
        .ql-align-justify { text-align: justify; }
        input[type="text"], .form-field {
            border: none;
            border-bottom: 1px solid black;
            background: transparent;
            width: 100%;
            padding: 2px 4px;
            font-family: 'Times New Roman', serif;
            font-size: 11pt;
        }
        input[type="checkbox"] {
            appearance: none;
            -webkit-appearance: none;
            width: 14px;
            height: 14px;
            border: 1px solid black;
            background: white;
            margin-right: 8px;
            vertical-align: middle;
        }
        .field-row { display: flex; gap: 20px; margin-bottom: 12px; }
        .field-label { white-space: nowrap; padding-right: 8px; }
        .field-input { flex: 1; border-bottom: 1px solid black; min-width: 200px; }
        .text-box { border: 2px solid black; padding: 12px; margin: 12px 0; }
        .text-box-thin { border: 1px solid black; padding: 10px; margin: 10px 0; }
        .text-box-dashed { border: 2px dashed black; padding: 12px; margin: 12px 0; }
        .print-page-break { page-break-before: always; }
        * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    </style>
</head>
<body>${html}</body>
</html>`);
        doc.close();

        // Wait for images to load, then print
        iframe.onload = () => {
            setTimeout(() => {
                try {
                    iframe.contentWindow.print();
                } catch (e) {
                    // Fallback: open in new tab
                    const win = window.open('', '_blank');
                    win.document.write(doc.documentElement.outerHTML);
                    win.document.close();
                    win.onload = () => win.print();
                }
                setTimeout(() => {
                    document.body.removeChild(iframe);
                    resolve();
                }, 1000);
            }, 500);
        };
    });
}

// Generate the standard CHC header HTML for use in print templates
export function getCHCHeaderHTML(logoUrl = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/695939a556b8082002a35a68/1e5584b38_goldwithlettersContemporary-health-center-logo-retina.png") {
    return `
        <div style="text-align: center; margin-bottom: 16px;">
            <img src="${logoUrl}" alt="CHC Logo" style="height: 64px; margin: 0 auto;" 
                 onerror="this.style.display='none'" />
        </div>
        <div style="text-align: center; margin-bottom: 24px; padding-bottom: 12px; border-bottom: 1px solid #999;">
            <div style="font-size: 9pt; color: #333; line-height: 1.6;">
                <div style="font-weight: 600;">6150 Diamond Center Court #400, Fort Myers, FL 33912</div>
                <div>Phone: 239-561-9191 | Fax: 239-561-9188</div>
                <div>contemporaryhealthcenter.com</div>
            </div>
        </div>
    `;
}

// Generate the standard CHC footer HTML
export function getCHCFooterHTML() {
    return `
        <div style="text-align: center; font-size: 9pt; color: #666; margin-top: 32px; padding-top: 12px; border-top: 1px solid #ccc;">
            <p style="font-weight: 500;">Contemporary Health Center | Phone: 239-561-9191 | Email: office@contemporaryhealthcenter.com</p>
            <p>Document Generated: ${new Date().toLocaleDateString()}</p>
        </div>
    `;
}

// Print a full CHC document with header/footer
export function printCHCDocument(title, bodyHTML) {
    const html = `
        ${getCHCHeaderHTML()}
        ${title ? `<h1 style="font-size: 16pt; font-weight: bold; text-align: center; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid #000; padding-bottom: 8px; margin-bottom: 16px;">${title}</h1>` : ''}
        <div style="color: #111;">${bodyHTML}</div>
        ${getCHCFooterHTML()}
    `;
    return printHTML(html, title || 'CHC Document');
}
