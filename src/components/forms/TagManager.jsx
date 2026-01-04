import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { X, Plus } from "lucide-react";

export default function TagManager({ open, onOpenChange, currentTags = [], onSave }) {
    const [tags, setTags] = useState(() => {
        try {
            return Array.isArray(currentTags) ? currentTags : (currentTags ? JSON.parse(currentTags) : []);
        } catch {
            return [];
        }
    });
    const [newTag, setNewTag] = useState("");

    const addTag = () => {
        if (newTag.trim() && !tags.includes(newTag.trim())) {
            setTags([...tags, newTag.trim()]);
            setNewTag("");
        }
    };

    const removeTag = (tagToRemove) => {
        setTags(tags.filter(tag => tag !== tagToRemove));
    };

    const handleSave = () => {
        onSave(JSON.stringify(tags));
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Manage Tags</DialogTitle>
                </DialogHeader>
                
                <div className="space-y-4 mt-4">
                    <div className="flex gap-2">
                        <Input
                            value={newTag}
                            onChange={(e) => setNewTag(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && addTag()}
                            placeholder="Add a tag..."
                            className="flex-1"
                        />
                        <Button onClick={addTag} size="sm">
                            <Plus className="w-4 h-4" />
                        </Button>
                    </div>

                    <div className="flex flex-wrap gap-2 min-h-[100px] p-4 border rounded-lg bg-gray-50">
                        {tags.length === 0 ? (
                            <p className="text-sm text-gray-500">No tags yet</p>
                        ) : (
                            tags.map(tag => (
                                <Badge key={tag} variant="secondary" className="flex items-center gap-1 px-3 py-1">
                                    {tag}
                                    <button
                                        onClick={() => removeTag(tag)}
                                        className="ml-1 hover:text-red-600"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </Badge>
                            ))
                        )}
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave}>
                        Save Tags
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}