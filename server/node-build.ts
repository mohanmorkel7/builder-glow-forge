import path from "path";
import { createServer } from "./index";
import express from "express";
import finopsScheduler from "./services/finopsScheduler";
import { fileURLToPath } from 'url';

const app = createServer();
const port = process.env.PORT || 5000;

// In production, serve the built SPA files
// const __dirname = import.meta.dirname;
// const distPath = path.join(__dirname, "../frontend");

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.join(__dirname, "../frontend");

// Serve static files
app.use(express.static(distPath));

app.get("/{*splat}", (req, res) => {
  if (req.path.startsWith("/api/") || req.path.startsWith("/health")) {
    return res.status(404).json({ error: "API endpoint not found" });
  }

  res.sendFile(path.join(distPath, "index.html"));
});

// // Handle React Router - serve index.html for all non-API routes
// app.get("*", (req, res) => {
//   // Don't serve index.html for API routes
//   if (req.path.startsWith("/api/") || req.path.startsWith("/health")) {
//     return res.status(404).json({ error: "API endpoint not found" });
//   }

//   res.sendFile(path.join(distPath, "index.html"));
// });

app.listen(port, () => {
  console.log(`🚀 Fusion Starter server running on port ${port}`);
  console.log(`📱 Frontend: http://localhost:${port}`);
  console.log(`🔧 API: http://localhost:${port}/api`);

  // Initialize FinOps scheduler for automated task execution and SLA monitoring
  try {
    finopsScheduler.initialize();
    console.log(`⏰ FinOps Scheduler initialized successfully`);
  } catch (error) {
    console.error(`❌ Failed to initialize FinOps Scheduler:`, error);
  }
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("🛑 Received SIGTERM, shutting down gracefully");
  finopsScheduler.stop();
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("🛑 Received SIGINT, shutting down gracefully");
  finopsScheduler.stop();
  process.exit(0);
});
