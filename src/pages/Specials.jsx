import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, X, Loader2, FileUp, Archive, Search } from "lucide-react";
import { format } from "date-fns";

export default function SpecialsPage() {
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [formData, setFormData] = useState({
        title: "",
        date_from: "",
        date_to: "",
    });
    const [file, setFile] = useState(null);
    const queryClient = useQueryClient();

    const { data: specials = [], isLoading } = useQuery({
        queryKey: ["specials"],
        queryFn: () => base44.entities.Special.list("-updated_date"),
    });

    const archiveMutation = useMutation({
        mutationFn: (special) => base44.entities.Special.update(special.id, { is_archived: !special.is_archived }),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["specials"] }),
    });

    const deleteMutation = useMutation({
        mutationFn: (id) => base44.entities.Special.delete(id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["specials"] }),
    });

    const handleFileSelect = (e) => {
        const selectedFile = e.target.files?.[0];
        if (!selectedFile) return;

        const validTypes = ["application/pdf", "image/jpeg", "image/jpg"];
        if (!validTypes.includes(selectedFile.type)) {
            setError("Please upload a PDF or JPG file");
            return;
        }

        setError("");
        setFile(selectedFile);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!file || !formData.date_from || !formData.date_to) {
            setError("Please fill in all required fields and select a file");
            return;
        }

        if (new Date(formData.date_from) > new Date(formData.date_to)) {
            setError("Start date must be before end date");
            return;
        }

        setUploading(true);
        setError("");

        try {
            const { file_url } = await base44.integrations.Core.UploadFile({ file });
            await base44.entities.Special.create({
                title: formData.title || file.name,
                file_url,
                date_from: formData.date_from,
                date_to: formData.date_to,
            });
            setSuccess("Special added successfully!");
            setFormData({ title: "", date_from: "", date_to: "" });
            setFile(null);
            queryClient.invalidateQueries({ queryKey: ["specials"] });
            setTimeout(() => setSuccess(""), 3000);
        } catch (err) {
            setError("Failed to add special. Please try again.");
            console.error("Error:", err);
        } finally {
            setUploading(false);
        }
    };

    const filteredSpecials = specials.filter(
        (special) =>
            !special.is_archived &&
            (special.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                special.file_url.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const archivedSpecials = specials.filter((special) => special.is_archived);

    return (
        <div className="max-w-2xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Current Specials</h1>
                <p className="text-gray-600">Upload current specials as PDF or JPG</p>
            </div>

            <Card className="border-2 border-dashed border-purple-300">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileUp className="w-5 h-5 text-purple-600" />
                        Upload File
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex flex-col items-center justify-center p-8 bg-purple-50 rounded-lg border-2 border-dashed border-purple-200">
                        <label className="cursor-pointer">
                            <div className="flex flex-col items-center gap-3">
                                <Upload className="w-8 h-8 text-purple-600" />
                                <div className="text-center">
                                    <p className="font-semibold text-gray-900">Click to upload</p>
                                    <p className="text-sm text-gray-600">or drag and drop</p>
                                    <p className="text-xs text-gray-500 mt-1">PDF or JPG files</p>
                                </div>
                            </div>
                            <input
                                type="file"
                                accept=".pdf,.jpg,.jpeg"
                                onChange={handleFileUpload}
                                disabled={uploading}
                                className="hidden"
                            />
                        </label>
                    </div>

                    {error && (
                        <div className="p-4 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="p-4 bg-green-50 border border-green-200 rounded text-green-700 text-sm">
                            {success}
                        </div>
                    )}

                    {uploading && (
                        <div className="flex items-center justify-center gap-2 text-purple-600">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Uploading...</span>
                        </div>
                    )}

                    {uploadedFile && (
                        <div className="p-4 bg-blue-50 border border-blue-200 rounded">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="font-semibold text-blue-900">{uploadedFile.name}</p>
                                    <p className="text-sm text-blue-700 mt-1">Uploaded: {uploadedFile.uploadedAt}</p>
                                    <a
                                        href={uploadedFile.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sm text-blue-600 hover:underline mt-2 inline-block"
                                    >
                                        View file →
                                    </a>
                                </div>
                                <button
                                    onClick={handleClearFile}
                                    className="text-blue-600 hover:text-blue-900"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}