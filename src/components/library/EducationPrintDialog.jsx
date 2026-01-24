import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer, X, Pencil, Settings, Save, Download, Calendar } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import EducationTopicForm from "@/components/EducationTopicForm";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import jsPDF from "jspdf";

export default function EducationPrintDialog({ open, onOpenChange, topic }) {
    if (!topic) return null;

    const iframeRef = React.useRef(null);
    const [isLoaded, setIsLoaded] = React.useState(false);
    const [showEditForm, setShowEditForm] = React.useState(false);
    const [printTemplate, setPrintTemplate] = React.useState('detailed');
    const [showCustomize, setShowCustomize] = React.useState(false);
    const [customFooter, setCustomFooter] = React.useState('');
    const [customHeader, setCustomHeader] = React.useState('');
    const [templateName, setTemplateName] = React.useState('');
    const [selectedTemplate, setSelectedTemplate] = React.useState('');
    const [showSchedule, setShowSchedule] = React.useState(false);
    const [scheduleDate, setScheduleDate] = React.useState('');
    const queryClient = useQueryClient();

    const { data: savedTemplates = [] } = useQuery({
        queryKey: ['print-templates'],
        queryFn: () => base44.entities.PrintTemplate.list()
    });

    React.useEffect(() => {
        if (open) {
            setIsLoaded(false);
            // Load default template if exists
            const defaultTemplate = savedTemplates.find(t => t.is_default);
            if (defaultTemplate) {
                loadTemplate(defaultTemplate);
            }
        }
    }, [open, savedTemplates]);

    const loadTemplate = (template) => {
        setPrintTemplate(template.template_type);
        setCustomHeader(template.custom_header || '');
        setCustomFooter(template.custom_footer || '');
        setSelectedTemplate(template.id);
    };

    const saveTemplate = async () => {
        if (!templateName) {
            alert('Please enter a template name');
            return;
        }
        try {
            await base44.entities.PrintTemplate.create({
                template_name: templateName,
                template_type: printTemplate,
                custom_header: customHeader,
                custom_footer: customFooter,
                is_default: savedTemplates.length === 0
            });
            queryClient.invalidateQueries({ queryKey: ['print-templates'] });
            setTemplateName('');
            alert('Template saved successfully!');
        } catch (error) {
            alert('Failed to save template');
        }
    };

    const handleExportPDF = async () => {
        try {
            const printContent = generatePrintHTML();
            const pdf = new jsPDF('p', 'pt', 'letter');
            
            // Create a temporary div to render HTML
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = printContent;
            tempDiv.style.width = '612px'; // Letter width in pts
            document.body.appendChild(tempDiv);
            
            await pdf.html(tempDiv, {
                callback: function(doc) {
                    doc.save(`${topic.title}.pdf`);
                    document.body.removeChild(tempDiv);
                },
                x: 40,
                y: 40,
                width: 532,
                windowWidth: 612
            });
        } catch (error) {
            alert('Failed to export PDF. Using alternative method...');
            // Fallback: trigger print dialog
            handlePrint();
        }
    };

    const scheduleReminder = async () => {
        if (!scheduleDate) {
            alert('Please select a date');
            return;
        }
        try {
            await base44.entities.Reminder.create({
                title: `Print: ${topic.title}`,
                description: `Scheduled print for education topic: ${topic.title}`,
                due_date: new Date(scheduleDate).toISOString(),
                priority: 'medium'
            });
            alert('Print reminder scheduled successfully!');
            setShowSchedule(false);
            setScheduleDate('');
        } catch (error) {
            alert('Failed to schedule reminder');
        }
    };

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
        const isSimple = printTemplate === 'simple';
        const headerText = customHeader || topic.header || '';
        const footerText = customFooter || `${topic.title} | Contemporary Health Center | Page`;
        
        return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>${topic.title}</title>
    <style>
        @page {
            margin: ${isSimple ? '0.75in' : '0.5in 0.5in 0.75in 0.5in'};
            size: letter;
        }
        
        @page {
            @bottom-center {
                content: "${footerText} " counter(page);
                font-size: 9pt;
                color: #666;
            }
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
            margin-top: 12pt;
            margin-bottom: 8pt;
            page-break-after: avoid;
        }

        h3 {
            font-size: 12pt;
            font-weight: bold;
            margin-top: 10pt;
            margin-bottom: 6pt;
            page-break-after: avoid;
        }

        p {
            margin-bottom: 8pt;
            text-align: left;
            line-height: 1.6;
        }

        ul, ol {
            margin: 10pt 0;
            padding-left: 30pt;
            line-height: 1.6;
        }

        li {
            margin-bottom: 6pt;
            line-height: 1.5;
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

        /* Preserve rich text editor formatting */
        .content-section {
            background: white !important;
            border: none !important;
        }

        .content-section * {
            color: inherit !important;
            background-color: inherit !important;
        }

        .content-section [style*="color"] {
            color: revert !important;
        }

        .content-section [style*="background"] {
            background-color: revert !important;
        }

        .content-section [style*="margin"] {
            margin: revert !important;
        }

        .content-section [style*="padding"] {
            padding: revert !important;
        }

        .content-section [style*="line-height"] {
            line-height: revert !important;
        }
    </style>
</head>
<body>
    ${headerText ? `<div class="page-header">${headerText}</div>` : ''}

    <div class="content-wrapper">
        <div class="print-title">
            Patient Education: ${topic.title}
        </div>

    ${!isSimple ? `
    <div class="print-logo">
        <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/695939a556b8082002a35a68/1e5584b38_goldwithlettersContemporary-health-center-logo-retina.png" alt="Contemporary Health Center" />
    </div>
    ` : ''}

    ${topic.image_url ? `
    <div class="print-section" style="text-align: center;">
        <img src="${topic.image_url}" alt="${topic.title}" style="max-width: 100%; max-height: 400px; margin: 0 auto; object-fit: contain;" />
    </div>
    ` : ''}

    ${topic.summary ? `
    <div class="print-section compact" style="background: #ecfdf5; border-color: #10b981;">
        <h2 style="margin-top: 4pt; margin-bottom: 6pt;">Summary</h2>
        <p style="font-weight: 500; margin-bottom: 4pt;">${topic.summary}</p>
    </div>
    ` : ''}
    
    <div class="print-section content-section">
        ${topic.content || ''}
    </div>
    
    ${!isSimple && topic.medical_references ? `
    <div class="print-section">
        <h2>Medical References</h2>
        <p style="font-size: 10pt; white-space: pre-wrap;">${topic.medical_references}</p>
    </div>
    ` : ''}

    ${!isSimple ? `
    <div class="print-section" style="background: #f1f5f9; border-color: #475569; border-width: 2px;">
        <p style="font-style: italic; font-size: 10pt;">
            <strong>Disclaimer:</strong> This information is for educational purposes only and should not replace professional medical advice. Please consult with a healthcare provider for personalized medical guidance.
        </p>
    </div>
    ` : ''}
    
    <div class="print-section compact" style="background: #f1f5f9; border-color: #475569; border-width: 2px; padding: 4pt; margin: 2pt 0;">
        <p style="font-weight: bold; font-size: 13pt; margin-bottom: 2pt; margin-top: 0; line-height: 1; text-transform: uppercase;">
            Questions or Want to Learn More?
        </p>
        <p style="margin-bottom: 2pt; margin-top: 0; line-height: 1.2;">
            Our medical team is here to help answer any questions about this topic or discuss treatment options that may be right for you.
        </p>
        <div style="border-top: 1px solid #cbd5e1; padding-top: 2pt; margin-top: 1pt;">
            <p style="font-weight: 600; margin: 0; line-height: 1.3;">📞 Phone: 239-561-9191 (call or text)</p>
            <p style="font-weight: 600; margin: 0; line-height: 1.3;">📧 Email: office@contemporaryhealthcenter.com</p>
            <p style="font-weight: 600; margin: 0; line-height: 1.3;">🌐 Web: contemporaryhealthcenter.com</p>
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
                        <div className="flex gap-2 flex-wrap">
                            <Button 
                                onClick={() => setShowEditForm(true)} 
                                size="sm" 
                                variant="outline"
                            >
                                <Pencil className="w-4 h-4 mr-2" />
                                Edit
                            </Button>
                            <Button 
                                onClick={() => setShowCustomize(!showCustomize)} 
                                size="sm" 
                                variant="outline"
                            >
                                <Settings className="w-4 h-4 mr-2" />
                                Customize
                            </Button>
                            <Button 
                                onClick={handleExportPDF} 
                                size="sm" 
                                variant="outline"
                                disabled={!isLoaded}
                            >
                                <Download className="w-4 h-4 mr-2" />
                                PDF
                            </Button>
                            <Button 
                                onClick={() => setShowSchedule(!showSchedule)} 
                                size="sm" 
                                variant="outline"
                            >
                                <Calendar className="w-4 h-4 mr-2" />
                                Schedule
                            </Button>
                            <Button 
                                onClick={handlePrint} 
                                size="sm" 
                                className="text-black"
                                disabled={!isLoaded}
                            >
                                <Printer className="w-4 h-4 mr-2" />
                                Print
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                    </DialogHeader>

                    {showCustomize && (
                        <div className="border rounded-lg p-4 space-y-4 bg-gray-50">
                            <div className="space-y-2">
                                <Label>Load Saved Template</Label>
                                <Select value={selectedTemplate} onValueChange={(id) => {
                                    const template = savedTemplates.find(t => t.id === id);
                                    if (template) loadTemplate(template);
                                }}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Choose a template..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {savedTemplates.map(template => (
                                            <SelectItem key={template.id} value={template.id}>
                                                {template.template_name} {template.is_default ? '(Default)' : ''}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Print Template</Label>
                                <Select value={printTemplate} onValueChange={setPrintTemplate}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="detailed">Detailed (with logo, references, disclaimer)</SelectItem>
                                        <SelectItem value="simple">Simple (content only)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Custom Header Text (optional)</Label>
                                <Input
                                    value={customHeader}
                                    onChange={(e) => setCustomHeader(e.target.value)}
                                    placeholder="Leave blank to use topic header"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Custom Footer Text (optional)</Label>
                                <Textarea
                                    value={customFooter}
                                    onChange={(e) => setCustomFooter(e.target.value)}
                                    placeholder="Leave blank for default footer"
                                    rows={2}
                                />
                                <p className="text-xs text-gray-500">Page number will be added automatically</p>
                            </div>

                            <div className="border-t pt-4 space-y-2">
                                <Label>Save as Template</Label>
                                <div className="flex gap-2">
                                    <Input
                                        value={templateName}
                                        onChange={(e) => setTemplateName(e.target.value)}
                                        placeholder="Template name"
                                    />
                                    <Button onClick={saveTemplate} size="sm">
                                        <Save className="w-4 h-4 mr-2" />
                                        Save
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}

                    {showSchedule && (
                        <div className="border rounded-lg p-4 space-y-4 bg-blue-50">
                            <div className="space-y-2">
                                <Label>Schedule Print Reminder</Label>
                                <Input
                                    type="datetime-local"
                                    value={scheduleDate}
                                    onChange={(e) => setScheduleDate(e.target.value)}
                                />
                            </div>
                            <Button onClick={scheduleReminder} size="sm" className="w-full">
                                <Calendar className="w-4 h-4 mr-2" />
                                Schedule Reminder
                            </Button>
                        </div>
                    )}

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

                <EducationTopicForm
                open={showEditForm}
                onOpenChange={setShowEditForm}
                editTopic={topic}
                onSuccess={() => {
                    queryClient.invalidateQueries({ queryKey: ['education-topics'] });
                    setShowEditForm(false);
                }}
                />
                </Dialog>
                );
                }