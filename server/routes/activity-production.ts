import { Router, Request, Response } from "express";
import { pool } from "../database/connection";

const router = Router();

// Wrapper to ensure all responses are JSON
function jsonResponse(handler: (req: Request, res: Response) => Promise<void>) {
  return async (req: Request, res: Response) => {
    try {
      // Set JSON headers early
      res.setHeader("Content-Type", "application/json");
      await handler(req, res);
    } catch (error) {
      console.error("Unhandled error in route:", error);
      if (!res.headersSent) {
        res.status(500).json({
          error: "Internal server error",
          message: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }
  };
}

// Production database availability check with graceful fallback
async function isDatabaseAvailable() {
  try {
    await pool.query("SELECT 1");
    return true;
  } catch (error) {
    console.log("Database unavailable:", error.message);
    return false;
  }
}

// Mock activity logs for fallback
const mockActivityLogs = [
  {
    id: "1",
    timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
    action: "subtask_status_changed",
    entity_type: "subtask",
    entity_id: "st_001",
    entity_name: "MASTER AND VISA FILE VALIDATION",
    client_name: "ABC Corporation",
    user_name: "John Durairaj",
    user_id: 1,
    client_id: 1,
    details: "Subtask status changed from 'in_progress' to 'completed'",
    status: "completed",
    previous_status: "in_progress",
  },
  {
    id: "2",
    timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(), // 45 minutes ago
    action: "delay_reported",
    entity_type: "subtask",
    entity_id: "st_002",
    entity_name: "SHARING OF THE FILE TO M2P",
    client_name: "ABC Corporation",
    user_name: "John Durairaj",
    user_id: 1,
    client_id: 1,
    details: "Subtask marked as delayed due to external dependency",
    status: "delayed",
    previous_status: "in_progress",
    delay_reason: "External Dependency",
  },
  {
    id: "3",
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    action: "sla_alert",
    entity_type: "subtask",
    entity_id: "st_003",
    entity_name: "VISA - VALIDATION OF THE BASE 2 FILE",
    client_name: "ABC Corporation",
    user_name: "System",
    user_id: null,
    client_id: 1,
    details: "SLA warning - Task will breach SLA in 15 minutes",
    status: "in_progress",
  },
  {
    id: "4",
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
    action: "task_created",
    entity_type: "task",
    entity_id: "t_001",
    entity_name: "Daily Reconciliation Task",
    client_name: "ABC Corporation",
    user_name: "Admin User",
    user_id: 1,
    client_id: 1,
    details: "New FinOps task created for daily reconciliation",
    status: "active",
  },
];

// ===== ACTIVITY LOG ROUTES =====

// Get activity logs with filtering
router.get(
  "/",
  jsonResponse(async (req: Request, res: Response) => {
    try {
      // Set proper JSON headers
      res.setHeader("Content-Type", "application/json");

      console.log("Activity logs request received:", {
        query: req.query,
        url: req.url,
        method: req.method,
      });

      const {
        entity_type,
        entity_id,
        action,
        user_id,
        client_id,
        limit = 50,
        offset = 0,
        start_date,
        end_date,
      } = req.query;

      // Validate numeric parameters
      const limitNum = Math.max(
        1,
        Math.min(parseInt(limit as string) || 50, 1000),
      ); // Cap at 1000
      const offsetNum = Math.max(0, parseInt(offset as string) || 0);

      // Validate and sanitize date parameters
      let validStartDate = null;
      let validEndDate = null;

      if (start_date) {
        try {
          validStartDate = new Date(start_date as string);
          if (isNaN(validStartDate.getTime())) {
            console.warn("Invalid start_date parameter (NaN):", start_date);
            validStartDate = null;
          } else {
            // Check if date is too far in the future (more than 1 day)
            const now = new Date();
            const oneDayFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
            if (validStartDate > oneDayFromNow) {
              console.warn(
                "start_date is in the future:",
                start_date,
                "Using current time instead",
              );
              validStartDate = now;
            }
            console.log(
              "Activity logs: Using start_date:",
              validStartDate.toISOString(),
            );
          }
        } catch (e) {
          console.warn("Invalid start_date parameter (error):", start_date, e);
          validStartDate = null;
        }
      }

      if (end_date) {
        try {
          validEndDate = new Date(end_date as string);
          if (isNaN(validEndDate.getTime())) {
            validEndDate = null;
          }
        } catch (e) {
          console.warn("Invalid end_date parameter:", end_date);
          validEndDate = null;
        }
      }

      console.log("Activity logs: Checking database availability...");
      if (await isDatabaseAvailable()) {
        console.log("Activity logs: Using database");
        let whereConditions = [];
        let params = [];
        let paramIndex = 1;

        // Build dynamic WHERE clause
        if (entity_type) {
          whereConditions.push(
            `CASE WHEN fal.subtask_id IS NOT NULL THEN 'subtask' ELSE 'task' END = $${paramIndex++}`,
          );
          params.push(entity_type);
        }

        if (entity_id) {
          whereConditions.push(`fal.task_id = $${paramIndex++}`);
          params.push(entity_id);
        }

        if (action) {
          whereConditions.push(`fal.action = $${paramIndex++}`);
          params.push(action);
        }

        if (user_id) {
          whereConditions.push(`fal.user_name LIKE $${paramIndex++}`);
          params.push(`%User ${user_id}%`);
        }

        if (client_id) {
          whereConditions.push(`ft.client_id = $${paramIndex++}`);
          params.push(parseInt(client_id as string));
        }

        if (validStartDate) {
          whereConditions.push(`fal.timestamp >= $${paramIndex++}`);
          params.push(validStartDate.toISOString());
        }

        if (validEndDate) {
          whereConditions.push(`fal.timestamp <= $${paramIndex++}`);
          params.push(validEndDate.toISOString());
        }

        const whereClause =
          whereConditions.length > 0
            ? `WHERE ${whereConditions.join(" AND ")}`
            : "";

        const query = `
        SELECT
          fal.id,
          fal.task_id as entity_id,
          CASE WHEN fal.subtask_id IS NOT NULL THEN 'subtask' ELSE 'task' END as entity_type,
          COALESCE(fs.name, ft.task_name) as entity_name,
          fal.action,
          fal.user_name,
          fal.details,
          fal.timestamp,
          ft.client_name,
          fal.task_id
        FROM finops_activity_log fal
        LEFT JOIN finops_tasks ft ON fal.task_id = ft.id
        LEFT JOIN finops_subtasks fs ON fal.subtask_id = fs.id
        WHERE 1=1 ${whereClause ? whereClause.replace("WHERE", "AND") : ""}
        ORDER BY fal.timestamp DESC
        LIMIT $${paramIndex++} OFFSET $${paramIndex++}
      `;

        params.push(limitNum, offsetNum);

        const result = await pool.query(query, params);

        // Get total count for pagination
        const countQuery = `
        SELECT COUNT(*) as total
        FROM finops_activity_log fal
        WHERE 1=1 ${whereClause ? whereClause.replace("WHERE", "AND") : ""}
      `;

        const countResult = await pool.query(countQuery, params.slice(0, -2)); // Remove limit and offset params
        const total = parseInt(countResult.rows[0].total);

        res.json({
          activity_logs: result.rows,
          pagination: {
            total,
            limit: limitNum,
            offset: offsetNum,
            has_more: offsetNum + limitNum < total,
          },
        });
      } else {
        console.log(
          "Activity logs: Database unavailable, using mock activity logs",
        );

        // Filter mock activity logs
        let filteredLogs = mockActivityLogs;

        if (entity_type) {
          filteredLogs = filteredLogs.filter(
            (log) => log.entity_type === entity_type,
          );
        }

        if (entity_id) {
          filteredLogs = filteredLogs.filter(
            (log) => log.entity_id === entity_id,
          );
        }

        if (action) {
          filteredLogs = filteredLogs.filter((log) => log.action === action);
        }

        if (user_id) {
          filteredLogs = filteredLogs.filter(
            (log) => log.user_id === parseInt(user_id as string),
          );
        }

        if (client_id) {
          filteredLogs = filteredLogs.filter(
            (log) => log.client_id === parseInt(client_id as string),
          );
        }

        if (validStartDate) {
          const startTime = validStartDate.getTime();
          filteredLogs = filteredLogs.filter(
            (log) => new Date(log.timestamp).getTime() >= startTime,
          );
        }

        if (validEndDate) {
          const endTime = validEndDate.getTime();
          filteredLogs = filteredLogs.filter(
            (log) => new Date(log.timestamp).getTime() <= endTime,
          );
        }

        const total = filteredLogs.length;
        const paginatedLogs = filteredLogs.slice(
          offsetNum,
          offsetNum + limitNum,
        );

        const response = {
          activity_logs: paginatedLogs,
          pagination: {
            total,
            limit: limitNum,
            offset: offsetNum,
            has_more: offsetNum + limitNum < total,
          },
        };

        console.log("Activity logs: Sending mock response:", {
          activity_logs_count: response.activity_logs.length,
          pagination: response.pagination,
        });

        // Ensure the response is JSON serializable
        try {
          JSON.stringify(response);
          res.json(response);
        } catch (serializationError) {
          console.error("Response serialization error:", serializationError);
          res.status(500).json({
            error: "Response serialization failed",
            activity_logs: [],
            pagination: { total: 0, limit: 50, offset: 0, has_more: false },
          });
        }
      }
    } catch (error) {
      console.error("Error fetching activity logs:", error);

      // Ensure we always return a valid JSON response
      try {
        res.status(500).json({
          error: "Failed to fetch activity logs",
          message: error instanceof Error ? error.message : "Unknown error",
          activity_logs: mockActivityLogs.slice(0, 10), // Return limited mock data as fallback
          pagination: {
            total: mockActivityLogs.length,
            limit: parseInt(req.query.limit as string) || 50,
            offset: parseInt(req.query.offset as string) || 0,
            has_more: false,
          },
        });
      } catch (jsonError) {
        console.error("Failed to send JSON response:", jsonError);
        // Last resort: send a simple JSON error
        res
          .status(500)
          .send(
            '{"error": "Internal server error", "activity_logs": [], "pagination": {"total": 0, "limit": 50, "offset": 0, "has_more": false}}',
          );
      }
    }
  }),
);

// Create activity log entry
router.post("/", async (req: Request, res: Response) => {
  try {
    if (await isDatabaseAvailable()) {
      const {
        action,
        entity_type,
        entity_id,
        entity_name,
        user_id,
        client_id,
        details,
        changes,
        status,
        previous_status,
        delay_reason,
      } = req.body;

      // Validate required fields
      if (!action || !entity_type || !entity_id || !user_id) {
        return res.status(400).json({
          error: "Missing required fields",
          required: ["action", "entity_type", "entity_id", "user_id"],
        });
      }

      const query = `
        INSERT INTO finops_activity_log (
          action, task_id, subtask_id, user_name, details, timestamp
        ) VALUES ($1, $2, $3, $4, $5, NOW())
        RETURNING *
      `;

      const result = await pool.query(query, [
        action,
        entity_type === "task" ? entity_id : null, // task_id
        entity_type === "subtask" ? entity_id : null, // subtask_id
        `User ${user_id}`, // user_name
        details || `${action} action performed`,
      ]);

      res.status(201).json(result.rows[0]);
    } else {
      console.log("Database unavailable, returning mock activity log creation");
      // Return a mock created activity log
      const mockCreated = {
        id: Date.now().toString(),
        action: req.body.action,
        entity_type: req.body.entity_type,
        entity_id: req.body.entity_id,
        entity_name: req.body.entity_name || null,
        user_id: req.body.user_id,
        client_id: req.body.client_id || null,
        details: req.body.details || null,
        changes: req.body.changes || null,
        status: req.body.status || null,
        previous_status: req.body.previous_status || null,
        delay_reason: req.body.delay_reason || null,
        timestamp: new Date().toISOString(),
      };
      res.status(201).json(mockCreated);
    }
  } catch (error) {
    console.error("Error creating activity log:", error);
    res.status(500).json({
      error: "Failed to create activity log",
      message: error.message,
    });
  }
});

// Get activity log by ID
router.get("/:id", async (req: Request, res: Response) => {
  try {
    if (await isDatabaseAvailable()) {
      const id = req.params.id;

      const query = `
        SELECT
          fal.id,
          fal.task_id as entity_id,
          CASE WHEN fal.subtask_id IS NOT NULL THEN 'subtask' ELSE 'task' END as entity_type,
          COALESCE(fs.name, ft.task_name) as entity_name,
          fal.action,
          fal.user_name,
          fal.details,
          fal.timestamp,
          ft.client_name
        FROM finops_activity_log fal
        LEFT JOIN finops_tasks ft ON fal.task_id = ft.id
        LEFT JOIN finops_subtasks fs ON fal.subtask_id = fs.id
        WHERE fal.id = $1
      `;

      const result = await pool.query(query, [id]);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Activity log not found" });
      }

      res.json(result.rows[0]);
    } else {
      console.log("Database unavailable, using mock activity log lookup");
      const mockLog = mockActivityLogs.find((log) => log.id === req.params.id);
      if (!mockLog) {
        return res.status(404).json({ error: "Activity log not found" });
      }
      res.json(mockLog);
    }
  } catch (error) {
    console.error("Error fetching activity log:", error);
    res.status(500).json({
      error: "Failed to fetch activity log",
      message: error.message,
    });
  }
});

// Get activity summary/stats
router.get("/stats/summary", async (req: Request, res: Response) => {
  try {
    const { days = 7 } = req.query;

    if (await isDatabaseAvailable()) {
      const query = `
        SELECT
          action,
          COUNT(*) as count,
          DATE(timestamp) as date
        FROM finops_activity_log
        WHERE timestamp >= NOW() - INTERVAL $1 || ' days'
        GROUP BY action, DATE(timestamp)
        ORDER BY date DESC, count DESC
      `;

      const result = await pool.query(query, [parseInt(days as string)]);

      // Also get total counts by action
      const totalsQuery = `
        SELECT
          action,
          COUNT(*) as total_count
        FROM finops_activity_log
        WHERE timestamp >= NOW() - INTERVAL $1 || ' days'
        GROUP BY action
        ORDER BY total_count DESC
      `;

      const totalsResult = await pool.query(totalsQuery, [
        parseInt(days as string),
      ]);

      res.json({
        daily_breakdown: result.rows,
        action_totals: totalsResult.rows,
        period_days: parseInt(days as string),
      });
    } else {
      console.log("Database unavailable, using mock activity stats");

      // Generate mock stats from mock data
      const daysNum = parseInt(days as string);
      const cutoffTime = Date.now() - daysNum * 24 * 60 * 60 * 1000;
      const recentLogs = mockActivityLogs.filter(
        (log) => new Date(log.timestamp).getTime() >= cutoffTime,
      );

      const actionTotals = recentLogs.reduce(
        (acc, log) => {
          acc[log.action] = (acc[log.action] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      );

      const actionTotalsArray = Object.entries(actionTotals).map(
        ([action, total_count]) => ({
          action,
          total_count,
        }),
      );

      res.json({
        daily_breakdown: [],
        action_totals: actionTotalsArray,
        period_days: daysNum,
      });
    }
  } catch (error) {
    console.error("Error fetching activity stats:", error);

    try {
      res.status(500).json({
        error: "Failed to fetch activity stats",
        message: error instanceof Error ? error.message : "Unknown error",
        daily_breakdown: [],
        action_totals: [],
        period_days: parseInt(req.query.days as string) || 7,
      });
    } catch (jsonError) {
      console.error("Failed to send JSON response:", jsonError);
      res
        .status(500)
        .send(
          '{"error": "Internal server error", "daily_breakdown": [], "action_totals": [], "period_days": 7}',
        );
    }
  }
});

// Test route to verify routing is working
router.get("/test", (req: Request, res: Response) => {
  console.log("TEST ROUTE HIT: /api/activity-production/test");
  res.json({
    message: "Activity production route is working!",
    timestamp: new Date().toISOString(),
  });
});

export default router;
