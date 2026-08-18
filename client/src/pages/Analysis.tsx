import { useState, useRef, useCallback, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { Navbar } from "@/components/custom/Navbar";
import {
  ArrowLeft,
  Download,
  Loader2,
  FileText,
  ImageIcon,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Pill,
  AlertTriangle,
  Lightbulb,
  Lock,
  Eye,
  Info,
  Clock,
} from "lucide-react";
import PrescriptionDashboard from "@/components/custom/PrescriptionDashboard";
import { showToast, getReadableError } from "@/components/custom/Toast";
import { getPendingFile, clearPendingFile } from "@/lib/file-store";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";

// ── react-pdf (optional) ──────────────────────────────────────────────────────
let ReactPdfDocument: React.ComponentType<any> | null = null;
let ReactPdfPage: React.ComponentType<any> | null = null;

try {
  const mod = require("react-pdf");
  ReactPdfDocument = mod.Document;
  ReactPdfPage = mod.Page;
  mod.pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${mod.pdfjs.version}/pdf.worker.min.mjs`;
} catch (_) {}

// ── Tiny toolbar icon button ──────────────────────────────────────────────────
function ToolBtn({
  onClick, disabled, title, children,
}: {
  onClick?: () => void; disabled?: boolean; title?: string; children: React.ReactNode;
}) {
  return (
    <button
      title={title}
      disabled={disabled}
      onClick={onClick}
      className="h-7 w-7 flex items-center justify-center rounded-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
    >
      {children}
    </button>
  );
}

// ── Stat pill ─────────────────────────────────────────────────────────────────
function StatPill({
  icon, label, value, color,
}: {
  icon: React.ReactNode; label: string; value: string | number; color: string;
}) {
  return (
    <div className={`flex items-center gap-1.5 px-2.5 py-1 border border-border text-xs font-medium ${color}`}>
      {icon}
      <span className="font-bold">{value}</span>
      <span className="text-muted-foreground">{label}</span>
    </div>
  );
}

// ── Document Viewer ───────────────────────────────────────────────────────────
function DocumentViewer({
  previewUrl, isPdf, fileName, fileSizeMb,
}: {
  previewUrl: string; isPdf: boolean; fileName: string; fileSizeMb: string;
}) {
  const [numPages, setNumPages] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const canRenderPdf = isPdf && ReactPdfDocument !== null && ReactPdfPage !== null;

  return (
    <div className="flex flex-col h-full w-full bg-card">

      {/* ── Panel header ── */}
      <div className="flex items-center gap-3 px-4 h-12 border-b border-border shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          {isPdf
            ? <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
            : <ImageIcon className="h-4 w-4 text-muted-foreground shrink-0" />}
          <span className="text-sm font-semibold text-foreground truncate">Original Prescription</span>
        </div>
        <div className="flex items-center gap-2 ml-auto shrink-0">
          <span className="text-xs text-muted-foreground truncate hidden sm:block max-w-[160px]">
            {fileName}
          </span>
          <span className="text-xs font-medium px-2 py-0.5 bg-muted border border-border text-muted-foreground uppercase tracking-wide">
            {isPdf ? "PDF" : "IMG"}
          </span>
          <span className="text-xs text-muted-foreground">{fileSizeMb} MB</span>
        </div>
      </div>

      {/* ── Zoom & page toolbar ── */}
      <div className="flex items-center justify-between px-3 h-9 border-b border-border bg-muted/20 shrink-0">
        <div className="flex items-center gap-0.5">
          <ToolBtn title="Zoom out" onClick={() => setScale(s => Math.max(+(s - 0.25).toFixed(2), 0.5))}>
            <ZoomOut className="h-3.5 w-3.5" />
          </ToolBtn>
          <span className="text-xs font-mono text-muted-foreground px-1.5 min-w-[3rem] text-center">
            {Math.round(scale * 100)}%
          </span>
          <ToolBtn title="Zoom in" onClick={() => setScale(s => Math.min(+(s + 0.25).toFixed(2), 3.0))}>
            <ZoomIn className="h-3.5 w-3.5" />
          </ToolBtn>
          <div className="w-px h-4 bg-border mx-1" />
          <ToolBtn title="Reset zoom" onClick={() => setScale(1.0)}>
            <RotateCcw className="h-3 w-3" />
          </ToolBtn>
        </div>

        {canRenderPdf && numPages > 1 && (
          <div className="flex items-center gap-0.5">
            <ToolBtn disabled={pageNumber <= 1} onClick={() => setPageNumber(p => Math.max(p - 1, 1))}>
              <ChevronLeft className="h-3.5 w-3.5" />
            </ToolBtn>
            <span className="text-xs text-muted-foreground px-1.5">
              {pageNumber} <span className="opacity-50">/</span> {numPages}
            </span>
            <ToolBtn disabled={pageNumber >= numPages} onClick={() => setPageNumber(p => Math.min(p + 1, numPages))}>
              <ChevronRight className="h-3.5 w-3.5" />
            </ToolBtn>
          </div>
        )}
      </div>


      {/* ── Document body ── */}
      {/*
        Width scaling goes on the WRAPPER div (direct child of overflow-auto),
        not on the image itself. When width is on the image inside a flex
        container, the scroll container may not detect the overflow correctly.
        By expanding the wrapper, scrollWidth is always accurate.
        react-pdf gets the scale prop which sizes its canvas natively.
      */}
      <div className="flex-1 overflow-auto scroll-primary bg-muted/10">
        {canRenderPdf ? (
          // PDF: react-pdf scales its own canvas — just centre it
          <div className="p-6 flex justify-center min-h-full">
            <ReactPdfDocument
              file={previewUrl}
              onLoadSuccess={({ numPages }: { numPages: number }) => {
                setNumPages(numPages);
                setPageNumber(1);
              }}
              loading={
                <div className="flex flex-col items-center gap-3 text-muted-foreground mt-24">
                  <div className="h-6 w-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                  <span className="text-xs text-muted-foreground">Loading PDF…</span>
                </div>
              }
            >
              <ReactPdfPage
                pageNumber={pageNumber}
                scale={scale}
                renderTextLayer={false}
                renderAnnotationLayer={false}
                className="shadow-md border border-border"
              />
            </ReactPdfDocument>
          </div>
        ) : (
          // Image / iframe:
          //   wrapper = max(100%, scale*100%) → expands scroll area when zoomed in
          //   content = min(100%, scale*100%) of wrapper → shrinks when zoomed out
          //   flex + justify-center centres the content when it's narrower than the wrapper
          <div
            className="p-6 box-border flex justify-center items-start"
            style={{ width: `${Math.max(100, Math.round(scale * 100))}%` }}
          >
            {isPdf ? (
              <iframe
                src={previewUrl}
                title="PDF Preview"
                className="border border-border block shrink-0"
                style={{
                  width: `${Math.min(100, Math.round(scale * 100))}%`,
                  height: "calc(100vh - 16rem)",
                }}
              />
            ) : (
              <img
                src={previewUrl}
                alt="Prescription Preview"
                draggable={false}
                className="shadow-md border border-border block select-none"
                style={{ width: `${Math.min(100, Math.round(scale * 100))}%` }}
              />
            )}
          </div>
        )}
      </div>


      {/* ── Footer actions ── */}
      <div className="flex items-center border-t border-border shrink-0 divide-x divide-border">
        <button className="flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
          <Eye className="h-3.5 w-3.5" />
          View Full Size
        </button>
        <a
          href={previewUrl}
          download={fileName}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
        >
          <Download className="h-3.5 w-3.5" />
          Download Original
        </a>
      </div>
    </div>
  );
}

// ── Right panel header ────────────────────────────────────────────────────────
function InsightHeader({
  hasData,
  onExport,
  isExporting,
}: {
  hasData: boolean;
  onExport: () => void;
  isExporting: boolean;
}) {
  return (
    <div className="shrink-0 border-b border-border bg-card">
      {/* Title row */}
      <div className="flex items-center gap-3 px-4 h-12">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold">AI Insight Report</span>
        </div>

        {hasData && (
          <div className="flex items-center gap-1.5 ml-3">
            <StatPill
              icon={<Pill className="h-3 w-3" />}
              label="medicines"
              value={3}
              color="bg-green-50 text-green-700 border-green-200"
            />
            <StatPill
              icon={<AlertTriangle className="h-3 w-3" />}
              label="alerts"
              value={1}
              color="bg-amber-50 text-amber-700 border-amber-200"
            />
            <StatPill
              icon={<Lightbulb className="h-3 w-3" />}
              label="insights"
              value={2}
              color="bg-blue-50 text-blue-700 border-blue-200"
            />
          </div>
        )}

        <div className="ml-auto flex items-center gap-1.5">
          {hasData && (
            <>
              <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-border bg-card hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                <Eye className="h-3.5 w-3.5" />
                View
              </button>
              <button
                onClick={onExport}
                disabled={isExporting}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-border bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {isExporting
                  ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  : <Download className="h-3.5 w-3.5" />}
                {isExporting ? "Exporting…" : "Export PDF"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function AnalysisSkeleton({ onExport, isExporting }: { onExport: () => void; isExporting: boolean }) {
  return (
    <div className="flex flex-col h-full bg-background">
      <InsightHeader hasData={false} onExport={onExport} isExporting={isExporting} />
      <div className="flex-1 overflow-y-auto scroll-primary p-6 space-y-5">
        {/* Header card */}
        <div className="border border-border bg-card p-5 space-y-3">
          <Skeleton className="h-5 w-44" />
          <div className="flex gap-6">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-3 w-36" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
        {/* Patient row */}
        <div className="border border-border bg-card p-4 flex gap-6">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-24" />
        </div>
        {/* Table */}
        <div className="border border-border overflow-hidden">
          <div className="flex gap-4 p-3.5 bg-muted border-b border-border">
            <Skeleton className="h-3 flex-1" />
            <Skeleton className="h-3 flex-1" />
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-3 w-20" />
          </div>
          {[1, 2, 3].map(i => (
            <div key={i} className="flex gap-4 p-3.5 border-b border-border last:border-0">
              <Skeleton className="h-3 flex-1" />
              <Skeleton className="h-3 flex-1" />
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-3 w-20" />
            </div>
          ))}
        </div>
        {/* Cards grid */}
        <div className="grid grid-cols-2 gap-4">
          {[0, 1].map(i => (
            <div key={i} className="border border-border bg-card p-4 space-y-3">
              <Skeleton className="h-4 w-24" />
              {[1, 2, 3].map(j => (
                <div key={j} className="flex items-start gap-2">
                  <Skeleton className="h-3 w-3 mt-0.5 shrink-0" />
                  <Skeleton className="h-3 w-full" />
                </div>
              ))}
            </div>
          ))}
        </div>
        <div className="border border-border bg-card p-4 space-y-3">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-5/6" />
        </div>
      </div>
    </div>
  );
}

// ── Main Analysis Page ────────────────────────────────────────────────────────
export default function Analysis() {
  const location = useLocation();
  const navigate = useNavigate();
  const dashboardExportRef = useRef<(() => Promise<void>) | null>(null);
  const hasPendingFile = getPendingFile() !== null;

  const [isExporting, setIsExporting] = useState(false);
  const [loading, setLoading] = useState(hasPendingFile);
  const [markdown, setMarkdown] = useState<any>(null);
  const [error, setError] = useState<string | null>(
    hasPendingFile ? null : "No file to analyze. Please go back and select a file.",
  );

  const state = location.state as {
    previewUrl?: string; fileName?: string; fileSizeMb?: string; isPdf?: boolean;
  } | null;

  const previewUrl  = state?.previewUrl  ?? null;
  const fileName    = state?.fileName    ?? "";
  const fileSizeMb  = state?.fileSizeMb  ?? "0";
  const isPdf       = state?.isPdf       ?? false;

  const handleExportPdf = useCallback(async () => {
    if (!dashboardExportRef.current) return;
    setIsExporting(true);
    try {
      await dashboardExportRef.current();
      showToast.success("PDF exported successfully!");
    } catch {
      showToast.error("Failed to export PDF. Please try again.");
    } finally {
      setIsExporting(false);
    }
  }, []);

  useEffect(() => {
    const pendingFile = getPendingFile();
    if (!pendingFile) return;
    let cancelled = false;

    const analyze = async () => {
      setLoading(true);
      setError(null);
      try {
        const fd = new FormData();
        fd.append("file", pendingFile);
        const apiBase = (import.meta.env.VITE_API_URL as string) || "";
        const resp = await fetch(`${apiBase}/upload-file`, { method: "POST", body: fd });
        if (!resp.ok) {
          const text = await resp.text();
          throw Object.assign(new Error(text || resp.statusText), { status: resp.status });
        }
        const data = await resp.json();
        if (!cancelled) {
          setMarkdown(data.markdown || data.markdown_full || null);
          showToast.success("Analysis complete!");
        }
      } catch (err: any) {
        if (!cancelled) {
          const message = getReadableError(err, err?.status);
          setError(message);
          showToast.error(message);
        }
      } finally {
        clearPendingFile();
        if (!cancelled) setLoading(false);
      }
    };

    analyze();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!previewUrl) navigate("/", { replace: true });
  }, [previewUrl, navigate]);

  if (!previewUrl) return null;

  // ── Status helpers ──────────────────────────────────────────────────────────
  const statusColor = loading
    ? "bg-amber-400"
    : error
    ? "bg-destructive"
    : "bg-green-500";

  const statusLabel = loading
    ? "Analyzing…"
    : error
    ? "Error"
    : "Complete";

  return (
    <div className="h-screen bg-background text-foreground flex flex-col overflow-hidden">

      {/* ── Navbar ─────────────────────────────────────────────────────────── */}
      <Navbar
        stickyHeader={false}
        rightSlot={
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-muted-foreground border border-border hover:bg-muted hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back
            </button>
            {markdown && (
              <button
                onClick={handleExportPdf}
                disabled={isExporting}
                className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium bg-primary text-primary-foreground border border-border hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {isExporting
                  ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  : <Download className="h-3.5 w-3.5" />}
                {isExporting ? "Exporting…" : "Export PDF"}
              </button>
            )}
          </div>
        }
      />

      {/* ── Status strip ───────────────────────────────────────────────────── */}
      <div className="shrink-0 h-10 border-b border-border bg-card flex items-center px-6">
        <div className="max-w-screen-2xl w-full mx-auto flex items-center justify-between">

          {/* Left: breadcrumb + status */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="font-medium text-foreground">Prescription Analysis</span>
              <span>/</span>
              <span className="truncate max-w-[200px]">{fileName}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className={`inline-flex h-2 w-2 rounded-full ${statusColor} ${loading ? "animate-pulse" : ""}`} />
              <span className="text-xs font-medium text-muted-foreground">{statusLabel}</span>
            </div>
          </div>

          {/* Right: security note */}
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground">
            <Lock className="h-3 w-3" />
            <span>Session only — data is never stored</span>
          </div>
        </div>
      </div>

      {/* ── Two-column main ────────────────────────────────────────────────── */}
      <div className="flex-1 min-h-0">
        <div className="h-full max-w-screen-2xl mx-auto">
          <ResizablePanelGroup
            orientation="horizontal"
            className="h-full border-x border-border"
          >
            {/* ── Left: Document viewer ── */}
            <ResizablePanel defaultSize="42%" minSize="28%" maxSize="58%">
              <div className="flex flex-col h-full overflow-hidden">
                <DocumentViewer
                  previewUrl={previewUrl}
                  isPdf={isPdf}
                  fileName={fileName}
                  fileSizeMb={fileSizeMb}
                />
              </div>
            </ResizablePanel>

            <ResizableHandle withHandle />

            {/* ── Right: Insight report ── */}
            <ResizablePanel defaultSize="58%" minSize="42%" maxSize="72%">
              <div className="flex flex-col h-full overflow-hidden bg-background">

                {loading ? (
                  <AnalysisSkeleton onExport={handleExportPdf} isExporting={isExporting} />

                ) : error ? (
                  <div className="flex flex-col h-full">
                    <InsightHeader hasData={false} onExport={handleExportPdf} isExporting={isExporting} />
                    <div className="flex flex-col items-center justify-center flex-1 gap-5 p-10 text-center">
                      <div className="p-6 border border-border bg-card max-w-sm w-full">
                        <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
                          <AlertCircle className="h-6 w-6 text-destructive" />
                        </div>
                        <h3 className="text-sm font-semibold text-foreground mb-1">Analysis Failed</h3>
                        <p className="text-xs text-muted-foreground leading-relaxed">{error}</p>
                      </div>
                      <button
                        onClick={() => navigate("/")}
                        className="flex items-center gap-2 px-5 py-2.5 text-xs font-medium border border-border bg-card hover:bg-muted transition-colors"
                      >
                        <ArrowLeft className="h-3.5 w-3.5" />
                        Go Back &amp; Try Again
                      </button>
                    </div>
                  </div>

                ) : markdown ? (
                  <div className="flex flex-col h-full">
                    <InsightHeader hasData={true} onExport={handleExportPdf} isExporting={isExporting} />
                    <div className="flex-1 overflow-y-auto scroll-primary p-6">
                      <PrescriptionDashboard
                        data={markdown}
                        exportRef={dashboardExportRef}
                      />
                    </div>
                  </div>

                ) : null}

              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      </div>

      {/* ── Disclaimer footer ──────────────────────────────────────────────── */}
      <div className="shrink-0 h-9 border-t border-border bg-card flex items-center px-6 print:hidden">
        <div className="max-w-screen-2xl w-full mx-auto flex items-center gap-2">
          <Info className="h-3 w-3 text-muted-foreground shrink-0" />
          <p className="text-[11px] text-muted-foreground">
            <span className="font-semibold text-foreground">Disclaimer:</span>{" "}
            For informational purposes only. Not a substitute for professional medical advice. Always consult your doctor.
          </p>
        </div>
      </div>

    </div>
  );
}
