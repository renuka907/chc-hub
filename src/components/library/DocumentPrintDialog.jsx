import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer, X } from "lucide-react";

export default function DocumentPrintDialog({ open, onOpenChange, document }) {
    const iframeRef = React.useRef(null);

    if (!document) return null;

    const handlePrint = () => {
        if (iframeRef.current) {
            iframeRef.current.contentWindow.print();
        } else {
            window.print();
        }
    };

    const isPDF = document.file_type?.includes('pdf') || document.document_url?.endsWith('.pdf');
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
                        <iframe 
                            ref={iframeRef}
                            src={document.document_url} 
                            width="100%" 
                            height="600px"
                            className="rounded-lg border-0"
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
                                className="mt-4 text-black"
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