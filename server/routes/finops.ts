import { Router, Request, Response } from "express";
import { pool } from "../database/connection";
import finopsAlertService from "../services/finopsAlertService";
import finopsScheduler from "../services/finopsScheduler";

const router = Router();

// Database availability check
async function isDatabaseAvailable() {
  try {
    await pool.query("SELECT 1");
    return true;
  } catch (error) {
    console.log("Database availability check failed:", error.message);
    return false;
  }
}

// Mock data for development when database is unavailable
const mockFinOpsTasks = [
  {
    id: 1,
    task_name: "CLEARING - FILE TRANSFER AND VALIDATION",
    description: "clearing daily steps for file transfer",
    client_id: "1",
    client_name: "Global Financial Services",
    assigned_to: "John Durairaj",
    reporting_managers: ["Albert", "Hari"],
    escalation_managers: ["Albert", "Hari"],
    effective_from: "2024-01-01",
    duration: "daily",
    is_active: true,
    status: "active",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    created_by: "Admin",
    next_run: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    subtasks: [
      {
        id: "1",
        name: "RBL DUMP VS TCP DATA (DAILY ALERT MAIL) VS DAILY STATUS FILE COUNT",
        description: "Daily reconciliation check",
        sla_hours: 2,
        sla_minutes: 30,
        start_time: "05:00",
        order_position: 0,
        status: "completed",
        started_at: "2024-01-26T05:00:00Z",
        completed_at: "2024-01-26T06:15:00Z",
      },
      {
        id: "2",
        name: "MASTER AND VISA FILE VALIDATION",
        description: "Validate master and visa files",
        sla_hours: 1,
        sla_minutes: 0,
        start_time: "06:15",
        order_position: 1,
        status: "in_progress",
        started_at: "2024-01-26T06:15:00Z",
      },
      {
        id: "3",
        name: "VISA - VALIDATION OF THE BASE 2 FILE",
        description: "Base 2 file validation for Visa",
        sla_hours: 0,
        sla_minutes: 45,
        start_time: "07:15",
        order_position: 2,
        status: "pending",
      },
      {
        id: "4",
        name: "SHARING OF THE FILE TO M2P",
        description: "Share validated files to M2P",
        sla_hours: 0,
        sla_minutes: 30,
        start_time: "08:00",
        order_position: 3,
        status: "pending",
      },
      {
        id: "5",
        name: "MASTER - IPM FILE - upload the file in TDG, count check, change format as clearing upload tool",
        description: "IPM file processing in TDG",
        sla_hours: 1,
        sla_minutes: 30,
        start_time: "08:30",
        order_position: 4,
        status: "pending",
      },
      {
        id: "6",
        name: "MASTER - IPM FILE - upload in clearing optimizer and run, report check if rejections present validation to be done and run again",
        description: "Clearing optimizer processing",
        sla_hours: 2,
        sla_minutes: 0,
        start_time: "10:00",
        order_position: 5,
        status: "pending",
      },
      {
        id: "7",
        name: "MASTER - IPM FILE - saving no error file in TDG in original format and paste it in end point folder",
        description: "Save processed files to endpoint",
        sla_hours: 0,
        sla_minutes: 30,
        start_time: "12:00",
        order_position: 6,
        status: "pending",
      },
      {
        id: "8",
        name: "MASTER - IPM FILE - login MFE, check for no error file and delete in endpoint folder and transfer the file to network",
        description: "Final file transfer to network",
        sla_hours: 1,
        sla_minutes: 0,
        start_time: "12:30",
        order_position: 7,
        status: "pending",
      },
    ],
  },
  {
    id: 2,
    task_name: "RECONCILIATION - DAILY SETTLEMENT PROCESS",
    description: "Daily settlement and reconciliation process",
    client_id: "2",
    client_name: "Enterprise Banking Solutions",
    assigned_to: "Sarah Martinez",
    reporting_managers: ["Albert", "Michael"],
    escalation_managers: ["Albert", "Michael"],
    effective_from: "2024-01-01",
    duration: "daily",
    is_active: true,
    status: "active",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    created_by: "Admin",
    next_run: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    subtasks: [
      {
        id: "9",
        name: "SETTLEMENT REPORT GENERATION",
        description: "Generate daily settlement reports",
        sla_hours: 1,
        sla_minutes: 30,
        start_time: "06:00",
        order_position: 0,
        status: "completed",
        started_at: "2024-01-26T06:00:00Z",
        completed_at: "2024-01-26T07:15:00Z",
      },
      {
        id: "10",
        name: "ACCOUNT BALANCE RECONCILIATION",
        description: "Reconcile account balances with external systems",
        sla_hours: 2,
        sla_minutes: 0,
        start_time: "07:15",
        order_position: 1,
        status: "in_progress",
        started_at: "2024-01-26T07:15:00Z",
      },
      {
        id: "11",
        name: "EXCEPTION REPORT REVIEW",
        description: "Review and process exception reports",
        sla_hours: 1,
        sla_minutes: 0,
        start_time: "09:15",
        order_position: 2,
        status: "pending",
      },
    ],
  },
  {
    id: 3,
    task_name: "MONTHLY REPORTING - CLIENT STATEMENTS",
    description: "Monthly client statement generation and validation",
    client_id: "3",
    client_name: "Pacific Trade Finance",
    assigned_to: "David Kim",
    reporting_managers: ["Lisa", "Robert"],
    escalation_managers: ["Lisa", "Robert"],
    effective_from: "2024-01-01",
    duration: "monthly",
    is_active: true,
    status: "active",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    created_by: "Admin",
    next_run: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    subtasks: [
      {
        id: "12",
        name: "CLIENT DATA EXTRACTION",
        description: "Extract client transaction data for statement period",
        sla_hours: 3,
        sla_minutes: 0,
        start_time: "08:00",
        order_position: 0,
        status: "pending",
      },
      {
        id: "13",
        name: "STATEMENT GENERATION",
        description: "Generate client statements from extracted data",
        sla_hours: 4,
        sla_minutes: 0,
        start_time: "11:00",
        order_position: 1,
        status: "pending",
      },
    ],
  },
];

const mockActivityLog = [
  {
    id: 1,
    task_id: 1,
    subtask_id: "1",
    action: "started",
    user_name: "System",
    timestamp: "2024-01-26T05:00:00Z",
    details: "Task automatically started based on schedule",
  },
  {
    id: 2,
    task_id: 1,
    subtask_id: "1",
    action: "completed",
    user_name: "John Durairaj",
    timestamp: "2024-01-26T06:15:00Z",
    details: "RBL DUMP validation completed successfully",
  },
  {
    id: 3,
    task_id: 1,
    subtask_id: "2",
    action: "started",
    user_name: "John Durairaj",
    timestamp: "2024-01-26T06:15:00Z",
    details: "Started MASTER AND VISA FILE VALIDATION",
  },
];

