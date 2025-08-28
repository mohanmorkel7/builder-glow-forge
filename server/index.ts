import "dotenv/config";
import express from "express";
import cors from "cors";

// Extend Express Request interface for raw body
declare global {
  namespace Express {
    interface Request {
      rawBody?: Buffer;
    }
  }
}
import { initializeDatabase } from "./database/connection";
import { handleDemo } from "./routes/demo";
import usersRouter from "./routes/users";
import clientsRouter from "./routes/clients";
import templatesRouter from "./routes/templates";
import deploymentsRouter from "./routes/deployments";
import onboardingRouter from "./routes/onboarding";
import leadsRouter from "./routes/leads";
import vcRouter from "./routes/vc";
import followUpsRouter from "./routes/follow-ups";
import filesRouter from "./routes/files";
import ticketsRouter from "./routes/tickets";
import finopsRouter from "./routes/finops";
import workflowRouter from "./routes/workflow";
import databaseStatusRouter from "./routes/database-status";
import ssoAuthRouter from "./routes/sso-auth";
import azureSyncRouter from "./routes/azure-sync";

// Production routes (database-only, no mock fallback)
import templatesProductionRouter from "./routes/templates-production";
import activityProductionRouter from "./routes/activity-production";
import notificationsProductionRouter from "./routes/notifications-production";
import adminProductionRouter from "./routes/admin-production";
import finopsProductionRouter from "./routes/finops-production";

