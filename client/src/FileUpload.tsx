import React, { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Upload,
  AlertCircle,
  Loader2,
  FileText,
  X,
  ArrowRight,
  RefreshCw,
  Download,
  Sparkles,
  ImageIcon,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import PrescriptionDashboard from "@/components/custom/PrescriptionDashboard";

// ── Try importing react-pdf — works once installed, silently degrades if not ──
// We import at module level; Vite will error at build-time if missing, not runtime.
// The try/catch below lets the rest of the app work until `npm install react-pdf` runs.
let ReactPdfDocument: React.ComponentType<any> | null = null;
let ReactPdfPage: React.ComponentType<any> | null = null;

try {
  // @ts-ignore — optional dependency
  const mod = require("react-pdf");
  ReactPdfDocument = mod.Document;
  ReactPdfPage = mod.Page;
  mod.pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${mod.pdfjs.version}/pdf.worker.min.mjs`;
} catch (_) {
  // react-pdf not yet installed — falls back to <iframe>
}

// ── Unified Document Viewer ───────────────────────────────────────────────────
// Same chrome (header, bg, border) for both PDF and image — looks identical.
function DocumentViewer({
  previewUrl,
  isPdf,
  fileName,
  fileSizeMb,
  onChangeFile,
}: {
  previewUrl: string;
  isPdf: boolean;
  fileName: string;
  fileSizeMb: string;
  onChangeFile: () => void;
}) {
  const [numPages, setNumPages] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);

  const canRenderPdf =
    isPdf && ReactPdfDocument !== null && ReactPdfPage !== null;

  return (
    <div className="flex flex-col h-full w-full">
      {/* ── Header ── */}
      <div className="flex items-center gap-3 px-4 py-2.5 border-b-2 border-foreground shrink-0 bg-muted">
        <div className="p-1 bg-primary border-2 border-foreground shadow-[var(--shadow-sm)] shrink-0">
          {isPdf ? (
            <FileText className="h-3.5 w-3.5 text-primary-foreground" />
          ) : (
            <ImageIcon className="h-3.5 w-3.5 text-primary-foreground" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold uppercase tracking-widest leading-tight">
            Source Document
          </p>
          <p className="text-[10px] opacity-60 truncate">
            {fileName}&nbsp;·&nbsp;{fileSizeMb} MB
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="shrink-0 gap-1.5 text-[10px] font-bold uppercase h-7 border-2 border-foreground shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow)] hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all"
          onClick={onChangeFile}
        >
          <RefreshCw className="h-3 w-3" />
          Change
        </Button>
      </div>

      {/* ── Always-visible Zoom Toolbar ── */}
      <div className="flex items-center justify-between gap-2 px-3 py-1.5 border-b-2 border-foreground bg-card shrink-0">
        <div className="flex items-center gap-0.5">
          {canRenderPdf && numPages > 1 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => setPageNumber((p) => Math.max(p - 1, 1))}
                disabled={pageNumber <= 1}
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              <span className="text-[11px] text-muted-foreground font-medium px-1.5">
                {pageNumber} / {numPages}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => setPageNumber((p) => Math.min(p + 1, numPages))}
                disabled={pageNumber >= numPages}
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </>
          )}
        </div>
        <div className="flex items-center gap-0.5">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() =>
              setScale((s) => Math.max(+(s - 0.25).toFixed(2), 0.5))
            }
          >
            <ZoomOut className="h-3.5 w-3.5" />
          </Button>
          <span className="text-[11px] font-mono text-muted-foreground w-10 text-center">
            {Math.round(scale * 100)}%
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() =>
              setScale((s) => Math.min(+(s + 0.25).toFixed(2), 3.0))
            }
          >
            <ZoomIn className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto scroll-primary bg-muted/20 p-6">
        {/* Scale wrapper — transform-origin top-center so zoom expands downward */}
        <div
          className="transition-transform duration-200 ease-out"
          style={{
            transform: `scale(${scale})`,
            transformOrigin: "top center",
            /* Push the scrollable area so it can scroll when scaled up */
            marginBottom: `calc((${scale} - 1) * 100%)`,
          }}
        >
          {canRenderPdf ? (
            <ReactPdfDocument
              file={previewUrl}
              onLoadSuccess={({ numPages }: { numPages: number }) => {
                setNumPages(numPages);
                setPageNumber(1);
              }}
              loading={
                <div className="flex flex-col items-center gap-2 text-muted-foreground mt-16">
                  <div className="h-6 w-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                  <span className="text-xs">Loading document…</span>
                </div>
              }
            >
              <ReactPdfPage
                pageNumber={pageNumber}
                renderTextLayer={false}
                renderAnnotationLayer={false}
                className="shadow-lg rounded"
              />
            </ReactPdfDocument>
          ) : isPdf ? (
            <iframe
              src={previewUrl}
              className="w-full border-0 rounded-lg shadow-md"
              style={{ height: "calc(100vh - 14rem)" }}
              title="PDF Preview"
            />
          ) : (
            /* Image — fills panel width at scale=1, zooms with CSS transform */
            <img
              src={previewUrl}
              className="w-full rounded-lg shadow-md block select-none"
              alt="Prescription Preview"
              draggable={false}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ── Analysis Skeleton Loader ──────────────────────────────────────────────────
function AnalysisSkeleton() {
  return (
    <div className="flex flex-col h-full animate-in fade-in duration-500">
      {/* Header skeleton */}
      <div className="flex items-center gap-3 px-4 py-3 border-b-2 border-foreground shrink-0 bg-card">
        <Skeleton className="h-7 w-7" />
        <div className="flex-1 space-y-1.5">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-48" />
        </div>
      </div>

      {/* Content skeleton */}
      <div className="flex-1 overflow-y-auto scroll-primary p-5 space-y-5">
        {/* Clinic / Doctor header */}
        <div className="border-2 border-foreground bg-primary/10 p-4 space-y-3">
          <Skeleton className="h-5 w-40 bg-primary/20" />
          <div className="flex gap-4">
            <Skeleton className="h-3 w-28 bg-primary/20" />
            <Skeleton className="h-3 w-36 bg-primary/20" />
            <Skeleton className="h-3 w-24 bg-primary/20" />
          </div>
        </div>

        {/* Patient + date row */}
        <div className="border-2 border-foreground bg-secondary p-3 flex gap-4">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-24" />
        </div>

        {/* Medications table skeleton */}
        <div className="space-y-3">
          <Skeleton className="h-4 w-28" />
          <div className="border-2 border-foreground overflow-hidden">
            <div className="flex gap-2 p-3 bg-muted border-b-2 border-foreground">
              <Skeleton className="h-3 flex-1" />
              <Skeleton className="h-3 flex-1" />
              <Skeleton className="h-3 w-16" />
            </div>
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-2 p-3 border-b-2 border-foreground last:border-0">
                <Skeleton className="h-3 flex-1" />
                <Skeleton className="h-3 flex-1" />
                <Skeleton className="h-3 w-16" />
              </div>
            ))}
          </div>
        </div>

        {/* Do / Avoid cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="border-2 border-foreground p-3 space-y-2">
            <Skeleton className="h-4 w-16" />
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-start gap-2">
                <Skeleton className="h-2.5 w-2.5 mt-0.5 shrink-0" />
                <Skeleton className="h-3 w-full" />
              </div>
            ))}
          </div>
          <div className="border-2 border-foreground p-3 space-y-2">
            <Skeleton className="h-4 w-16" />
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-start gap-2">
                <Skeleton className="h-2.5 w-2.5 mt-0.5 shrink-0" />
                <Skeleton className="h-3 w-full" />
              </div>
            ))}
          </div>
        </div>

        {/* Medicine cards */}
        <div className="grid grid-cols-2 gap-3">
          {[1, 2].map((i) => (
            <div key={i} className="border-2 border-foreground p-3 space-y-2">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-16" />
              </div>
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-4/5" />
            </div>
          ))}
        </div>

        {/* Warning signs */}
        <div className="border-2 border-foreground bg-destructive/10 p-3 space-y-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-5/6" />
        </div>
      </div>
    </div>
  );
}

// ── Main FileUpload component ─────────────────────────────────────────────────
export default function FileUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [markdown, setMarkdown] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dashboardExportRef = useRef<(() => Promise<void>) | null>(null);
  const [isExporting, setIsExporting] = useState(false);

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
    setLoading(false);
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
      const resp = await fetch(`${apiBase}/upload-file`, {
        method: "POST",
        body: fd,
      });
      if (!resp.ok) {
        const text = await resp.text();
        throw new Error(text || resp.statusText);
      }
      const data = await resp.json();
      setMarkdown(
        data.markdown || data.markdown_full || "(no markdown returned)",
      );
    } catch (err: any) {
      setError(err?.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  const handleExportPdf = useCallback(async () => {
    if (!dashboardExportRef.current) return;
    setIsExporting(true);
    try {
      await dashboardExportRef.current();
    } finally {
      setIsExporting(false);
    }
  }, []);

  const isPdf = file?.type === "application/pdf";
  const fileSizeMb = file ? (file.size / 1024 / 1024).toFixed(2) : "0";

  const showTwoPanel = loading || markdown;

  return (
    // Seamless — no vertical padding gap between sections
    <div className="w-full max-w-7xl mx-auto px-4 animate-in fade-in duration-500">
      {!showTwoPanel ? (
        /* ── Upload / File-selected state ── */
        <div className="max-w-3xl mx-auto py-6">
          {!file ? (
            /* Drop zone */
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`
                relative border-2 border-foreground px-12 py-16
                flex flex-col items-center gap-5 cursor-pointer transition-all
                ${
                  isDragging
                    ? "bg-primary/10 shadow-[var(--shadow-md)] translate-x-[-2px] translate-y-[-2px]"
                    : "bg-card shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow)] hover:translate-x-[-1px] hover:translate-y-[-1px]"
                }
              `}
            >
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*,application/pdf"
                onChange={handleFileChange}
              />
              <div className="p-3 bg-primary text-primary-foreground border-2 border-foreground shadow-[var(--shadow-sm)]">
                <Upload className="h-7 w-7" />
              </div>
              <div className="text-center space-y-1">
                <p className="text-lg font-bold uppercase tracking-wide">
                  Drop your prescription here
                </p>
                <p className="text-sm opacity-60">
                  or{" "}
                  <span className="text-primary font-bold underline underline-offset-2">
                    click to browse
                  </span>
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs font-bold">
                {["JPG", "PNG", "WEBP", "PDF"].map((fmt) => (
                  <span
                    key={fmt}
                    className="px-2.5 py-1 border-2 border-foreground bg-muted"
                  >
                    {fmt}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            /* File selected */
            <div className="border-2 border-foreground bg-card overflow-hidden shadow-[var(--shadow)]">
              <div className="flex items-center gap-4 px-5 py-4">
                <div className="p-2.5 bg-muted border-2 border-foreground shrink-0">
                  {isPdf ? (
                    <FileText className="h-5 w-5" />
                  ) : (
                    <ImageIcon className="h-5 w-5" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate">
                    {file.name}
                  </p>
                  <p className="text-xs opacity-60">
                    {fileSizeMb} MB
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0 hover:text-destructive border-2 border-transparent hover:border-foreground"
                  onClick={clearSelection}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <div className="px-5 pb-5">
                <Button
                  onClick={handleUpload}
                  size="lg"
                  className="w-full gap-2 text-sm font-bold uppercase h-11 border-2 border-foreground shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all"
                >
                  Extract & Analyze
                  <ArrowRight className="h-4 w-4" />
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
        /* ── Two-column result — single unified card, zero gap between panels ── */
        <div
          className="h-screen border-2 border-foreground bg-card overflow-hidden shadow-[var(--shadow)] flex lg:flex-row flex-col print:block"
        >
          {/* LEFT — Document viewer */}
          <div className="lg:w-[42%] flex-col flex border-b-2 lg:border-b-0 lg:border-r-2 border-foreground overflow-hidden print:hidden min-h-[50vh] lg:min-h-0">
            {previewUrl && (
              <DocumentViewer
                previewUrl={previewUrl}
                isPdf={isPdf}
                fileName={file?.name ?? ""}
                fileSizeMb={fileSizeMb}
                onChangeFile={clearSelection}
              />
            )}
          </div>

          {/* RIGHT — AI Analysis */}
          <div className="lg:w-[58%] flex flex-col overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-3 border-b-2 border-foreground shrink-0 bg-muted">
              <div className="p-1.5 bg-primary border-2 border-foreground shadow-[var(--shadow-sm)] shrink-0">
                <Sparkles className="h-4 w-4 text-primary-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold uppercase tracking-widest leading-tight">
                  AI Analysis Report
                </p>
                <p className="text-[10px] opacity-60">
                  AI-generated insights and extracted information
                </p>
              </div>
              {markdown && (
                <Button
                  variant="default"
                  size="sm"
                  className="shrink-0 gap-1.5 text-[11px] font-bold uppercase h-8 border-2 border-foreground shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow)] hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all"
                  onClick={handleExportPdf}
                  disabled={isExporting}
                >
                  {isExporting ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Download className="h-3.5 w-3.5" />
                  )}
                  {isExporting ? "Exporting…" : "Export PDF"}
                </Button>
              )}
            </div>
            <div className="flex-1 overflow-y-auto scroll-primary">
              {loading && !markdown ? (
                <AnalysisSkeleton />
              ) : (
                <PrescriptionDashboard
                  data={markdown}
                  exportRef={dashboardExportRef}
                  compact
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
