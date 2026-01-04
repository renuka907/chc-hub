import React from "react";

export default function PrintableDocument({ title, children, showLogo = true }) {
    return (
        <div className="printable-document max-w-4xl mx-auto bg-white p-12 rounded-lg shadow-sm" style={{fontFamily: 'Times New Roman, serif'}}>
            <style>
                {`
                    @page {
                        size: letter;
                        margin: 0.75in;
                    }
                    
                    @media print {
                        body * {
                            visibility: hidden;
                        }
                        .printable-document, .printable-document * {
                            visibility: visible;
                        }
                        .printable-document {
                            position: absolute;
                            left: 0;
                            top: 0;
                            width: 100%;
                            background: white;
                            padding: 0;
                        }
                        .no-print {
                            display: none !important;
                        }
                        .print-page-break {
                            page-break-before: always;
                        }
                        * {
                            -webkit-print-color-adjust: exact !important;
                            print-color-adjust: exact !important;
                            color-adjust: exact !important;
                        }
                    }
                `}
            </style>

            {/* Yellow Logo at top */}
            <div className="mb-6 text-center">
                <img 
                    src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/695939a556b8082002a35a68/1e5584b38_goldwithlettersContemporary-health-center-logo-retina.png" 
                    alt="Contemporary Health Center"
                    className="h-20 mx-auto"
                />
            </div>

            {/* Header with contact info */}
            {showLogo && (
                <div className="mb-8 pb-4 border-b border-gray-400 text-center">
                    <div className="text-sm text-gray-800 leading-relaxed">
                        <div className="font-semibold">6150 Diamond Center Court #400, Fort Myers, FL 33912</div>
                        <div className="mt-1">Phone: 239-561-9191 | Fax: 239-561-9188</div>
                        <div className="mt-1">contemporaryhealthcenter.com</div>
                    </div>
                </div>
            )}

            {/* Title */}
            {title && (
                <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center uppercase tracking-wide border-b pb-3">
                    {title}
                </h1>
            )}

            {/* Content */}
            <div className="text-gray-900">
                {children}
            </div>

            {/* Footer with date */}
            <div className="text-center text-xs text-gray-600 mt-12 pt-4 border-t border-gray-300">
                <p className="font-medium">Contemporary Health Center | Phone: 239-561-9191 | Email: office@contemporaryhealthcenter.com</p>
                <p className="mt-1">Document Generated: {new Date().toLocaleDateString()}</p>
            </div>
        </div>
    );
}