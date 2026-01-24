import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer, X } from "lucide-react";

export default function EducationPrintDialog({ open, onOpenChange, topic }) {
    if (!topic) return null;

    const iframeRef = React.useRef(null);
    const [isLoaded, setIsLoaded] = React.useState(false);

    React.useEffect(() => {
        if (open) {
            setIsLoaded(false);
        }
    }, [open]);

    const handlePrint = () => {
        // Generate HTML content for printing
        const printContent = generatePrintHTML();
        
        // Create hidden iframe to print
        const printFrame = document.createElement('iframe');
        printFrame.style.position = 'fixed';
        printFrame.style.right = '0';
        printFrame.style.bottom = '0';
        printFrame.style.width = '0';
        printFrame.style.height = '0';
        printFrame.style.border = 'none';
        document.body.appendChild(printFrame);
        
        printFrame.onload = () => {
            try {
                const doc = printFrame.contentDocument || printFrame.contentWindow.document;
                doc.open();
                doc.write(printContent);
                doc.close();
                
                setTimeout(() => {
                    printFrame.contentWindow.focus();
                    printFrame.contentWindow.print();
                    setTimeout(() => document.body.removeChild(printFrame), 1000);
                }, 100);
            } catch (e) {
                console.error('Print error:', e);
                document.body.removeChild(printFrame);
            }
        };
        
        printFrame.src = 'about:blank';
    };

    const generatePrintHTML = () => {
        return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>${topic.title}</title>
    <style>
        @page {
            margin: 0.5in 0.5in 0.75in 0.5in;
            size: letter;
        }
        
        body {
            font-family: 'Times New Roman', serif;
            font-size: 11pt;
            line-height: 2;
            color: #000;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }
        
        .page-header {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            height: 0.3in;
            text-align: center;
            font-weight: bold;
            font-size: 11pt;
            padding: 5pt 0;
            border-bottom: 2px solid #000;
            background: white;
        }
        
        .content-wrapper {
            margin-top: 0.35in;
        }
        
        .print-title {
            font-size: 18pt;
            font-weight: bold;
            text-align: center;
            margin: 12pt 0;
            padding-bottom: 8pt;
            border-bottom: 2px solid #000;
            text-transform: uppercase;
        }
        
        .print-logo {
            text-align: center;
            margin: 20pt 0;
        }
        
        .print-logo img {
            height: 50px;
            width: auto;
        }
        
        h2 {
            font-size: 14pt;
            font-weight: bold;
            margin-top: 18pt;
            margin-bottom: 12pt;
            page-break-after: avoid;
        }
        
        h3 {
            font-size: 12pt;
            font-weight: bold;
            margin-top: 16pt;
            margin-bottom: 10pt;
            page-break-after: avoid;
        }
        
        p {
            margin-bottom: 14pt;
            text-align: left;
            line-height: 2.2;
        }
        
        ul, ol {
            margin: 16pt 0;
            padding-left: 30pt;
            line-height: 2.2;
        }
        
        li {
            margin-bottom: 10pt;
            line-height: 2.1;
        }
        
        strong {
            font-weight: 600;
        }
        
        .print-section {
            background: #f8f9fa;
            border: 1px solid #ddd;
            padding: 8pt;
            margin: 8pt 0;
            page-break-inside: avoid;
        }
        
        .print-section.compact {
            padding: 6pt;
            margin: 6pt 0;
        }
    </style>
</head>
<body>
    ${topic.header ? `<div class="page-header">${topic.header}</div>` : ''}
    
    <div class="content-wrapper">
        <div class="print-title">
            Patient Education: ${topic.title}
        </div>
    
    <div class="print-logo">
        <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/695939a556b8082002a35a68/1e5584b38_goldwithlettersContemporary-health-center-logo-retina.png" alt="Contemporary Health Center" />
    </div>
    
    ${topic.summary ? `
    <div class="print-section compact" style="background: #ecfdf5; border-color: #10b981;">
        <h2 style="margin-top: 4pt; margin-bottom: 6pt;">Summary</h2>
        <p style="font-weight: 500; margin-bottom: 4pt;">${topic.summary}</p>
    </div>
    ` : ''}
    
    <div class="print-section">
        ${topic.content || ''}
    </div>
    
    ${topic.medical_references ? `
    <div class="print-section">
        <h2>Medical References</h2>
        <p style="font-size: 10pt; white-space: pre-wrap;">${topic.medical_references}</p>
    </div>
    ` : ''}
    
    <div class="print-section" style="background: #f1f5f9; border-color: #475569; border-width: 2px;">
        <p style="font-style: italic; font-size: 10pt;">
            <strong>Disclaimer:</strong> This information is for educational purposes only and should not replace professional medical advice. Please consult with a healthcare provider for personalized medical guidance.
        </p>
    </div>
    
    <div class="print-section compact" style="background: #f1f5f9; border-color: #475569; border-width: 2px; padding: 4pt; margin: 2pt 0;">
        <p style="font-weight: bold; font-size: 13pt; margin-bottom: 3pt; text-transform: uppercase;">
            Questions or Want to Learn More?
        </p>
        <p style="margin-bottom: 3pt;">
            Our medical team is here to help answer any questions about this topic or discuss treatment options that may be right for you.
        </p>
        <div style="border-top: 1px solid #cbd5e1; padding-top: 3pt; margin-top: 2pt;">
            <p style="font-weight: 600; margin-bottom: 1pt;">📞 Phone: 239-561-9191 (call or text)</p>
            <p style="font-weight: 600; margin-bottom: 1pt;">📧 Email: office@contemporaryhealthcenter.com</p>
            <p style="font-weight: 600; margin-bottom: 0;">🌐 Web: contemporaryhealthcenter.com</p>
        </div>
    </div>
    </div>
</body>
</html>
        `;
    };

    // Generate preview URL using Google Docs Viewer
    const previewUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(
        `data:text/html;charset=utf-8,${encodeURIComponent(generatePrintHTML())}`
    )}&embedded=true`;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh]">
                <DialogHeader>
                    <div className="flex items-center justify-between">
                        <DialogTitle>{topic.title}</DialogTitle>
                        <div className="flex gap-2">
                            <Button 
                                onClick={handlePrint} 
                                size="sm" 
                                className="text-black"
                                disabled={!isLoaded}
                            >
                                <Printer className="w-4 h-4 mr-2" />
                                {isLoaded ? 'Print' : 'Loading...'}
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </DialogHeader>
                <div className="overflow-auto max-h-[calc(90vh-120px)] relative bg-white">
                    <iframe 
                        ref={iframeRef}
                        srcDoc={generatePrintHTML()}
                        width="100%" 
                        height="600px"
                        className="rounded-lg border-0 bg-white"
                        onLoad={() => setIsLoaded(true)}
                        title={topic.title}
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
}