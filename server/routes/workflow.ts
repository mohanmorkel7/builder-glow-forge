import { Router, Request, Response } from "express";
import {
  WorkflowRepository,
  CreateWorkflowProjectData,
  CreateWorkflowStepData,
  CreateWorkflowCommentData,
} from "../models/WorkflowIntegration";

const router = Router();

// Helper function to check if database is available (for fallback to mock data)
async function isDatabaseAvailable() {
  try {
    await WorkflowRepository.getAllProjects();
    return true;
  } catch (error) {
    console.log("Workflow database not available:", error.message);
    return false;
  }
}

// Mock data for development/testing
const WorkflowMockData = {
  projects: [
    {
      id: 1,
      name: "TechCorp Solutions - Core Platform",
      description: "Product development project for TechCorp Solutions",
      source_type: "lead",
      source_id: 1,
      project_type: "product_development",
      status: "in_progress",
      priority: "high",
      assigned_team: "Product Team",
      project_manager_id: 2,
      progress_percentage: 45,
      total_steps: 8,
      completed_steps: 3,
      active_steps: 2,
      pending_steps: 3,
      created_at: "2024-01-15T00:00:00Z",
      lead_data: {
        client_name: "TechCorp Solutions",
        project_title: "Enterprise Platform Development",
        project_description: "Building a comprehensive enterprise platform",
        lead_status: "completed",
      },
    },
    {
      id: 2,
      name: "FinOps Daily Operations",
      description: "Daily financial operations and reconciliation processes",
      source_type: "manual",
      project_type: "finops_process",
      status: "in_progress",
      priority: "critical",
      assigned_team: "FinOps Team",
      progress_percentage: 90,
      total_steps: 4,
      completed_steps: 3,
      active_steps: 1,
      pending_steps: 0,
      created_at: "2024-01-01T00:00:00Z",
    },
  ],
  steps: [
    {
      id: 1,
      project_id: 1,
      step_name: "Build base using platform",
      step_description:
        "Create the foundational architecture using our existing platform components",
      step_order: 1,
      status: "in_progress",
      assigned_to: 3,
      assigned_user_name: "John Developer",
      estimated_hours: 40,
      actual_hours: 25,
      created_at: "2024-01-15T00:00:00Z",
    },
    {
      id: 2,
      project_id: 1,
      step_name: "Follow-up with development team",
      step_description:
        "Coordinate with development team and assign specific tasks with tracking",
      step_order: 2,
      status: "pending",
      assigned_to: 2,
      assigned_user_name: "Alice Manager",
      estimated_hours: 20,
      created_at: "2024-01-15T00:00:00Z",
    },
    {
      id: 3,
      project_id: 2,
      step_name: "Daily Transaction Reconciliation",
      step_description:
        "Run automated transaction reconciliation at 5:00 AM daily",
      step_order: 1,
      status: "completed",
      is_automated: true,
      automation_config: {
        schedule: "0 5 * * 1-5",
        timeout: 30,
        alert_on_failure: true,
      },
      created_at: "2024-01-01T00:00:00Z",
    },
    {
      id: 4,
      project_id: 2,
      step_name: "Process files before 5 AM",
      step_description:
        "Ensure all files are processed before the 5 AM cutoff time",
      step_order: 2,
      status: "in_progress",
      is_automated: true,
      automation_config: {
        schedule: "45 4 * * 1-5",
        alert_on_failure: true,
      },
      created_at: "2024-01-01T00:00:00Z",
    },
  ],
  comments: [
    {
      id: 1,
      project_id: 1,
      step_id: 1,
      comment_text:
        "Started working on the base platform setup. Using React and Node.js stack as discussed.",
      comment_type: "comment",
      is_internal: false,
      created_at: "2024-01-20T10:30:00Z",
      creator_name: "John Developer",
      user_name: "John Developer",
      user_id: 3,
    },
    {
      id: 2,
      project_id: 1,
      comment_text:
        "Project milestone reached - 45% completion. Moving to next phase.",
      comment_type: "status_update",
      is_internal: true,
      created_at: "2024-01-25T14:00:00Z",
      creator_name: "System",
      user_name: "System",
      user_id: 1,
    },
  ],
  notifications: [
    {
      id: 1,
      notification_type: "step_overdue",
      title: "Step Overdue: Follow-up with development team",
      message:
        "The step 'Follow-up with development team' is overdue. Please take action.",
      recipient_id: 2,
      project_id: 1,
      step_id: 2,
      source_type: "product",
      priority: "high",
      is_read: false,
      created_at: "2024-01-26T09:00:00Z",
    },
    {
      id: 2,
      notification_type: "process_failed",
      title: "Daily reconciliation failed",
      message:
        "The automated reconciliation process failed at 5:00 AM. Manual intervention required.",
      recipient_id: 4,
      project_id: 2,
      source_type: "finops",
      priority: "critical",
      is_read: false,
      created_at: "2024-01-26T05:15:00Z",
    },
  ],
};

