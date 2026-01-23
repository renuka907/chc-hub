import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { base44 } from "@/api/base44Client";

export default function DocumentEditDialog({ open, onOpenChange, document: doc, onSuccess }) {
    const [formData, setFormData] = React.useState({
        document_name: "",
        category: "General",
        description: "",
        tags: ""
    });

    React.useEffect(() => {
        if (doc) {
            setFormData({
                document_name: doc.document_name || "",
                category: doc.category || "General",
                description: doc.description || "",
                tags: doc.tags || ""
            });
        }
    }, [doc]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        try {
            await base44.entities.LibraryDocument.update(doc.id, {
                document_name: formData.document_name,
                category: formData.category,
                description: formData.description,
                tags: formData.tags
            });
            
            onSuccess?.();
            onOpenChange(false);
        } catch (error) {
            console.error("Failed to update document:", error);
            alert("Failed to update document");
        }
    };

    if (!doc) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Edit Document</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <Label htmlFor="document_name">Document Name</Label>
                        <Input
                            id="document_name"
                            value={formData.document_name}
                            onChange={(e) => setFormData({ ...formData, document_name: e.target.value })}
                            required
                        />
                    </div>

                    <div>
                        <Label htmlFor="category">Category</Label>
                        <Select
                            value={formData.category}
                            onValueChange={(value) => setFormData({ ...formData, category: value })}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="General">General</SelectItem>
                                <SelectItem value="Forms">Forms</SelectItem>
                                <SelectItem value="Policies">Policies</SelectItem>
                                <SelectItem value="Training">Training</SelectItem>
                                <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            rows={3}
                        />
                    </div>

                    <div>
                        <Label htmlFor="tags">Tags (comma-separated)</Label>
                        <Input
                            id="tags"
                            value={formData.tags}
                            onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                            placeholder="tag1, tag2, tag3"
                        />
                    </div>

                    <div className="flex gap-2 justify-end">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit">Save Changes</Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}