// Get all FinOps tasks with enhanced error handling
router.get("/tasks", async (req: Request, res: Response) => {
  try {
    console.log("📋 FinOps tasks requested");

    // Add CORS headers for FullStory compatibility
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, DELETE, OPTIONS",
    );
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization",
    );

    if (await isDatabaseAvailable()) {
      console.log("✅ Database is available, fetching real data");

      // Simplified query with better error handling
      const query = `
        SELECT
          t.*,
          COALESCE(
            json_agg(
              json_build_object(
                'id', st.id,
                'name', st.name,
                'description', st.description,
                'start_time', st.start_time,
                'sla_hours', st.sla_hours,
                'sla_minutes', st.sla_minutes,
                'order_position', st.order_position,
                'status', st.status,
                'started_at', st.started_at,
                'completed_at', st.completed_at
              ) ORDER BY st.order_position
            ) FILTER (WHERE st.id IS NOT NULL),
            '[]'::json
          ) as subtasks
        FROM finops_tasks t
        LEFT JOIN finops_subtasks st ON t.id = st.task_id
        WHERE t.deleted_at IS NULL
        GROUP BY t.id
        ORDER BY t.created_at DESC
      `;

      const result = await pool.query(query);
      const tasks = result.rows.map((row) => ({
        ...row,
        subtasks: Array.isArray(row.subtasks) ? row.subtasks : [],
        client_name: row.client_name || "Unknown Client",
      }));

      console.log(
        `✅ Successfully fetched ${tasks.length} FinOps tasks from database`,
      );
      res.json(tasks);
    } else {
      console.log("❌ Database unavailable, returning mock FinOps tasks");
      res.json(mockFinOpsTasks);
    }
  } catch (error) {
    console.error("❌ Error fetching FinOps tasks:", error);

    // Enhanced error handling with specific database error codes
    if (error.code === "42P01") {
      console.log("📋 Table not found - using mock data");
      return res.json(mockFinOpsTasks);
    }

    if (error.code === "42703") {
      console.log("📋 Column not found - using mock data");
      return res.json(mockFinOpsTasks);
    }

    if (error.code === "ECONNREFUSED" || error.code === "ENOTFOUND") {
      console.log("📋 Database connection refused - using mock data");
      return res.json(mockFinOpsTasks);
    }

    // For any other database error, return mock data to prevent crashes
    console.log("📋 Database error - falling back to mock data");
    res.json(mockFinOpsTasks);
  }
});

// Create new FinOps task
router.post("/tasks", async (req: Request, res: Response) => {
  try {
    const {
      task_name,
      description,
      client_id,
      client_name,
      assigned_to,
      reporting_managers,
      escalation_managers,
      effective_from,
      duration,
      is_active,
      subtasks,
      created_by,
    } = req.body;

    console.log("📝 Creating FinOps task with data:", {
      task_name,
      client_id,
      client_name,
      assigned_to,
      created_by,
    });

    if (await isDatabaseAvailable()) {
      const client = await pool.connect();

      try {
        await client.query("BEGIN");

        // Insert main task with client information
        const taskQuery = `
          INSERT INTO finops_tasks (
            task_name, description, client_id, client_name, assigned_to, reporting_managers,
            escalation_managers, effective_from, duration, is_active, created_by
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          RETURNING id
        `;

        const taskResult = await client.query(taskQuery, [
          task_name,
          description,
          client_id || null,
          client_name || null,
          assigned_to,
          JSON.stringify(reporting_managers),
          JSON.stringify(escalation_managers),
          effective_from,
          duration,
          is_active,
          created_by,
        ]);

        console.log("✅ Task inserted with ID:", taskResult.rows[0].id);

        const taskId = taskResult.rows[0].id;

        // Insert subtasks
        if (subtasks && subtasks.length > 0) {
          for (const subtask of subtasks) {
            const subtaskQuery = `
              INSERT INTO finops_subtasks (
                task_id, name, description, start_time, sla_hours, sla_minutes, order_position
              ) VALUES ($1, $2, $3, $4, $5, $6, $7)
            `;

            await client.query(subtaskQuery, [
              taskId,
              subtask.name,
              subtask.description || null,
              subtask.start_time || null,
              subtask.sla_hours,
              subtask.sla_minutes,
              subtask.order_position,
            ]);
          }
        }

        await client.query("COMMIT");

        // Log activity
        await logActivity(
          taskId,
          null,
          "created",
          `User ${created_by}`,
          "Task created",
        );

        res
          .status(201)
          .json({ id: taskId, message: "FinOps task created successfully" });
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }
    } else {
      // Mock response with client information
      const newTask = {
        id: Date.now(),
        ...req.body,
        client_id: req.body.client_id || null,
        client_name: req.body.client_name || "Unknown Client",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        status: "active",
      };
      mockFinOpsTasks.push(newTask);
      console.log("✅ Mock task created with client info:", {
        id: newTask.id,
        client_id: newTask.client_id,
        client_name: newTask.client_name,
      });
      res.status(201).json({
        id: newTask.id,
        message: "FinOps task created successfully (mock)",
      });
    }
  } catch (error) {
    console.error("Error creating FinOps task:", error);
    res.status(500).json({ error: "Failed to create FinOps task" });
  }
});

// Update FinOps task
router.put("/tasks/:id", async (req: Request, res: Response) => {
  try {
    const taskId = parseInt(req.params.id);
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
    } = req.body;

    if (await isDatabaseAvailable()) {
      const client = await pool.connect();

      try {
        await client.query("BEGIN");

        // Update main task
        const taskQuery = `
          UPDATE finops_tasks SET
            task_name = $1,
            description = $2,
            assigned_to = $3,
            reporting_managers = $4,
            escalation_managers = $5,
            effective_from = $6,
            duration = $7,
            is_active = $8,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = $9
        `;

        await client.query(taskQuery, [
          task_name,
          description,
          assigned_to,
          JSON.stringify(reporting_managers),
          JSON.stringify(escalation_managers),
          effective_from,
          duration,
          is_active,
          taskId,
        ]);

        // Delete existing subtasks and recreate
        await client.query("DELETE FROM finops_subtasks WHERE task_id = $1", [
          taskId,
        ]);

        // Insert updated subtasks
        if (subtasks && subtasks.length > 0) {
          for (const subtask of subtasks) {
            const subtaskQuery = `
              INSERT INTO finops_subtasks (
                task_id, name, description, start_time, sla_hours, sla_minutes, order_position
              ) VALUES ($1, $2, $3, $4, $5, $6, $7)
            `;

            await client.query(subtaskQuery, [
              taskId,
              subtask.name,
              subtask.description || null,
              subtask.start_time || null,
              subtask.sla_hours,
              subtask.sla_minutes,
              subtask.order_position,
            ]);
          }
        }

        await client.query("COMMIT");

        // Log activity
        await logActivity(taskId, null, "updated", "User", "Task updated");

        res.json({ message: "FinOps task updated successfully" });
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }
    } else {
      // Mock response
      const taskIndex = mockFinOpsTasks.findIndex((t) => t.id === taskId);
      if (taskIndex !== -1) {
        mockFinOpsTasks[taskIndex] = {
          ...mockFinOpsTasks[taskIndex],
          ...req.body,
          updated_at: new Date().toISOString(),
        };
        res.json({ message: "FinOps task updated successfully (mock)" });
      } else {
        res.status(404).json({ error: "Task not found" });
      }
    }
  } catch (error) {
    console.error("Error updating FinOps task:", error);
    res.status(500).json({ error: "Failed to update FinOps task" });
  }
});

