import React, { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/AuthContext";
import { usePermissions } from "@/components/permissions/usePermissions";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  FileText, Upload, Trash2, Lock, Search,
  ShieldCheck, ChevronRight, FolderOpen, X, Download
} from "lucide-react";
import { supabase } from "@/api/supabaseClient";

const CATEGORY_COLORS = {
  "General": { bg: "bg-gray-100", text: "text-gray-700", dot: "bg-gray-400" },
  "Thyroid": { bg: "bg-blue-100", text: "text-blue-700", dot: "bg-blue-500" },
  "Hormone Replacement Therapy": { bg: "bg-purple-100", text: "text-purple-700", dot: "bg-purple-500" },
  "GLP-1 / Weight Management": { bg: "bg-emerald-100", text: "text-emerald-700", dot: "bg-emerald-500" },
  "Mens Health": { bg: "bg-sky-100", text: "text-sky-700", dot: "bg-sky-500" },
  "Gynecology": { bg: "bg-pink-100", text: "text-pink-700", dot: "bg-pink-500" },
  "Lab Interpretation": { bg: "bg-amber-100", text: "text-amber-700", dot: "bg-amber-500" },
  "Protocols & SOPs": { bg: "bg-indigo-100", text: "text-indigo-700", dot: "bg-indigo-500" },
  "Vitals & Intake": { bg: "bg-teal-100", text: "text-teal-700", dot: "bg-teal-500" },
  "Phlebotomy": { bg: "bg-red-100", text: "text-red-700", dot: "bg-red-500" },
  "Patient Communication": { bg: "bg-violet-100", text: "text-violet-700", dot: "bg-violet-500" },
  "Insurance & Billing": { bg: "bg-lime-100", text: "text-lime-700", dot: "bg-lime-500" },
  "Scheduling": { bg: "bg-cyan-100", text: "text-cyan-700", dot: "bg-cyan-500" },
  "Check-In / Check-Out": { bg: "bg-orange-100", text: "text-orange-700", dot: "bg-orange-500" },
  "Compliance & HIPAA": { bg: "bg-rose-100", text: "text-rose-700", dot: "bg-rose-500" },
  "Phone Scripts": { bg: "bg-fuchsia-100", text: "text-fuchsia-700", dot: "bg-fuchsia-500" },
  "EHR & Documentation": { bg: "bg-yellow-100", text: "text-yellow-700", dot: "bg-yellow-500" },
  "Injections & Procedures": { bg: "bg-sky-100", text: "text-sky-700", dot: "bg-sky-500" },
  "Safety & Infection Control": { bg: "bg-red-100", text: "text-red-700", dot: "bg-red-500" },
  "Onboarding": { bg: "bg-emerald-100", text: "text-emerald-700", dot: "bg-emerald-500" },
};

async function ensureBucket(bucket) {
  await supabase.storage.createBucket(bucket, { public: false });
}

/**
 * Reusable Education Page component.
 * @param {string} title - Page title
 * @param {string} subtitle - Subtitle text
 * @param {string} permissionKey - Permission key (e.g. "provider_education", "ma_education")
 * @param {string} bucket - Supabase storage bucket name
 * @param {string} table - Supabase table name
 * @param {string[]} categories - List of category options
 * @param {React.ComponentType} icon - Lucide icon component
 * @param {string} accentColor - Tailwind color for accent (e.g. "indigo", "teal", "rose")
 */
