import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer, X } from "lucide-react";

export default function DocumentPrintDialog({ open, onOpenChange, document }) {
    const iframeRef = React.useRef(null);
    const [isLoaded, setIsLoaded] = React.useState(false);

    if (!document) return null;

    React.useEffect(() => {
        if (open) {
            setIsLoaded(false);
        }
    }, [open]);

    const handlePrint = () => {
        if (!isLoaded) return;
        
        if (isPDF && iframeRef.current) {
            try {
                iframeRef.current.contentWindow.print();
            } catch (e) {
                window.print();
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
                <div className="overflow-auto max-h-[calc(90vh-120px)] relative">
                    {!isLoaded && (
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-50 rounded-lg">
                            <div className="text-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-2"></div>
                                <p className="text-sm text-gray-500">Loading preview...</p>
                            </div>
                        </div>
                    )}
                    {isPDF ? (
                        <iframe 
                            ref={iframeRef}
                            src={document.document_url + '#view=FitH'} 
                            width="100%" 
                            height="600px"
                            className="rounded-lg border-0"
                            onLoad={() => setIsLoaded(true)}
                        />
                    ) : isImage ? (
                        <img 
                            src={document.document_url} 
                            alt={document.document_name}
                            className="w-full h-auto rounded-lg"
                            onLoad={() => setIsLoaded(true)}
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