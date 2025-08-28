import { Router, Request, Response } from "express";
import {
  LeadRepository,
  LeadStepRepository,
  LeadChatRepository,
  CreateLeadData,
  UpdateLeadData,
  CreateLeadStepData,
  UpdateLeadStepData,
  CreateLeadChatData,
} from "../models/Lead";
import { DatabaseValidator, ValidationSchemas } from "../utils/validation";
import { pool } from "../database/connection";

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

// Get all leads
router.get("/", async (req: Request, res: Response) => {
  try {
    await requireDatabase();

    const { salesRep, partial, created_by, partial_saves_only } = req.query;
    const salesRepId = salesRep ? parseInt(salesRep as string) : undefined;
    const isPartialOnly = partial === "true";
    const createdById = created_by ? parseInt(created_by as string) : undefined;
    const isPartialSavesOnly = partial_saves_only === "true";

    // Validate parameters
    if (salesRepId && (isNaN(salesRepId) || salesRepId <= 0)) {
      return res.status(400).json({ error: "Invalid sales rep ID" });
    }

    if (createdById && (isNaN(createdById) || createdById <= 0)) {
      return res.status(400).json({ error: "Invalid created_by ID" });
    }

    const leads = await LeadRepository.findAll(
      salesRepId,
      isPartialOnly,
      createdById,
      isPartialSavesOnly,
    );
    res.json(leads);
  } catch (error) {
    console.error("Error fetching leads:", error);
    res.status(500).json({
      error: "Database connection failed",
      message: "Unable to fetch leads from database",
      details: error.message,
    });
  }
});

// Get lead statistics
router.get("/stats", async (req: Request, res: Response) => {
  try {
    await requireDatabase();

    const { salesRep } = req.query;
    const salesRepId = salesRep ? parseInt(salesRep as string) : undefined;

    if (salesRepId && (isNaN(salesRepId) || salesRepId <= 0)) {
      return res.status(400).json({ error: "Invalid sales rep ID" });
    }

    const stats = await LeadRepository.getStats(salesRepId);
    res.json(stats);
  } catch (error) {
    console.error("Error fetching lead stats:", error);
    res.status(500).json({
      error: "Failed to fetch lead statistics",
      message: error.message,
    });
  }
});

// Get template step dashboard data
router.get("/template-step-dashboard", async (req: Request, res: Response) => {
  try {
    await requireDatabase();

    console.log("Template step dashboard endpoint called");

    // Get all active templates with their steps
    const templatesQuery = `
      SELECT
        t.id as template_id,
        t.name as template_name,
        ts.id as step_id,
        ts.name as step_name,
        ts.step_order,
        ts.probability_percent
      FROM onboarding_templates t
      JOIN template_steps ts ON t.id = ts.template_id
      WHERE t.is_active = true
      ORDER BY t.id, ts.step_order
    `;

    const templatesResult = await pool.query(templatesQuery);
    console.log(`Found ${templatesResult.rows.length} template steps`);

    const dashboardData = [];
    for (const templateStep of templatesResult.rows) {
      // Get lead steps count for this template step
      const stepStatsQuery = `
        SELECT
          COUNT(*) as total_leads,
          COUNT(CASE WHEN ls.status = 'pending' THEN 1 END) as pending_count,
          COUNT(CASE WHEN ls.status = 'in_progress' THEN 1 END) as in_progress_count,
          COUNT(CASE WHEN ls.status = 'completed' THEN 1 END) as completed_count,
          COUNT(CASE WHEN ls.status = 'cancelled' THEN 1 END) as blocked_count
        FROM leads l
        LEFT JOIN lead_steps ls ON l.id = ls.lead_id
          AND ls.name = $1
          AND ls.step_order = $2
        WHERE l.template_id = $3
      `;

      const statsResult = await pool.query(stepStatsQuery, [
        templateStep.step_name,
        templateStep.step_order,
        templateStep.template_id,
      ]);

      const stats = statsResult.rows[0];

      dashboardData.push({
        template_id: templateStep.template_id,
        template_name: templateStep.template_name,
        step_id: templateStep.step_id,
        step_name: templateStep.step_name,
        step_order: templateStep.step_order,
        probability_percent: templateStep.probability_percent || 0,
        total_leads: parseInt(stats.total_leads) || 0,
        pending_count: parseInt(stats.pending_count) || 0,
        in_progress_count: parseInt(stats.in_progress_count) || 0,
        completed_count: parseInt(stats.completed_count) || 0,
        blocked_count: parseInt(stats.blocked_count) || 0,
      });
    }

    console.log(`Returning ${dashboardData.length} step data items`);
    res.json(dashboardData);
  } catch (error) {
    console.error("Error fetching template step dashboard:", error);
    res.status(500).json({
      error: "Failed to fetch template step dashboard data",
      message: error.message,
    });
  }
});

