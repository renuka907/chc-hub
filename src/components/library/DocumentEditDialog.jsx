import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { base44 } from "@/api/base44Client";

export default function DocumentEditDialog({ open, onOpenChange, document: doc, onSuccess }) {
    const [formData, setFormData] = React.useState({
        document_name: "",
        category: "General",
        description: "",
        tags: ""
    });
    const [additionalFiles, setAdditionalFiles] = React.useState([]);
    const [isUploading, setIsUploading] = React.useState(false);

    React.useEffect(() => {
        if (doc) {
            const tagsArray = doc.tags ? JSON.parse(doc.tags) : [];
            setFormData({
                document_name: doc.document_name || "",
                category: doc.category || "General",
                description: doc.description || "",
                tags: Array.isArray(tagsArray) ? tagsArray.join(', ') : ""
            });
        }
    }, [doc]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsUploading(true);
        
        try {
            const updateData = {
                document_name: formData.document_name,
                category: formData.category,
                description: formData.description,
                tags: formData.tags
            };

            if (additionalFiles.length > 0) {
                const existingUrls = doc.file_urls ? JSON.parse(doc.file_urls) : [doc.document_url];
                
                for (const file of additionalFiles) {
                    const { file_url } = await base44.integrations.Core.UploadFile({ file });
                    existingUrls.push(file_url);
                }
                
                updateData.file_urls = JSON.stringify(existingUrls);
            }

            if (updateData.tags) {
                updateData.tags = JSON.stringify(formData.tags.split(',').map(t => t.trim()).filter(t => t));
            }

            await base44.entities.LibraryDocument.update(doc.id, updateData);
            
            onSuccess?.();
            onOpenChange(false);
            setAdditionalFiles([]);
        } catch (error) {
            console.error("Failed to update document:", error);
            alert("Failed to update document");
        } finally {
            setIsUploading(false);
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

                    <div className="border-t pt-4">
                        <Label>Current Files</Label>
                        <div className="flex flex-wrap gap-2 mt-2">
                            {(doc.file_urls ? JSON.parse(doc.file_urls) : [doc.document_url]).map((url, index) => (
                                <Badge key={index} variant="secondary">
                                    File {index + 1}
                                </Badge>
                            ))}
                        </div>
                    </div>

                    <div>
                        <Label htmlFor="additional_files">Add More Files</Label>
                        <Input
                            id="additional_files"
                            type="file"
                            onChange={(e) => setAdditionalFiles(Array.from(e.target.files))}
                            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                            multiple
                        />
                        {additionalFiles.length > 0 && (
                            <p className="text-sm text-gray-600 mt-2">
                                {additionalFiles.length} new file{additionalFiles.length !== 1 ? 's' : ''} to add
                            </p>
                        )}
                    </div>

                    <div className="flex gap-2 justify-end">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isUploading}>
                            {isUploading ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}