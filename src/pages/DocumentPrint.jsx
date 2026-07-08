import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { entities } from "../api/supabaseHelpers";
import { createPageUrl } from "../utils";
import { ArrowLeft, Printer, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

function safeParse(v, f = []) {
    if (v == null) return f;
    if (typeof v !== "string") return v;
    try { return JSON.parse(v); } catch { return f; }
}

export default function DocumentPrint() {
    const urlParams = new URLSearchParams(window.location.search);
    const docId = urlParams.get('id');
    const autoPrint = urlParams.get('autoprint') === 'true';
    const [selectedFileIndex, setSelectedFileIndex] = useState(0);
    const [blobUrl, setBlobUrl] = useState(null);
    const [pdfPages, setPdfPages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const { data: documents = [] } = useQuery({
        queryKey: ['libraryDocuments'],
        queryFn: () => entities.LibraryDocument.list('-updated_at', 100),
    });

    const doc = documents.find(d => d.id === docId);
    const fileUrls = doc ? (doc.file_urls ? safeParse(doc.file_urls) : [doc.document_url]) : [];
    const currentFileUrl = fileUrls[selectedFileIndex];
    const isPDF = doc?.file_type?.includes('pdf') || currentFileUrl?.endsWith('.pdf');
    const isImage = doc?.file_type?.includes('image') || currentFileUrl?.match(/\.(jpg|jpeg|png|gif|webp)$/i);

    useEffect(() => {
        if (!currentFileUrl) return;
        setLoading(true);
        setError(null);
        setPdfPages([]);
        setBlobUrl(null);

        if (isImage) {
            setBlobUrl(currentFileUrl);
            setLoading(false);
            return;
        }

        if (isPDF) {
            const loadPdfJs = async () => {
                if (!window.pdfjsLib) {
                    const script = document.createElement('script');
                    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
                    script.onload = () => {
                        window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
                        renderPdf();
                    };
                    script.onerror = () => { setError('Failed to load PDF viewer'); setLoading(false); };
                    document.head.appendChild(script);
                } else {
                    renderPdf();
                }
            };

            const renderPdf = async () => {
                try {
                    const response = await fetch(currentFileUrl);
                    const blob = await response.blob();
                    const arrayBuffer = await blob.arrayBuffer();
                    const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
                    const pages = [];
                    
                    for (let i = 1; i <= pdf.numPages; i++) {
                        const page = await pdf.getPage(i);
                        const scale = 2;
                        const viewport = page.getViewport({ scale });
                        const canvas = document.createElement('canvas');
                        canvas.width = viewport.width;
                        canvas.height = viewport.height;
                        await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
                        pages.push(canvas.toDataURL('image/png'));
                    }
                    
                    setPdfPages(pages);
                    setLoading(false);
                } catch (err) {
                    console.error('PDF render error:', err);
                    setError('Could not load document.');
                    setLoading(false);
                }
            };

            loadPdfJs();
        }
    }, [currentFileUrl, isPDF, isImage]);

    useEffect(() => {
        if (!loading && (pdfPages.length > 0 || blobUrl) && autoPrint) {
            setTimeout(() => window.print(), 500);
        }
    }, [loading, pdfPages, blobUrl, autoPrint]);

    const handlePrint = () => {
        // Open a clean window with just the images for printing
        const w = window.open('', '_blank');
        if (!w) { window.print(); return; }
        
        const images = pdfPages.length > 0 ? pdfPages : (blobUrl ? [blobUrl] : []);
        const imgTags = images.map((src, i) => 
            `<div class="page"><img src="${src}" /></div>`
        ).join('');
        
        w.document.write(`<!DOCTYPE html><html><head><title>${doc?.document_name || 'Print'}</title>
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { background: white; }
.page { page-break-after: always; width: 100%; display: flex; justify-content: center; align-items: flex-start; }
.page:last-child { page-break-after: auto; }
.page img { width: 100%; height: auto; display: block; }
@media print {
    @page { margin: 0.35in 0.25in 0.25in 0.25in; size: letter; }
    html, body { width: 100%; height: auto; background: white; overflow: visible; }
    .page {
        break-after: page;
        page-break-after: always;
        width: 100%;
        height: auto;
        max-height: 10.4in;
        display: flex;
        justify-content: center;
        align-items: flex-start;
        overflow: hidden;
        margin: 0;
        padding: 0;
    }
    .page:last-child { break-after: auto; page-break-after: auto; }
    .page img {
        display: block;
        max-width: 100%;
        max-height: 10.4in;
        width: auto;
        height: auto;
        object-fit: contain;
    }
}
</style></head><body>${imgTags}
<script>
window.onload = function() { 
    setTimeout(function() { window.print(); window.close(); }, 300); 
};
</script></body></html>`);
        w.document.close();
    };

    if (!doc) {
        return <div className="flex items-center justify-center py-20"><div className="animate-pulse text-gray-400 text-lg">Loading document...</div></div>;
    }

    return (
        <div className="max-w-5xl mx-auto">
            {/* Action Bar */}
            <div className="flex items-center justify-between mb-4">
                <Link to={createPageUrl("Library")}>
                    <Button variant="outline" size="sm" className="gap-2">
                        <ArrowLeft className="w-4 h-4" /> Back to Library
                    </Button>
                </Link>
                <div className="flex gap-2 items-center">
                    <h2 className="text-lg font-bold text-gray-800 hidden sm:block">{doc.document_name}</h2>
                    <Button
                        size="sm"
                        onClick={handlePrint}
                        disabled={loading}
                        className="bg-blue-600 hover:bg-blue-700 text-white gap-2 text-base px-5 py-2.5"
                    >
                        <Printer className="w-5 h-5" /> Print
                    </Button>
                </div>
            </div>

            {fileUrls.length > 1 && (
                <div className="flex gap-2 mb-3 overflow-x-auto pb-2">
                    {fileUrls.map((url, index) => (
                        <Button key={index} variant={selectedFileIndex === index ? "default" : "outline"} size="sm"
                            onClick={() => { setSelectedFileIndex(index); setLoading(true); }}>
                            File {index + 1}
                        </Button>
                    ))}
                </div>
            )}

            <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-auto" style={{ maxHeight: 'calc(100vh - 140px)' }}>
                {loading && (
                    <div className="flex flex-col items-center justify-center py-20 gap-3">
                        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
                        <p className="text-gray-500">Loading document...</p>
                    </div>
                )}
                
                {error && (
                    <div className="flex flex-col items-center justify-center py-20 gap-3">
                        <p className="text-red-500">{error}</p>
                        <a href={currentFileUrl} target="_blank" rel="noopener noreferrer"
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                            Download Instead
                        </a>
                    </div>
                )}

                {isImage && blobUrl && (
                    <img src={blobUrl} alt={doc.document_name} className="w-full h-auto p-4" />
                )}

                {pdfPages.length > 0 && (
                    <div className="space-y-2 p-2">
                        {pdfPages.map((pageDataUrl, index) => (
                            <img key={index} src={pageDataUrl} alt={`Page ${index + 1}`} className="w-full h-auto block shadow-sm" />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