// DASHBOARD ENDPOINTS

// Get workflow dashboard data
router.get("/dashboard", async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.query.userId as string) || 1;
    const userRole = (req.query.userRole as string) || "admin";

    if (await isDatabaseAvailable()) {
      const dashboardData = await WorkflowRepository.getDashboardData(
        userId,
        userRole,
      );
      res.json(dashboardData);
    } else {
      // Return mock dashboard data
      const mockData = {
        project_stats: [
          { status: "in_progress", count: 2 },
          { status: "completed", count: 3 },
          { status: "created", count: 1 },
        ],
        overdue_steps: 1,
        unread_notifications: 2,
        recent_notifications: WorkflowMockData.notifications,
      };
      res.json(mockData);
    }
  } catch (error) {
    console.error("Error fetching workflow dashboard:", error);
    res.status(500).json({ error: "Failed to fetch dashboard data" });
  }
});

// PROJECT ENDPOINTS

// Get all projects
router.get("/projects", async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.query.userId as string) || 1;
    const userRole = (req.query.userRole as string) || "admin";

    if (await isDatabaseAvailable()) {
      const projects = await WorkflowRepository.getAllProjects(
        userId,
        userRole,
      );
      res.json(projects);
    } else {
      let filteredProjects = WorkflowMockData.projects;

      if (userRole === "product") {
        filteredProjects = filteredProjects.filter(
          (p) => p.project_type === "product_development",
        );
      } else if (userRole === "finance") {
        filteredProjects = filteredProjects.filter(
          (p) => p.project_type === "finops_process",
        );
      }

      res.json(filteredProjects);
    }
  } catch (error) {
    console.error("Error fetching projects:", error);
    res.json(WorkflowMockData.projects);
  }
});

// Get project by ID
router.get("/projects/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid project ID" });
    }

    if (await isDatabaseAvailable()) {
      const project = await WorkflowRepository.getProjectById(id, true, true);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }
      res.json(project);
    } else {
      const mockProject = WorkflowMockData.projects.find((p) => p.id === id);
      if (!mockProject) {
        return res.status(404).json({ error: "Project not found" });
      }

      // Add related data
      const projectSteps = WorkflowMockData.steps.filter(
        (s) => s.project_id === id,
      );
      const projectComments = WorkflowMockData.comments.filter(
        (c) => c.project_id === id,
      );

      res.json({
        ...mockProject,
        steps: projectSteps,
        comments: projectComments,
      });
    }
  } catch (error) {
    console.error("Error fetching project:", error);
    res.status(500).json({ error: "Failed to fetch project" });
  }
});

