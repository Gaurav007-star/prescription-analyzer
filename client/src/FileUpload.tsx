import React, { useState } from "react";

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
      const base = apiBase ? apiBase.replace(/\/$/, "") : "";
      const uploadUrl = base ? `${base}/upload-file` : "/upload-file";

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
    <div style={{ padding: 16, border: "1px solid #ddd", borderRadius: 8, maxWidth: 720 }}>
      <h3>Upload image to parse</h3>
      <input type="file" accept="image/*" onChange={handleFileChange} />
      <div style={{ marginTop: 8 }}>
        <button onClick={handleUpload} disabled={!file || loading}>
          {loading ? "Parsing..." : "Upload & Parse"}
        </button>
      </div>

      {error && (
        <div style={{ marginTop: 8, color: "#b00020" }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {markdown && (
        <div style={{ marginTop: 12 }}>
          <h4>Parsed Markdown</h4>
          <pre style={{ whiteSpace: "pre-wrap", background: "#f7f7f7", padding: 12 }}>{markdown}</pre>
        </div>
      )}
    </div>
  );
}