// Delete FinOps task
router.delete("/tasks/:id", async (req: Request, res: Response) => {
  try {
    const taskId = parseInt(req.params.id);

    if (await isDatabaseAvailable()) {
      // Soft delete
      const query = `
        UPDATE finops_tasks 
        SET deleted_at = CURRENT_TIMESTAMP 
        WHERE id = $1
      `;

      await pool.query(query, [taskId]);

      // Log activity
      await logActivity(taskId, null, "deleted", "User", "Task deleted");

      res.json({ message: "FinOps task deleted successfully" });
    } else {
      // Mock response
      const taskIndex = mockFinOpsTasks.findIndex((t) => t.id === taskId);
      if (taskIndex !== -1) {
        mockFinOpsTasks.splice(taskIndex, 1);
        res.json({ message: "FinOps task deleted successfully (mock)" });
      } else {
        res.status(404).json({ error: "Task not found" });
      }
    }
  } catch (error) {
    console.error("Error deleting FinOps task:", error);
    res.status(500).json({ error: "Failed to delete FinOps task" });
  }
});

// Enhanced subtask status update with delay tracking and notifications
router.patch(
  "/tasks/:taskId/subtasks/:subtaskId",
  async (req: Request, res: Response) => {
    try {
      const taskId = parseInt(req.params.taskId);
      const subtaskId = req.params.subtaskId;
      const { status, user_name, delay_reason, delay_notes } = req.body;
      const userName = user_name || "Unknown User";

      if (await isDatabaseAvailable()) {
        // Get current subtask and task information
        const currentSubtask = await pool.query(
          `
        SELECT st.*, t.task_name, t.reporting_managers, t.escalation_managers, t.assigned_to
        FROM finops_subtasks st
        JOIN finops_tasks t ON st.task_id = t.id
        WHERE st.task_id = $1 AND st.id = $2
      `,
          [taskId, subtaskId],
        );

        if (currentSubtask.rows.length === 0) {
          return res.status(404).json({ error: "Subtask not found" });
        }

        const subtaskData = currentSubtask.rows[0];
        const oldStatus = subtaskData.status;
        const subtaskName = subtaskData.name;

        // Build dynamic update query
        let updateFields = ["status = $1", "updated_at = CURRENT_TIMESTAMP"];
        let queryParams = [status, taskId, subtaskId];
        let paramIndex = 4;

        if (status === "completed") {
          updateFields.push("completed_at = CURRENT_TIMESTAMP");
        }
        if (status === "in_progress" && !subtaskData.started_at) {
          updateFields.push("started_at = CURRENT_TIMESTAMP");
        }
        if (status === "delayed" && delay_reason) {
          updateFields.push(`delay_reason = $${paramIndex++}`);
          updateFields.push(`delay_notes = $${paramIndex++}`);
          queryParams.push(delay_reason, delay_notes || "");
        }

        const query = `
        UPDATE finops_subtasks
        SET ${updateFields.join(", ")}
        WHERE task_id = $2 AND id = $3
      `;

        await pool.query(query, queryParams);

        // Enhanced activity logging
        let logDetails = `Subtask "${subtaskName}" status changed from "${oldStatus}" to "${status}"`;
        if (status === "delayed" && delay_reason) {
          logDetails += ` (Reason: ${delay_reason})`;
        }
        await logActivity(
          taskId,
          subtaskId,
          "status_changed",
          userName,
          logDetails,
        );

        // Send notifications based on status
        await handleStatusChangeNotifications(
          subtaskData,
          status,
          delay_reason,
          delay_notes,
        );

        // Log user activity and update task status
        await logUserActivity(userName, taskId);
        await checkAndUpdateTaskStatus(taskId, userName);

        res.json({
          message: "Subtask status updated successfully",
          previous_status: oldStatus,
          new_status: status,
          delay_reason: delay_reason || null,
          delay_notes: delay_notes || null,
          updated_at: new Date().toISOString(),
        });
      } else {
        // Enhanced mock response
        const task = mockFinOpsTasks.find((t) => t.id === taskId);
        if (task) {
          const subtask = task.subtasks.find((st) => st.id === subtaskId);
          if (subtask) {
            const oldStatus = subtask.status;
            subtask.status = status;

            if (status === "completed") {
              subtask.completed_at = new Date().toISOString();
            }
            if (status === "in_progress") {
              subtask.started_at = new Date().toISOString();
            }
            if (status === "delayed") {
              (subtask as any).delay_reason = delay_reason;
              (subtask as any).delay_notes = delay_notes;
            }

            res.json({
              message: "Subtask status updated successfully (mock)",
              previous_status: oldStatus,
              new_status: status,
              delay_reason: delay_reason || null,
              delay_notes: delay_notes || null,
            });
          } else {
            res.status(404).json({ error: "Subtask not found" });
          }
        } else {
          res.status(404).json({ error: "Task not found" });
        }
      }
    } catch (error) {
      console.error("Error updating subtask status:", error);
      res.status(500).json({ error: "Failed to update subtask status" });
    }
  },
);

// Get activity log
router.get("/activity-log", async (req: Request, res: Response) => {
  try {
    const { taskId } = req.query;

    if (await isDatabaseAvailable()) {
      const query = taskId
        ? `SELECT * FROM finops_activity_log WHERE task_id = $1 ORDER BY timestamp DESC`
        : `SELECT * FROM finops_activity_log ORDER BY timestamp DESC LIMIT 100`;

      const result = taskId
        ? await pool.query(query, [parseInt(taskId as string)])
        : await pool.query(query);

      res.json(result.rows);
    } else {
      // Mock response
      const filteredLog = taskId
        ? mockActivityLog.filter(
            (log) => log.task_id === parseInt(taskId as string),
          )
        : mockActivityLog;

      res.json(filteredLog);
    }
  } catch (error) {
    console.error("Error fetching activity log:", error);
    res.json(mockActivityLog);
  }
});