// Create project
router.post("/projects", async (req: Request, res: Response) => {
  try {
    const projectData: CreateWorkflowProjectData = req.body;

    // Validate required fields
    if (
      !projectData.name ||
      !projectData.project_type ||
      !projectData.created_by
    ) {
      return res
        .status(400)
        .json({
          error: "Missing required fields: name, project_type, created_by",
        });
    }

    if (await isDatabaseAvailable()) {
      const newProject = await WorkflowRepository.createProject(projectData);
      res.status(201).json(newProject);
    } else {
      // Return mock created project
      const mockProject = {
        id: Math.floor(Math.random() * 1000) + 100,
        ...projectData,
        status: "created",
        progress_percentage: 0,
        total_steps: 0,
        completed_steps: 0,
        active_steps: 0,
        pending_steps: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      res.status(201).json(mockProject);
    }
  } catch (error) {
    console.error("Error creating project:", error);
    res.status(500).json({ error: "Failed to create project" });
  }
});

// Create project from completed lead
router.post(
  "/projects/from-lead/:leadId",
  async (req: Request, res: Response) => {
    try {
      const leadId = parseInt(req.params.leadId);
      const projectData = req.body;
      const createdBy = parseInt(req.body.created_by) || 1;

      if (isNaN(leadId)) {
        return res.status(400).json({ error: "Invalid lead ID" });
      }

      if (await isDatabaseAvailable()) {
        const newProject = await WorkflowRepository.createProjectFromLead(
          leadId,
          projectData,
          createdBy,
        );
        res.status(201).json(newProject);
      } else {
        // Return mock project created from lead
        const mockProject = {
          id: Math.floor(Math.random() * 1000) + 100,
          name: `Lead ${leadId} - Product Development`,
          description: `Product development project created from completed lead ${leadId}`,
          source_type: "lead",
          source_id: leadId,
          project_type: "product_development",
          status: "created",
          priority: "high",
          assigned_team: "Product Team",
          progress_percentage: 0,
          created_at: new Date().toISOString(),
          lead_data: {
            client_name: "Sample Client",
            project_title: "Sample Project",
            lead_status: "completed",
          },
        };
        res.status(201).json(mockProject);
      }
    } catch (error) {
      console.error("Error creating project from lead:", error);
      res.status(500).json({ error: "Failed to create project from lead" });
    }
  },
);

// STEP ENDPOINTS

// Get project steps
router.get(
  "/projects/:projectId/steps",
  async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      if (isNaN(projectId)) {
        return res.status(400).json({ error: "Invalid project ID" });
      }

      if (await isDatabaseAvailable()) {
        const steps = await WorkflowRepository.getProjectSteps(projectId);
        res.json(steps);
      } else {
        const mockSteps = WorkflowMockData.steps.filter(
          (s) => s.project_id === projectId,
        );
        res.json(mockSteps);
      }
    } catch (error) {
      console.error("Error fetching project steps:", error);
      res.json([]);
    }
  },
);

// Create step
router.post(
  "/projects/:projectId/steps",
  async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      if (isNaN(projectId)) {
        return res.status(400).json({ error: "Invalid project ID" });
      }

      const stepData: CreateWorkflowStepData = {
        ...req.body,
        project_id: projectId,
      };

      // Validate required fields
      if (!stepData.step_name || !stepData.created_by) {
        return res
          .status(400)
          .json({ error: "Missing required fields: step_name, created_by" });
      }

      if (await isDatabaseAvailable()) {
        const newStep = await WorkflowRepository.createStep(stepData);
        res.status(201).json(newStep);
      } else {
        // Return mock created step
        const mockStep = {
          id: Math.floor(Math.random() * 1000) + 100,
          ...stepData,
          status: "pending",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        res.status(201).json(mockStep);
      }
    } catch (error) {
      console.error("Error creating step:", error);
      res.status(500).json({ error: "Failed to create step" });
    }
  },
);

// Update step status
router.patch("/steps/:stepId/status", async (req: Request, res: Response) => {
  try {
    const stepId = parseInt(req.params.stepId);
    const { status, updated_by } = req.body;

    if (isNaN(stepId)) {
      return res.status(400).json({ error: "Invalid step ID" });
    }

    if (!status || !updated_by) {
      return res
        .status(400)
        .json({ error: "Missing required fields: status, updated_by" });
    }

    if (await isDatabaseAvailable()) {
      await WorkflowRepository.updateStepStatus(
        stepId,
        status,
        parseInt(updated_by),
      );
      res.json({ success: true, message: "Step status updated" });
    } else {
      // Update mock data for testing
      const mockStep = WorkflowMockData.steps.find((s) => s.id === stepId);
      if (mockStep) {
        mockStep.status = status;
        mockStep.updated_at = new Date().toISOString();
        console.log(`Mock step ${stepId} status updated to ${status}`);
      }
      res.json({ success: true, message: "Step status updated (mock)" });
    }
  } catch (error) {
    console.error("Error updating step status:", error);
    res.status(500).json({ error: "Failed to update step status" });
  }
});

