import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer, X } from "lucide-react";

export default function DocumentPrintDialog({ open, onOpenChange, document: doc }) {
    if (!doc) return null;

    const iframeRef = React.useRef(null);
    const [isLoaded, setIsLoaded] = React.useState(false);

    React.useEffect(() => {
        if (open) {
            setIsLoaded(false);
        }
    }, [open]);

    const handlePrint = () => {
        if (isPDF) {
            // Create hidden iframe to print PDF directly
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
                    printFrame.contentWindow.focus();
                    printFrame.contentWindow.print();
                    setTimeout(() => document.body.removeChild(printFrame), 1000);
                } catch (e) {
                    console.error('Print error:', e);
                    document.body.removeChild(printFrame);
                }
            };
            
            printFrame.src = doc.document_url;
        } else if (isImage) {
            // Print current window with image
            window.print();
        } else {
            window.print();
        }
    };

    const isPDF = doc.file_type?.includes('pdf') || doc.document_url?.endsWith('.pdf');
    const isImage = doc.file_type?.includes('image') || doc.document_url?.match(/\.(jpg|jpeg|png)$/i);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh]">
                <DialogHeader>
                    <div className="flex items-center justify-between">
                        <DialogTitle>{doc.document_name}</DialogTitle>
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
                    {isImage ? (
                        <img 
                            src={doc.document_url} 
                            alt={doc.document_name}
                            className="w-full h-auto rounded-lg"
                            onLoad={() => setIsLoaded(true)}
                        />
                    ) : (
                        <iframe 
                            ref={iframeRef}
                            src={`https://docs.google.com/viewer?url=${encodeURIComponent(doc.document_url)}&embedded=true`}
                            width="100%" 
                            height="600px"
                            className="rounded-lg border-0 bg-white"
                            onLoad={() => setIsLoaded(true)}
                            title={doc.document_name}
                        />
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}