export function createServer() {
  const app = express();

  // Initialize database with enhanced schema (non-blocking)
  setTimeout(() => {
    initializeDatabase().catch((error) => {
      console.error("Database initialization failed:", error);
      console.log("Server will continue with mock data fallback");
    });
  }, 1000); // Delay initialization to prevent blocking server startup

  // Middleware
  app.use(cors());

  // Handle large file uploads with proper error handling - skip multipart/form-data for multer
  app.use((req, res, next) => {
    // Skip JSON parsing for multipart/form-data to avoid conflicts with multer
    if (req.headers["content-type"]?.startsWith("multipart/form-data")) {
      return next();
    }
    express.json({
      limit: "50mb",
      extended: true,
      parameterLimit: 50000,
      verify: (req, res, buf) => {
        // Add raw body for debugging
        req.rawBody = buf;
      },
    })(req, res, next);
  });

  app.use((req, res, next) => {
    // Skip URL-encoded parsing for multipart/form-data to avoid conflicts with multer
    if (req.headers["content-type"]?.startsWith("multipart/form-data")) {
      return next();
    }
    express.urlencoded({
      extended: true,
      limit: "50mb",
      parameterLimit: 50000,
    })(req, res, next);
  });

  // Add raw body parser for specific content types (exclude multipart/form-data to allow multer to handle it)
  app.use(
    express.raw({
      limit: "50mb",
      type: ["application/octet-stream"],
    }),
  );

  // Error handling middleware for payload too large
  app.use((error: any, req: any, res: any, next: any) => {
    if (error && error.type === "entity.too.large") {
      console.error("File too large error:", error);
      return res.status(413).json({
        error: "File too large",
        message: "The uploaded file exceeds the maximum size limit of 50MB",
        maxSize: "50MB",
      });
    }
    next(error);
  });

  // Add headers for large upload support
  app.use((req, res, next) => {
    // Allow large requests
    res.setHeader("Access-Control-Max-Age", "86400");
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, Content-Length, X-Requested-With",
    );

    // Set keep-alive for large uploads
    if (
      req.headers["content-length"] &&
      parseInt(req.headers["content-length"]) > 1024 * 1024
    ) {
      res.setHeader("Connection", "keep-alive");
      res.setHeader("Keep-Alive", "timeout=120, max=1000");
    }

    next();
  });

  // Debug middleware to log all requests
  app.use((req, res, next) => {
    const contentLength = req.headers["content-length"] || 0;
    console.log(
      `[${new Date().toISOString()}] ${req.method} ${req.url} (${contentLength} bytes)`,
    );
    next();
  });

  // API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  // Test endpoint
  app.get("/api/test", (_req, res) => {
    res.json({ message: "Server is working!" });
  });

  // Comprehensive health check endpoint
  app.get("/api/health", async (_req, res) => {
    const healthCheck = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      server: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        version: process.version,
      },
      routes: {
        finops: "loaded",
        finops_production: "loaded",
        notifications_production: "loaded",
      },
      environment: {
        node_env: process.env.NODE_ENV || "development",
        database_url: process.env.DATABASE_URL
          ? "configured"
          : "not configured",
      },
    };

    try {
      // Test database connection if configured
      if (process.env.DATABASE_URL) {
        const { pool } = await import("./database/connection");
        await pool.query("SELECT 1");
        healthCheck.database = { status: "connected" };
      } else {
        healthCheck.database = { status: "not configured" };
      }
    } catch (error) {
      healthCheck.database = {
        status: "error",
        message: error.message,
      };
      healthCheck.status = "degraded";
    }

    res.json(healthCheck);
  });

  // Test login endpoint
  app.post("/api/test-login", (req, res) => {
    const { email, password } = req.body;
    res.json({ message: "Test login endpoint working", email, password });
  });

  // Main API routes with error handling
  try {
    app.use("/api/users", usersRouter);
    console.log("Users router loaded successfully");
  } catch (error) {
    console.error("Error loading users router:", error);
  }

  try {
    app.use("/api/clients", clientsRouter);
    console.log("Clients router loaded successfully");
  } catch (error) {
    console.error("Error loading clients router:", error);
  }

  try {
    app.use("/api/templates", templatesRouter);
    console.log("Templates router loaded successfully");
  } catch (error) {
    console.error("Error loading templates router:", error);
  }

  try {
    app.use("/api/deployments", deploymentsRouter);
    console.log("Deployments router loaded successfully");
  } catch (error) {
    console.error("Error loading deployments router:", error);
  }

  try {
    app.use("/api/onboarding", onboardingRouter);
    console.log("Onboarding router loaded successfully");
  } catch (error) {
    console.error("Error loading onboarding router:", error);
  }

  try {
    app.use("/api/leads", leadsRouter);
    console.log("Leads router loaded successfully");
  } catch (error) {
    console.error("Error loading leads router:", error);
  }

  try {
    app.use("/api/vc", vcRouter);
    console.log("VC router loaded successfully");
  } catch (error) {
    console.error("Error loading VC router:", error);
  }

  try {
    app.use("/api/follow-ups", followUpsRouter);
    console.log("Follow-ups router loaded successfully");
  } catch (error) {
    console.error("Error loading follow-ups router:", error);
  }

  try {
    app.use("/api/files", filesRouter);
    console.log("Files router loaded successfully");
  } catch (error) {
    console.error("Error loading files router:", error);
  }

  try {
    app.use("/api/tickets", ticketsRouter);
    console.log("Tickets router loaded successfully");
  } catch (error) {
    console.error("Error loading tickets router:", error);
  }

  try {
    app.use("/api/finops", finopsRouter);
    console.log("FinOps router loaded successfully");
  } catch (error) {
    console.error("Error loading FinOps router:", error);
  }

  try {
    app.use("/api/workflow", workflowRouter);
    console.log("Workflow router loaded successfully");
  } catch (error) {
    console.error("Error loading Workflow router:", error);
  }

  try {
    app.use("/api/database", databaseStatusRouter);
    console.log("Database status router loaded successfully");
  } catch (error) {
    console.error("Error loading Database status router:", error);
  }

  // SSO Authentication router
  try {
    app.use("/api/auth", ssoAuthRouter);
    console.log("SSO Auth router loaded successfully");
  } catch (error) {
    console.error("Error loading SSO Auth router:", error);
  }

  // Azure sync router
  try {
    app.use("/api/azure-sync", azureSyncRouter);
    console.log("Azure sync router loaded successfully");
  } catch (error) {
    console.error("Error loading Azure sync router:", error);
  }

  // Add a simple notifications route that redirects to workflow notifications
  try {
    app.get("/api/notifications", (req, res) => {
      // Redirect to workflow notifications with the same query parameters
      const queryString =
        Object.keys(req.query).length > 0
          ? "?" +
            new URLSearchParams(req.query as Record<string, string>).toString()
          : "";

      // Proxy the request to workflow notifications
      res.redirect(`/api/workflow/notifications${queryString}`);
    });
    console.log("Main notifications route added successfully");
  } catch (error) {
    console.error("Error adding notifications route:", error);
  }

  // Production routes (database-only, no mock fallback)
  try {
    app.use("/api/admin", adminProductionRouter);
    console.log("Admin production router loaded successfully");
  } catch (error) {
    console.error("Error loading Admin production router:", error);
  }

  try {
    app.use("/api/templates-production", templatesProductionRouter);
    console.log("Templates production router loaded successfully");
  } catch (error) {
    console.error("Error loading Templates production router:", error);
  }

  try {
    app.use("/api/activity-production", activityProductionRouter);
    console.log("Activity production router loaded successfully");
  } catch (error) {
    console.error("Error loading Activity production router:", error);
  }

  try {
    app.use("/api/notifications-production", notificationsProductionRouter);
    console.log("Notifications production router loaded successfully");
  } catch (error) {
    console.error("Error loading Notifications production router:", error);
  }

  try {
    app.use("/api/finops-production", finopsProductionRouter);
    console.log("FinOps production router loaded successfully");
  } catch (error) {
    console.error("Error loading FinOps production router:", error);
  }

  return app;
}
