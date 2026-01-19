import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, X, Loader2, FileUp, Archive, Search, Eye } from "lucide-react";
import { format } from "date-fns";
import PreviewModal from "@/components/specials/PreviewModal";

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
        <div className="max-w-4xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Current Specials</h1>
                <p className="text-gray-600">Manage current specials with dates</p>
            </div>

            {/* Add New Special */}
            <Card className="border-2 border-dashed border-purple-300">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileUp className="w-5 h-5 text-purple-600" />
                        Add New Special
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <Label htmlFor="title">Title (Optional)</Label>
                            <Input
                                id="title"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                placeholder="e.g., Summer Sale 2026"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="date_from">Start Date</Label>
                                <Input
                                    id="date_from"
                                    type="date"
                                    value={formData.date_from}
                                    onChange={(e) => setFormData({ ...formData, date_from: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <Label htmlFor="date_to">End Date</Label>
                                <Input
                                    id="date_to"
                                    type="date"
                                    value={formData.date_to}
                                    onChange={(e) => setFormData({ ...formData, date_to: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="file">File (PDF or JPG)</Label>
                            <div className="flex flex-col items-center justify-center p-8 bg-purple-50 rounded-lg border-2 border-dashed border-purple-200">
                                <label className="cursor-pointer w-full">
                                    <div className="flex flex-col items-center gap-3">
                                        <Upload className="w-8 h-8 text-purple-600" />
                                        <div className="text-center">
                                            <p className="font-semibold text-gray-900">
                                                {file ? file.name : "Click to upload"}
                                            </p>
                                            {!file && (
                                                <p className="text-sm text-gray-600">or drag and drop</p>
                                            )}
                                        </div>
                                    </div>
                                    <input
                                        id="file"
                                        type="file"
                                        accept=".pdf,.jpg,.jpeg"
                                        onChange={handleFileSelect}
                                        className="hidden"
                                    />
                                </label>
                            </div>
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

                        <Button
                            type="submit"
                            disabled={uploading || !file}
                            className="w-full bg-purple-600 hover:bg-purple-700"
                        >
                            {uploading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Adding...
                                </>
                            ) : (
                                "Add Special"
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {/* Search and Specials List */}
            <div>
                <div className="flex items-center gap-2 mb-4">
                    <Search className="w-5 h-5 text-gray-400" />
                    <Input
                        placeholder="Search specials..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="flex-1"
                    />
                </div>

                {isLoading ? (
                    <div className="flex justify-center p-8">
                        <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
                    </div>
                ) : (
                    <>
                        {filteredSpecials.length > 0 ? (
                            <div className="grid gap-4">
                                {filteredSpecials.map((special) => (
                                    <Card key={special.id} className="border-l-4 border-l-purple-500">
                                        <CardContent className="p-6">
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="flex-1">
                                                    <p className="font-semibold text-gray-900">
                                                        {special.title}
                                                    </p>
                                                    <p className="text-sm text-gray-600 mt-1">
                                                        {format(new Date(special.date_from), "MMM d, yyyy")} - {format(new Date(special.date_to), "MMM d, yyyy")}
                                                    </p>
                                                </div>
                                                <div className="flex gap-2">
                                                    <a
                                                        href={special.file_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-sm text-purple-600 hover:underline"
                                                    >
                                                        View
                                                    </a>
                                                    <button
                                                        onClick={() => archiveMutation.mutate(special)}
                                                        className="text-sm text-gray-600 hover:text-gray-900"
                                                        title="Archive"
                                                    >
                                                        <Archive className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => deleteMutation.mutate(special.id)}
                                                        className="text-sm text-red-600 hover:text-red-900"
                                                        title="Delete"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        ) : (
                            <Card className="text-center p-8">
                                <p className="text-gray-600">No active specials yet</p>
                            </Card>
                        )}

                        {archivedSpecials.length > 0 && (
                            <div className="mt-8">
                                <h2 className="text-lg font-semibold text-gray-900 mb-4">Archived Specials</h2>
                                <div className="grid gap-4">
                                    {archivedSpecials.map((special) => (
                                        <Card key={special.id} className="border-l-4 border-l-gray-300 opacity-60">
                                            <CardContent className="p-6">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <p className="font-semibold text-gray-700">
                                                            {special.title}
                                                        </p>
                                                        <p className="text-sm text-gray-600 mt-1">
                                                            {format(new Date(special.date_from), "MMM d, yyyy")} - {format(new Date(special.date_to), "MMM d, yyyy")}
                                                        </p>
                                                    </div>
                                                    <button
                                                        onClick={() => archiveMutation.mutate(special)}
                                                        className="text-sm text-gray-600 hover:text-gray-900"
                                                        title="Restore"
                                                    >
                                                        <Archive className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}