// Reorder project steps
router.post(
  "/projects/:projectId/steps/reorder",
  async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const { stepOrders } = req.body;

      if (isNaN(projectId)) {
        return res.status(400).json({ error: "Invalid project ID" });
      }

      if (!stepOrders || !Array.isArray(stepOrders)) {
        return res
          .status(400)
          .json({ error: "Missing or invalid stepOrders array" });
      }

      if (await isDatabaseAvailable()) {
        await WorkflowRepository.reorderProjectSteps(projectId, stepOrders);
        res.json({ success: true, message: "Steps reordered successfully" });
      } else {
        // Mock response - update mock data step orders
        stepOrders.forEach((stepOrder: { id: number; order: number }) => {
          const mockStep = WorkflowMockData.steps.find(
            (s) => s.id === stepOrder.id && s.project_id === projectId,
          );
          if (mockStep) {
            mockStep.step_order = stepOrder.order;
          }
        });
        res.json({
          success: true,
          message: "Steps reordered successfully (mock)",
        });
      }
    } catch (error) {
      console.error("Error reordering project steps:", error);
      res.status(500).json({ error: "Failed to reorder project steps" });
    }
  },
);

// COMMENTS ENDPOINTS

// Get project comments
router.get(
  "/projects/:projectId/comments",
  async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const stepId = req.query.stepId
        ? parseInt(req.query.stepId as string)
        : undefined;

      if (isNaN(projectId)) {
        return res.status(400).json({ error: "Invalid project ID" });
      }

      if (await isDatabaseAvailable()) {
        const comments = await WorkflowRepository.getProjectComments(
          projectId,
          stepId,
        );
        res.json(comments);
      } else {
        let mockComments = WorkflowMockData.comments.filter(
          (c) => c.project_id === projectId,
        );
        if (stepId) {
          mockComments = mockComments.filter((c) => c.step_id === stepId);
        }
        res.json(mockComments);
      }
    } catch (error) {
      console.error("Error fetching comments:", error);
      res.json([]);
    }
  },
);

// Create comment
router.post(
  "/projects/:projectId/comments",
  async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      if (isNaN(projectId)) {
        return res.status(400).json({ error: "Invalid project ID" });
      }

      const commentData: CreateWorkflowCommentData = {
        ...req.body,
        project_id: projectId,
      };

      // Validate required fields
      if (!commentData.comment_text || !commentData.created_by) {
        return res
          .status(400)
          .json({ error: "Missing required fields: comment_text, created_by" });
      }

      if (await isDatabaseAvailable()) {
        const newComment = await WorkflowRepository.createComment(commentData);
        res.status(201).json(newComment);
      } else {
        // Return mock created comment
        const mockComment = {
          id: Math.floor(Math.random() * 1000) + 100,
          ...commentData,
          comment_type: commentData.comment_type || "comment",
          is_internal: commentData.is_internal || false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          creator_name: commentData.user_name || "Current User",
          user_name: commentData.user_name || "Current User",
        };
        res.status(201).json(mockComment);
      }
    } catch (error) {
      console.error("Error creating comment:", error);
      res.status(500).json({ error: "Failed to create comment" });
    }
  },
);

// NOTIFICATIONS ENDPOINTS

// Get user notifications
router.get("/notifications", async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.query.userId as string) || 1;
    const unreadOnly = req.query.unreadOnly === "true";

    if (await isDatabaseAvailable()) {
      const notifications = await WorkflowRepository.getUserNotifications(
        userId,
        unreadOnly,
      );
      res.json(notifications);
    } else {
      let mockNotifications = WorkflowMockData.notifications.filter(
        (n) => n.recipient_id === userId,
      );
      if (unreadOnly) {
        mockNotifications = mockNotifications.filter((n) => !n.is_read);
      }
      res.json(mockNotifications);
    }
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.json([]);
  }
});

// Mark notification as read
router.patch(
  "/notifications/:notificationId/read",
  async (req: Request, res: Response) => {
    try {
      const notificationId = parseInt(req.params.notificationId);
      if (isNaN(notificationId)) {
        return res.status(400).json({ error: "Invalid notification ID" });
      }

      if (await isDatabaseAvailable()) {
        await WorkflowRepository.markNotificationAsRead(notificationId);
        res.json({ success: true, message: "Notification marked as read" });
      } else {
        res.json({
          success: true,
          message: "Notification marked as read (mock)",
        });
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ error: "Failed to mark notification as read" });
    }
  },
);

