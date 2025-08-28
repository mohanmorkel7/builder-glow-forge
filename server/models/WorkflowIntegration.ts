import { pool } from "../database/connection";
import { QueryResult } from "pg";

// Type definitions for workflow entities
export interface WorkflowProject {
  id: number;
  name: string;
  description?: string;
  source_type: "lead" | "manual";
  source_id?: number;
  project_type: "product_development" | "finops_process" | "integration";
  status:
    | "created"
    | "in_progress"
    | "review"
    | "completed"
    | "on_hold"
    | "cancelled";
  priority: "low" | "medium" | "high" | "critical";
  assigned_team?: string;
  project_manager_id?: number;
  start_date?: string;
  target_completion_date?: string;
  actual_completion_date?: string;
  budget?: number;
  estimated_hours?: number;
  actual_hours?: number;
  progress_percentage: number;
  created_at: string;
  updated_at: string;
  created_by: number;
  // Extended fields from view
  project_manager_name?: string;
  creator_name?: string;
  total_steps?: number;
  completed_steps?: number;
  active_steps?: number;
  pending_steps?: number;
  total_comments?: number;
  total_documents?: number;
  // Related data
  steps?: WorkflowStep[];
  comments?: WorkflowComment[];
  documents?: WorkflowDocument[];
  lead_data?: any; // Original lead data when source_type = 'lead'
}

export interface WorkflowStep {
  id: number;
  project_id: number;
  step_name: string;
  step_description?: string;
  step_order: number;
  status: "pending" | "in_progress" | "completed" | "blocked" | "cancelled";
  assigned_to?: number;
  estimated_hours?: number;
  actual_hours?: number;
  start_date?: string;
  due_date?: string;
  completion_date?: string;
  dependencies?: string; // JSON array of step IDs
  is_automated: boolean;
  automation_config?: any; // JSON configuration
  created_at: string;
  updated_at: string;
  created_by: number;
  // Extended fields
  assigned_user_name?: string;
  creator_name?: string;
  comments?: WorkflowComment[];
}

export interface WorkflowComment {
  id: number;
  project_id?: number;
  step_id?: number;
  comment_text: string;
  comment_type: "comment" | "status_update" | "assignment" | "alert" | "system";
  mentioned_users?: number[]; // JSON array
  attachments?: string[]; // JSON array
  is_internal: boolean;
  created_at: string;
  updated_at: string;
  created_by: number;
  // Extended fields
  creator_name?: string;
  creator_avatar?: string;
}

export interface WorkflowNotification {
  id: number;
  notification_type:
    | "step_overdue"
    | "project_delayed"
    | "assignment"
    | "mention"
    | "process_failed"
    | "daily_task"
    | "system_alert";
  title: string;
  message: string;
  recipient_id: number;
  project_id?: number;
  step_id?: number;
  source_type: "lead" | "product" | "finops" | "system";
  source_id?: number;
  priority: "low" | "medium" | "high" | "critical";
  is_read: boolean;
  is_email_sent: boolean;
  scheduled_for?: string;
  expires_at?: string;
  created_at: string;
  read_at?: string;
}

export interface WorkflowAutomation {
  id: number;
  automation_name: string;
  automation_type:
    | "daily_task"
    | "scheduled_check"
    | "conditional_trigger"
    | "notification";
  target_type: "step" | "project" | "system";
  target_id?: number;
  schedule_config: any; // JSON
  action_config: any; // JSON
  is_active: boolean;
  last_run_at?: string;
  next_run_at?: string;
  run_count: number;
  success_count: number;
  failure_count: number;
  last_error?: string;
  created_at: string;
  updated_at: string;
  created_by: number;
}

export interface WorkflowDocument {
  id: number;
  project_id: number;
  document_name: string;
  document_type:
    | "requirement"
    | "specification"
    | "design"
    | "report"
    | "contract"
    | "other";
  file_path?: string;
  file_size?: number;
  mime_type?: string;
  source_type: "lead" | "uploaded" | "generated";
  source_reference?: string;
  description?: string;
  version: string;
  is_latest_version: boolean;
  uploaded_at: string;
  uploaded_by: number;
  uploader_name?: string;
}

