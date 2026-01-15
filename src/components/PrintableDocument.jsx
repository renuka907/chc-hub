import React from "react";

export default function PrintableDocument({ title, children, showLogo = true, logoUrl = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/695939a556b8082002a35a68/1e5584b38_goldwithlettersContemporary-health-center-logo-retina.png" }) {
    return (
        <div className="printable-document w-full max-w-[8.5in] mx-auto bg-white p-8" style={{fontFamily: 'Times New Roman, serif'}}>
            <style>
                {`
                    @page {
                        size: letter;
                        margin: 0.5in;
                    }

                    .printable-document input[type="text"],
                    .printable-document .form-field {
                        border: none;
                        border-bottom: 1px solid black;
                        background: transparent;
                        width: 100%;
                        padding: 2px 4px;
                        font-family: 'Times New Roman', serif;
                        font-size: 11pt;
                    }

                    .printable-document .field-row {
                        display: flex;
                        gap: 20px;
                        margin-bottom: 12px;
                    }

                    .printable-document .field-label {
                        white-space: nowrap;
                        padding-right: 8px;
                    }

                    .printable-document .field-input {
                        flex: 1;
                        border-bottom: 1px solid black;
                        min-width: 200px;
                    }

                    .printable-document input[type="checkbox"] {
                        appearance: none;
                        -webkit-appearance: none;
                        width: 14px;
                        height: 14px;
                        border: 1px solid black;
                        background: white;
                        margin-right: 8px;
                        vertical-align: middle;
                        cursor: pointer;
                    }

                    .printable-document input[type="checkbox"]:checked {
                        background: white;
                    }

                    .printable-document input[type="checkbox"]:checked::after {
                        content: '';
                        display: block;
                        width: 8px;
                        height: 8px;
                        margin: 2px;
                        background: black;
                    }

                    .printable-document p {
                        margin: 8px 0;
                        line-height: 1.4;
                    }

                    .printable-document strong {
                        font-weight: bold;
                    }

                    .printable-document ul, .printable-document ol {
                        margin: 10px 0;
                        padding-left: 30px;
                    }

                    .printable-document li {
                        margin: 5px 0;
                    }

                    /* Quill alignment classes */
                    .printable-document .ql-align-left {
                        text-align: left;
                    }

                    .printable-document .ql-align-center {
                        text-align: center;
                    }

                    .printable-document .ql-align-right {
                        text-align: right;
                    }

                    .printable-document .ql-align-justify {
                        text-align: justify;
                    }

                    /* Box styles */
                    .printable-document .text-box {
                        border: 2px solid black;
                        padding: 12px;
                        margin: 12px 0;
                    }

                    .printable-document .text-box-thin {
                        border: 1px solid black;
                        padding: 10px;
                        margin: 10px 0;
                    }

                    .printable-document .text-box-dashed {
                        border: 2px dashed black;
                        padding: 12px;
                        margin: 12px 0;
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
                            padding: 0.5in;
                            border: 2px solid black;
                            max-width: 100%;
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
            <div className="mb-4 text-center">
                <img 
                    src={logoUrl}
                    alt="Logo"
                    className="h-16 mx-auto"
                    loading="eager"
                    decoding="sync"
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
            </div>

            {/* Header with contact info */}
            {showLogo && (
                <div className="mb-6 pb-3 border-b border-gray-400 text-center">
                    <div className="text-xs text-gray-800 leading-relaxed">
                        <div className="font-semibold">6150 Diamond Center Court #400, Fort Myers, FL 33912</div>
                        <div className="mt-0.5">Phone: 239-561-9191 | Fax: 239-561-9188</div>
                        <div className="mt-0.5">contemporaryhealthcenter.com</div>
                    </div>
                </div>
            )}

            {/* Title */}
            {title && (
                <h1 className="text-xl font-bold text-gray-900 mb-4 text-center uppercase tracking-wide border-b pb-2">
                    {title}
                </h1>
            )}

            {/* Content */}
            <div className="text-gray-900">
                {children}
            </div>

            {/* Footer with date */}
            <div className="text-center text-xs text-gray-600 mt-8 pt-3 border-t border-gray-300">
                <p className="font-medium">Contemporary Health Center | Phone: 239-561-9191 | Email: office@contemporaryhealthcenter.com</p>
                <p className="mt-0.5">Document Generated: {new Date().toLocaleDateString()}</p>
            </div>
        </div>
    );
}