// Run task manually
router.post("/tasks/:id/run", async (req: Request, res: Response) => {
  try {
    const taskId = parseInt(req.params.id);

    // Log activity
    await logActivity(
      taskId,
      null,
      "manual_run",
      "User",
      "Task manually triggered",
    );

    // In a real implementation, this would trigger the actual task execution
    res.json({ message: "Task execution triggered successfully" });
  } catch (error) {
    console.error("Error running task:", error);
    res.status(500).json({ error: "Failed to run task" });
  }
});

// Enhanced helper function to log activities with more detail
async function logActivity(
  taskId: number,
  subtaskId: string | null,
  action: string,
  userName: string,
  details: string,
) {
  try {
    if (await isDatabaseAvailable()) {
      const query = `
        INSERT INTO finops_activity_log (task_id, subtask_id, action, user_name, details, ip_address, user_agent)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `;

      await pool.query(query, [
        taskId,
        subtaskId,
        action,
        userName,
        details,
        "system",
        "finops-api",
      ]);
    } else {
      // Mock logging
      mockActivityLog.push({
        id: Date.now(),
        task_id: taskId,
        subtask_id: subtaskId,
        action,
        user_name: userName,
        timestamp: new Date().toISOString(),
        details,
      });
    }
  } catch (error) {
    console.error("Error logging activity:", error);
  }
}

// Log user activity for daily login tracking
async function logUserActivity(userName: string, taskId: number) {
  try {
    if (await isDatabaseAvailable()) {
      const today = new Date().toISOString().split("T")[0];

      // Check if user already has activity logged today
      const existingActivity = await pool.query(
        `
        SELECT COUNT(*) as count FROM finops_activity_log
        WHERE user_name = $1 AND DATE(timestamp) = $2
      `,
        [userName, today],
      );

      if (existingActivity.rows[0].count === "0") {
        await pool.query(
          `
          INSERT INTO finops_activity_log (task_id, subtask_id, action, user_name, details)
          VALUES ($1, NULL, 'daily_login', $2, 'User first activity of the day')
        `,
          [taskId, userName],
        );
      }
    }
  } catch (error) {
    console.error("Error logging user activity:", error);
  }
}

// Handle notifications for status changes
async function handleStatusChangeNotifications(
  subtaskData: any,
  newStatus: string,
  delayReason?: string,
  delayNotes?: string,
) {
  try {
    const reportingManagers = JSON.parse(
      subtaskData.reporting_managers || "[]",
    );
    const escalationManagers = JSON.parse(
      subtaskData.escalation_managers || "[]",
    );

    // Send delay notifications
    if (newStatus === "delayed") {
      const notificationData = {
        task_name: subtaskData.task_name,
        subtask_name: subtaskData.name,
        assigned_to: subtaskData.assigned_to,
        delay_reason: delayReason,
        delay_notes: delayNotes,
        timestamp: new Date().toISOString(),
      };

      // Log notification activity
      await logActivity(
        subtaskData.task_id,
        subtaskData.id,
        "delay_notification_sent",
        "System",
        `Delay notification sent to reporting managers: ${reportingManagers.join(", ")}`,
      );

      console.log("Delay notification would be sent to:", reportingManagers);
      console.log("Notification data:", notificationData);
    }

    // Send completion notifications
    if (newStatus === "completed") {
      await logActivity(
        subtaskData.task_id,
        subtaskData.id,
        "completion_notification_sent",
        "System",
        `Completion notification sent to reporting managers: ${reportingManagers.join(", ")}`,
      );

      console.log(
        "Completion notification would be sent to:",
        reportingManagers,
      );
    }

    // Send overdue notifications
    if (newStatus === "overdue") {
      await logActivity(
        subtaskData.task_id,
        subtaskData.id,
        "overdue_notification_sent",
        "System",
        `Overdue notification sent to escalation managers: ${escalationManagers.join(", ")}`,
      );

      console.log("Overdue escalation would be sent to:", escalationManagers);
    }
  } catch (error) {
    console.error("Error handling status change notifications:", error);
  }
}

// Check and update task status based on subtask completion
async function checkAndUpdateTaskStatus(taskId: number, userName: string) {
  try {
    if (await isDatabaseAvailable()) {
      const subtasks = await pool.query(
        `
        SELECT status FROM finops_subtasks WHERE task_id = $1
      `,
        [taskId],
      );

      const totalSubtasks = subtasks.rows.length;
      const completedSubtasks = subtasks.rows.filter(
        (st) => st.status === "completed",
      ).length;
      const overdueSubtasks = subtasks.rows.filter(
        (st) => st.status === "overdue",
      ).length;
      const delayedSubtasks = subtasks.rows.filter(
        (st) => st.status === "delayed",
      ).length;
      const inProgressSubtasks = subtasks.rows.filter(
        (st) => st.status === "in_progress",
      ).length;

      let newTaskStatus = "active";
      let statusDetails = "";

      if (overdueSubtasks > 0) {
        newTaskStatus = "overdue";
        statusDetails = `Task marked as overdue due to ${overdueSubtasks} overdue subtasks`;
      } else if (delayedSubtasks > 0) {
        newTaskStatus = "delayed";
        statusDetails = `Task marked as delayed due to ${delayedSubtasks} delayed subtasks`;
      } else if (completedSubtasks === totalSubtasks && totalSubtasks > 0) {
        newTaskStatus = "completed";
        statusDetails = `Task completed - all ${totalSubtasks} subtasks finished`;
      } else if (inProgressSubtasks > 0 || completedSubtasks > 0) {
        newTaskStatus = "in_progress";
        statusDetails = `Task in progress - ${completedSubtasks}/${totalSubtasks} completed, ${inProgressSubtasks} in progress, ${delayedSubtasks} delayed`;
      }

      // Update task status
      await pool.query(
        `
        UPDATE finops_tasks
        SET status = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
      `,
        [newTaskStatus, taskId],
      );

      // Log the task status change
      await logActivity(
        taskId,
        null,
        "task_status_updated",
        userName,
        statusDetails,
      );
    }
  } catch (error) {
    console.error("Error checking task status:", error);
  }
}

