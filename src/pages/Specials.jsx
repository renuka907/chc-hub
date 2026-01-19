import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, X, Loader2, FileUp } from "lucide-react";

export default function SpecialsPage() {
    const [uploading, setUploading] = useState(false);
    const [uploadedFile, setUploadedFile] = useState(null);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const handleFileUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        const validTypes = ["application/pdf", "image/jpeg", "image/jpg"];
        if (!validTypes.includes(file.type)) {
            setError("Please upload a PDF or JPG file");
            return;
        }

        setError("");
        setSuccess("");
        setUploading(true);

        try {
            const { file_url } = await base44.integrations.Core.UploadFile({ file });
            setUploadedFile({
                name: file.name,
                url: file_url,
                type: file.type,
                uploadedAt: new Date().toLocaleString()
            });
            setSuccess("File uploaded successfully!");
        } catch (err) {
            setError("Failed to upload file. Please try again.");
            console.error("Upload error:", err);
        } finally {
            setUploading(false);
        }
    };

    const handleClearFile = () => {
        setUploadedFile(null);
        setSuccess("");
    };

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