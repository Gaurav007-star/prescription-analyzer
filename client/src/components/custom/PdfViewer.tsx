import { useState, useCallback } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";

// Use a CDN-hosted PDF.js worker — no bundler config needed
pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;

interface PdfViewerProps {
  url: string;
}

const SCALE_MIN = 0.5;
const SCALE_MAX = 2.5;
const SCALE_STEP = 0.25;

export default function PdfViewer({ url }: PdfViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [isLoading, setIsLoading] = useState(true);

  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setPageNumber(1);
    setIsLoading(false);
  }, []);

  const goToPrevPage = () => setPageNumber((p) => Math.max(p - 1, 1));
  const goToNextPage = () => setPageNumber((p) => Math.min(p + 1, numPages));
  const zoomOut = () => setScale((s) => Math.max(+(s - SCALE_STEP).toFixed(2), SCALE_MIN));
  const zoomIn = () => setScale((s) => Math.min(+(s + SCALE_STEP).toFixed(2), SCALE_MAX));

  return (
    <div className="flex flex-col h-full w-full overflow-hidden">
      {/* Page navigation + zoom toolbar */}
      <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-border bg-muted/40 shrink-0">
        {/* Page controls */}
        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={goToPrevPage}
            disabled={pageNumber <= 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-xs text-muted-foreground font-medium select-none whitespace-nowrap px-1">
            Page{" "}
            <span className="text-foreground font-semibold">{pageNumber}</span>
            {" / "}
            <span className="text-foreground font-semibold">{numPages || "—"}</span>
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={goToNextPage}
            disabled={pageNumber >= numPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Zoom controls */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={zoomOut}
            disabled={scale <= SCALE_MIN}
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-xs font-mono text-muted-foreground w-12 text-center select-none">
            {Math.round(scale * 100)}%
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={zoomIn}
            disabled={scale >= SCALE_MAX}
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* PDF canvas area */}
      <div className="flex-1 overflow-auto bg-muted/20 flex items-start justify-center py-4 px-2">
        {isLoading && (
          <div className="flex flex-col items-center gap-3 text-muted-foreground mt-16">
            <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            <span className="text-sm">Loading document…</span>
          </div>
        )}
        <Document
          file={url}
          onLoadSuccess={onDocumentLoadSuccess}
          onLoadError={() => setIsLoading(false)}
          loading={null}
          className="flex justify-center"
        >
          <Page
            pageNumber={pageNumber}
            scale={scale}
            className="shadow-xl rounded overflow-hidden"
            loading={null}
            renderTextLayer={true}
            renderAnnotationLayer={true}
          />
        </Document>
      </div>
    </div>
  );
}
