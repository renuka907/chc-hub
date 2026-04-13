import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

const CHC_LOGO = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/695939a556b8082002a35a68/1e5584b38_goldwithlettersContemporary-health-center-logo-retina.png";

export default function TemplatePreview({ open, onOpenChange, template }) {
    if (!template) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        {template.template_name}
                        {template.category && (
                            <Badge variant="secondary">{template.category}</Badge>
                        )}
                    </DialogTitle>
                </DialogHeader>

                {template.description && (
                    <Card className="bg-purple-50 border-purple-200">
                        <CardContent className="pt-4">
                            <p className="text-sm text-purple-900">{template.description}</p>
                        </CardContent>
                    </Card>
                )}

                <div className="border rounded-lg bg-white" style={{ fontFamily: 'Arial, sans-serif', fontSize: '10pt', lineHeight: '1.4', color: '#1a1a1a', padding: '0.4in 0.55in' }}>
                    {/* Header: logo left, title right, purple border */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '2px solid #5b21b6', paddingBottom: '8px', marginBottom: '14px' }}>
                        <img src={CHC_LOGO} alt="CHC Logo" style={{ height: '44px' }} />
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '14pt', fontWeight: '700', color: '#5b21b6', fontFamily: 'Arial, sans-serif', lineHeight: '1.2' }}>
                                {template.template_name}
                            </div>
                            <div style={{ fontSize: '8pt', color: '#6b7280', fontFamily: 'Arial, sans-serif', marginTop: '2px' }}>
                                Contemporary Health Center
                            </div>
                        </div>
                    </div>

                    <style>{`
                        .bellafill-preview h1, .bellafill-preview h2, .bellafill-preview h3 {
                            font-family: Arial, sans-serif;
                            font-weight: 700;
                            color: #5b21b6;
                            text-transform: uppercase;
                            letter-spacing: 0.5px;
                            border-bottom: 1px solid #ede9fe;
                            padding-bottom: 3px;
                            margin: 12px 0 7px;
                        }
                        .bellafill-preview h1 { font-size: 11pt; }
                        .bellafill-preview h2 { font-size: 10pt; }
                        .bellafill-preview h3 { font-size: 9pt; }
                        .bellafill-preview p { margin-bottom: 6px; }
                        .bellafill-preview ul, .bellafill-preview ol { margin: 3px 0 7px 18px; }
                        .bellafill-preview li { margin-bottom: 3px; }
                        .bellafill-preview strong { font-weight: 700; }
                        .bellafill-preview table { width: 100%; border-collapse: collapse; margin: 4pt 0; }
                        .bellafill-preview td, .bellafill-preview th { border: 1px solid #ede9fe; padding: 3pt 6pt; }
                    `}</style>

                    <div
                        className="bellafill-preview"
                        dangerouslySetInnerHTML={{ __html: template.content }}
                    />

                    {/* Footer */}
                    <div style={{ marginTop: '14px', borderTop: '1px solid #e5e7eb', paddingTop: '5px', fontSize: '7.5pt', color: '#9ca3af', textAlign: 'center', fontFamily: 'Arial, sans-serif' }}>
                        Contemporary Health Center &nbsp;|&nbsp; Template Preview
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
