import cron from "node-cron";
import finopsAlertService from "./finopsAlertService";
import { pool } from "../database/connection";

class FinOpsScheduler {
  private isInitialized = false;

  /**
   * Initialize all scheduled jobs
   */
  public initialize(): void {
    if (this.isInitialized) {
      console.log("FinOps Scheduler already initialized");
      return;
    }

    console.log("Initializing FinOps Scheduler...");

    // Daily task execution at 5:00 AM
    cron.schedule("0 5 * * *", async () => {
      console.log("Running daily task execution...");
      await finopsAlertService.checkDailyTaskExecution();
    }, {
      timezone: "Asia/Kolkata"
    });

    // SLA monitoring every 5 minutes
    cron.schedule("*/5 * * * *", async () => {
      console.log("Running SLA monitoring check...");
      await finopsAlertService.checkSLAAlerts();
    });

    // Incomplete subtask check every 30 minutes
    cron.schedule("*/30 * * * *", async () => {
      console.log("Checking for incomplete subtasks...");
      await finopsAlertService.checkIncompleteSubtasks();
    });

    // Weekly task execution on Mondays at 5:00 AM
    cron.schedule("0 5 * * 1", async () => {
      console.log("Running weekly task execution...");
      await this.executeWeeklyTasks();
    }, {
      timezone: "Asia/Kolkata"
    });

    // Monthly task execution on the 1st of each month at 5:00 AM
    cron.schedule("0 5 1 * *", async () => {
      console.log("Running monthly task execution...");
      await this.executeMonthlyTasks();
    }, {
      timezone: "Asia/Kolkata"
    });

    // Task status sync every minute for real-time monitoring
    cron.schedule("* * * * *", async () => {
      await this.syncTaskStatuses();
    });

    // Database cleanup weekly on Sundays at 2:00 AM
    cron.schedule("0 2 * * 0", async () => {
      console.log("Running database cleanup...");
      await this.cleanupOldData();
    }, {
      timezone: "Asia/Kolkata"
    });

    this.isInitialized = true;
    console.log("FinOps Scheduler initialized successfully");
  }

