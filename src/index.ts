import "dotenv/config";
import express from "express";
import cors from "cors";
import fs from "fs";
import os from "os";
import multer from "multer";

import LlamaCloud from "@llamaindex/llama-cloud";

const client = new LlamaCloud({
  apiKey: process.env.LLAMA_API_KEY || "",
});

const app = express();
app.use(cors({
  origin: process.env.CORS_ORIGIN || "*",
}));
// allow large base64 payloads from clients (adjust limit as needed)
app.use(express.json({ limit: "20mb" }));

// multer config: store uploads in the OS temp dir; we'll remove files after processing
const upload = multer({ dest: os.tmpdir(), limits: { fileSize: 20 * 1024 * 1024 } });

// POST /upload-file
// Accepts multipart/form-data with a single file field named 'file'
app.post("/upload-file", upload.single("file"), async (req, res) => {
  try {
    const f = req.file as Express.Multer.File | undefined;
    if (!f) return res.status(400).json({ error: "No file uploaded (field name must be 'file')" });
    console.log("File details : ", f);

    const readStream = fs.createReadStream(f.path);
    try {
      const fileObj = await client.files.create({
        file: readStream,
        purpose: "parse",
        // filename: f.originalname || path.basename(f.path),
      });

      const result = await client.parsing.parse({
        file_id: fileObj.id,
        tier: "agentic",
        expand: ["markdown_full"],
        version: "latest",
      });

      console.log("Result: ", result);


      return res.json({ markdown: result.markdown_full });
    } finally {
      readStream.destroy();
      await fs.promises.unlink(f.path).catch(() => { });
    }
  } catch (err: any) {
    console.error("/upload-file error:", err);
    return res.status(500).json({ error: "Upload or parsing failed", detail: err?.message || String(err) });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server listening on http://localhost:${PORT}`));
