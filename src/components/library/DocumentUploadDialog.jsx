import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload } from "lucide-react";

export default function DocumentUploadDialog({ open, onOpenChange, onSuccess }) {
    const [uploading, setUploading] = useState(false);
    const [form, setForm] = useState({
        document_name: "",
        category: "General",
        description: "",
        files: [],
        tags: ""
    });

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        if (files.length > 0) {
            setForm({ ...form, files, document_name: form.document_name || files[0].name.split('.')[0] });
        }
    };

    const handleSubmit = async () => {
        if (form.files.length === 0 || !form.document_name) return;

        setUploading(true);
        try {
            const uploadedUrls = [];
            
            for (const file of form.files) {
                const { file_url } = await base44.integrations.Core.UploadFile({ file });
                uploadedUrls.push(file_url);
            }
            
            await base44.entities.LibraryDocument.create({
                document_name: form.document_name,
                document_url: uploadedUrls[0],
                file_urls: JSON.stringify(uploadedUrls),
                category: form.category,
                description: form.description,
                file_type: form.files[0].type,
                tags: form.tags ? JSON.stringify(form.tags.split(',').map(t => t.trim()).filter(t => t)) : "[]"
            });

            setForm({ document_name: "", category: "General", description: "", files: [], tags: "" });
            onSuccess();
            onOpenChange(false);
        } catch (error) {
            console.error("Upload failed:", error);
        } finally {
            setUploading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Upload Document</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    <div>
                        <Label>Files (multiple allowed)</Label>
                        <div className="mt-2">
                            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                                <div className="flex flex-col items-center justify-center py-6">
                                    <Upload className="w-8 h-8 text-gray-400 mb-2" />
                                    <p className="text-sm text-gray-600">
                                        {form.files.length > 0 
                                            ? `${form.files.length} file${form.files.length > 1 ? 's' : ''} selected` 
                                            : "Click to select files"}
                                    </p>
                                    <p className="text-xs text-gray-400 mt-1">PDF, JPG, PNG supported</p>
                                </div>
                                <input type="file" className="hidden" onChange={handleFileChange} accept=".pdf,.jpg,.jpeg,.png" multiple />
                            </label>
                        </div>
                    </div>
                    <div>
                        <Label>Document Name</Label>
                        <Input
                            value={form.document_name}
                            onChange={(e) => setForm({ ...form, document_name: e.target.value })}
                            placeholder="Enter document name"
                        />
                    </div>
                    <div>
                        <Label>Category</Label>
                        <Select value={form.category} onValueChange={(value) => setForm({ ...form, category: value })}>
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
                        <Label>Description (Optional)</Label>
                        <Textarea
                            value={form.description}
                            onChange={(e) => setForm({ ...form, description: e.target.value })}
                            placeholder="Brief description..."
                        />
                    </div>
                    <div>
                        <Label>Tags (comma-separated)</Label>
                        <Input
                            value={form.tags}
                            onChange={(e) => setForm({ ...form, tags: e.target.value })}
                            placeholder="urgent, policy, training"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button 
                        onClick={handleSubmit} 
                        disabled={form.files.length === 0 || !form.document_name || uploading}
                        className="text-black"
                    >
                        {uploading ? "Uploading..." : "Upload"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}