// AUTOMATION ENDPOINTS

// Get active automations
router.get("/automations", async (req: Request, res: Response) => {
  try {
    if (await isDatabaseAvailable()) {
      const automations = await WorkflowRepository.getActiveAutomations();
      res.json(automations);
    } else {
      // Return mock automations
      const mockAutomations = [
        {
          id: 1,
          automation_name: "Daily Transaction Reconciliation",
          automation_type: "daily_task",
          schedule_config: {
            time: "05:00",
            days: ["monday", "tuesday", "wednesday", "thursday", "friday"],
          },
          is_active: true,
          last_run_at: "2024-01-26T05:00:00Z",
          success_count: 25,
          failure_count: 1,
        },
        {
          id: 2,
          automation_name: "Pre-5AM File Processing Check",
          automation_type: "scheduled_check",
          schedule_config: {
            time: "04:45",
            days: ["monday", "tuesday", "wednesday", "thursday", "friday"],
          },
          is_active: true,
          last_run_at: "2024-01-26T04:45:00Z",
          success_count: 25,
          failure_count: 0,
        },
      ];
      res.json(mockAutomations);
    }
  } catch (error) {
    console.error("Error fetching automations:", error);
    res.json([]);
  }
});

// Trigger automation manually
router.post(
  "/automations/:automationId/trigger",
  async (req: Request, res: Response) => {
    try {
      const automationId = parseInt(req.params.automationId);
      if (isNaN(automationId)) {
        return res.status(400).json({ error: "Invalid automation ID" });
      }

      // In a real implementation, this would trigger the automation
      console.log(`Manually triggering automation ${automationId}`);

      // Mock response
      res.json({
        success: true,
        message: `Automation ${automationId} triggered successfully`,
        triggered_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error triggering automation:", error);
      res.status(500).json({ error: "Failed to trigger automation" });
    }
  },
);

// FOLLOW-UP ENDPOINTS

// Create project follow-up
router.post(
  "/projects/:projectId/follow-ups",
  async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      if (isNaN(projectId)) {
        return res.status(400).json({ error: "Invalid project ID" });
      }

      const followUpData = {
        ...req.body,
        project_id: projectId,
      };

      // Validate required fields
      if (!followUpData.title || !followUpData.created_by) {
        return res
          .status(400)
          .json({ error: "Missing required fields: title, created_by" });
      }

      // Mock response for now
      const mockFollowUp = {
        id: Math.floor(Math.random() * 1000) + 100,
        ...followUpData,
        status: "pending",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      res.status(201).json(mockFollowUp);
    } catch (error) {
      console.error("Error creating follow-up:", error);
      res.status(500).json({ error: "Failed to create follow-up" });
    }
  },
);

// LEAD INTEGRATION ENDPOINTS

// Get completed leads ready for project creation
router.get("/leads/completed", async (req: Request, res: Response) => {
  try {
    // In real implementation, this would query leads with status 'completed'
    // that haven't been converted to projects yet
    const mockCompletedLeads = [
      {
        id: 1,
        client_name: "TechCorp Solutions",
        project_title: "Enterprise Platform Development",
        project_description:
          "Building a comprehensive enterprise platform with microservices architecture",
        lead_status: "completed",
        completion_date: "2024-01-25T00:00:00Z",
        total_steps: 8,
        completed_steps: 8,
        estimated_budget: 250000,
        has_project: false,
      },
      {
        id: 2,
        client_name: "StartupXYZ",
        project_title: "Mobile App Development",
        project_description: "Cross-platform mobile application for e-commerce",
        lead_status: "completed",
        completion_date: "2024-01-20T00:00:00Z",
        total_steps: 6,
        completed_steps: 6,
        estimated_budget: 80000,
        has_project: false,
      },
    ];

    res.json(mockCompletedLeads);
  } catch (error) {
    console.error("Error fetching completed leads:", error);
    res.json([]);
  }
});

export default router;