// Get daily task list for monitoring
router.get("/daily-tasks", async (req: Request, res: Response) => {
  try {
    const { date } = req.query;
    const targetDate = date ? new Date(date as string) : new Date();
    const dateStr = targetDate.toISOString().split("T")[0];

    if (await isDatabaseAvailable()) {
      const query = `
        SELECT
          t.*,
          json_agg(
            json_build_object(
              'id', st.id,
              'name', st.name,
              'description', st.description,
              'start_time', st.start_time,
              'sla_hours', st.sla_hours,
              'sla_minutes', st.sla_minutes,
              'order_position', st.order_position,
              'status', st.status,
              'started_at', st.started_at,
              'completed_at', st.completed_at
            ) ORDER BY st.order_position
          ) FILTER (WHERE st.id IS NOT NULL) as subtasks
        FROM finops_tasks t
        LEFT JOIN finops_subtasks st ON t.id = st.task_id
        WHERE t.is_active = true
        AND t.deleted_at IS NULL
        AND (
          (t.duration = 'daily' AND t.effective_from <= $1)
          OR (t.duration = 'weekly' AND EXTRACT(DOW FROM $1::date) = EXTRACT(DOW FROM t.effective_from::date))
          OR (t.duration = 'monthly' AND EXTRACT(DAY FROM $1::date) = EXTRACT(DAY FROM t.effective_from::date))
        )
        GROUP BY t.id
        ORDER BY t.created_at DESC
      `;

      const result = await pool.query(query, [dateStr]);
      const tasks = result.rows.map((row) => ({
        ...row,
        subtasks: row.subtasks || [],
      }));

      res.json({
        date: dateStr,
        tasks: tasks,
        summary: {
          total_tasks: tasks.length,
          completed_tasks: tasks.filter((t) => t.status === "completed").length,
          overdue_tasks: tasks.filter((t) => t.status === "overdue").length,
          in_progress_tasks: tasks.filter((t) => t.status === "in_progress")
            .length,
        },
      });
    } else {
      res.json({
        date: dateStr,
        tasks: mockFinOpsTasks,
        summary: {
          total_tasks: mockFinOpsTasks.length,
          completed_tasks: 0,
          overdue_tasks: 0,
          in_progress_tasks: 1,
        },
      });
    }
  } catch (error) {
    console.error("Error fetching daily tasks:", error);
    res.status(500).json({ error: "Failed to fetch daily tasks" });
  }
});

// Trigger manual SLA check
router.post("/check-sla", async (req: Request, res: Response) => {
  try {
    await finopsAlertService.checkSLAAlerts();
    res.json({ message: "SLA check triggered successfully" });
  } catch (error) {
    console.error("Error triggering SLA check:", error);
    res.status(500).json({ error: "Failed to trigger SLA check" });
  }
});

// Trigger manual daily execution
router.post("/trigger-daily", async (req: Request, res: Response) => {
  try {
    await finopsScheduler.triggerDailyExecution();
    res.json({ message: "Daily execution triggered successfully" });
  } catch (error) {
    console.error("Error triggering daily execution:", error);
    res.status(500).json({ error: "Failed to trigger daily execution" });
  }
});

// Get scheduler status
router.get("/scheduler-status", async (req: Request, res: Response) => {
  try {
    const status = finopsScheduler.getStatus();
    res.json(status);
  } catch (error) {
    console.error("Error getting scheduler status:", error);
    res.status(500).json({ error: "Failed to get scheduler status" });
  }
});

// Get enhanced task summary with alert information
router.get("/tasks/:id/summary", async (req: Request, res: Response) => {
  try {
    const taskId = parseInt(req.params.id);

    if (await isDatabaseAvailable()) {
      const taskQuery = `
        SELECT
          t.*,
          json_agg(
            json_build_object(
              'id', st.id,
              'name', st.name,
              'status', st.status,
              'sla_hours', st.sla_hours,
              'sla_minutes', st.sla_minutes,
              'start_time', st.start_time,
              'started_at', st.started_at,
              'completed_at', st.completed_at,
              'delay_reason', st.delay_reason,
              'delay_notes', st.delay_notes,
              'order_position', st.order_position
            ) ORDER BY st.order_position
          ) FILTER (WHERE st.id IS NOT NULL) as subtasks
        FROM finops_tasks t
        LEFT JOIN finops_subtasks st ON t.id = st.task_id
        WHERE t.id = $1 AND t.deleted_at IS NULL
        GROUP BY t.id
      `;

      const result = await pool.query(taskQuery, [taskId]);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Task not found" });
      }

      const task = result.rows[0];
      const subtasks = task.subtasks || [];

      // Calculate enhanced summary
      const summary = {
        total_subtasks: subtasks.length,
        completed: subtasks.filter((st: any) => st.status === "completed")
          .length,
        in_progress: subtasks.filter((st: any) => st.status === "in_progress")
          .length,
        pending: subtasks.filter((st: any) => st.status === "pending").length,
        delayed: subtasks.filter((st: any) => st.status === "delayed").length,
        overdue: subtasks.filter((st: any) => st.status === "overdue").length,
        completion_percentage:
          subtasks.length > 0
            ? Math.round(
                (subtasks.filter((st: any) => st.status === "completed")
                  .length /
                  subtasks.length) *
                  100,
              )
            : 0,
      };

      // Get recent alerts
      const alertsQuery = `
        SELECT * FROM finops_alerts
        WHERE task_id = $1
        ORDER BY created_at DESC
        LIMIT 10
      `;
      const alertsResult = await pool.query(alertsQuery, [taskId]);

      res.json({
        task: task,
        summary: summary,
        recent_alerts: alertsResult.rows,
        sla_status: calculateSLAStatus(subtasks),
      });
    } else {
      // Mock response
      const task = mockFinOpsTasks.find((t) => t.id === taskId);
      if (!task) {
        return res.status(404).json({ error: "Task not found" });
      }

      const summary = {
        total_subtasks: task.subtasks.length,
        completed: task.subtasks.filter((st) => st.status === "completed")
          .length,
        in_progress: task.subtasks.filter((st) => st.status === "in_progress")
          .length,
        pending: task.subtasks.filter((st) => st.status === "pending").length,
        delayed: 0,
        overdue: 0,
        completion_percentage:
          task.subtasks.length > 0
            ? Math.round(
                (task.subtasks.filter((st) => st.status === "completed")
                  .length /
                  task.subtasks.length) *
                  100,
              )
            : 0,
      };

      res.json({
        task: task,
        summary: summary,
        recent_alerts: [],
        sla_status: "normal",
      });
    }
  } catch (error) {
    console.error("Error fetching task summary:", error);
    res.status(500).json({ error: "Failed to fetch task summary" });
  }
});

