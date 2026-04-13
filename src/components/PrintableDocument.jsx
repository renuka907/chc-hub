import React from "react";

const CHC_LOGO = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/695939a556b8082002a35a68/1e5584b38_goldwithlettersContemporary-health-center-logo-retina.png";

export default function PrintableDocument({ title, children, showLogo = true, logoUrl = CHC_LOGO }) {
    return (
        <div className="printable-document w-full max-w-[8.5in] mx-auto bg-white" style={{fontFamily: 'Arial, sans-serif', fontSize: '10pt', lineHeight: '1.4', color: '#1a1a1a', padding: '0.4in 0.55in'}}>
            <style>
                {`
                    @page {
                        size: letter;
                        margin: 0.4in 0.55in;
                    }

                    .printable-document input[type="text"],
                    .printable-document .form-field {
                        border: none;
                        border-bottom: 1.5px solid #374151;
                        background: transparent;
                        width: 100%;
                        padding: 2px 4px;
                        font-family: Arial, sans-serif;
                        font-size: 10pt;
                    }

                    .printable-document .field-row {
                        display: flex;
                        gap: 14px;
                        margin-bottom: 8px;
                    }

                    .printable-document .field-label {
                        white-space: nowrap;
                        padding-right: 4px;
                        font-size: 7pt;
                        font-weight: 700;
                        color: #6b7280;
                        text-transform: uppercase;
                        letter-spacing: 0.3px;
                    }

                    .printable-document .field-input {
                        flex: 1;
                        border-bottom: 1.5px solid #374151;
                        min-width: 150px;
                    }

                    .printable-document input[type="checkbox"] {
                        appearance: none;
                        -webkit-appearance: none;
                        width: 13px;
                        height: 13px;
                        border: 1.5px solid #374151;
                        background: white;
                        margin-right: 7px;
                        vertical-align: middle;
                        cursor: pointer;
                        flex-shrink: 0;
                    }

                    .printable-document input[type="checkbox"]:checked {
                        background: white;
                    }

                    .printable-document input[type="checkbox"]:checked::after {
                        content: '';
                        display: block;
                        width: 7px;
                        height: 7px;
                        margin: 2px;
                        background: #374151;
                    }

                    .printable-document h1, .printable-document h2, .printable-document h3 {
                        font-family: Arial, sans-serif;
                        font-weight: 700;
                        color: #5b21b6;
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                        border-bottom: 1px solid #ede9fe;
                        padding-bottom: 3px;
                        margin: 12px 0 7px;
                    }

                    .printable-document h1 { font-size: 11pt; }
                    .printable-document h2 { font-size: 10pt; }
                    .printable-document h3 { font-size: 9pt; }

                    .printable-document p {
                        margin: 0 0 6px;
                        line-height: 1.4;
                    }

                    .printable-document strong {
                        font-weight: bold;
                    }

                    .printable-document ul, .printable-document ol {
                        margin: 3px 0 7px 18px;
                        padding-left: 0;
                    }

                    .printable-document li {
                        margin: 0 0 3px;
                        line-height: 1.4;
                    }

                    /* Quill alignment classes */
                    .printable-document .ql-align-left { text-align: left; }
                    .printable-document .ql-align-center { text-align: center; }
                    .printable-document .ql-align-right { text-align: right; }
                    .printable-document .ql-align-justify { text-align: justify; }

                    /* Box styles */
                    .printable-document .text-box {
                        border: 1.5px solid #374151;
                        padding: 10px;
                        margin: 8px 0;
                    }

                    .printable-document .text-box-thin {
                        border: 1px solid #374151;
                        padding: 8px;
                        margin: 8px 0;
                    }

                    .printable-document .text-box-dashed {
                        border: 1.5px dashed #374151;
                        padding: 10px;
                        margin: 8px 0;
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

            {/* Header: logo left, title right, purple border */}
            {showLogo && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '2px solid #5b21b6', paddingBottom: '8px', marginBottom: '14px' }}>
                    <img
                        src={logoUrl}
                        alt="CHC Logo"
                        style={{ height: '44px' }}
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                    <div style={{ textAlign: 'right' }}>
                        {title && (
                            <div style={{ fontSize: '14pt', fontWeight: '700', color: '#5b21b6', fontFamily: 'Arial, sans-serif', lineHeight: '1.2' }}>
                                {title}
                            </div>
                        )}
                        <div style={{ fontSize: '8pt', color: '#6b7280', fontFamily: 'Arial, sans-serif', marginTop: '2px' }}>
                            Contemporary Health Center | Fort Myers, FL
                        </div>
                    </div>
                </div>
            )}

            {/* Title fallback if no logo */}
            {!showLogo && title && (
                <div style={{ fontSize: '14pt', fontWeight: '700', color: '#5b21b6', textAlign: 'center', marginBottom: '14px', paddingBottom: '8px', borderBottom: '2px solid #5b21b6', fontFamily: 'Arial, sans-serif' }}>
                    {title}
                </div>
            )}

            {/* Content */}
            <div style={{ color: '#1a1a1a' }}>
                {children}
            </div>

            {/* Footer */}
            <div style={{ marginTop: '14px', borderTop: '1px solid #e5e7eb', paddingTop: '5px', fontSize: '7.5pt', color: '#9ca3af', textAlign: 'center', fontFamily: 'Arial, sans-serif' }}>
                Contemporary Health Center &nbsp;|&nbsp; 6150 Diamond Center Court #400, Fort Myers, FL 33912 &nbsp;|&nbsp; Ph: 239-561-9191 &nbsp;|&nbsp; Fx: 239-561-9188
            </div>
        </div>
    );
}
