import { Router, Request, Response } from "express";
import { pool } from "../database/connection";
import finopsAlertService from "../services/finopsAlertService";
import finopsScheduler from "../services/finopsScheduler";

const router = Router();

// Production database availability check - fail fast if no database
async function requireDatabase() {
  try {
    await pool.query("SELECT 1");
    return true;
  } catch (error) {
    throw new Error(`Database connection failed: ${error.message}`);
  }
}

// Get all FinOps tasks with subtasks
router.get("/tasks", async (req: Request, res: Response) => {
  try {
    await requireDatabase();

    const query = `
      SELECT 
        t.*,
        json_agg(
          json_build_object(
            'id', st.id,
            'name', st.name,
            'description', st.description,
            'sla_hours', st.sla_hours,
            'sla_minutes', st.sla_minutes,
            'order_position', st.order_position,
            'status', st.status,
            'started_at', st.started_at,
            'completed_at', st.completed_at,
            'due_at', st.due_at
          ) ORDER BY st.order_position
        ) FILTER (WHERE st.id IS NOT NULL) as subtasks
      FROM finops_tasks t
      LEFT JOIN finops_subtasks st ON t.id = st.task_id
      WHERE t.deleted_at IS NULL
      GROUP BY t.id
      ORDER BY t.created_at DESC
    `;

    const result = await pool.query(query);
    const tasks = result.rows.map((row) => ({
      ...row,
      subtasks: row.subtasks || [],
    }));

    res.json(tasks);
  } catch (error) {
    console.error("Error fetching FinOps tasks:", error);
    res.status(500).json({
      error: "Database connection failed",
      message: "Unable to fetch FinOps tasks from database",
      details: error.message,
    });
  }
});

// Create new FinOps task
router.post("/tasks", async (req: Request, res: Response) => {
  try {
    await requireDatabase();

    const {
      task_name,
      description,
      assigned_to,
      reporting_managers,
      escalation_managers,
      effective_from,
      duration,
      is_active,
      subtasks,
      created_by,
    } = req.body;

    // Validate required fields
    if (
      !task_name ||
      !assigned_to ||
      !effective_from ||
      !duration ||
      !created_by
    ) {
      return res.status(400).json({
        error: "Missing required fields",
        required: [
          "task_name",
          "assigned_to",
          "effective_from",
          "duration",
          "created_by",
        ],
      });
    }

    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      // Insert main task
      const taskQuery = `
        INSERT INTO finops_tasks (
          task_name, description, assigned_to, reporting_managers, 
          escalation_managers, effective_from, duration, is_active, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `;

      const taskResult = await client.query(taskQuery, [
        task_name,
        description,
        assigned_to,
        JSON.stringify(reporting_managers || []),
        JSON.stringify(escalation_managers || []),
        effective_from,
        duration,
        is_active ?? true,
        created_by,
      ]);

      const task = taskResult.rows[0];

      // Insert subtasks
      const subtaskResults = [];
      if (subtasks && subtasks.length > 0) {
        for (let i = 0; i < subtasks.length; i++) {
          const subtask = subtasks[i];
          const subtaskQuery = `
            INSERT INTO finops_subtasks (
              task_id, name, description, sla_hours, sla_minutes, order_position
            ) VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
          `;

          const subtaskResult = await client.query(subtaskQuery, [
            task.id,
            subtask.name,
            subtask.description || null,
            subtask.sla_hours || 1,
            subtask.sla_minutes || 0,
            i,
          ]);

          subtaskResults.push(subtaskResult.rows[0]);
        }
      }

      await client.query("COMMIT");

      // Log activity
      await client.query(
        `
        INSERT INTO finops_activity_log (task_id, action, user_name, details)
        VALUES ($1, $2, $3, $4)
      `,
        [
          task.id,
          "created",
          assigned_to,
          `Task "${task_name}" created with ${subtaskResults.length} subtasks`,
        ],
      );

      const response = {
        ...task,
        subtasks: subtaskResults,
      };

      res.status(201).json(response);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error creating FinOps task:", error);
    res.status(500).json({
      error: "Failed to create FinOps task",
      message: error.message,
    });
  }
});