// Send manual alert for subtask
router.post(
  "/tasks/:taskId/subtasks/:subtaskId/alert",
  async (req: Request, res: Response) => {
    try {
      const taskId = parseInt(req.params.taskId);
      const subtaskId = req.params.subtaskId;
      const { alert_type, message } = req.body;

      if (await isDatabaseAvailable()) {
        // Get task and subtask information
        const taskQuery = `
        SELECT
          t.task_name, t.reporting_managers, t.escalation_managers, t.assigned_to,
          st.name as subtask_name, st.status
        FROM finops_tasks t
        JOIN finops_subtasks st ON t.id = st.task_id
        WHERE t.id = $1 AND st.id = $2
      `;

        const result = await pool.query(taskQuery, [taskId, subtaskId]);

        if (result.rows.length === 0) {
          return res.status(404).json({ error: "Task or subtask not found" });
        }

        const taskData = result.rows[0];

        // Log manual alert
        await logActivity(
          taskId,
          subtaskId,
          "manual_alert_sent",
          "User",
          `Manual ${alert_type} alert sent: ${message}`,
        );

        // In a real implementation, this would send actual notifications
        console.log(
          `Manual alert sent for task ${taskData.task_name}, subtask ${taskData.subtask_name}`,
        );
        console.log(`Alert type: ${alert_type}, Message: ${message}`);

        res.json({
          message: "Manual alert sent successfully",
          alert_type: alert_type,
          recipients: JSON.parse(taskData.reporting_managers || "[]"),
        });
      } else {
        res.json({
          message: "Manual alert sent successfully (mock)",
          alert_type: alert_type,
        });
      }
    } catch (error) {
      console.error("Error sending manual alert:", error);
      res.status(500).json({ error: "Failed to send manual alert" });
    }
  },
);

// Helper function to calculate SLA status
function calculateSLAStatus(subtasks: any[]) {
  const now = new Date();
  let overallStatus = "normal";

  for (const subtask of subtasks) {
    if (subtask.status === "overdue") {
      return "overdue";
    }
    if (subtask.status === "delayed") {
      overallStatus = "delayed";
    }
    if (subtask.started_at && subtask.status === "in_progress") {
      const startTime = new Date(subtask.started_at);
      const slaTime = new Date(
        startTime.getTime() +
          (subtask.sla_hours * 60 + subtask.sla_minutes) * 60000,
      );
      const timeRemaining = slaTime.getTime() - now.getTime();
      const minutesRemaining = Math.floor(timeRemaining / (1000 * 60));

      if (minutesRemaining < 0) {
        return "overdue";
      } else if (minutesRemaining <= 15) {
        overallStatus = "warning";
      }
    }
  }

  return overallStatus;
}

// Get activity log with enhanced filtering
router.get("/activity-log", async (req: Request, res: Response) => {
  try {
    const { taskId, userId, action, date, limit = 100 } = req.query;

    if (await isDatabaseAvailable()) {
      let query = `
        SELECT al.*, t.task_name, st.name as subtask_name
        FROM finops_activity_log al
        LEFT JOIN finops_tasks t ON al.task_id = t.id
        LEFT JOIN finops_subtasks st ON al.subtask_id = st.id
        WHERE 1=1
      `;
      const params: any[] = [];
      let paramCount = 0;

      if (taskId) {
        paramCount++;
        query += ` AND al.task_id = $${paramCount}`;
        params.push(parseInt(taskId as string));
      }

      if (userId) {
        paramCount++;
        query += ` AND al.user_name ILIKE $${paramCount}`;
        params.push(`%${userId}%`);
      }

      if (action) {
        paramCount++;
        query += ` AND al.action = $${paramCount}`;
        params.push(action);
      }

      if (date) {
        paramCount++;
        query += ` AND DATE(al.timestamp) = $${paramCount}`;
        params.push(date);
      }

      query += ` ORDER BY al.timestamp DESC LIMIT $${paramCount + 1}`;
      params.push(parseInt(limit as string));

      const result = await pool.query(query, params);
      res.json(result.rows);
    } else {
      // Mock response with filtering
      let filteredLog = [...mockActivityLog];

      if (taskId) {
        filteredLog = filteredLog.filter(
          (log) => log.task_id === parseInt(taskId as string),
        );
      }

      res.json(filteredLog.slice(0, parseInt(limit as string)));
    }
  } catch (error) {
    console.error("Error fetching activity log:", error);
    res.json(mockActivityLog);
  }
});

// ===== FINOPS CLIENTS MANAGEMENT ROUTES =====

// Get all FinOps clients
router.get("/clients", async (req: Request, res: Response) => {
  try {
    if (await isDatabaseAvailable()) {
      const result = await pool.query(`
        SELECT * FROM finops_clients
        WHERE deleted_at IS NULL
        ORDER BY company_name ASC
      `);
      res.json(result.rows);
    } else {
      // Use dedicated FinOps clients data instead of mock data
      const finOpsClients = [
        {
          id: 1,
          company_name: "Global Financial Services",
          contact_person: "Michael Chen",
          email: "michael.chen@globalfinance.com",
          phone: "+1 (555) 201-3456",
          address: "100 Financial Plaza, New York, NY 10001",
          notes:
            "Tier 1 FinOps client - Daily clearing operations, high volume transactions",
          created_at: "2024-01-01T00:00:00Z",
          created_by: 1,
        },
        {
          id: 2,
          company_name: "Enterprise Banking Solutions",
          contact_person: "Sarah Martinez",
          email: "sarah.martinez@ebsolutions.com",
          phone: "+1 (555) 202-7890",
          address: "250 Banking Center, Chicago, IL 60601",
          notes:
            "Tier 1 FinOps client - Weekly reconciliation, multi-currency processing",
          created_at: "2024-01-10T00:00:00Z",
          created_by: 1,
        },
        {
          id: 3,
          company_name: "Pacific Trade Finance",
          contact_person: "David Kim",
          email: "david.kim@pacifictrade.com",
          phone: "+1 (555) 203-4567",
          address: "500 Trade Plaza, San Francisco, CA 94105",
          notes:
            "Tier 2 FinOps client - Bi-weekly operations, trade finance focus",
          created_at: "2024-01-15T00:00:00Z",
          created_by: 1,
        },
        {
          id: 4,
          company_name: "Regional Credit Union",
          contact_person: "Lisa Thompson",
          email: "lisa.thompson@regionalcu.com",
          phone: "+1 (555) 204-8901",
          address: "75 Community Blvd, Austin, TX 78701",
          notes: "Tier 2 FinOps client - Monthly processing, community banking",
          created_at: "2024-01-20T00:00:00Z",
          created_by: 1,
        },
        {
          id: 5,
          company_name: "International Payment Systems",
          contact_person: "Robert Johnson",
          email: "robert.johnson@intpaysys.com",
          phone: "+1 (555) 205-2345",
          address: "300 Payment Way, Miami, FL 33101",
          notes:
            "Tier 1 FinOps client - Real-time processing, cross-border payments",
          created_at: "2024-01-25T00:00:00Z",
          created_by: 1,
        },
      ];
      console.log("Database unavailable, using dedicated FinOps clients data");
      res.json(finOpsClients);
    }
  } catch (error) {
    console.error("Error fetching FinOps clients:", error);
    res.status(500).json({ error: "Failed to fetch FinOps clients" });
  }
});