  /**
   * Execute weekly tasks
   */
  private async executeWeeklyTasks(): Promise<void> {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const tasksToExecute = await pool.query(`
        SELECT * FROM finops_tasks 
        WHERE is_active = true 
        AND duration = 'weekly'
        AND effective_from <= $1
        AND (last_run IS NULL OR last_run < (CURRENT_TIMESTAMP - INTERVAL '6 days'))
        AND deleted_at IS NULL
      `, [today]);
      
      for (const task of tasksToExecute.rows) {
        await this.executeTask(task, 'weekly');
      }
      
      console.log(`Weekly task execution completed. Processed ${tasksToExecute.rows.length} tasks`);
    } catch (error) {
      console.error("Error in weekly task execution:", error);
    }
  }

  /**
   * Execute monthly tasks
   */
  private async executeMonthlyTasks(): Promise<void> {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const tasksToExecute = await pool.query(`
        SELECT * FROM finops_tasks 
        WHERE is_active = true 
        AND duration = 'monthly'
        AND effective_from <= $1
        AND (last_run IS NULL OR last_run < (CURRENT_TIMESTAMP - INTERVAL '28 days'))
        AND deleted_at IS NULL
      `, [today]);
      
      for (const task of tasksToExecute.rows) {
        await this.executeTask(task, 'monthly');
      }
      
      console.log(`Monthly task execution completed. Processed ${tasksToExecute.rows.length} tasks`);
    } catch (error) {
      console.error("Error in monthly task execution:", error);
    }
  }

  /**
   * Execute a specific task
   */
  private async executeTask(task: any, period: string): Promise<void> {
    try {
      console.log(`Executing ${period} task: ${task.task_name}`);
      
      // Get subtasks for this task
      const subtasks = await pool.query(`
        SELECT * FROM finops_subtasks 
        WHERE task_id = $1 
        ORDER BY order_position
      `, [task.id]);
      
      // Reset all subtasks to pending status for new execution cycle
      for (const subtask of subtasks.rows) {
        await pool.query(`
          UPDATE finops_subtasks 
          SET status = 'pending', 
              started_at = NULL, 
              completed_at = NULL,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = $1
        `, [subtask.id]);
      }
      
      // Calculate next run time based on duration
      let nextRunInterval = '1 day';
      if (period === 'weekly') {
        nextRunInterval = '7 days';
      } else if (period === 'monthly') {
        nextRunInterval = '30 days';
      }
      
      // Update task last run time and next run
      await pool.query(`
        UPDATE finops_tasks 
        SET last_run = CURRENT_TIMESTAMP,
            next_run = CURRENT_TIMESTAMP + INTERVAL '${nextRunInterval}',
            status = 'active'
        WHERE id = $1
      `, [task.id]);
      
      // Log activity
      await this.logActivity(task.id, null, `${period}_execution`, 'System', `${period.charAt(0).toUpperCase() + period.slice(1)} task execution started`);
      
      console.log(`${period.charAt(0).toUpperCase() + period.slice(1)} task executed successfully: ${task.task_name}`);
      
    } catch (error) {
      console.error(`Error executing ${period} task ${task.task_name}:`, error);
    }
  }

  /**
   * Sync task statuses based on subtask completion
   */
  private async syncTaskStatuses(): Promise<void> {
    try {
      // Get all active tasks and calculate their status
      const tasks = await pool.query(`
        SELECT 
          t.id,
          t.task_name,
          COUNT(st.id) as total_subtasks,
          COUNT(CASE WHEN st.status = 'completed' THEN 1 END) as completed_subtasks,
          COUNT(CASE WHEN st.status = 'overdue' THEN 1 END) as overdue_subtasks,
          COUNT(CASE WHEN st.status = 'in_progress' THEN 1 END) as in_progress_subtasks
        FROM finops_tasks t
        LEFT JOIN finops_subtasks st ON t.id = st.task_id
        WHERE t.is_active = true AND t.deleted_at IS NULL
        GROUP BY t.id, t.task_name
      `);
      
      for (const task of tasks.rows) {
        let newStatus = 'active';
        
        if (task.overdue_subtasks > 0) {
          newStatus = 'overdue';
        } else if (task.completed_subtasks === task.total_subtasks && task.total_subtasks > 0) {
          newStatus = 'completed';
        } else if (task.in_progress_subtasks > 0) {
          newStatus = 'in_progress';
        }
        
        // Update task status if it has changed
        await pool.query(`
          UPDATE finops_tasks 
          SET status = $1, updated_at = CURRENT_TIMESTAMP 
          WHERE id = $2 AND status != $1
        `, [newStatus, task.id]);
      }
      
    } catch (error) {
      console.error("Error syncing task statuses:", error);
    }
  }

  /**
   * Clean up old data
   */
  private async cleanupOldData(): Promise<void> {
    try {
      console.log("Starting database cleanup...");
      
      // Clean up old activity logs (older than 90 days)
      const activityCleanup = await pool.query(`
        DELETE FROM finops_activity_log 
        WHERE timestamp < (CURRENT_TIMESTAMP - INTERVAL '90 days')
      `);
      
      // Clean up old alerts (older than 30 days)
      const alertsCleanup = await pool.query(`
        DELETE FROM finops_alerts 
        WHERE created_at < (CURRENT_TIMESTAMP - INTERVAL '30 days')
      `);
      
      console.log(`Database cleanup completed. Removed ${activityCleanup.rowCount} activity logs and ${alertsCleanup.rowCount} alerts`);
      
    } catch (error) {
      console.error("Error during database cleanup:", error);
    }
  }

  /**
   * Log activity
   */
  private async logActivity(taskId: number, subtaskId: string | null, action: string, userName: string, details: string): Promise<void> {
    try {
      await pool.query(`
        INSERT INTO finops_activity_log (task_id, subtask_id, action, user_name, details)
        VALUES ($1, $2, $3, $4, $5)
      `, [taskId, subtaskId, action, userName, details]);
    } catch (error) {
      console.error("Error logging activity:", error);
    }
  }

  /**
   * Manually trigger daily execution for testing
   */
  public async triggerDailyExecution(): Promise<void> {
    console.log("Manually triggering daily task execution...");
    await finopsAlertService.checkDailyTaskExecution();
  }

  /**
   * Manually trigger SLA check for testing
   */
  public async triggerSLACheck(): Promise<void> {
    console.log("Manually triggering SLA check...");
    await finopsAlertService.checkSLAAlerts();
  }

  /**
   * Get scheduler status
   */
  public getStatus(): { initialized: boolean, activeJobs: string[] } {
    const activeJobs = [
      "Daily Task Execution (5:00 AM)",
      "SLA Monitoring (Every 5 minutes)",
      "Incomplete Subtask Check (Every 30 minutes)",
      "Weekly Task Execution (Mondays 5:00 AM)",
      "Monthly Task Execution (1st of month 5:00 AM)",
      "Task Status Sync (Every minute)",
      "Database Cleanup (Sundays 2:00 AM)"
    ];
    
    return {
      initialized: this.isInitialized,
      activeJobs: this.isInitialized ? activeJobs : []
    };
  }

  /**
   * Stop all scheduled jobs
   */
  public stop(): void {
    if (this.isInitialized) {
      cron.getTasks().forEach(task => task.stop());
      this.isInitialized = false;
      console.log("FinOps Scheduler stopped");
    }
  }
}

export default new FinOpsScheduler();
