import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Clock, User, FileText, RotateCcw } from "lucide-react";
import { format } from "date-fns";

export default function EducationVersionHistory({ open, onOpenChange, topicId, onRestore }) {
    const { data: allTopics = [], isLoading } = useQuery({
        queryKey: ['educationTopics'],
        queryFn: () => base44.entities.EducationTopic.list(),
        enabled: open
    });

    // Find current topic and all its versions
    const currentTopic = allTopics.find(t => t.id === topicId);
    
    // Get version history by following parent_id chain
    const versions = React.useMemo(() => {
        if (!currentTopic) return [];
        
        const versionList = [currentTopic];
        let currentId = currentTopic.parent_id;
        
        // Follow the parent chain to get all previous versions
        while (currentId) {
            const parent = allTopics.find(t => t.id === currentId);
            if (parent) {
                versionList.push(parent);
                currentId = parent.parent_id;
            } else {
                break;
            }
        }
        
        return versionList.sort((a, b) => 
            new Date(b.updated_date || b.created_date) - new Date(a.updated_date || a.created_date)
        );
    }, [allTopics, currentTopic, topicId]);

    const handleRestore = (version) => {
        if (onRestore) {
            onRestore(version);
        }
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[80vh]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Clock className="w-5 h-5 text-purple-600" />
                        Version History
                    </DialogTitle>
                </DialogHeader>

                {isLoading ? (
                    <div className="text-center py-8 text-gray-500">Loading versions...</div>
                ) : versions.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">No version history available</div>
                ) : (
                    <ScrollArea className="h-[500px] pr-4">
                        <div className="space-y-4">
                            {versions.map((version, index) => (
                                <div
                                    key={version.id}
                                    className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                {index === 0 && (
                                                    <Badge className="bg-green-100 text-green-800">
                                                        Current Version
                                                    </Badge>
                                                )}
                                                {version.version && (
                                                    <Badge variant="outline">
                                                        v{version.version}
                                                    </Badge>
                                                )}
                                                <span className="text-sm text-gray-500">
                                                    {format(new Date(version.updated_date || version.created_date), 'MMM d, yyyy h:mm a')}
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                                                <User className="w-4 h-4" />
                                                <span>{version.created_by || 'Unknown'}</span>
                                            </div>

                                            {version.change_summary && (
                                                <div className="flex items-start gap-2 text-sm text-gray-700 bg-blue-50 p-2 rounded">
                                                    <FileText className="w-4 h-4 mt-0.5 text-blue-600" />
                                                    <span>{version.change_summary}</span>
                                                </div>
                                            )}

                                            <div className="mt-3 text-sm text-gray-600">
                                                <div className="font-medium mb-1">Content Preview:</div>
                                                <div className="bg-gray-50 p-2 rounded text-xs line-clamp-3">
                                                    {version.content?.replace(/<[^>]*>/g, '').substring(0, 200)}...
                                                </div>
                                            </div>
                                        </div>

                                        {index !== 0 && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleRestore(version)}
                                                className="ml-4"
                                            >
                                                <RotateCcw className="w-4 h-4 mr-2" />
                                                Restore
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                )}
            </DialogContent>
        </Dialog>
    );
}