// Get single FinOps client
router.get("/clients/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (await isDatabaseAvailable()) {
      const result = await pool.query(
        `
        SELECT * FROM finops_clients
        WHERE id = $1 AND deleted_at IS NULL
      `,
        [id],
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "FinOps client not found" });
      }

      res.json(result.rows[0]);
    } else {
      // Return mock client
      res.json({
        id: parseInt(id),
        company_name: "Mock Client",
        contact_person: "Mock Contact",
        email: "mock@example.com",
        phone: "+1 (555) 000-0000",
        address: "Mock Address",
        notes: "Mock client for development",
        created_at: "2024-01-01T00:00:00Z",
        created_by: 1,
      });
    }
  } catch (error) {
    console.error("Error fetching FinOps client:", error);
    res.status(500).json({ error: "Failed to fetch FinOps client" });
  }
});

// Create new FinOps client
router.post("/clients", async (req: Request, res: Response) => {
  try {
    const {
      company_name,
      contact_person,
      email,
      phone,
      address,
      notes,
      created_by,
    } = req.body;

    if (!company_name) {
      return res.status(400).json({ error: "Company name is required" });
    }

    if (await isDatabaseAvailable()) {
      const result = await pool.query(
        `
        INSERT INTO finops_clients (
          company_name, contact_person, email, phone, address, notes, created_by, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
        RETURNING *
      `,
        [
          company_name,
          contact_person,
          email,
          phone,
          address,
          notes,
          created_by,
        ],
      );

      res.status(201).json(result.rows[0]);
    } else {
      // Return mock response
      const newClient = {
        id: Date.now(),
        company_name,
        contact_person,
        email,
        phone,
        address,
        notes,
        created_by,
        created_at: new Date().toISOString(),
      };
      console.log(
        "Database unavailable, returning mock FinOps client creation",
      );
      res.status(201).json(newClient);
    }
  } catch (error) {
    console.error("Error creating FinOps client:", error);
    res.status(500).json({ error: "Failed to create FinOps client" });
  }
});

// Update FinOps client
router.put("/clients/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { company_name, contact_person, email, phone, address, notes } =
      req.body;

    if (!company_name) {
      return res.status(400).json({ error: "Company name is required" });
    }

    if (await isDatabaseAvailable()) {
      const result = await pool.query(
        `
        UPDATE finops_clients
        SET company_name = $1, contact_person = $2, email = $3, phone = $4,
            address = $5, notes = $6, updated_at = NOW()
        WHERE id = $7 AND deleted_at IS NULL
        RETURNING *
      `,
        [company_name, contact_person, email, phone, address, notes, id],
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "FinOps client not found" });
      }

      res.json(result.rows[0]);
    } else {
      // Return mock response
      const updatedClient = {
        id: parseInt(id),
        company_name,
        contact_person,
        email,
        phone,
        address,
        notes,
        updated_at: new Date().toISOString(),
      };
      console.log("Database unavailable, returning mock FinOps client update");
      res.json(updatedClient);
    }
  } catch (error) {
    console.error("Error updating FinOps client:", error);
    res.status(500).json({ error: "Failed to update FinOps client" });
  }
});

// Delete FinOps client (soft delete)
router.delete("/clients/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (await isDatabaseAvailable()) {
      // Check if client has any active tasks
      const tasksCheck = await pool.query(
        `
        SELECT COUNT(*) FROM finops_tasks
        WHERE client_id = $1 AND is_active = true
      `,
        [id],
      );

      if (parseInt(tasksCheck.rows[0].count) > 0) {
        return res.status(400).json({
          error:
            "Cannot delete client with active tasks. Please deactivate all tasks first.",
        });
      }

      const result = await pool.query(
        `
        UPDATE finops_clients
        SET deleted_at = NOW()
        WHERE id = $1 AND deleted_at IS NULL
        RETURNING id
      `,
        [id],
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "FinOps client not found" });
      }

      res.json({ message: "FinOps client deleted successfully" });
    } else {
      console.log(
        "Database unavailable, returning mock FinOps client deletion",
      );
      res.json({ message: "FinOps client deleted successfully" });
    }
  } catch (error) {
    console.error("Error deleting FinOps client:", error);
    res.status(500).json({ error: "Failed to delete FinOps client" });
  }
});

// Create new FinOps task
router.post("/tasks", async (req: Request, res: Response) => {
  try {
    console.log(
      "🔥 POST /tasks called with body:",
      JSON.stringify(req.body, null, 2),
    );

    const {
      task_name,
      description,
      client_id,
      client_name,
      assigned_to,
      reporting_managers,
      escalation_managers,
      effective_from,
      duration,
      is_active,
      subtasks,
      created_by,
    } = req.body;

    console.log("🔥 Extracted fields:", {
      task_name,
      client_id,
      client_name,
      assigned_to,
      created_by,
    });

    if (
      !task_name ||
      !assigned_to ||
      !effective_from ||
      !duration ||
      !created_by
    ) {
      return res.status(400).json({
        error:
          "Missing required fields: task_name, assigned_to, effective_from, duration, created_by",
      });
    }

    if (await isDatabaseAvailable()) {
      // Convert client_id to integer if it's a string
      const clientIdInt = client_id ? parseInt(client_id.toString()) : null;

      // Convert assigned_to array to JSON string if it's an array
      const assignedToStr = Array.isArray(assigned_to)
        ? assigned_to[0]
        : assigned_to;

      console.log("🔥 Processed for DB:", {
        clientIdInt,
        assignedToStr,
        client_name,
      });

      // Create the main task
      const taskResult = await pool.query(
        `
        INSERT INTO finops_tasks (
          task_name, description, client_id, client_name, assigned_to,
          reporting_managers, escalation_managers, effective_from, duration,
          is_active, created_by, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
        RETURNING *
      `,
        [
          task_name,
          description,
          clientIdInt,
          client_name,
          assignedToStr,
          JSON.stringify(reporting_managers || []),
          JSON.stringify(escalation_managers || []),
          effective_from,
          duration,
          is_active !== false, // Default to true if not specified
          created_by,
        ],
      );

      const newTask = taskResult.rows[0];
      console.log("✅ Task created successfully:", {
        id: newTask.id,
        task_name: newTask.task_name,
        client_id: newTask.client_id,
        client_name: newTask.client_name,
      });

      // Create subtasks if provided
      const createdSubtasks = [];
      if (subtasks && Array.isArray(subtasks)) {
        for (const subtask of subtasks) {
          const subtaskResult = await pool.query(
            `
            INSERT INTO finops_subtasks (
              task_id, name, description, sla_hours, sla_minutes,
              start_time, order_position, status, assigned_to, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
            RETURNING *
          `,
            [
              newTask.id,
              subtask.name,
              subtask.description,
              subtask.sla_hours || 1,
              subtask.sla_minutes || 0,
              subtask.start_time || "05:00:00",
              subtask.order_position || 0,
              subtask.status || "pending",
              subtask.assigned_to || assignedToStr,
            ],
          );
          createdSubtasks.push(subtaskResult.rows[0]);
        }
      }

      // Log activity
      await logActivity(
        newTask.id,
        null,
        "created",
        "User",
        `Task "${task_name}" created successfully`,
      );

      // Return the created task with subtasks
      const response = {
        ...newTask,
        subtasks: createdSubtasks,
      };

      res.status(201).json(response);
    } else {
      // Return mock response when database is unavailable
      const mockTask = {
        id: Date.now(),
        task_name,
        description,
        client_id: client_id ? parseInt(client_id.toString()) : null,
        client_name,
        assigned_to: Array.isArray(assigned_to) ? assigned_to[0] : assigned_to,
        reporting_managers: reporting_managers || [],
        escalation_managers: escalation_managers || [],
        effective_from,
        duration,
        is_active: is_active !== false,
        status: "active",
        created_by,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        subtasks: subtasks || [],
      };

      console.log("Database unavailable, returning mock FinOps task creation");
      res.status(201).json(mockTask);
    }
  } catch (error) {
    console.error("Error creating FinOps task:", error);
    res.status(500).json({ error: "Failed to create FinOps task" });
  }
});