// Get leads for a specific template step and status
router.get(
  "/template-step/:templateId/:stepId/:status",
  async (req: Request, res: Response) => {
    try {
      await requireDatabase();

      const templateId = parseInt(req.params.templateId);
      const stepId = parseInt(req.params.stepId);
      const status = req.params.status;

      if (isNaN(templateId) || isNaN(stepId)) {
        return res.status(400).json({ error: "Invalid template or step ID" });
      }

      if (
        ![
          "pending",
          "in_progress",
          "completed",
          "blocked",
          "cancelled",
        ].includes(status)
      ) {
        return res.status(400).json({ error: "Invalid status" });
      }

      console.log(
        `Getting leads for template ${templateId}, step ${stepId}, status ${status}`,
      );

      // Query leads that have this specific step with the requested status
      const query = `
      SELECT DISTINCT l.*, ls.status as step_status
      FROM leads l
      JOIN lead_steps ls ON l.id = ls.lead_id
      WHERE l.template_id = $1
        AND ls.step_order = (
          SELECT step_order FROM template_steps WHERE id = $2
        )
        AND ls.status = $3
      ORDER BY l.created_at DESC
    `;

      const result = await pool.query(query, [templateId, stepId, status]);
      console.log(`Found ${result.rows.length} leads with status ${status}`);

      res.json(result.rows);
    } catch (error) {
      console.error("Error fetching leads for step:", error);
      res.status(500).json({
        error: "Failed to fetch leads for step",
        message: error.message,
      });
    }
  },
);

// Get lead by ID
router.get("/:id", async (req: Request, res: Response) => {
  try {
    await requireDatabase();

    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid lead ID" });
    }

    const lead = await LeadRepository.findById(id);

    if (!lead) {
      return res.status(404).json({ error: "Lead not found" });
    }

    res.json(lead);
  } catch (error) {
    console.error("Error fetching lead:", error);
    res.status(500).json({
      error: "Failed to fetch lead",
      message: error.message,
    });
  }
});

// Create new lead with comprehensive validation
router.post("/", async (req: Request, res: Response) => {
  try {
    await requireDatabase();

    const leadData: CreateLeadData = req.body;
    console.log(
      "Received lead creation request. Body:",
      JSON.stringify(req.body, null, 2),
    );

    // Validate required fields
    if (!leadData.created_by) {
      return res.status(400).json({
        error: "created_by is required",
      });
    }

    // Ensure basic required fields have defaults
    if (!leadData.client_name) {
      leadData.client_name = "New Lead";
    }

    if (!leadData.lead_source) {
      leadData.lead_source = "other";
    }

    // Basic enum validation with defaults
    if (
      leadData.lead_source &&
      !ValidationSchemas.lead.enums.lead_source.includes(leadData.lead_source)
    ) {
      leadData.lead_source = "other";
    }

    if (
      leadData.status &&
      !ValidationSchemas.lead.enums.status.includes(leadData.status)
    ) {
      leadData.status = "in-progress";
    }

    if (
      leadData.priority &&
      !ValidationSchemas.lead.enums.priority.includes(leadData.priority)
    ) {
      leadData.priority = "medium";
    }

    // Validate numeric fields
    if (
      leadData.probability !== undefined &&
      leadData.probability !== null &&
      leadData.probability !== ""
    ) {
      if (!DatabaseValidator.isValidNumber(leadData.probability, 0, 100)) {
        return res
          .status(400)
          .json({ error: "Probability must be between 0 and 100" });
      }
    }

    if (
      leadData.project_value !== undefined &&
      leadData.project_value !== null &&
      leadData.project_value !== ""
    ) {
      if (!DatabaseValidator.isValidNumber(leadData.project_value, 0)) {
        return res
          .status(400)
          .json({ error: "Project value must be a positive number" });
      }
    }

    if (
      leadData.expected_daily_txn_volume !== undefined &&
      leadData.expected_daily_txn_volume !== null &&
      leadData.expected_daily_txn_volume !== ""
    ) {
      if (
        !DatabaseValidator.isValidNumber(leadData.expected_daily_txn_volume, 0)
      ) {
        return res.status(400).json({
          error: "Expected daily transaction volume must be a positive number",
        });
      }
    }

    // Validate dates
    if (
      leadData.expected_close_date &&
      leadData.expected_close_date !== "" &&
      leadData.expected_close_date !== null
    ) {
      if (!DatabaseValidator.isValidFutureDate(leadData.expected_close_date)) {
        return res
          .status(400)
          .json({ error: "Expected close date must be in the future" });
      }
    }

    if (
      leadData.targeted_end_date &&
      leadData.targeted_end_date !== "" &&
      leadData.targeted_end_date !== null
    ) {
      if (!DatabaseValidator.isValidFutureDate(leadData.targeted_end_date)) {
        return res
          .status(400)
          .json({ error: "Targeted end date must be in the future" });
      }
    }

    // Validate contact information if provided
    if (leadData.contacts && Array.isArray(leadData.contacts)) {
      for (let i = 0; i < leadData.contacts.length; i++) {
        const contact = leadData.contacts[i];
        if (contact.email && !DatabaseValidator.isValidEmail(contact.email)) {
          return res.status(400).json({
            error: `Invalid email format for contact ${i + 1}`,
          });
        }
      }
    }

    console.log("All validations passed, attempting to create lead...");

    // Generate unique lead ID if not provided
    if (!leadData.lead_id) {
      leadData.lead_id = await DatabaseValidator.generateUniqueLeadId();
    } else {
      // Check if custom lead ID is already taken
      const isTaken = await DatabaseValidator.isLeadIdTaken(leadData.lead_id);
      if (isTaken) {
        return res.status(409).json({ error: "Lead ID already exists" });
      }
    }

    const lead = await LeadRepository.create(leadData);
    res.status(201).json(lead);
  } catch (error) {
    console.error("Error creating lead:", error);
    console.error("Error stack:", error.stack);
    res.status(500).json({
      error: "Failed to create lead",
      details: error.message,
    });
  }
});

