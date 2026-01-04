import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Search, Star } from "lucide-react";

export default function TemplateSelector({ open, onOpenChange, templateType, onSelect }) {
    const [searchQuery, setSearchQuery] = useState("");

    const { data: templates = [], isLoading } = useQuery({
        queryKey: ['formTemplates', templateType],
        queryFn: async () => {
            const allTemplates = await base44.entities.FormTemplate.list('-updated_date', 100);
            return allTemplates.filter(t => t.template_type === templateType && t.is_public);
        },
        enabled: open
    });

    const filteredTemplates = templates.filter(template =>
        template.template_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleSelect = async (template) => {
        // Increment usage count
        await base44.entities.FormTemplate.update(template.id, {
            usage_count: (template.usage_count || 0) + 1
        });
        onSelect(template);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Select a Template</DialogTitle>
                </DialogHeader>

                <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search templates..."
                        className="pl-10"
                    />
                </div>

                {isLoading ? (
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
                    </div>
                ) : filteredTemplates.length === 0 ? (
                    <Card className="text-center py-12">
                        <CardContent>
                            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500">No templates found</p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid md:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto">
                        {filteredTemplates.map(template => (
                            <Card 
                                key={template.id} 
                                className="cursor-pointer hover:shadow-lg transition-all hover:border-blue-500"
                                onClick={() => handleSelect(template)}
                            >
                                <CardHeader>
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex gap-2">
                                            {template.category && (
                                                <Badge variant="secondary">{template.category}</Badge>
                                            )}
                                            <Badge variant="outline" className="text-xs">
                                                {template.usage_count || 0} uses
                                            </Badge>
                                        </div>
                                        {template.is_favorite && (
                                            <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                                        )}
                                    </div>
                                    <CardTitle className="text-lg">{template.template_name}</CardTitle>
                                    {template.description && (
                                        <CardDescription className="line-clamp-2">
                                            {template.description}
                                        </CardDescription>
                                    )}
                                </CardHeader>
                            </Card>
                        ))}
                    </div>
                )}

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}