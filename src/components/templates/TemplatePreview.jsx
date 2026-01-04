import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

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
                    <Card className="bg-blue-50 border-blue-200">
                        <CardContent className="pt-4">
                            <p className="text-sm text-blue-900">{template.description}</p>
                        </CardContent>
                    </Card>
                )}

                <div className="border rounded-lg p-6 bg-white">
                    <div 
                        className="prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ __html: template.content }}
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
}