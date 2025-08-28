import { Router, Request, Response } from "express";
import { pool, isDatabaseAvailable } from "../database/connection";

const router = Router();

// Get database connection status and configuration
router.get("/status", async (req: Request, res: Response) => {
  try {
    const isConnected = await isDatabaseAvailable();

    const status = {
      database: {
        connected: isConnected,
        host: process.env.PG_HOST || "10.30.11.95",
        port: Number(process.env.PG_PORT) || 2019,
        database: process.env.PG_DB || "crm_test",
        user: process.env.PG_USER || "crmuser",
      },
      endpoints: {
        usingRealData: isConnected,
        fallbackToMock: !isConnected,
        availableRoutes: {
          "/api/leads": isConnected ? "DATABASE" : "MOCK",
          "/api/vc": isConnected ? "DATABASE" : "MOCK",
          "/api/follow-ups": isConnected ? "DATABASE" : "MOCK",
          "/api/users": isConnected ? "DATABASE" : "MOCK",
          "/api/clients": isConnected ? "DATABASE" : "MOCK",
          "/api/templates": isConnected ? "DATABASE" : "MOCK",
          "/api/tickets": isConnected ? "DATABASE" : "MOCK",

          // Production routes (database-only)
          "/api/leads-production": isConnected ? "DATABASE" : "UNAVAILABLE",
          "/api/templates-production": isConnected ? "DATABASE" : "UNAVAILABLE",
          "/api/activity-production": isConnected ? "DATABASE" : "UNAVAILABLE",
          "/api/notifications-production": isConnected
            ? "DATABASE"
            : "UNAVAILABLE",
          "/api/admin": isConnected ? "DATABASE" : "UNAVAILABLE",
          "/api/finops-production": isConnected ? "DATABASE" : "UNAVAILABLE",
        },
      },
      recommendations: isConnected
        ? [
            "✅ Database is connected - all endpoints using real-time data",
            "🔧 Production routes are available and active",
          ]
        : [
            "⚠️ Database not connected - endpoints using mock data fallback",
            "🔧 To use real-time data, ensure PostgreSQL is running and accessible",
            "💡 Set environment variables: PG_HOST, PG_PORT, PG_USER, PG_PASSWORD, PG_DB",
            "🚀 Production routes are unavailable without database connection",
          ],
    };

    res.json(status);
  } catch (error) {
    res.status(500).json({
      error: "Failed to check database status",
      message: error.message,
    });
  }
});

// Test database connection
router.post("/test", async (req: Request, res: Response) => {
  try {
    const client = await pool.connect();
    const result = await client.query(
      "SELECT NOW() as server_time, version() as version",
    );
    client.release();

    res.json({
      success: true,
      message: "Database connection successful",
      serverTime: result.rows[0].server_time,
      version: result.rows[0].version,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Database connection failed",
      error: error.message,
      troubleshooting: [
        "Check if PostgreSQL is running",
        "Verify connection parameters (host, port, user, password, database)",
        "Ensure network connectivity to database server",
        "Check firewall settings",
      ],
    });
  }
});

// Force refresh database connection
router.post("/reconnect", async (req: Request, res: Response) => {
  try {
    // Test new connection
    const isConnected = await isDatabaseAvailable();

    if (isConnected) {
      res.json({
        success: true,
        message: "Database reconnection successful",
        status: "All endpoints now using real-time database data",
      });
    } else {
      res.status(500).json({
        success: false,
        message: "Database reconnection failed",
        status: "Endpoints continue using mock data fallback",
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Reconnection attempt failed",
      error: error.message,
    });
  }
});

export default router;