// Update subtask status
router.put("/subtasks/:id", async (req: Request, res: Response) => {
  try {
    await requireDatabase();

    const subtaskId = parseInt(req.params.id);
    const { status, delay_reason, user_name } = req.body;

    if (isNaN(subtaskId)) {
      return res.status(400).json({ error: "Invalid subtask ID" });
    }

    if (!status) {
      return res.status(400).json({ error: "Status is required" });
    }

    const validStatuses = [
      "pending",
      "in_progress",
      "completed",
      "overdue",
      "cancelled",
    ];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        error: "Invalid status",
        validStatuses,
      });
    }

    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      // Update subtask
      let updateQuery = "";
      let queryParams = [];

      if (status === "in_progress") {
        updateQuery = `
          UPDATE finops_subtasks 
          SET status = $1, started_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
          WHERE id = $2
          RETURNING *
        `;
        queryParams = [status, subtaskId];
      } else if (status === "completed") {
        updateQuery = `
          UPDATE finops_subtasks 
          SET status = $1, completed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
          WHERE id = $2
          RETURNING *
        `;
        queryParams = [status, subtaskId];
      } else {
        updateQuery = `
          UPDATE finops_subtasks 
          SET status = $1, updated_at = CURRENT_TIMESTAMP
          WHERE id = $2
          RETURNING *
        `;
        queryParams = [status, subtaskId];
      }

      const result = await client.query(updateQuery, queryParams);

      if (result.rows.length === 0) {
        await client.query("ROLLBACK");
        return res.status(404).json({ error: "Subtask not found" });
      }

      const subtask = result.rows[0];

      // Log activity
      let activityDetails = `Subtask "${subtask.name}" status changed to ${status}`;
      if (delay_reason && status === "overdue") {
        activityDetails += `. Delay reason: ${delay_reason}`;
      }

      await client.query(
        `
        INSERT INTO finops_activity_log (task_id, subtask_id, action, user_name, details)
        VALUES ($1, $2, $3, $4, $5)
      `,
        [
          subtask.task_id,
          subtaskId,
          "updated",
          user_name || "System",
          activityDetails,
        ],
      );

      // Trigger alerts if needed
      if (status === "overdue") {
        await finopsAlertService.createSLABreachAlert(
          subtask.task_id,
          subtaskId,
          delay_reason,
        );
      }

      await client.query("COMMIT");
      res.json(subtask);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error updating subtask:", error);
    res.status(500).json({
      error: "Failed to update subtask",
      message: error.message,
    });
  }
});

// Get activity log
router.get("/activity-log", async (req: Request, res: Response) => {
  try {
    await requireDatabase();

    const { start_date, end_date, task_id } = req.query;

    let query = `
      SELECT 
        al.*,
        t.task_name,
        st.name as subtask_name
      FROM finops_activity_log al
      JOIN finops_tasks t ON al.task_id = t.id
      LEFT JOIN finops_subtasks st ON al.subtask_id = st.id
      WHERE 1=1
    `;
    const queryParams = [];
    let paramCount = 0;

    if (start_date) {
      paramCount++;
      query += ` AND al.timestamp >= $${paramCount}`;
      queryParams.push(start_date);
    }

    if (end_date) {
      paramCount++;
      query += ` AND al.timestamp <= $${paramCount}`;
      queryParams.push(end_date);
    }

    if (task_id) {
      paramCount++;
      query += ` AND al.task_id = $${paramCount}`;
      queryParams.push(parseInt(task_id as string));
    }

    query += ` ORDER BY al.timestamp DESC LIMIT 1000`;

    const result = await pool.query(query, queryParams);
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching activity log:", error);
    res.status(500).json({
      error: "Failed to fetch activity log",
      message: error.message,
    });
  }
});

