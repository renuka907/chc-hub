import React from "react";

export default function PrintableDocument({ title, children, showLogo = true }) {
    return (
        <div className="printable-document bg-white">
            <style>
                {`
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
                            padding: 40px;
                        }
                        .no-print {
                            display: none !important;
                        }
                        .print-page-break {
                            page-break-before: always;
                        }
                    }
                `}
            </style>
            
            <div className="max-w-4xl mx-auto p-8 bg-white">
                {showLogo && (
                    <div className="flex justify-center mb-4 pb-3 border-b border-gray-200">
                        <div className="text-center">
                            <img 
                                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/695939a556b8082002a35a68/1e5584b38_goldwithlettersContemporary-health-center-logo-retina.png" 
                                alt="Contemporary Health Center"
                                className="h-16 mx-auto mb-2"
                            />
                            <div className="text-xs text-gray-600 font-medium">
                                Go from Conventional to Contemporary Healthcare
                            </div>
                        </div>
                    </div>
                )}
                
                {title && (
                    <h1 className="text-xl font-bold text-gray-900 mb-4">
                        {title}
                    </h1>
                )}
                
                <div className="prose max-w-none">
                    {children}
                </div>
                
                <div className="mt-12 pt-6 border-t border-gray-200 text-sm text-gray-500">
                    <p>Document generated on {new Date().toLocaleDateString()}</p>
                </div>
            </div>
        </div>
    );
}