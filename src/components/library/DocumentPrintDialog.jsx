import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer, X } from "lucide-react";

export default function DocumentPrintDialog({ open, onOpenChange, document }) {
    if (!document) return null;

    const handlePrint = () => {
        const printWindow = window.open('', '_blank');
        if (document.file_type?.includes('pdf')) {
            printWindow.document.write(`
                <html>
                    <head><title>Print ${document.document_name}</title></head>
                    <body style="margin:0">
                        <embed src="${document.document_url}" width="100%" height="100%" type="application/pdf" />
                        <script>
                            window.onload = function() { window.print(); }
                        </script>
                    </body>
                </html>
            `);
        } else {
            printWindow.document.write(`
                <html>
                    <head>
                        <title>Print ${document.document_name}</title>
                        <style>
                            body { margin: 0; display: flex; justify-content: center; align-items: center; }
                            img { max-width: 100%; height: auto; }
                        </style>
                    </head>
                    <body>
                        <img src="${document.document_url}" onload="window.print()" />
                    </body>
                </html>
            `);
        }
        printWindow.document.close();
    };

    const isPDF = document.file_type?.includes('pdf');
    const isImage = document.file_type?.includes('image') || document.document_url?.match(/\.(jpg|jpeg|png)$/i);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh]">
                <DialogHeader>
                    <div className="flex items-center justify-between">
                        <DialogTitle>{document.document_name}</DialogTitle>
                        <div className="flex gap-2">
                            <Button onClick={handlePrint} size="sm" className="text-black">
                                <Printer className="w-4 h-4 mr-2" />
                                Print
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </DialogHeader>
                <div className="overflow-auto max-h-[calc(90vh-120px)]">
                    {isPDF ? (
                        <embed 
                            src={document.document_url} 
                            type="application/pdf" 
                            width="100%" 
                            height="600px"
                            className="rounded-lg"
                        />
                    ) : isImage ? (
                        <img 
                            src={document.document_url} 
                            alt={document.document_name}
                            className="w-full h-auto rounded-lg"
                        />
                    ) : (
                        <div className="text-center py-12">
                            <p className="text-gray-500">Preview not available</p>
                            <Button 
                                onClick={() => window.open(document.document_url, '_blank')}
                                variant="outline"
                                className="mt-4"
                            >
                                Open in New Tab
                            </Button>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}