// Update lead
router.put("/:id", async (req: Request, res: Response) => {
  try {
    await requireDatabase();

    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid lead ID" });
    }

    let leadData: UpdateLeadData = req.body;

    // Sanitize date fields - convert empty strings to null for PostgreSQL compatibility
    const dateFields = [
      "start_date",
      "targeted_end_date",
      "expected_close_date",
    ];
    for (const field of dateFields) {
      if (leadData[field] === "") {
        leadData[field] = null;
      }
    }

    // Validate status if provided
    if (
      leadData.status &&
      !["in-progress", "won", "lost", "completed"].includes(leadData.status)
    ) {
      return res.status(400).json({ error: "Invalid status value" });
    }

    // First check if lead exists
    const existingLead = await LeadRepository.findById(id);
    if (!existingLead) {
      return res.status(404).json({
        error: "Lead not found",
        message: `Lead with ID ${id} does not exist in the database`,
      });
    }

    const lead = await LeadRepository.update(id, leadData);
    if (!lead) {
      return res.status(500).json({ error: "Failed to update lead" });
    }

    res.json(lead);
  } catch (error) {
    console.error("Error updating lead:", error);
    res.status(500).json({
      error: "Failed to update lead",
      message: error.message,
    });
  }
});

// Delete lead
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    await requireDatabase();

    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid lead ID" });
    }

    const success = await LeadRepository.delete(id);
    if (!success) {
      return res.status(404).json({ error: "Lead not found" });
    }

    res.status(204).send();
  } catch (error) {
    console.error("Error deleting lead:", error);
    res.status(500).json({
      error: "Failed to delete lead",
      message: error.message,
    });
  }
});

// Get lead steps
router.get("/:leadId/steps", async (req: Request, res: Response) => {
  try {
    await requireDatabase();

    const leadId = parseInt(req.params.leadId);
    if (isNaN(leadId)) {
      return res.status(400).json({ error: "Invalid lead ID" });
    }

    const steps = await LeadStepRepository.findByLeadId(leadId);
    res.json(steps);
  } catch (error) {
    console.error("Error fetching lead steps:", error);
    res.status(500).json({
      error: "Failed to fetch lead steps",
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
      AND table_name IN ('leads', 'lead_steps', 'lead_chats', 'onboarding_templates', 'template_steps')
      ORDER BY table_name
    `;

    const tablesResult = await pool.query(tablesQuery);
    const tables = tablesResult.rows.map((row) => row.table_name);

    const requiredTables = [
      "leads",
      "lead_steps",
      "lead_chats",
      "onboarding_templates",
      "template_steps",
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

export default router;