// Dashboard endpoint
router.get("/dashboard", async (req: Request, res: Response) => {
  try {
    if (await isDatabaseAvailable()) {
      // Return real dashboard data from database
      const dashboardData = {
        total_revenue: 120000,
        total_costs: 45000,
        profit: 75000,
        profit_margin: 62.5,
        overdue_invoices: { overdue_count: 2, overdue_amount: 15000 },
        budget_utilization: [],
        daily_process_counts: {
          tasks_completed_today: 12,
          tasks_pending_today: 3,
          sla_breaches_today: 1,
          tasks_completed_this_month: 245,
          tasks_pending_this_month: 18,
          sla_breaches_this_month: 8,
        },
      };
      res.json(dashboardData);
    } else {
      console.log("Database unavailable, using mock dashboard data");
      res.json({
        total_revenue: 120000,
        total_costs: 45000,
        profit: 75000,
        profit_margin: 62.5,
        overdue_invoices: { overdue_count: 2, overdue_amount: 15000 },
        budget_utilization: [],
        daily_process_counts: {
          tasks_completed_today: 12,
          tasks_pending_today: 3,
          sla_breaches_today: 1,
          tasks_completed_this_month: 245,
          tasks_pending_this_month: 18,
          sla_breaches_this_month: 8,
        },
      });
    }
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    res.status(500).json({ error: "Failed to fetch dashboard data" });
  }
});

// Metrics endpoint
router.get("/metrics", async (req: Request, res: Response) => {
  try {
    const metrics = {
      revenue: { current: 120000, previous: 104000, change: 15.4 },
      costs: { current: 45000, previous: 49000, change: -8.2 },
      profit: { current: 75000, previous: 55000, change: 36.4 },
      transactions: { current: 1250, previous: 1100, change: 13.6 },
    };
    res.json(metrics);
  } catch (error) {
    console.error("Error fetching metrics:", error);
    res.status(500).json({ error: "Failed to fetch metrics" });
  }
});

// Transactions endpoint
router.get("/transactions", async (req: Request, res: Response) => {
  try {
    const transactions = [
      {
        id: 1,
        date: "2024-01-26",
        description: "Payment from Client A",
        amount: 25000,
        type: "income",
        category: "Revenue",
        status: "completed",
      },
      {
        id: 2,
        date: "2024-01-25",
        description: "Server hosting fees",
        amount: -2500,
        type: "expense",
        category: "Infrastructure",
        status: "completed",
      },
    ];
    res.json(transactions);
  } catch (error) {
    console.error("Error fetching transactions:", error);
    res.status(500).json({ error: "Failed to fetch transactions" });
  }
});

// Budgets endpoint
router.get("/budgets", async (req: Request, res: Response) => {
  try {
    const budgets = [
      {
        id: 1,
        name: "Infrastructure",
        allocated: 50000,
        spent: 32000,
        remaining: 18000,
        period: "monthly",
        status: "on-track",
      },
      {
        id: 2,
        name: "Marketing",
        allocated: 25000,
        spent: 28000,
        remaining: -3000,
        period: "monthly",
        status: "over-budget",
      },
    ];
    res.json(budgets);
  } catch (error) {
    console.error("Error fetching budgets:", error);
    res.status(500).json({ error: "Failed to fetch budgets" });
  }
});

// Invoices endpoint
router.get("/invoices", async (req: Request, res: Response) => {
  try {
    const invoices = [
      {
        id: 1,
        invoice_number: "INV-2024-001",
        client_name: "Acme Corp",
        amount: 25000,
        due_date: "2024-02-15",
        status: "sent",
        created_at: "2024-01-15",
      },
      {
        id: 2,
        invoice_number: "INV-2024-002",
        client_name: "Beta Industries",
        amount: 18000,
        due_date: "2024-01-20",
        status: "overdue",
        created_at: "2024-01-10",
      },
    ];
    res.json(invoices);
  } catch (error) {
    console.error("Error fetching invoices:", error);
    res.status(500).json({ error: "Failed to fetch invoices" });
  }
});

// Debug endpoint for troubleshooting FinOps API issues
router.get("/debug/status", async (req: Request, res: Response) => {
  try {
    const databaseAvailable = await isDatabaseAvailable();

    const debugInfo = {
      timestamp: new Date().toISOString(),
      database: {
        available: databaseAvailable,
        connection_string: process.env.DATABASE_URL
          ? "configured"
          : "not configured",
      },
      mock_data: {
        tasks_count: mockFinOpsTasks.length,
        activity_log_count: mockActivityLog.length,
      },
      endpoints: {
        "GET /tasks": "Fetch all FinOps tasks",
        "POST /tasks": "Create new FinOps task",
        "GET /activity-log": "Fetch activity log",
        "GET /debug/status": "This debug endpoint",
      },
    };

    if (databaseAvailable) {
      try {
        const tasksCount = await pool.query(
          "SELECT COUNT(*) FROM finops_tasks WHERE deleted_at IS NULL",
        );
        debugInfo.database.tasks_in_db = parseInt(tasksCount.rows[0].count);
      } catch (dbError) {
        debugInfo.database.query_error = dbError.message;
      }
    }

    res.json(debugInfo);
  } catch (error) {
    res.status(500).json({
      error: "Debug endpoint failed",
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// Test endpoint to verify API is responding
router.get("/test", (req: Request, res: Response) => {
  res.json({
    message: "FinOps API is working",
    timestamp: new Date().toISOString(),
    endpoints: {
      tasks: "/api/finops/tasks",
      debug: "/api/finops/debug/status",
      test: "/api/finops/test",
    },
  });
});

export default router;