export interface LeadProjectTransition {
  id: number;
  lead_id: number;
  project_id: number;
  transition_type: "automatic" | "manual";
  transition_reason?: string;
  lead_completion_date?: string;
  project_creation_date: string;
  handoff_notes?: string;
  created_by: number;
}

// Data transfer objects
export interface CreateWorkflowProjectData {
  name: string;
  description?: string;
  source_type: "lead" | "manual";
  source_id?: number;
  project_type: "product_development" | "finops_process" | "integration";
  priority?: "low" | "medium" | "high" | "critical";
  assigned_team?: string;
  project_manager_id?: number;
  start_date?: string;
  target_completion_date?: string;
  budget?: number;
  estimated_hours?: number;
  template_id?: number;
  steps?: Array<{
    step_name: string;
    step_description?: string;
    step_order: number;
    status?: "pending" | "in_progress" | "completed" | "blocked";
    estimated_hours?: number;
    due_date?: string;
  }>;
  created_by: number;
}

export interface CreateWorkflowStepData {
  project_id: number;
  step_name: string;
  step_description?: string;
  step_order?: number;
  assigned_to?: number;
  estimated_hours?: number;
  due_date?: string;
  dependencies?: number[];
  is_automated?: boolean;
  automation_config?: any;
  created_by: number;
}

export interface CreateWorkflowCommentData {
  project_id?: number;
  step_id?: number;
  comment_text: string;
  comment_type?:
    | "comment"
    | "status_update"
    | "assignment"
    | "alert"
    | "system";
  mentioned_users?: number[];
  attachments?: string[];
  is_internal?: boolean;
  created_by: number;
}

// Repository class for workflow operations
export class WorkflowRepository {
  // Project operations
  static async getAllProjects(
    userId?: number,
    userRole?: string,
  ): Promise<WorkflowProject[]> {
    let whereClause = "WHERE 1=1";
    const params: any[] = [];

    // Filter based on user role and assignment
    if (userRole === "product") {
      whereClause +=
        " AND (project_type = 'product_development' OR assigned_team LIKE '%Product%')";
    } else if (userRole === "finance") {
      whereClause +=
        " AND (project_type = 'finops_process' OR assigned_team LIKE '%FinOps%')";
    }

    const result = await pool.query(
      `SELECT * FROM workflow_project_summary ${whereClause} ORDER BY created_at DESC`,
      params,
    );
    return result.rows as WorkflowProject[];
  }

  static async getProjectById(
    id: number,
    includeSteps = true,
    includeComments = true,
  ): Promise<WorkflowProject | null> {
    const result = await pool.query(
      "SELECT * FROM workflow_project_summary WHERE id = $1",
      [id],
    );

    if (result.rows.length === 0) return null;

    const project = result.rows[0] as WorkflowProject;

    if (includeSteps) {
      project.steps = await this.getProjectSteps(id);
    }

    if (includeComments) {
      project.comments = await this.getProjectComments(id);
    }

    // Get lead data if project is sourced from lead
    if (project.source_type === "lead" && project.source_id) {
      try {
        const leadResult = await pool.query(
          "SELECT * FROM leads WHERE id = $1",
          [project.source_id],
        );
        if (leadResult.rows.length > 0) {
          project.lead_data = leadResult.rows[0];
        }
      } catch (error) {
        console.log("Could not fetch lead data:", error);
      }
    }

    return project;
  }

  static async createProject(
    data: CreateWorkflowProjectData,
  ): Promise<WorkflowProject> {
    const result = await pool.query(
      `INSERT INTO workflow_projects
       (name, description, source_type, source_id, project_type, priority, assigned_team,
        project_manager_id, start_date, target_completion_date, budget, estimated_hours, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       RETURNING id`,
      [
        data.name,
        data.description,
        data.source_type,
        data.source_id,
        data.project_type,
        data.priority || "medium",
        data.assigned_team,
        data.project_manager_id,
        data.start_date,
        data.target_completion_date,
        data.budget,
        data.estimated_hours,
        data.created_by,
      ],
    );

    const newProject = await this.getProjectById(result.rows[0].id);
    return newProject!;
  }

