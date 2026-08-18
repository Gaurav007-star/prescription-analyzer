import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Upload,
  AlertCircle,
  FileText,
  X,
  ArrowRight,
  ImageIcon,
} from "lucide-react";
import { showToast } from "@/components/custom/Toast";
import { setPendingFile } from "@/lib/file-store";

export default function FileUpload() {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const applyFile = (f: File) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (!allowed.includes(f.type)) {
      showToast.error("Unsupported file type. Please upload JPG, PNG, WEBP, or PDF.");
      return;
    }
    if (f.size > 20 * 1024 * 1024) {
      showToast.error("File is too large. Maximum size is 20 MB.");
      return;
    }
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
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleAnalyze = () => {
    if (!file) {
      showToast.error("Please select a file first.");
      return;
    }
    if (!previewUrl) return;

    // Store the File in module-level holder (File isn't serializable for router state)
    setPendingFile(file);

    navigate("/analysis", {
      state: {
        previewUrl,
        fileName: file.name,
        fileSizeMb: (file.size / 1024 / 1024).toFixed(2),
        isPdf: file.type === "application/pdf",
      },
    });
  };

  const isPdf = file?.type === "application/pdf";
  const fileSizeMb = file ? (file.size / 1024 / 1024).toFixed(2) : "0";

  return (
    <div className="w-full max-w-3xl mx-auto py-6 animate-in fade-in duration-500">
      {!file ? (
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
              <p className="text-sm font-bold truncate">{file.name}</p>
              <p className="text-xs opacity-60">{fileSizeMb} MB</p>
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
              onClick={handleAnalyze}
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
  );
}