export default function EducationPage({
  title,
  subtitle,
  permissionKey,
  bucket,
  table,
  categories,
  icon: Icon,
  accentColor = "indigo",
}) {
  const { user } = useAuth();
  const { can, isAdmin } = usePermissions();
  const hasAccess = isAdmin || can(permissionKey, "view");
  const canManage = isAdmin || can(permissionKey, "edit");

  const [files, setFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileContent, setFileContent] = useState(null);
  const [loadingContent, setLoadingContent] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadDescription, setUploadDescription] = useState("");
  const [uploadCategory, setUploadCategory] = useState(categories[0] || "General");
  const [uploadFile, setUploadFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const iframeRef = useRef(null);

  const loadFiles = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from(table)
        .select("*")
        .order("category", { ascending: true })
        .order("title", { ascending: true });
      if (!error) setFiles(data || []);
      else setFiles([]);
    } catch { setFiles([]); }
    setIsLoading(false);
  }, [table]);

  useEffect(() => { if (hasAccess) loadFiles(); }, [hasAccess, loadFiles]);

  const openFile = async (file) => {
    setSelectedFile(file);
    setLoadingContent(true);
    setFileContent(null);
    try {
      const { data, error } = await supabase.storage.from(bucket).download(file.file_name);
      if (error) throw error;
      let text = await new Response(data).text();
      if (text.includes('\u00c2') || text.includes('\u00c3')) {
        const buf = await data.arrayBuffer();
        text = new TextDecoder('utf-8').decode(buf);
      }
      if (!text.includes('<meta charset')) {
        text = text.replace('<head>', '<head><meta charset="UTF-8">');
      }
      // Inject anchor link handler — always route scroll to parent container
      const anchorScript = '<scr' + 'ipt>' +
        'document.addEventListener("click", function(e) {' +
        '  var a = e.target.closest("a");' +
        '  if (!a) return;' +
        '  var href = a.getAttribute("href");' +
        '  if (href && href.charAt(0) === "#") {' +
        '    e.preventDefault();' +
        '    e.stopPropagation();' +
        '    var id = href.substring(1);' +
        '    var target = document.getElementById(id) || document.querySelector(href);' +
        '    if (target) {' +
        '      window.parent.postMessage({ type: "scrollToSection", offsetTop: target.offsetTop, ts: Date.now() }, "*");' +
        '    }' +
        '  }' +
        '});' +
        '</scr' + 'ipt>';
      text = text.replace('</body>', anchorScript + '</body>');
      setFileContent(text);
    } catch (err) {
      setFileContent(`<html><body style="font-family:sans-serif;padding:2rem;"><h2>Error loading file</h2><p>${err.message}</p></body></html>`);
    }
    setLoadingContent(false);
  };

  // Listen for scroll messages from iframe — route all anchor clicks to parent scroll
  useEffect(() => {
    const handleMessage = (e) => {
      if (e.data?.type === "scrollToSection" && typeof e.data.offsetTop === "number") {
        const scrollContainer = iframeRef.current?.closest(".overflow-auto");
        if (scrollContainer) {
          // Force scroll to the exact position within the parent container
          // Add small offset for the header bar
          const headerOffset = 48;
          scrollContainer.scrollTo({ top: e.data.offsetTop - headerOffset, behavior: "smooth" });
        }
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  useEffect(() => {
    if (!fileContent || !iframeRef.current) return;
    const iframe = iframeRef.current;
    const resizeIframe = () => {
      try {
        const doc = iframe.contentDocument || iframe.contentWindow.document;
        const nav = doc.querySelector("nav"); if (nav) nav.remove();
        const footer = doc.querySelector("footer"); if (footer) footer.remove();
        const container = doc.querySelector(".article-container");
        if (container) container.style.padding = "20px 1.5rem 40px";
        doc.documentElement.style.overflow = "hidden";
        doc.body.style.overflow = "hidden";
        const h = Math.max(doc.body.scrollHeight, doc.body.offsetHeight, doc.documentElement.scrollHeight, doc.documentElement.offsetHeight);
        iframe.style.height = h + "px";
      } catch {}
    };
    const handleLoad = () => { resizeIframe(); setTimeout(resizeIframe, 500); setTimeout(resizeIframe, 1500); };
    iframe.addEventListener("load", handleLoad);
    return () => iframe.removeEventListener("load", handleLoad);
  }, [fileContent]);

  const handleUpload = async () => {
    if (!uploadFile || !uploadTitle.trim()) return;
    setUploading(true);
    try {
      await ensureBucket(bucket);
      const ext = uploadFile.name.split(".").pop();
      const safeName = `${Date.now()}_${uploadTitle.replace(/[^a-zA-Z0-9]/g, "_")}.${ext}`;
      const { error: storageError } = await supabase.storage.from(bucket).upload(safeName, uploadFile, { contentType: uploadFile.type });
      if (storageError) throw storageError;
      const { error: dbError } = await supabase.from(table).insert({
        title: uploadTitle.trim(), description: uploadDescription.trim() || null, category: uploadCategory,
        file_name: safeName, original_name: uploadFile.name, mime_type: uploadFile.type,
        file_size: uploadFile.size, uploaded_by: user?.email || "unknown",
      });
      if (dbError) throw dbError;
      setUploadTitle(""); setUploadDescription(""); setUploadCategory(categories[0] || "General");
      setUploadFile(null); setShowUpload(false);
      await loadFiles();
    } catch (err) { alert("Upload failed: " + err.message); }
    setUploading(false);
  };

  const handleDelete = async (file, e) => {
    e?.stopPropagation();
    if (!confirm(`Delete "${file.title}"?`)) return;
    try {
      await supabase.storage.from(bucket).remove([file.file_name]);
      await supabase.from(table).delete().eq("id", file.id);
      if (selectedFile?.id === file.id) { setSelectedFile(null); setFileContent(null); }
      await loadFiles();
    } catch (err) { console.error("Delete failed:", err); }
  };

  const handleDownload = async (file) => {
    try {
      const { data, error } = await supabase.storage.from(bucket).createSignedUrl(file.file_name, 3600);
      if (error) throw error;
      window.open(data.signedUrl, "_blank");
    } catch (err) { alert("Could not open file: " + err.message); }
  };

  const filteredFiles = files.filter((f) => {
    const matchesSearch = f.title?.toLowerCase().includes(searchQuery.toLowerCase()) || f.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = selectedCategory === "all" || f.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const grouped = {};
  filteredFiles.forEach((f) => { const cat = f.category || "General"; if (!grouped[cat]) grouped[cat] = []; grouped[cat].push(f); });

  const ac = accentColor; // shorthand

  if (!hasAccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center"><Lock className="w-10 h-10 text-red-500" /></div>
        <h2 className="text-2xl font-bold text-gray-900">Access Restricted</h2>
        <p className="text-gray-500 max-w-md">This page is only available to authorized staff. Contact your administrator to request access.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <div className="bg-white rounded-2xl p-4 shadow-sm mb-4 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center space-x-3">
          <div className={`w-9 h-9 bg-${ac}-100 rounded-xl flex items-center justify-center`}>
            <Icon className={`w-5 h-5 text-${ac}-600`} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{title}</h1>
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <ShieldCheck className={`w-3 h-3 text-${ac}-500`} />
              {subtitle}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {canManage && (
            <Button size="sm" onClick={() => setShowUpload(true)} className={`bg-${ac}-600 hover:bg-${ac}-700`}>
              <Upload className="w-4 h-4 mr-1" /> Upload
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-1 gap-4 min-h-0">
        <div className={`${sidebarOpen ? "w-80" : "w-0"} flex-shrink-0 transition-all duration-300 overflow-hidden`}>
          <div className="bg-white rounded-2xl shadow-sm h-full flex flex-col w-80">
            <div className="p-3 border-b">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search resources..." className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300" />
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2">
                <button onClick={() => setSelectedCategory("all")}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${selectedCategory === "all" ? `bg-${ac}-600 text-white` : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>All</button>
                {categories.map((cat) => {
                  const colors = CATEGORY_COLORS[cat] || CATEGORY_COLORS["General"];
                  return (
                    <button key={cat} onClick={() => setSelectedCategory(cat)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${selectedCategory === cat ? `bg-${ac}-600 text-white` : `${colors.bg} ${colors.text} hover:opacity-80`}`}>
                      {cat.length > 20 ? cat.split(" / ")[0] : cat}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2">
              {isLoading ? (
                <div className="flex items-center justify-center py-12"><div className={`animate-spin rounded-full h-8 w-8 border-b-2 border-${ac}-600`} /></div>
              ) : Object.keys(grouped).length === 0 ? (
                <div className="text-center py-12 px-4"><FolderOpen className="w-10 h-10 text-gray-300 mx-auto mb-2" /><p className="text-sm text-gray-400">No resources found</p></div>
              ) : (
                Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)).map(([category, catFiles]) => {
                  const colors = CATEGORY_COLORS[category] || CATEGORY_COLORS["General"];
                  return (
                    <div key={category} className="mb-4">
                      <div className={`flex items-center gap-2 px-3 py-2 rounded-xl mb-2 ${colors.bg}`}>
                        <div className={`w-2.5 h-2.5 rounded-full ${colors.dot}`} />
                        <span className={`text-xs font-bold uppercase tracking-wider ${colors.text}`}>{category}</span>
                        <span className={`text-xs font-medium ${colors.text} opacity-60`}>({catFiles.length})</span>
                      </div>
                      {catFiles.map((file) => {
                        const isActive = selectedFile?.id === file.id;
                        const isHTML = file.mime_type === "text/html" || file.original_name?.endsWith(".html");
                        const catColor = CATEGORY_COLORS[category] || CATEGORY_COLORS["General"];
                        return (
                          <button key={file.id} onClick={() => isHTML ? openFile(file) : handleDownload(file)}
                            className={`w-full text-left px-3 py-3 rounded-xl mb-1.5 transition-all group flex items-start gap-3 ${
                              isActive ? `${catColor.bg} border-2 border-current shadow-md ${catColor.text}` : `bg-gradient-to-r from-gray-50 to-white border border-gray-200 hover:border-gray-300 hover:shadow-sm`}`}>
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${catColor.bg} ${catColor.text}`}>
                              <FileText className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm font-semibold leading-tight ${isActive ? catColor.text : "text-gray-800"}`}>{file.title}</p>
                              {file.description && <p className="text-xs text-gray-400 truncate mt-1">{file.description}</p>}
                              <div className="flex items-center gap-2 mt-1.5">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold ${catColor.bg} ${catColor.text}`}>
                                  {isHTML ? "HTML" : file.original_name?.split(".").pop()?.toUpperCase() || "FILE"}
                                </span>
                                <span className="text-[10px] text-gray-300">{new Date(file.created_at).toLocaleDateString()}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                              {!isHTML && <Download className="w-3.5 h-3.5 text-gray-400" />}
                              {canManage && <button onClick={(e) => handleDelete(file, e)} className="p-0.5 hover:text-red-500 text-gray-300"><Trash2 className="w-3.5 h-3.5" /></button>}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        <button onClick={() => setSidebarOpen(!sidebarOpen)}
          className="self-start mt-4 p-1.5 bg-white rounded-lg shadow-sm border border-gray-200 hover:bg-gray-50 transition-all flex-shrink-0">
          <ChevronRight className={`w-4 h-4 text-gray-500 transition-transform ${sidebarOpen ? "rotate-180" : ""}`} />
        </button>

        <div className="flex-1 min-w-0">
          {!selectedFile ? (
            <div className="bg-white rounded-2xl shadow-sm h-full flex items-center justify-center">
              <div className="text-center px-8">
                <div className={`w-16 h-16 bg-${ac}-50 rounded-2xl flex items-center justify-center mx-auto mb-4`}>
                  <Icon className={`w-8 h-8 text-${ac}-300`} />
                </div>
                <h3 className="text-lg font-semibold text-gray-700 mb-1">Select a resource</h3>
                <p className="text-sm text-gray-400 max-w-sm">Choose a topic from the sidebar to view the educational material here.</p>
              </div>
            </div>
          ) : loadingContent ? (
            <div className="bg-white rounded-2xl shadow-sm h-full flex items-center justify-center">
              <div className={`animate-spin rounded-full h-10 w-10 border-b-2 border-${ac}-600`} />
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm h-full overflow-hidden flex flex-col">
              <div className="flex items-center justify-between px-4 py-2.5 border-b bg-gray-50/50 flex-shrink-0">
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`px-2 py-0.5 rounded-lg text-xs font-medium ${(CATEGORY_COLORS[selectedFile.category] || CATEGORY_COLORS["General"]).bg} ${(CATEGORY_COLORS[selectedFile.category] || CATEGORY_COLORS["General"]).text}`}>{selectedFile.category}</span>
                  <h2 className="text-sm font-semibold text-gray-700 truncate">{selectedFile.title}</h2>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <Button variant="ghost" size="sm" onClick={() => handleDownload(selectedFile)} className="text-xs h-7 px-2"><Download className="w-3.5 h-3.5 mr-1" /> Open in Tab</Button>
                  <Button variant="ghost" size="sm" onClick={() => { setSelectedFile(null); setFileContent(null); }} className="text-xs h-7 px-2"><X className="w-3.5 h-3.5" /></Button>
                </div>
              </div>
              <div className="flex-1 overflow-auto">
                <iframe ref={iframeRef} srcDoc={fileContent} title={selectedFile.title}
                  className="w-full border-0" style={{ minHeight: "200px", height: "800px", overflow: "hidden" }}
                  scrolling="no" sandbox="allow-same-origin allow-popups allow-scripts" />
              </div>
            </div>
          )}
        </div>
      </div>

      <Dialog open={showUpload} onOpenChange={setShowUpload}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Upload Resource</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Title *</Label><Input value={uploadTitle} onChange={(e) => setUploadTitle(e.target.value)} placeholder="Resource title" /></div>
            <div><Label>Description</Label><Input value={uploadDescription} onChange={(e) => setUploadDescription(e.target.value)} placeholder="Brief description" /></div>
            <div><Label>Category</Label>
              <select value={uploadCategory} onChange={(e) => setUploadCategory(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
                {categories.map((cat) => (<option key={cat} value={cat}>{cat}</option>))}
              </select>
            </div>
            <div><Label>File (HTML, PDF, or DOCX)</Label><Input type="file" accept=".html,.htm,.pdf,.docx,.doc" onChange={(e) => setUploadFile(e.target.files?.[0] || null)} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUpload(false)}>Cancel</Button>
            <Button onClick={handleUpload} disabled={!uploadFile || !uploadTitle.trim() || uploading} className={`bg-${ac}-600 hover:bg-${ac}-700`}>
              {uploading ? "Uploading..." : "Upload"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