// Get clients from leads table for dropdown
router.get("/clients", async (req: Request, res: Response) => {
  try {
    await requireDatabase();

    const query = `
      SELECT DISTINCT client_name as name, client_name as id
      FROM leads 
      WHERE client_name IS NOT NULL AND client_name != ''
      ORDER BY client_name
    `;

    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching clients from leads:", error);
    res.status(500).json({
      error: "Failed to fetch clients",
      message: error.message,
    });
  }
});

// Get alerts/notifications
router.get("/alerts", async (req: Request, res: Response) => {
  try {
    await requireDatabase();

    const query = `
      SELECT 
        a.*,
        t.task_name,
        st.name as subtask_name
      FROM finops_alerts a
      JOIN finops_tasks t ON a.task_id = t.id
      LEFT JOIN finops_subtasks st ON a.subtask_id = st.id
      WHERE a.is_active = true
      ORDER BY a.created_at DESC
      LIMIT 100
    `;

    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching alerts:", error);
    res.status(500).json({
      error: "Failed to fetch alerts",
      message: error.message,
    });
  }
});

// Database health check endpoint
router.get("/health", async (req: Request, res: Response) => {
  try {
    const start = Date.now();
    await pool.query("SELECT 1");
    const responseTime = Date.now() - start;

    // Check if required tables exist
    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('finops_tasks', 'finops_subtasks', 'finops_activity_log', 'finops_alerts')
      ORDER BY table_name
    `;

    const tablesResult = await pool.query(tablesQuery);
    const tables = tablesResult.rows.map((row) => row.table_name);

    const requiredTables = [
      "finops_tasks",
      "finops_subtasks",
      "finops_activity_log",
      "finops_alerts",
    ];
    const missingTables = requiredTables.filter(
      (table) => !tables.includes(table),
    );

    res.json({
      status: missingTables.length === 0 ? "healthy" : "degraded",
      database: "connected",
      responseTime: `${responseTime}ms`,
      tables: {
        found: tables,
        missing: missingTables,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Health check failed:", error);
    res.status(503).json({
      status: "unhealthy",
      database: "disconnected",
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// Dashboard endpoint for FinOps dashboard
router.post("/dashboard", async (req: Request, res: Response) => {
  try {
    await requireDatabase();

    const { period, start_date, end_date } = req.body;

    // Get task statistics from database
    const tasksQuery = `
      SELECT
        COUNT(*) as total_tasks,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_tasks,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_tasks,
        COUNT(CASE WHEN status = 'overdue' THEN 1 END) as overdue_tasks
      FROM finops_tasks
      WHERE deleted_at IS NULL
    `;

    const subtasksQuery = `
      SELECT
        COUNT(*) as total_subtasks,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_subtasks,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_subtasks,
        COUNT(CASE WHEN status = 'overdue' THEN 1 END) as overdue_subtasks,
        COUNT(CASE WHEN DATE(created_at) = CURRENT_DATE THEN 1 END) as tasks_today,
        COUNT(CASE WHEN status = 'completed' AND DATE(completed_at) = CURRENT_DATE THEN 1 END) as completed_today,
        COUNT(CASE WHEN status = 'pending' AND DATE(created_at) = CURRENT_DATE THEN 1 END) as pending_today,
        COUNT(CASE WHEN status = 'overdue' AND DATE(updated_at) = CURRENT_DATE THEN 1 END) as sla_breaches_today,
        COUNT(CASE WHEN status = 'completed' AND DATE(completed_at) >= DATE_TRUNC('month', CURRENT_DATE) THEN 1 END) as completed_this_month,
        COUNT(CASE WHEN status = 'pending' AND DATE(created_at) >= DATE_TRUNC('month', CURRENT_DATE) THEN 1 END) as pending_this_month,
        COUNT(CASE WHEN status = 'overdue' AND DATE(updated_at) >= DATE_TRUNC('month', CURRENT_DATE) THEN 1 END) as sla_breaches_this_month
      FROM finops_subtasks
    `;

    const [tasksResult, subtasksResult] = await Promise.all([
      pool.query(tasksQuery),
      pool.query(subtasksQuery),
    ]);

    const taskStats = tasksResult.rows[0];
    const subtaskStats = subtasksResult.rows[0];

    const dashboardData = {
      total_revenue: 120000,
      total_costs: 45000,
      profit: 75000,
      profit_margin: 62.5,
      overdue_invoices: {
        overdue_count: parseInt(subtaskStats.overdue_subtasks) || 0,
        overdue_amount: 15000,
      },
      budget_utilization: [],
      daily_process_counts: {
        tasks_completed_today: parseInt(subtaskStats.completed_today) || 0,
        tasks_pending_today: parseInt(subtaskStats.pending_today) || 0,
        sla_breaches_today: parseInt(subtaskStats.sla_breaches_today) || 0,
        tasks_completed_this_month:
          parseInt(subtaskStats.completed_this_month) || 0,
        tasks_pending_this_month:
          parseInt(subtaskStats.pending_this_month) || 0,
        sla_breaches_this_month:
          parseInt(subtaskStats.sla_breaches_this_month) || 0,
      },
      task_summary: {
        total_tasks: parseInt(taskStats.total_tasks) || 0,
        active_tasks: parseInt(taskStats.active_tasks) || 0,
        completed_tasks: parseInt(taskStats.completed_tasks) || 0,
        overdue_tasks: parseInt(taskStats.overdue_tasks) || 0,
      },
      subtask_summary: {
        total_subtasks: parseInt(subtaskStats.total_subtasks) || 0,
        completed_subtasks: parseInt(subtaskStats.completed_subtasks) || 0,
        pending_subtasks: parseInt(subtaskStats.pending_subtasks) || 0,
        overdue_subtasks: parseInt(subtaskStats.overdue_subtasks) || 0,
      },
    };

    res.json(dashboardData);
  } catch (error) {
    console.error("Error fetching FinOps dashboard data:", error);
    res.status(500).json({
      error: "Failed to fetch dashboard data",
      message: error.message,
    });
  }
});

// Daily process stats endpoint for real-time tracking
router.post("/daily-process-stats", async (req: Request, res: Response) => {
  try {
    await requireDatabase();

    const { period, start_date, end_date } = req.body;

    const statsQuery = `
      SELECT
        COUNT(CASE WHEN status = 'completed' AND DATE(completed_at) = CURRENT_DATE THEN 1 END) as tasks_completed_today,
        COUNT(CASE WHEN status = 'pending' AND DATE(created_at) = CURRENT_DATE THEN 1 END) as tasks_pending_today,
        COUNT(CASE WHEN status = 'overdue' AND DATE(updated_at) = CURRENT_DATE THEN 1 END) as sla_breaches_today,
        COUNT(CASE WHEN status = 'completed' AND DATE(completed_at) >= DATE_TRUNC('month', CURRENT_DATE) THEN 1 END) as tasks_completed_this_month,
        COUNT(CASE WHEN status = 'pending' AND DATE(created_at) >= DATE_TRUNC('month', CURRENT_DATE) THEN 1 END) as tasks_pending_this_month,
        COUNT(CASE WHEN status = 'overdue' AND DATE(updated_at) >= DATE_TRUNC('month', CURRENT_DATE) THEN 1 END) as sla_breaches_this_month
      FROM finops_subtasks
    `;

    const result = await pool.query(statsQuery);
    const stats = result.rows[0];

    const processData = {
      tasks_completed_today: parseInt(stats.tasks_completed_today) || 0,
      tasks_pending_today: parseInt(stats.tasks_pending_today) || 0,
      sla_breaches_today: parseInt(stats.sla_breaches_today) || 0,
      tasks_completed_this_month:
        parseInt(stats.tasks_completed_this_month) || 0,
      tasks_pending_this_month: parseInt(stats.tasks_pending_this_month) || 0,
      sla_breaches_this_month: parseInt(stats.sla_breaches_this_month) || 0,
    };

    res.json(processData);
  } catch (error) {
    console.error("Error fetching daily process stats:", error);
    res.status(500).json({
      error: "Failed to fetch daily process stats",
      message: error.message,
    });
  }
});

export default router;
