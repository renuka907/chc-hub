import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { X } from "lucide-react";

export default function PreviewModal({ file, open, onOpenChange }) {
    if (!file) return null;

    const url = file.file_url || file.image_url || "";
    const isPdf = url.toLowerCase().endsWith(".pdf");
    const isImage = url.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)$/i) || url.includes("tempImage");

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh]">
                <DialogHeader>
                    <DialogTitle>{file.title}</DialogTitle>
                </DialogHeader>
                <div className="w-full h-[70vh] bg-gray-100 rounded-lg overflow-auto">
                    {(isImage || (!isPdf && url)) && (
                        <img
                            src={url}
                            alt={file.title}
                            className="w-full h-full object-contain"
                        />
                    )}
                    {isPdf && (
                        <embed
                            src={url}
                            type="application/pdf"
                            width="100%"
                            height="100%"
                        />
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}