  static async createProjectFromLead(
    leadId: number,
    projectData: Partial<CreateWorkflowProjectData>,
    createdBy: number,
  ): Promise<WorkflowProject> {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Get lead data
      const leadResult = await client.query(
        "SELECT * FROM leads WHERE id = $1",
        [leadId],
      );

      if (leadResult.rows.length === 0) {
        throw new Error("Lead not found");
      }

      const lead = leadResult.rows[0];

      // Create project based on lead
      const projectCreateData: CreateWorkflowProjectData = {
        name: projectData.name || `${lead.client_name} - ${lead.project_title}`,
        description:
          projectData.description ||
          `Product development project for ${lead.client_name}`,
        source_type: "lead",
        source_id: leadId,
        project_type: projectData.project_type || "product_development",
        priority: projectData.priority || "medium",
        assigned_team: projectData.assigned_team || "Product Team",
        project_manager_id: projectData.project_manager_id,
        start_date:
          projectData.start_date || new Date().toISOString().split("T")[0],
        target_completion_date: projectData.target_completion_date,
        budget: projectData.budget,
        estimated_hours: projectData.estimated_hours,
        created_by: createdBy,
      };

      const projectResult = await client.query(
        `INSERT INTO workflow_projects
         (name, description, source_type, source_id, project_type, priority, assigned_team,
          project_manager_id, start_date, target_completion_date, budget, estimated_hours, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
         RETURNING id`,
        Object.values(projectCreateData),
      );

      const projectId = projectResult.rows[0].id;

      // Create transition record
      await client.query(
        `INSERT INTO lead_project_transitions
         (lead_id, project_id, transition_type, transition_reason, handoff_notes, created_by)
         VALUES ($1, $2, 'manual', 'Lead completed - handed off to product team', $3, $4)`,
        [
          leadId,
          projectId,
          projectData.description || "Lead to product handoff",
          createdBy,
        ],
      );

      // Handle steps creation - either from template or from provided steps
      if ((projectData as any).template_id) {
        // Get template steps from template
        try {
          const templateStepsResult = await client.query(
            "SELECT * FROM template_steps WHERE template_id = $1 ORDER BY step_order",
            [(projectData as any).template_id],
          );

          if (templateStepsResult.rows.length > 0) {
            for (const templateStep of templateStepsResult.rows) {
              await client.query(
                `INSERT INTO workflow_steps
                 (project_id, step_name, step_description, step_order, status, estimated_hours, created_by)
                 VALUES ($1, $2, $3, $4, 'pending', $5, $6)`,
                [
                  projectId,
                  templateStep.name,
                  templateStep.description,
                  templateStep.step_order,
                  templateStep.default_eta_days
                    ? templateStep.default_eta_days * 8
                    : null,
                  createdBy,
                ],
              );
            }
          }
        } catch (templateError) {
          console.log(
            "Could not load template steps, using provided steps instead:",
            templateError,
          );
        }
      } else if (
        (projectData as any).steps &&
        (projectData as any).steps.length > 0
      ) {
        // Use provided custom steps
        for (const step of (projectData as any).steps) {
          await client.query(
            `INSERT INTO workflow_steps
             (project_id, step_name, step_description, step_order, status, estimated_hours, due_date, created_by)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [
              projectId,
              step.step_name,
              step.step_description,
              step.step_order,
              step.status || "pending",
              step.estimated_hours,
              step.due_date,
              createdBy,
            ],
          );
        }
      }

      // Copy lead steps as reference steps for the project (always add this as the first step)
      const leadStepsResult = await client.query(
        "SELECT * FROM lead_steps WHERE lead_id = $1 ORDER BY step_order",
        [leadId],
      );
      const leadSteps = leadStepsResult.rows;

      if (leadSteps.length > 0) {
        // Add reference step showing completed lead work as step 0
        await client.query(
          `INSERT INTO workflow_steps
           (project_id, step_name, step_description, step_order, status, created_by)
           VALUES ($1, $2, $3, $4, 'completed', $5)`,
          [
            projectId,
            "Lead Completion Review",
            `Review completed lead work: ${leadSteps.length} steps completed. Original lead requirements and documents attached.`,
            0,
            createdBy,
          ],
        );
      }

      await client.query("COMMIT");

      const newProject = await this.getProjectById(projectId);
      return newProject!;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  // Step operations
  static async getProjectSteps(projectId: number): Promise<WorkflowStep[]> {
    const result = await pool.query(
      `SELECT ws.*, u1.name as assigned_user_name, u2.name as creator_name
       FROM workflow_steps ws
       LEFT JOIN users u1 ON ws.assigned_to = u1.id
       LEFT JOIN users u2 ON ws.created_by = u2.id
       WHERE ws.project_id = $1
       ORDER BY ws.step_order, ws.created_at`,
      [projectId],
    );
    return result.rows as WorkflowStep[];
  }

  static async createStep(data: CreateWorkflowStepData): Promise<WorkflowStep> {
    const result = await pool.query(
      `INSERT INTO workflow_steps
       (project_id, step_name, step_description, step_order, assigned_to, estimated_hours,
        due_date, dependencies, is_automated, automation_config, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING id`,
      [
        data.project_id,
        data.step_name,
        data.step_description,
        data.step_order || 1,
        data.assigned_to,
        data.estimated_hours,
        data.due_date,
        data.dependencies ? JSON.stringify(data.dependencies) : null,
        data.is_automated || false,
        data.automation_config ? JSON.stringify(data.automation_config) : null,
        data.created_by,
      ],
    );

    const stepResult = await pool.query(
      `SELECT ws.*, u1.name as assigned_user_name, u2.name as creator_name
       FROM workflow_steps ws
       LEFT JOIN users u1 ON ws.assigned_to = u1.id
       LEFT JOIN users u2 ON ws.created_by = u2.id
       WHERE ws.id = $1`,
      [result.rows[0].id],
    );

    return stepResult.rows[0] as WorkflowStep;
  }

  static async updateStepStatus(
    stepId: number,
    status: string,
    userId: number,
  ): Promise<void> {
    await pool.query(
      "UPDATE workflow_steps SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2",
      [status, stepId],
    );

    // The trigger will handle progress updates and notifications
  }

  static async reorderProjectSteps(
    projectId: number,
    stepOrders: { id: number; order: number }[],
  ): Promise<void> {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Update step orders in batch
      for (const stepOrder of stepOrders) {
        await client.query(
          "UPDATE workflow_steps SET step_order = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND project_id = $3",
          [stepOrder.order, stepOrder.id, projectId],
        );
      }

      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  // Comment operations
  static async getProjectComments(
    projectId: number,
    stepId?: number,
  ): Promise<WorkflowComment[]> {
    let whereClause = "WHERE wc.project_id = $1";
    const params = [projectId];

    if (stepId) {
      whereClause += " AND wc.step_id = $2";
      params.push(stepId);
    }

    const result = await pool.query(
      `SELECT wc.*, u.name as creator_name
       FROM workflow_comments wc
       LEFT JOIN users u ON wc.created_by = u.id
       ${whereClause}
       ORDER BY wc.created_at DESC`,
      params,
    );
    return result.rows as WorkflowComment[];
  }

  static async createComment(
    data: CreateWorkflowCommentData,
  ): Promise<WorkflowComment> {
    const result = await pool.query(
      `INSERT INTO workflow_comments
       (project_id, step_id, comment_text, comment_type, mentioned_users, attachments, is_internal, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id`,
      [
        data.project_id,
        data.step_id,
        data.comment_text,
        data.comment_type || "comment",
        data.mentioned_users ? JSON.stringify(data.mentioned_users) : null,
        data.attachments ? JSON.stringify(data.attachments) : null,
        data.is_internal || false,
        data.created_by,
      ],
    );

    const commentResult = await pool.query(
      `SELECT wc.*, u.name as creator_name
       FROM workflow_comments wc
       LEFT JOIN users u ON wc.created_by = u.id
       WHERE wc.id = $1`,
      [result.rows[0].id],
    );

    return commentResult.rows[0] as WorkflowComment;
  }

  // Notification operations
  static async getUserNotifications(
    userId: number,
    unreadOnly = false,
  ): Promise<WorkflowNotification[]> {
    let whereClause = "WHERE recipient_id = $1";
    const params = [userId];

    if (unreadOnly) {
      whereClause += " AND is_read = false";
    }

    const result = await pool.query(
      `SELECT * FROM workflow_notifications
       ${whereClause}
       ORDER BY created_at DESC
       LIMIT 50`,
      params,
    );
    return result.rows as WorkflowNotification[];
  }

  static async createNotification(
    notificationData: Omit<
      WorkflowNotification,
      "id" | "created_at" | "read_at"
    >,
  ): Promise<void> {
    await pool.query(
      `INSERT INTO workflow_notifications
       (notification_type, title, message, recipient_id, project_id, step_id, source_type,
        source_id, priority, is_read, is_email_sent, scheduled_for, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
      [
        notificationData.notification_type,
        notificationData.title,
        notificationData.message,
        notificationData.recipient_id,
        notificationData.project_id,
        notificationData.step_id,
        notificationData.source_type,
        notificationData.source_id,
        notificationData.priority,
        notificationData.is_read,
        notificationData.is_email_sent,
        notificationData.scheduled_for,
        notificationData.expires_at,
      ],
    );
  }

  static async markNotificationAsRead(notificationId: number): Promise<void> {
    await pool.query(
      "UPDATE workflow_notifications SET is_read = true, read_at = CURRENT_TIMESTAMP WHERE id = $1",
      [notificationId],
    );
  }

  // Automation operations
  static async getActiveAutomations(): Promise<WorkflowAutomation[]> {
    const result = await pool.query(
      "SELECT * FROM workflow_automations WHERE is_active = true ORDER BY next_run_at",
    );
    return result.rows as WorkflowAutomation[];
  }

  static async updateAutomationRunStatus(
    automationId: number,
    success: boolean,
    error?: string,
  ): Promise<void> {
    await pool.query(
      `UPDATE workflow_automations
       SET last_run_at = CURRENT_TIMESTAMP,
           run_count = run_count + 1,
           success_count = success_count + $1,
           failure_count = failure_count + $2,
           last_error = $3
       WHERE id = $4`,
      [success ? 1 : 0, success ? 0 : 1, error || null, automationId],
    );
  }

  // Dashboard data
  static async getDashboardData(
    userId: number,
    userRole: string,
  ): Promise<any> {
    // Get project counts by status
    const projectStatsResult = await pool.query(
      `SELECT status, COUNT(*) as count
       FROM workflow_projects
       WHERE ($1 = 'admin' OR assigned_team LIKE $2 OR project_manager_id = $3)
       GROUP BY status`,
      [
        userRole,
        `%${userRole === "product" ? "Product" : userRole === "finance" ? "FinOps" : ""}%`,
        userId,
      ],
    );

    // Get overdue steps
    const overdueStepsResult = await pool.query(
      `SELECT COUNT(*) as overdue_count
       FROM workflow_steps ws
       JOIN workflow_projects wp ON ws.project_id = wp.id
       WHERE ws.due_date < NOW()
       AND ws.status NOT IN ('completed', 'cancelled')
       AND ($1 = 'admin' OR wp.assigned_team LIKE $2 OR ws.assigned_to = $3)`,
      [
        userRole,
        `%${userRole === "product" ? "Product" : userRole === "finance" ? "FinOps" : ""}%`,
        userId,
      ],
    );

    // Get recent notifications
    const recentNotifications = await this.getUserNotifications(userId, true);

    return {
      project_stats: projectStatsResult.rows,
      overdue_steps: overdueStepsResult.rows[0]?.overdue_count || 0,
      unread_notifications: recentNotifications.length,
      recent_notifications: recentNotifications.slice(0, 5),
    };
  }
}
