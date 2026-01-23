import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer, X } from "lucide-react";

export default function DocumentPrintDialog({ open, onOpenChange, document }) {
    if (!document) return null;

    const iframeRef = React.useRef(null);
    const [isLoaded, setIsLoaded] = React.useState(false);

    React.useEffect(() => {
        if (open) {
            setIsLoaded(false);
        }
    }, [open]);

    const handlePrint = () => {
        if (isPDF) {
            // Open with Google Viewer's print interface which respects orientation
            const printUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(document.document_url)}&embedded=true&print=true`;
            window.open(printUrl, '_blank');
        } else if (isImage) {
            // For images, open in new window and print
            const printWindow = window.open(document.document_url, '_blank');
            if (printWindow) {
                printWindow.onload = () => {
                    printWindow.print();
                };
            }
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
                            src={document.document_url} 
                            alt={document.document_name}
                            className="w-full h-auto rounded-lg"
                            onLoad={() => setIsLoaded(true)}
                        />
                    ) : (
                        <iframe 
                            ref={iframeRef}
                            src={`https://docs.google.com/viewer?url=${encodeURIComponent(document.document_url)}&embedded=true`}
                            width="100%" 
                            height="600px"
                            className="rounded-lg border-0 bg-white"
                            onLoad={() => setIsLoaded(true)}
                            title={document.document_name}
                        />
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}