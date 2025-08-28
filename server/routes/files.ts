import { Router, Request, Response } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";

const router = Router();

// Configure multer for file uploads
const uploadsDir = path.join(process.cwd(), "public", "uploads");

// Ensure uploads directory exists
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp
    const timestamp = Date.now();
    const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, "_");
    cb(null, `${timestamp}_${sanitizedName}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow all file types for now, but could be restricted
    console.log(
      "File upload - field name:",
      file.fieldname,
      "filename:",
      file.originalname,
    );
    cb(null, true);
  },
});

// Chunked upload endpoint for large files
router.post("/upload-chunk", async (req: Request, res: Response) => {
  try {
    const { chunk, filename, chunkIndex, totalChunks } = req.body;

    if (!chunk || !filename || chunkIndex === undefined || !totalChunks) {
      return res.status(400).json({ error: "Missing required chunk data" });
    }

    const chunkDir = path.join(uploadsDir, "chunks");
    if (!fs.existsSync(chunkDir)) {
      fs.mkdirSync(chunkDir, { recursive: true });
    }

    const chunkPath = path.join(chunkDir, `${filename}.chunk.${chunkIndex}`);

    // Decode base64 chunk data
    const chunkBuffer = Buffer.from(chunk, "base64");
    fs.writeFileSync(chunkPath, chunkBuffer);

    console.log(
      `Received chunk ${chunkIndex + 1}/${totalChunks} for ${filename}`,
    );

    // If this is the last chunk, combine all chunks
    if (parseInt(chunkIndex) === parseInt(totalChunks) - 1) {
      const finalPath = path.join(uploadsDir, `${Date.now()}_${filename}`);
      const writeStream = fs.createWriteStream(finalPath);

      for (let i = 0; i < totalChunks; i++) {
        const chunkFile = path.join(chunkDir, `${filename}.chunk.${i}`);
        if (fs.existsSync(chunkFile)) {
          const chunkData = fs.readFileSync(chunkFile);
          writeStream.write(chunkData);
          fs.unlinkSync(chunkFile); // Clean up chunk file
        }
      }

      writeStream.end();

      const stats = fs.statSync(finalPath);
      console.log(`File assembled: ${filename} (${stats.size} bytes)`);

      return res.json({
        success: true,
        file: {
          originalName: filename,
          filename: path.basename(finalPath),
          size: stats.size,
          path: `/uploads/${path.basename(finalPath)}`,
        },
        message: "File uploaded successfully via chunked upload",
      });
    }

    res.json({
      success: true,
      message: `Chunk ${parseInt(chunkIndex) + 1}/${totalChunks} received`,
    });
  } catch (error) {
    console.error("Error in chunked upload:", error);
    res.status(500).json({ error: "Failed to process chunk" });
  }
});

// Test endpoint to verify routing
router.get("/test", (req: Request, res: Response) => {
  res.json({
    message: "Files router is working",
    timestamp: new Date().toISOString(),
  });
});

// Simple POST test endpoint to verify POST routing works
router.post("/test-post", (req: Request, res: Response) => {
  console.log("Test POST endpoint hit");
  console.log("Headers:", req.headers);
  console.log("Body:", req.body);
  res.json({
    message: "POST routing works",
    timestamp: new Date().toISOString(),
    headers: req.headers,
    hasBody: !!req.body,
  });
});

// Upload files endpoint - flexible to handle any field names
router.post("/upload", (req: Request, res: Response) => {
  try {
    console.log("=== UPLOAD REQUEST START ===");
    console.log("Headers:", req.headers);
    console.log("Content-Type:", req.headers["content-type"]);
    console.log("Content-Length:", req.headers["content-length"]);

    // Ensure we always return JSON
    res.setHeader("Content-Type", "application/json");

    // Use the more flexible upload.any() instead of upload.array()
    upload.any()(req, res, (err) => {
      if (err) {
        console.error("❌ Multer upload error:", err);
        console.error("Error code:", err.code);
        console.error("Error message:", err.message);

        // Ensure we always return a proper JSON response
        try {
          if (err.code === "LIMIT_FILE_SIZE") {
            return res.status(413).json({
              error: "File too large",
              message: "File size exceeds the maximum limit of 50MB",
              maxSize: "50MB",
            });
          }

          if (err.code === "LIMIT_FILE_COUNT") {
            return res.status(400).json({
              error: "Too many files",
              message: "Maximum number of files exceeded",
            });
          }

          // Handle specific multer/busboy errors
          if (err.message && err.message.includes("Unexpected end of form")) {
            return res.status(400).json({
              error: "Upload corrupted",
              message:
                "File upload was interrupted or corrupted. Please try again.",
            });
          }

          if (err.message && err.message.includes("Missing boundary")) {
            return res.status(400).json({
              error: "Invalid form data",
              message:
                "Invalid multipart form data. Please refresh and try again.",
            });
          }

          // Generic error response
          return res.status(400).json({
            error: "Upload failed",
            message: err.message || "Unknown upload error",
            errorCode: err.code || "UNKNOWN",
          });
        } catch (responseError) {
          console.error("❌ Failed to send error response:", responseError);
          // Last resort - send plain text
          return res
            .status(500)
            .send("Upload failed: " + (err.message || "Unknown error"));
        }
      }

      // Continue with successful upload processing
      try {
        console.log("=== MULTER PROCESSING COMPLETE ===");
        console.log("req.files:", req.files);
        console.log("req.body:", req.body);
        console.log("req.files type:", typeof req.files);
        console.log("req.files is array:", Array.isArray(req.files));

        // With upload.any(), req.files is an array of files
        if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
          console.log("❌ No files received in upload request");
          console.log("req.files details:", {
            exists: !!req.files,
            isArray: Array.isArray(req.files),
            length: req.files ? (req.files as any).length : "N/A",
            type: typeof req.files,
          });
          return res.status(400).json({
            error: "No files uploaded",
            message: "No files were received in the request",
            debug: {
              hasFiles: !!req.files,
              isArray: Array.isArray(req.files),
              length: req.files ? (req.files as any).length : "N/A",
            },
          });
        }

        const files = req.files as Express.Multer.File[];

        console.log(`✅ Received ${files.length} files for upload`);
        files.forEach((file, index) => {
          console.log(
            `File ${index + 1}: ${file.originalname} (${file.size} bytes) (field: ${file.fieldname})`,
          );
        });

        const uploadedFiles = files.map((file) => ({
          originalName: file.originalname,
          filename: file.filename,
          size: file.size,
          mimetype: file.mimetype,
          path: `/uploads/${file.filename}`,
          fieldname: file.fieldname,
        }));

        console.log(
          `Successfully uploaded ${uploadedFiles.length} files:`,
          uploadedFiles.map((f) => `${f.filename} (${f.size} bytes)`),
        );

        res.json({
          success: true,
          files: uploadedFiles,
          message: `Successfully uploaded ${uploadedFiles.length} file(s)`,
        });
      } catch (error) {
        console.error("❌ Error processing uploaded files:", error);
        return res.status(500).json({
          error: "Failed to process uploaded files",
          message:
            error instanceof Error ? error.message : "Unknown processing error",
        });
      }
    });
  } catch (unexpectedError) {
    console.error("❌ Unexpected error in upload handler:", unexpectedError);
    try {
      res.status(500).json({
        error: "Unexpected server error",
        message: "An unexpected error occurred during upload processing",
        details:
          unexpectedError instanceof Error
            ? unexpectedError.message
            : String(unexpectedError),
      });
    } catch (responseError) {
      console.error("❌ Failed to send error response:", responseError);
      res.status(500).send("Internal server error");
    }
  }
});

// Download file by filename
router.get("/download/:filename", async (req: Request, res: Response) => {
  try {
    const filename = req.params.filename;

    // Security: prevent directory traversal attacks
    const sanitizedFilename = path.basename(filename);

    // Define the uploads directory path
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    const filePath = path.join(uploadsDir, sanitizedFilename);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.log(`File not found: ${filePath}`);
      console.log(`Available files in uploads:`, fs.readdirSync(uploadsDir));
      return res.status(404).json({
        error: "File not found",
        requested: sanitizedFilename,
        path: filePath,
      });
    }

    // Get file stats for proper headers
    const stats = fs.statSync(filePath);

    console.log(`Serving file: ${sanitizedFilename} (${stats.size} bytes)`);

    // Set appropriate headers
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${sanitizedFilename}"`,
    );
    res.setHeader("Content-Type", "application/octet-stream");
    res.setHeader("Content-Length", stats.size.toString());

    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

    fileStream.on("error", (error) => {
      console.error("Error streaming file:", error);
      if (!res.headersSent) {
        res.status(500).json({ error: "Error downloading file" });
      }
    });
  } catch (error) {
    console.error("Error in file download:", error);
    res.status(500).json({ error: "Failed to download file" });
  }
});

// Get file info
router.get("/info/:filename", async (req: Request, res: Response) => {
  try {
    const filename = req.params.filename;
    const sanitizedFilename = path.basename(filename);
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    const filePath = path.join(uploadsDir, sanitizedFilename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "File not found" });
    }

    const stats = fs.statSync(filePath);
    const fileInfo = {
      filename: sanitizedFilename,
      size: stats.size,
      created: stats.birthtime,
      modified: stats.mtime,
      exists: true,
    };

    res.json(fileInfo);
  } catch (error) {
    console.error("Error getting file info:", error);
    res.status(500).json({ error: "Failed to get file info" });
  }
});

export default router;
