import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Upload, FileText, AlertCircle, Loader2, Image as ImageIcon } from "lucide-react";

export default function FileUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [markdown, setMarkdown] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMarkdown(null);
    setError(null);
    const f = e.target.files && e.target.files[0];
    setFile(f || null);
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
      const uploadUrl = `${apiBase}/upload-file`;

      const resp = await fetch(uploadUrl, {
        method: "POST",
        body: fd,
      });

      if (!resp.ok) {
        const text = await resp.text();
        throw new Error(text || resp.statusText);
      }

      const data = await resp.json();
      setMarkdown(data.markdown || data.markdown_full || "(no markdown returned)");
    } catch (err: any) {
      console.error(err);
      setError(err?.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-lg border-muted">
      <CardHeader>
        <CardTitle className="text-2xl flex items-center gap-2">
          <ImageIcon className="w-6 h-6 text-primary" />
          Upload Image to Parse
        </CardTitle>
        <CardDescription>
          Select an image containing text, and we'll extract it as Markdown.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col gap-4">
          <div className="grid w-full items-center gap-1.5">
            <Input 
              id="picture" 
              type="file" 
              accept="image/*" 
              onChange={handleFileChange}
              className="cursor-pointer file:cursor-pointer" 
            />
          </div>
          
          <Button 
            onClick={handleUpload} 
            disabled={!file || loading}
            className="w-full sm:w-auto self-start"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Parsing...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Upload & Parse
              </>
            )}
          </Button>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {markdown && (
          <div className="mt-6 space-y-3">
            <div className="flex items-center gap-2 text-lg font-semibold">
              <FileText className="w-5 h-5 text-primary" />
              <h4>Parsed Markdown</h4>
            </div>
            <div className="bg-muted p-4 rounded-md border text-sm text-foreground overflow-auto max-h-[400px]">
              <pre className="whitespace-pre-wrap font-mono">{markdown}</pre>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
