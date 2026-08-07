import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Upload, AlertCircle, Loader2, FileText, X, ArrowRight, ImageIcon } from "lucide-react";
import PrescriptionDashboard from "@/components/custom/PrescriptionDashboard";

export default function FileUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [markdown, setMarkdown] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const applyFile = (f: File) => {
    setMarkdown(null);
    setError(null);
    setFile(f);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(f));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) applyFile(f);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) applyFile(f);
  };

  const clearSelection = () => {
    setFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setMarkdown(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleUpload = async () => {
    if (!file) return setError("Please select a file first");
    setLoading(true);
    setError(null);
    setMarkdown(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const apiBase = (import.meta.env.VITE_API_URL as string) || "";
      const resp = await fetch(`${apiBase}/upload-file`, { method: "POST", body: fd });
      if (!resp.ok) {
        const text = await resp.text();
        throw new Error(text || resp.statusText);
      }
      const data = await resp.json();
      setMarkdown(data.markdown || data.markdown_full || "(no markdown returned)");
    } catch (err: any) {
      setError(err?.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-8 animate-in fade-in duration-500">
      {!markdown ? (
        /* ── Upload Panel ── */
        <div className="max-w-3xl mx-auto">

          {/* Drop Zone */}
          {!file ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`
                group relative rounded-xl border-2 border-dashed px-12 py-20
                flex flex-col items-center gap-5 cursor-pointer
                transition-all duration-200
                ${isDragging
                  ? "border-primary bg-primary/5 scale-[1.01]"
                  : "border-border bg-card hover:border-primary/50 hover:bg-muted/40"}
              `}
            >
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*,application/pdf"
                onChange={handleFileChange}
              />

              {/* Icon cluster */}
              <div className="relative">
                <div className="flex items-end gap-2">
                  <div className="p-3 rounded-xl bg-primary shadow-sm -mb-2">
                    <Upload className="h-8 w-8 text-primary-foreground" />
                  </div>
                </div>
              </div>

              <div className="text-center space-y-1.5 mt-2">
                <p className="text-lg font-semibold text-foreground">
                  Drop your prescription here
                </p>
                <p className="text-sm text-muted-foreground">
                  or <span className="text-primary font-medium underline underline-offset-2">click to browse</span>
                </p>
              </div>

              <div className="flex items-center gap-3 text-xs text-muted-foreground mt-2">
                <span className="px-2.5 py-1 rounded-full bg-muted border border-border">JPG</span>
                <span className="px-2.5 py-1 rounded-full bg-muted border border-border">PNG</span>
                <span className="px-2.5 py-1 rounded-full bg-muted border border-border">WEBP</span>
                <span className="px-2.5 py-1 rounded-full bg-muted border border-border">PDF</span>
              </div>
            </div>
          ) : (
            /* ── File Selected ── */
            <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">

              {/* File info row */}
              <div className="flex items-center gap-4 px-5 py-4">
                <div className="p-2.5 rounded-lg bg-primary/10 shrink-0">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-base font-medium text-foreground truncate">{file.name}</p>
                  <p className="text-sm text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                  onClick={clearSelection}
                  disabled={loading}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* CTA */}
              <div className="px-5 pb-5">
                <Button
                  onClick={handleUpload}
                  disabled={loading}
                  size="lg"
                  className="w-full gap-2 text-base h-12"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Analyzing document…
                    </>
                  ) : (
                    <>
                      Extract & Analyze
                      <ArrowRight className="h-5 w-5" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>
      ) : (
        /* ── Two-column result view ── */
        <div className="grid lg:grid-cols-[2fr_3fr] gap-5 items-start print:block">

          {/* Left: Document Viewer */}
          <div className="lg:sticky lg:top-20 h-[calc(100vh-6rem)] flex flex-col rounded-xl border border-border bg-card overflow-hidden shadow-sm print:hidden">

            {/* Toolbar */}
            <div className="flex items-center gap-2.5 px-3 py-2.5 border-b border-border bg-muted/40 shrink-0">
              <div className="flex gap-1 shrink-0">
                <span className="w-2.5 h-2.5 rounded-full bg-border"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-border"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-border"></span>
              </div>
              <div className="flex-1 min-w-0 bg-background/60 border border-border rounded-md px-2 py-0.5 flex items-center gap-1.5 overflow-hidden">
                <FileText className="h-3 w-3 text-muted-foreground shrink-0" />
                <span className="text-[11px] text-muted-foreground truncate font-mono" title={file?.name}>
                  {file?.name}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-muted-foreground hover:text-foreground shrink-0 h-6 px-2 gap-1"
                onClick={clearSelection}
              >
                <X className="h-3 w-3" /> New
              </Button>
            </div>

            {/* Document content */}
            <div className="flex-1 overflow-auto bg-muted/20 flex items-center justify-center p-4">
              {previewUrl && file?.type.includes("pdf") ? (
                <iframe
                  src={previewUrl}
                  className="w-full h-full border-0"
                  title="PDF Preview"
                />
              ) : (
                <img
                  src={previewUrl || ""}
                  className="max-w-full max-h-full object-contain rounded-lg shadow-md bg-card"
                  alt="Prescription Preview"
                />
              )}
            </div>

            {/* Footer bar */}
            <div className="px-3 py-2 border-t border-border bg-muted/40 shrink-0 flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground">
                {file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : ""}
              </span>
              <span className="text-[10px] text-muted-foreground">Original Document</span>
            </div>
          </div>

          {/* Right: Prescription Dashboard */}
          <div>
            <PrescriptionDashboard data={markdown} />
          </div>
        </div>
      )}
    </div>
  );
}
