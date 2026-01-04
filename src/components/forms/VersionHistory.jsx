import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Eye } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

export default function VersionHistory({ open, onOpenChange, currentItem, entityName, onViewVersion }) {
    const { data: versions = [] } = useQuery({
        queryKey: ['versions', entityName, currentItem?.id],
        queryFn: async () => {
            if (!currentItem) return [];
            
            // Fetch all items and filter those with this parent_id or this item itself
            const allItems = await base44.entities[entityName].list('-created_date', 500);
            const versionChain = [];
            
            // Add current version
            versionChain.push(currentItem);
            
            // Find all previous versions (items that have this as parent, or share the same parent)
            let parentId = currentItem.parent_id;
            while (parentId) {
                const parent = allItems.find(item => item.id === parentId);
                if (parent) {
                    versionChain.push(parent);
                    parentId = parent.parent_id;
                } else {
                    break;
                }
            }
            
            // Find all newer versions (items that have current as parent)
            const findChildren = (id) => {
                const children = allItems.filter(item => item.parent_id === id);
                children.forEach(child => {
                    if (!versionChain.find(v => v.id === child.id)) {
                        versionChain.unshift(child);
                        findChildren(child.id);
                    }
                });
            };
            findChildren(currentItem.id);
            
            return versionChain;
        },
        enabled: open && !!currentItem,
    });

    if (!currentItem) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Version History</DialogTitle>
                </DialogHeader>
                
                <div className="space-y-4 mt-4">
                    {versions.length === 0 ? (
                        <p className="text-center text-gray-500 py-8">No version history available</p>
                    ) : (
                        versions.map((version, index) => (
                            <Card key={version.id} className={version.id === currentItem.id ? "border-2 border-blue-500" : ""}>
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <CardTitle className="text-base flex items-center gap-2">
                                                {version.version ? `Version ${version.version}` : `v${versions.length - index}`}
                                                {version.id === currentItem.id && (
                                                    <Badge className="bg-blue-600">Current</Badge>
                                                )}
                                            </CardTitle>
                                            <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                                                <Clock className="w-4 h-4" />
                                                {new Date(version.created_date).toLocaleDateString('en-US', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </div>
                                            <p className="text-sm text-gray-600 mt-1">
                                                {version.effective_date && `Effective: ${new Date(version.effective_date).toLocaleDateString()}`}
                                            </p>
                                        </div>
                                        {version.id !== currentItem.id && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => {
                                                    onViewVersion(version);
                                                    onOpenChange(false);
                                                }}
                                            >
                                                <Eye className="w-4 h-4 mr-2" />
                                                View
                                            </Button>
                                        )}
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-sm text-gray-600">
                                        {version.form_name || version.procedure_name}
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}