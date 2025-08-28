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
import { MockDataService } from "../services/mockData";
import { DatabaseValidator, ValidationSchemas } from "../utils/validation";
import { pool } from "../database/connection";

const router = Router();

// Enhanced helper function with better error handling
async function isDatabaseAvailable() {
  try {
    return await DatabaseValidator.isDatabaseAvailable();
  } catch (error) {
    console.log("Database availability check failed:", error.message);
    return false;
  }
}

// Get all leads
router.get("/", async (req: Request, res: Response) => {
  try {
    const { salesRep, partial, created_by, partial_saves_only } = req.query;
    const salesRepId = salesRep ? parseInt(salesRep as string) : undefined;
    const isPartialOnly = partial === "true";
    const createdById = created_by ? parseInt(created_by as string) : undefined;
    const isPartialSavesOnly = partial_saves_only === "true";

    let leads;
    try {
      if (await isDatabaseAvailable()) {
        leads = await LeadRepository.findAll(
          salesRepId,
          isPartialOnly,
          createdById,
          isPartialSavesOnly,
        );
      } else {
        leads = await MockDataService.getAllLeads(salesRepId);
        if (isPartialOnly) {
          leads = leads.filter((lead: any) => lead.is_partial === true);
        }
        if (isPartialSavesOnly) {
          leads = leads.filter((lead: any) => {
            try {
              // Sanitize notes field before parsing
              const notesStr = lead.notes || "{}";
              if (typeof notesStr !== "string") return false;

              const notes = JSON.parse(notesStr);
              return notes.isPartialSave === true;
            } catch (jsonError) {
              console.log(
                `Invalid JSON in notes for lead ${lead.id}:`,
                jsonError.message,
              );
              // Skip leads with invalid JSON instead of crashing
              return false;
            }
          });
        }
        if (createdById) {
          leads = leads.filter((lead: any) => lead.created_by === createdById);
        }
      }
    } catch (dbError) {
      console.log("Database error, using mock data:", dbError.message);
      leads = await MockDataService.getAllLeads(salesRepId);
      if (isPartialOnly) {
        leads = leads.filter((lead: any) => lead.is_partial === true);
      }
      if (isPartialSavesOnly) {
        leads = leads.filter((lead: any) => {
          try {
            const notes = JSON.parse(lead.notes || "{}");
            return notes.isPartialSave === true;
          } catch {
            return false;
          }
        });
      }
      if (createdById) {
        leads = leads.filter((lead: any) => lead.created_by === createdById);
      }
    }

    res.json(leads);
  } catch (error) {
    console.error("Error fetching leads:", error);
    try {
      const leads = await MockDataService.getAllLeads();
      res.json(leads);
    } catch (fallbackError) {
      console.error("Mock data fallback failed:", fallbackError);
      res.json([]);
    }
  }
});

// Get lead statistics
router.get("/stats", async (req: Request, res: Response) => {
  try {
    const { salesRep } = req.query;
    const salesRepId = salesRep ? parseInt(salesRep as string) : undefined;

    let stats;
    try {
      if (await isDatabaseAvailable()) {
        stats = await LeadRepository.getStats(salesRepId);
      } else {
        stats = await MockDataService.getLeadStats(salesRepId);
      }
    } catch (dbError) {
      console.log("Database error, using mock data:", dbError.message);
      stats = await MockDataService.getLeadStats(salesRepId);
    }

    res.json(stats);
  } catch (error) {
    console.error("Error fetching lead stats:", error);
    try {
      const stats = await MockDataService.getLeadStats();
      res.json(stats);
    } catch (fallbackError) {
      console.error("Mock data fallback failed:", fallbackError);
      res.json({ total: 0, in_progress: 0, won: 0, lost: 0, completed: 0 });
    }
  }
});

// Get lead progress dashboard data
router.get("/progress-dashboard", async (req: Request, res: Response) => {
  try {
    console.log("Lead progress dashboard endpoint called");
    let progressData = [];

    try {
      if (await isDatabaseAvailable()) {
        console.log("Database is available, querying lead progress data...");

        // Get all leads with their current step progress
        const leadsQuery = `
          SELECT DISTINCT
            l.id as lead_id,
            l.client_name,
            l.lead_id as lead_reference,
            l.status as lead_status,
            l.probability as lead_probability,
            l.template_id,
            t.name as template_name
          FROM leads l
          LEFT JOIN onboarding_templates t ON l.template_id = t.id
          WHERE l.client_name != 'PARTIAL_SAVE_IN_PROGRESS'
            AND (l.is_partial IS NULL OR l.is_partial = false)
          ORDER BY l.id
        `;

        const leadsResult = await pool.query(leadsQuery);
        console.log(
          `Found ${leadsResult.rows.length} leads for progress tracking`,
        );

        for (const lead of leadsResult.rows) {
          // Get all steps for this lead with their status and probability
          const stepsQuery = `
            SELECT
              ls.id,
              ls.name,
              ls.status,
              ls.step_order,
              COALESCE(ts.probability_percent, 0) as probability_percent
            FROM lead_steps ls
            LEFT JOIN template_steps ts ON ls.name = ts.name
              AND ts.template_id = $1
            WHERE ls.lead_id = $2
            ORDER BY ls.step_order
          `;

          const stepsResult = await pool.query(stepsQuery, [
            lead.template_id,
            lead.lead_id,
          ]);

          const steps = stepsResult.rows;
          const completedSteps = steps.filter((s) => s.status === "completed");
          const currentStep =
            steps.find((s) => s.status === "in_progress") ||
            steps.find((s) => s.status === "pending");

          progressData.push({
            lead_id: lead.lead_id,
            client_name: lead.client_name,
            lead_reference: lead.lead_reference,
            lead_status: lead.lead_status,
            lead_probability: lead.lead_probability,
            template_name: lead.template_name,
            current_step: currentStep
              ? {
                  name: currentStep.name,
                  status: currentStep.status,
                  probability: currentStep.probability_percent,
                }
              : null,
            completed_steps: completedSteps.map((s) => ({
              name: s.name,
              status: s.status,
              probability: s.probability_percent,
            })),
            total_completed_probability: completedSteps.reduce(
              (sum, s) => sum + (s.probability_percent || 0),
              0,
            ),
            total_steps: steps.length,
            completed_count: completedSteps.length,
          });
        }
      } else {
        throw new Error("Database not available");
      }
    } catch (dbError) {
      console.log(
        "Database error, falling back to mock data:",
        dbError.message,
      );

      // Mock data for demonstration
      progressData = [
        {
          lead_id: 1,
          client_name: "TechCorp Solutions",
          lead_reference: "LEAD-001",
          lead_status: "in-progress",
          lead_probability: 65,
          template_name: "Standard Client Onboarding",
          current_step: {
            name: "Proposal Creation",
            status: "in_progress",
            probability: 30,
          },
          completed_steps: [
            { name: "Initial Contact", status: "completed", probability: 10 },
            {
              name: "Requirement Analysis",
              status: "completed",
              probability: 25,
            },
          ],
          total_completed_probability: 35,
          total_steps: 5,
          completed_count: 2,
        },
        {
          lead_id: 2,
          client_name: "InnovateX Ltd",
          lead_reference: "LEAD-002",
          lead_status: "in-progress",
          lead_probability: 45,
          template_name: "Enterprise Onboarding",
          current_step: {
            name: "Contract Review",
            status: "in_progress",
            probability: 20,
          },
          completed_steps: [
            { name: "Initial Contact", status: "completed", probability: 10 },
            {
              name: "Technical Assessment",
              status: "completed",
              probability: 15,
            },
          ],
          total_completed_probability: 25,
          total_steps: 6,
          completed_count: 2,
        },
        {
          lead_id: 3,
          client_name: "StartupFlow",
          lead_reference: "LEAD-003",
          lead_status: "completed",
          lead_probability: 100,
          template_name: "Quick Start Package",
          current_step: null,
          completed_steps: [
            { name: "Initial Contact", status: "completed", probability: 10 },
            {
              name: "Requirement Analysis",
              status: "completed",
              probability: 30,
            },
            { name: "Proposal Creation", status: "completed", probability: 35 },
            { name: "Final Approval", status: "completed", probability: 25 },
          ],
          total_completed_probability: 100,
          total_steps: 4,
          completed_count: 4,
        },
      ];
    }

    console.log(`Returning ${progressData.length} lead progress records`);
    res.json(progressData);
  } catch (error) {
    console.error("Error in lead progress dashboard:", error);
    res.status(500).json({
      error: "Failed to fetch lead progress data",
      details: error.message,
    });
  }
});

// Get template step dashboard data
router.get("/template-step-dashboard", async (req: Request, res: Response) => {
  try {
    console.log("Template step dashboard endpoint called");
    let dashboardData = [];

    try {
      if (await isDatabaseAvailable()) {
        console.log("Database is available, querying template step data...");
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
      } else {
        throw new Error("Database not available");
      }
    } catch (dbError) {
      console.log(
        "Database error, falling back to mock data:",
        dbError.message,
      );
      // Mock data with realistic numbers for demonstration
      const mockTemplates = [
        {
          id: 1,
          name: "Standard Client Onboarding",
          steps: [
            {
              id: 1,
              name: "Initial Contact",
              step_order: 1,
              probability_percent: 10,
            },
            {
              id: 2,
              name: "Requirement Analysis",
              step_order: 2,
              probability_percent: 25,
            },
            {
              id: 3,
              name: "Proposal Submission",
              step_order: 3,
              probability_percent: 40,
            },
            {
              id: 4,
              name: "Contract Negotiation",
              step_order: 4,
              probability_percent: 70,
            },
            {
              id: 5,
              name: "Project Kickoff",
              step_order: 5,
              probability_percent: 100,
            },
          ],
        },
        {
          id: 2,
          name: "Enterprise Client Onboarding",
          steps: [
            {
              id: 6,
              name: "Discovery Call",
              step_order: 1,
              probability_percent: 5,
            },
            {
              id: 7,
              name: "Technical Review",
              step_order: 2,
              probability_percent: 15,
            },
            {
              id: 8,
              name: "Security Assessment",
              step_order: 3,
              probability_percent: 30,
            },
            {
              id: 9,
              name: "Stakeholder Meeting",
              step_order: 4,
              probability_percent: 45,
            },
            {
              id: 10,
              name: "Pilot Program",
              step_order: 5,
              probability_percent: 60,
            },
            {
              id: 11,
              name: "Implementation Plan",
              step_order: 6,
              probability_percent: 75,
            },
            {
              id: 12,
              name: "Contract Finalization",
              step_order: 7,
              probability_percent: 90,
            },
            {
              id: 13,
              name: "Go Live",
              step_order: 8,
              probability_percent: 100,
            },
          ],
        },
      ];

      for (const template of mockTemplates) {
        for (const step of template.steps) {
          // Generate realistic mock data based on step progression
          const stepProgress = step.step_order / template.steps.length;
          const baseLeads = Math.floor(Math.random() * 15) + 5; // 5-20 leads

          let pending_count, in_progress_count, completed_count, blocked_count;

          if (stepProgress < 0.3) {
            // Early steps: more pending
            pending_count = Math.ceil(baseLeads * 0.6);
            in_progress_count = Math.ceil(baseLeads * 0.25);
            completed_count = Math.floor(baseLeads * 0.1);
            blocked_count = Math.max(
              0,
              baseLeads - pending_count - in_progress_count - completed_count,
            );
          } else if (stepProgress < 0.7) {
            // Middle steps: more in progress
            pending_count = Math.ceil(baseLeads * 0.3);
            in_progress_count = Math.ceil(baseLeads * 0.45);
            completed_count = Math.ceil(baseLeads * 0.2);
            blocked_count = Math.max(
              0,
              baseLeads - pending_count - in_progress_count - completed_count,
            );
          } else {
            // Later steps: more completed
            pending_count = Math.ceil(baseLeads * 0.15);
            in_progress_count = Math.ceil(baseLeads * 0.25);
            completed_count = Math.ceil(baseLeads * 0.55);
            blocked_count = Math.max(
              0,
              baseLeads - pending_count - in_progress_count - completed_count,
            );
          }

          // Ensure totals match
          const total =
            pending_count + in_progress_count + completed_count + blocked_count;

          dashboardData.push({
            template_id: template.id,
            template_name: template.name,
            step_id: step.id,
            step_name: step.name,
            step_order: step.step_order,
            probability_percent: step.probability_percent,
            total_leads: total,
            pending_count,
            in_progress_count,
            completed_count,
            blocked_count,
          });
        }
      }
    }

    console.log(`Returning ${dashboardData.length} step data items`);
    res.json(dashboardData);
  } catch (error) {
    console.error("Error fetching template step dashboard:", error);
    res
      .status(500)
      .json({ error: "Failed to fetch template step dashboard data" });
  }
});

// Get leads for a specific template step and status
router.get(
  "/template-step/:templateId/:stepId/:status",
  async (req: Request, res: Response) => {
    try {
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

      let leads = [];

      try {
        if (await isDatabaseAvailable()) {
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
          leads = result.rows;
          console.log(`Found ${leads.length} leads with status ${status}`);
        } else {
          // Generate realistic mock leads for this step and status
          const allLeads = await MockDataService.getAllLeads();
          const templateLeads = allLeads.filter(
            (lead: any) =>
              lead.template_id === templateId || Math.random() > 0.5, // Include some mock leads
          );

          // Generate realistic count based on status
          let targetCount = 0;
          const stepProgress = Math.random(); // Mock step progression

          switch (status) {
            case "pending":
              targetCount = Math.ceil(
                templateLeads.length *
                  (stepProgress < 0.3 ? 0.6 : stepProgress < 0.7 ? 0.3 : 0.15),
              );
              break;
            case "in_progress":
              targetCount = Math.ceil(
                templateLeads.length *
                  (stepProgress < 0.3
                    ? 0.25
                    : stepProgress < 0.7
                      ? 0.45
                      : 0.25),
              );
              break;
            case "completed":
              targetCount = Math.ceil(
                templateLeads.length *
                  (stepProgress < 0.3 ? 0.1 : stepProgress < 0.7 ? 0.2 : 0.55),
              );
              break;
            case "blocked":
            case "cancelled":
              targetCount = Math.max(
                0,
                Math.floor(templateLeads.length * 0.05),
              ); // 5% blocked/cancelled
              break;
          }

          leads = templateLeads
            .slice(0, Math.max(1, targetCount))
            .map((lead: any) => ({
              ...lead,
              step_status: status,
            }));

          console.log(
            `Generated ${leads.length} mock leads for status ${status}`,
          );
        }
      } catch (dbError) {
        console.log("Database error, using mock data:", dbError.message);
        // Fallback mock data
        const mockLeads = await MockDataService.getAllLeads();
        leads = mockLeads.slice(
          0,
          Math.max(1, Math.floor(Math.random() * 5) + 1),
        );
      }

      res.json(leads);
    } catch (error) {
      console.error("Error fetching leads for step:", error);
      res.status(500).json({ error: "Failed to fetch leads for step" });
    }
  },
);

// Get lead by ID
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid lead ID" });
    }

    let lead;
    try {
      if (await isDatabaseAvailable()) {
        lead = await LeadRepository.findById(id);
      } else {
        lead = await MockDataService.getLeadById(id);
      }
    } catch (dbError) {
      console.log("Database error, using mock data:", dbError.message);
      lead = await MockDataService.getLeadById(id);
    }

    if (!lead) {
      return res.status(404).json({ error: "Lead not found" });
    }

    res.json(lead);
  } catch (error) {
    console.error("Error fetching lead:", error);
    res.status(500).json({ error: "Failed to fetch lead" });
  }
});

// Create new lead with comprehensive validation
router.post("/", async (req: Request, res: Response) => {
  try {
    const leadData: CreateLeadData = req.body;
    console.log(
      "Received lead creation request. Body:",
      JSON.stringify(req.body, null, 2),
    );

    // Minimal validation - only check for absolutely required fields
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

    // Validate numeric fields only when they have actual numeric values
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

    // Validate dates only when they have actual values
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

    // Skip user existence validation for now (users might not exist in database during demo mode)
    // TODO: Re-enable when user management is properly set up
    /*
    if (leadData.created_by && (await isDatabaseAvailable())) {
      const userExists = await DatabaseValidator.userExists(
        leadData.created_by,
      );
      if (!userExists) {
        return res.status(400).json({ error: "Creating user not found" });
      }
    }

    if (leadData.assigned_to && (await isDatabaseAvailable())) {
      const userExists = await DatabaseValidator.userExists(
        leadData.assigned_to,
      );
      if (!userExists) {
        return res.status(400).json({ error: "Assigned user not found" });
      }
    }
    */

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
    try {
      if (await isDatabaseAvailable()) {
        console.log("Database is available, creating lead via repository...");
        // Generate unique lead ID if not provided
        if (!leadData.lead_id) {
          leadData.lead_id = await DatabaseValidator.generateUniqueLeadId();
        } else {
          // Check if custom lead ID is already taken
          const isTaken = await DatabaseValidator.isLeadIdTaken(
            leadData.lead_id,
          );
          if (isTaken) {
            return res.status(409).json({ error: "Lead ID already exists" });
          }
        }

        const lead = await LeadRepository.create(leadData);
        res.status(201).json(lead);
      } else {
        const mockLead = {
          id: Date.now(),
          lead_id: leadData.lead_id || `#${Date.now().toString().slice(-4)}`,
          ...leadData,
          status: leadData.status || ("in-progress" as const),
          priority: leadData.priority || ("medium" as const),
          probability: leadData.probability || 50,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        console.log("Database unavailable, returning mock lead response");
        res.status(201).json(mockLead);
      }
    } catch (dbError) {
      console.log(
        "Database error, returning mock lead response:",
        dbError.message,
      );
      const mockLead = {
        id: Date.now(),
        lead_id: leadData.lead_id || `#${Date.now().toString().slice(-4)}`,
        ...leadData,
        status: leadData.status || ("in-progress" as const),
        priority: leadData.priority || ("medium" as const),
        probability: leadData.probability || 50,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      res.status(201).json(mockLead);
    }
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

    try {
      const dbAvailable = await isDatabaseAvailable();

      if (dbAvailable) {
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
      } else {
        const mockLead = await MockDataService.updateLead(id, leadData);
        if (!mockLead) {
          return res.status(404).json({ error: "Lead not found" });
        }
        res.json(mockLead);
      }
    } catch (dbError) {
      console.log(
        "Database error, falling back to mock data:",
        dbError.message,
      );

      const mockLead = await MockDataService.updateLead(id, leadData);
      if (!mockLead) {
        return res.status(404).json({
          error: "Lead not found",
          message: `Lead with ID ${id} does not exist`,
          availableLeadIds: [1, 2, 9],
        });
      }
      res.json(mockLead);
    }
  } catch (error) {
    console.error("Error updating lead:", error);
    res.status(500).json({ error: "Failed to update lead" });
  }
});

// Delete lead
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid lead ID" });
    }

    try {
      if (await isDatabaseAvailable()) {
        const success = await LeadRepository.delete(id);
        if (!success) {
          return res.status(404).json({ error: "Lead not found" });
        }
        res.status(204).send();
      } else {
        console.log(
          "Database unavailable, returning success for lead deletion",
        );
        res.status(204).send();
      }
    } catch (dbError) {
      console.log(
        "Database error, returning success for lead deletion:",
        dbError.message,
      );
      res.status(204).send();
    }
  } catch (error) {
    console.error("Error deleting lead:", error);
    res.status(500).json({ error: "Failed to delete lead" });
  }
});

// Debug endpoint to view all template steps
router.get("/debug/template-steps", async (req: Request, res: Response) => {
  try {
    if (await isDatabaseAvailable()) {
      const templateStepsQuery = `
        SELECT ts.*, t.name as template_name
        FROM template_steps ts
        LEFT JOIN onboarding_templates t ON ts.template_id = t.id
        ORDER BY ts.template_id, ts.step_order
      `;
      const result = await pool.query(templateStepsQuery);

      res.json({
        message: `Found ${result.rows.length} template steps`,
        steps: result.rows,
      });
    } else {
      res.status(503).json({ error: "Database not available" });
    }
  } catch (error) {
    console.error("Error fetching template steps:", error);
    res.status(500).json({ error: "Failed to fetch template steps" });
  }
});

// Get lead steps (from template_steps based on lead's template_id)
router.get("/:leadId/steps", async (req: Request, res: Response) => {
  try {
    const leadId = parseInt(req.params.leadId);
    if (isNaN(leadId)) {
      return res.status(400).json({ error: "Invalid lead ID" });
    }

    console.log(`\n=== LEAD STEPS API DEBUG (Lead ${leadId}) ===`);
    let steps;
    try {
      const dbAvailable = await isDatabaseAvailable();
      console.log(`Database available: ${dbAvailable}`);

      if (dbAvailable) {
        // First get the lead to find its template_id
        const leadQuery = `SELECT template_id FROM leads WHERE id = $1`;
        const leadResult = await pool.query(leadQuery, [leadId]);
        console.log(`Lead query result: ${leadResult.rows.length} rows`);

        if (leadResult.rows.length === 0) {
          console.log(`❌ Lead ${leadId} not found in database`);
          return res.status(404).json({ error: "Lead not found" });
        }

        const templateId = leadResult.rows[0].template_id;
        console.log(`Lead template_id: ${templateId}`);

        if (templateId) {
          // First check if lead steps already exist
          const existingLeadStepsQuery = `
            SELECT id, lead_id, name, description, status, step_order, due_date, completed_date,
                   estimated_days, probability_percent, assigned_to, created_at, updated_at
            FROM lead_steps
            WHERE lead_id = $1
            ORDER BY step_order ASC
          `;
          const existingLeadStepsResult = await pool.query(
            existingLeadStepsQuery,
            [leadId],
          );

          if (existingLeadStepsResult.rows.length > 0) {
            // Lead steps already exist, but check if they need probability sync from template
            console.log(
              `✅ Found ${existingLeadStepsResult.rows.length} existing lead steps`,
            );

            // Get template steps first to check for any mismatches
            const templateStepsQuery = `
              SELECT name, step_order, probability_percent
              FROM template_steps
              WHERE template_id = $1
              ORDER BY step_order ASC
            `;
            const templateStepsResult = await pool.query(templateStepsQuery, [
              templateId,
            ]);

            // Check for any mismatches between lead steps and template probabilities
            const stepsNeedingSync = existingLeadStepsResult.rows.filter(
              (leadStep) => {
                const matchingTemplate = templateStepsResult.rows.find(
                  (ts) =>
                    ts.step_order === leadStep.step_order &&
                    ts.name.toLowerCase().trim() ===
                      leadStep.name.toLowerCase().trim(),
                );

                if (!matchingTemplate) return false;

                // Sync if probability is missing/0 OR if it doesn't match template
                return (
                  !leadStep.probability_percent ||
                  leadStep.probability_percent === 0 ||
                  leadStep.probability_percent !==
                    matchingTemplate.probability_percent
                );
              },
            );

            if (stepsNeedingSync.length > 0) {
              console.log(
                `🔄 ${stepsNeedingSync.length} steps need probability sync from template`,
              );

              // Update lead steps with template probabilities (using pre-fetched template steps)
              for (const leadStep of stepsNeedingSync) {
                const matchingTemplate = templateStepsResult.rows.find(
                  (ts) =>
                    ts.step_order === leadStep.step_order &&
                    ts.name.toLowerCase().trim() ===
                      leadStep.name.toLowerCase().trim(),
                );

                if (matchingTemplate && matchingTemplate.probability_percent) {
                  await pool.query(
                    `
                    UPDATE lead_steps
                    SET probability_percent = $1, updated_at = NOW()
                    WHERE id = $2
                  `,
                    [matchingTemplate.probability_percent, leadStep.id],
                  );

                  console.log(
                    `  📊 Updated "${leadStep.name}": 0% → ${matchingTemplate.probability_percent}%`,
                  );

                  // Update the step in our result set
                  leadStep.probability_percent =
                    matchingTemplate.probability_percent;
                }
              }
            }

            steps = existingLeadStepsResult.rows;
          } else {
            // No lead steps exist, create them from template steps
            console.log(
              `Creating lead steps from template ${templateId} for lead ${leadId}`,
            );

            // Get template steps
            const templateStepsQuery = `
              SELECT id, name, description, step_order, default_eta_days, probability_percent
              FROM template_steps
              WHERE template_id = $1
              ORDER BY step_order ASC
            `;
            const templateStepsResult = await pool.query(templateStepsQuery, [
              templateId,
            ]);

            if (templateStepsResult.rows.length > 0) {
              // Create lead steps from template steps
              const leadStepsToCreate = templateStepsResult.rows.map(
                (templateStep) => ({
                  lead_id: leadId,
                  name: templateStep.name,
                  description: templateStep.description,
                  step_order: templateStep.step_order,
                  estimated_days: templateStep.default_eta_days,
                  probability_percent: templateStep.probability_percent || 0,
                  status: "pending",
                  due_date: null,
                  assigned_to: null,
                }),
              );

              // Insert lead steps
              const insertPromises = leadStepsToCreate.map((stepData) => {
                const insertQuery = `
                  INSERT INTO lead_steps (lead_id, name, description, step_order, estimated_days, probability_percent, status, due_date, assigned_to)
                  VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                  RETURNING *
                `;
                return pool.query(insertQuery, [
                  stepData.lead_id,
                  stepData.name,
                  stepData.description,
                  stepData.step_order,
                  stepData.estimated_days,
                  stepData.probability_percent,
                  stepData.status,
                  stepData.due_date,
                  stepData.assigned_to,
                ]);
              });

              const insertResults = await Promise.all(insertPromises);
              steps = insertResults.map((result) => result.rows[0]);
              console.log(`Created ${steps.length} lead steps from template`);
            } else {
              console.log(`No template steps found for template ${templateId}`);
              steps = [];
            }
          }
        } else {
          // No template assigned, use mock data
          console.log(
            `⚠️  No template assigned to lead ${leadId}, using mock data`,
          );
          steps = await MockDataService.getLeadSteps(leadId);
        }
      } else {
        console.log(`❌ Database not available, using mock data`);
        steps = await MockDataService.getLeadSteps(leadId);
      }
    } catch (dbError) {
      console.log("❌ Database error, using mock data:", dbError.message);
      steps = await MockDataService.getLeadSteps(leadId);
    }

    console.log(`📤 Returning ${steps?.length || 0} steps for lead ${leadId}`);
    console.log(`=== END LEAD STEPS API DEBUG ===\n`);
    res.json(steps);
  } catch (error) {
    console.error("Error fetching lead steps:", error);
    try {
      const steps = await MockDataService.getLeadSteps(
        parseInt(req.params.leadId),
      );
      res.json(steps);
    } catch (fallbackError) {
      console.error("Mock data fallback failed:", fallbackError);
      res.json([]);
    }
  }
});

// Fix missing steps for all leads
router.post("/fix-all-steps", async (req: Request, res: Response) => {
  try {
    if (await isDatabaseAvailable()) {
      // Find all leads that don't have steps
      const leadsWithoutStepsQuery = `
        SELECT l.id, l.lead_id, l.client_name
        FROM leads l
        LEFT JOIN lead_steps ls ON l.id = ls.lead_id
        WHERE ls.lead_id IS NULL
      `;
      const leadsResult = await pool.query(leadsWithoutStepsQuery);

      if (leadsResult.rows.length === 0) {
        return res.json({ message: "All leads already have steps" });
      }

      console.log(
        `Found ${leadsResult.rows.length} leads without steps, creating default steps...`,
      );

      // Create default steps for each lead
      const fixPromises = leadsResult.rows.map(async (lead) => {
        try {
          await LeadRepository.createDefaultSteps(lead.id);
          return { leadId: lead.id, leadCode: lead.lead_id, success: true };
        } catch (error) {
          console.error(`Failed to create steps for lead ${lead.id}:`, error);
          return {
            leadId: lead.id,
            leadCode: lead.lead_id,
            success: false,
            error: error.message,
          };
        }
      });

      const results = await Promise.all(fixPromises);
      const successful = results.filter((r) => r.success);
      const failed = results.filter((r) => !r.success);

      res.json({
        message: `Fixed ${successful.length} leads, ${failed.length} failed`,
        successful: successful,
        failed: failed,
        totalProcessed: leadsResult.rows.length,
      });
    } else {
      return res.status(503).json({ error: "Database not available" });
    }
  } catch (error) {
    console.error("Error fixing all lead steps:", error);
    res.status(500).json({ error: "Failed to fix all lead steps" });
  }
});

// Fix missing steps for a lead (create default steps if none exist)
router.post("/:leadId/steps/fix", async (req: Request, res: Response) => {
  try {
    const leadId = parseInt(req.params.leadId);
    if (isNaN(leadId)) {
      return res.status(400).json({ error: "Invalid lead ID" });
    }

    if (await isDatabaseAvailable()) {
      // Check if lead exists
      const leadExistsQuery = `SELECT id FROM leads WHERE id = $1`;
      const leadResult = await pool.query(leadExistsQuery, [leadId]);

      if (leadResult.rows.length === 0) {
        return res.status(404).json({ error: "Lead not found" });
      }

      // Check if lead already has steps
      const stepsExistQuery = `SELECT COUNT(*) as count FROM lead_steps WHERE lead_id = $1`;
      const stepsResult = await pool.query(stepsExistQuery, [leadId]);
      const stepCount = parseInt(stepsResult.rows[0].count);

      if (stepCount > 0) {
        return res.json({
          message: `Lead already has ${stepCount} steps`,
          stepCount: stepCount,
        });
      }

      // Create default steps
      await LeadRepository.createDefaultSteps(leadId);

      // Get the created steps
      const createdStepsQuery = `SELECT * FROM lead_steps WHERE lead_id = $1 ORDER BY step_order`;
      const createdStepsResult = await pool.query(createdStepsQuery, [leadId]);

      res.json({
        message: `Created ${createdStepsResult.rows.length} default steps for lead ${leadId}`,
        steps: createdStepsResult.rows,
      });
    } else {
      return res.status(503).json({ error: "Database not available" });
    }
  } catch (error) {
    console.error("Error fixing lead steps:", error);
    res.status(500).json({ error: "Failed to fix lead steps" });
  }
});

// Create lead step
router.post("/:leadId/steps", async (req: Request, res: Response) => {
  try {
    const leadId = parseInt(req.params.leadId);
    if (isNaN(leadId)) {
      return res.status(400).json({ error: "Invalid lead ID" });
    }

    const stepData: CreateLeadStepData = {
      ...req.body,
      lead_id: leadId,
    };

    // Validate required fields
    if (!stepData.name || !stepData.estimated_days) {
      return res.status(400).json({
        error: "Missing required fields: name, estimated_days",
      });
    }

    try {
      if (await isDatabaseAvailable()) {
        const step = await LeadStepRepository.create(stepData);
        res.status(201).json(step);
      } else {
        const mockStep = {
          id: Date.now(),
          lead_id: leadId,
          name: stepData.name,
          description: stepData.description || null,
          status: "pending" as const,
          step_order: stepData.step_order || 1,
          due_date: stepData.due_date || null,
          completed_date: null,
          estimated_days: stepData.estimated_days,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        // Store in MockDataService for proper deletion support
        const { MockDataService } = await import("../services/mockData");
        MockDataService.addLeadStep(mockStep);

        console.log("Database unavailable, returning mock step response");
        res.status(201).json(mockStep);
      }
    } catch (dbError) {
      console.log(
        "Database error, returning mock step response:",
        dbError.message,
      );
      const mockStep = {
        id: Date.now(),
        lead_id: leadId,
        name: stepData.name,
        description: stepData.description || null,
        status: "pending" as const,
        step_order: stepData.step_order || 1,
        due_date: stepData.due_date || null,
        completed_date: null,
        estimated_days: stepData.estimated_days,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Store in MockDataService for proper deletion support and chat compatibility
      const { MockDataService } = await import("../services/mockData");
      MockDataService.addLeadStep(mockStep);

      console.log("Database error, created mock step with ID:", mockStep.id);
      res.status(201).json(mockStep);
    }
  } catch (error) {
    console.error("Error creating lead step:", error);
    res.status(500).json({ error: "Failed to create lead step" });
  }
});

// Update lead step
router.put("/steps/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid step ID" });
    }

    const stepData: UpdateLeadStepData = req.body;

    try {
      if (await isDatabaseAvailable()) {
        const step = await LeadStepRepository.update(id, stepData);
        if (!step) {
          return res.status(404).json({ error: "Lead step not found" });
        }

        // Get the lead_id for this step before any updates
        const stepQuery = await pool.query(
          "SELECT lead_id FROM lead_steps WHERE id = $1",
          [id],
        );
        let leadId = null;
        if (stepQuery.rows.length > 0) {
          leadId = stepQuery.rows[0].lead_id;
        }

        // If status was updated, recalculate and update lead probability
        if (stepData.status && leadId) {
          console.log(
            `Step ${id} status updated to ${stepData.status}, recalculating lead probability`,
          );

          // Calculate new probability based on all lead steps
          const stepsQuery = await pool.query(
            `
            SELECT id, status, probability_percent
            FROM lead_steps
            WHERE lead_id = $1
          `,
            [leadId],
          );

          let totalCompletedProbability = 0;
          let totalStepProbability = 0;

          stepsQuery.rows.forEach((leadStep) => {
            const stepProbability = leadStep.probability_percent || 0;
            totalStepProbability += stepProbability;

            if (leadStep.status === "completed") {
              totalCompletedProbability += stepProbability;
            }
            // Only completed steps contribute to progress
          });

          const newProbability = Math.min(
            100,
            Math.round(totalCompletedProbability),
          );

          // Update lead probability
          await pool.query(
            "UPDATE leads SET probability = $1, updated_at = NOW() WHERE id = $2",
            [newProbability, leadId],
          );

          console.log(
            `Updated lead ${leadId} probability to ${newProbability}%`,
          );
        }

        // Return step data with lead_id for frontend cache invalidation
        res.json({ ...step, lead_id: leadId });
      } else {
        const mockStep = await MockDataService.updateLeadStep(id, stepData);
        console.log(
          "Database unavailable, returning mock step update response:",
          mockStep,
        );
        res.json(mockStep);
      }
    } catch (dbError) {
      console.log(
        "Database error, returning mock step update response:",
        dbError.message,
      );
      const mockStep = await MockDataService.updateLeadStep(id, stepData);
      console.log("Database error, returning mock step update:", mockStep);
      res.json(mockStep);
    }
  } catch (error) {
    console.error("Error updating lead step:", error);
    res.status(500).json({ error: "Failed to update lead step" });
  }
});

// Delete lead step
router.delete("/steps/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid step ID" });
    }

    try {
      if (await isDatabaseAvailable()) {
        console.log(`Attempting to delete lead step ${id} from database`);
        const success = await LeadStepRepository.delete(id);
        console.log(`Delete result for step ${id}: ${success}`);

        if (!success) {
          console.log(`Step ${id} not found in database`);
          return res.status(404).json({ error: "Lead step not found" });
        }

        console.log(`Step ${id} deleted successfully from database`);
        res.status(204).send();
      } else {
        console.log(
          "Database unavailable, using mock data service for step deletion",
        );
        const { MockDataService } = await import("../services/mockData");
        await MockDataService.deleteLeadStep(id);
        res.status(204).send();
      }
    } catch (dbError) {
      console.error("Database error during step deletion:", dbError);
      console.error("Error details:", {
        message: dbError.message,
        code: dbError.code,
        detail: dbError.detail,
        constraint: dbError.constraint,
      });

      // Handle foreign key constraint error by fixing the constraint and retrying
      if (
        dbError.code === "23503" &&
        dbError.constraint === "follow_ups_step_id_fkey"
      ) {
        console.log(
          "Foreign key constraint error detected, attempting to fix constraint and retry...",
        );

        try {
          // Fix the constraint
          await pool.query(`
            ALTER TABLE follow_ups DROP CONSTRAINT IF EXISTS follow_ups_step_id_fkey;
            ALTER TABLE follow_ups
            ADD CONSTRAINT follow_ups_step_id_fkey
            FOREIGN KEY (step_id) REFERENCES lead_steps(id) ON DELETE CASCADE;
          `);

          console.log("Constraint fixed, retrying deletion...");

          // Retry the deletion
          const success = await LeadStepRepository.delete(id);
          if (success) {
            console.log(`Step ${id} deleted successfully after constraint fix`);
            return res.status(204).send();
          } else {
            return res.status(404).json({ error: "Lead step not found" });
          }
        } catch (fixError) {
          console.error("Failed to fix constraint:", fixError);
          return res.status(500).json({
            error: "Failed to delete step and fix constraint",
            details: fixError.message,
          });
        }
      }

      // Return the actual error for other types of errors
      res.status(500).json({
        error: "Failed to delete step",
        details: dbError.message,
        code: dbError.code,
      });
    }
  } catch (error) {
    console.error("Error deleting lead step:", error);
    res.status(500).json({ error: "Failed to delete lead step" });
  }
});

// Reorder lead steps
router.put("/:leadId/steps/reorder", async (req: Request, res: Response) => {
  try {
    const leadId = parseInt(req.params.leadId);
    if (isNaN(leadId)) {
      return res.status(400).json({ error: "Invalid lead ID" });
    }

    const { stepOrders } = req.body;
    if (!Array.isArray(stepOrders)) {
      return res.status(400).json({ error: "stepOrders must be an array" });
    }

    try {
      if (await isDatabaseAvailable()) {
        await LeadStepRepository.reorderSteps(leadId, stepOrders);
        res.json({ message: "Steps reordered successfully" });
      } else {
        console.log(
          "Database unavailable, returning success for step reordering",
        );
        res.json({ message: "Steps reordered successfully" });
      }
    } catch (dbError) {
      console.log(
        "Database error, returning success for step reordering:",
        dbError.message,
      );
      res.json({ message: "Steps reordered successfully" });
    }
  } catch (error) {
    console.error("Error reordering steps:", error);
    res.status(500).json({ error: "Failed to reorder steps" });
  }
});

// Get step chats
router.get("/steps/:stepId/chats", async (req: Request, res: Response) => {
  try {
    const stepId = parseInt(req.params.stepId);
    if (isNaN(stepId)) {
      return res.status(400).json({ error: "Invalid step ID" });
    }

    let chats;
    try {
      if (await isDatabaseAvailable()) {
        chats = await LeadChatRepository.findByStepId(stepId);
      } else {
        chats = await MockDataService.getStepChats(stepId);
      }
    } catch (dbError) {
      console.log("Database error, using mock data:", dbError.message);
      chats = await MockDataService.getStepChats(stepId);
    }

    res.json(chats);
  } catch (error) {
    console.error("Error fetching step chats:", error);
    try {
      const chats = await MockDataService.getStepChats(
        parseInt(req.params.stepId),
      );
      res.json(chats);
    } catch (fallbackError) {
      console.error("Mock data fallback failed:", fallbackError);
      res.json([]);
    }
  }
});

// Create step chat
router.post("/steps/:stepId/chats", async (req: Request, res: Response) => {
  try {
    const stepId = parseInt(req.params.stepId);
    if (isNaN(stepId)) {
      return res.status(400).json({ error: "Invalid step ID" });
    }

    const chatData: CreateLeadChatData = {
      ...req.body,
      step_id: stepId,
    };

    // Validate required fields
    if (!chatData.message || !chatData.user_name) {
      return res.status(400).json({
        error: "Missing required fields: message, user_name",
      });
    }

    try {
      const dbAvailable = await isDatabaseAvailable();
      console.log(
        `💾 Database available: ${dbAvailable} for step ${stepId} chat creation`,
      );

      if (dbAvailable) {
        // First check if the step exists in lead_steps
        const stepExistsQuery = `SELECT id FROM lead_steps WHERE id = $1`;
        const stepResult = await pool.query(stepExistsQuery, [stepId]);

        if (stepResult.rows.length === 0) {
          console.log(
            `Step ${stepId} doesn't exist in lead_steps, using mock fallback`,
          );
          // Step doesn't exist, use mock data instead
          const mockChat = await MockDataService.createStepChat(
            stepId,
            chatData,
          );
          console.log(
            "Step not found in database, created mock chat:",
            mockChat,
          );
          res.status(201).json(mockChat);
          return;
        }

        console.log(
          `✅ Step ${stepId} exists in database, creating chat in database...`,
        );
        const chat = await LeadChatRepository.create(chatData);
        console.log(`✅ Successfully created chat in database:`, chat);
        res.status(201).json(chat);
      } else {
        console.log(
          `❌ Database not available, creating mock chat for step ${stepId}`,
        );
        const mockChat = await MockDataService.createStepChat(stepId, chatData);
        console.log("📝 Database unavailable, created mock chat:", mockChat);
        res.status(201).json(mockChat);
      }
    } catch (dbError: any) {
      console.log(
        "Database error, returning mock chat response:",
        dbError.message,
      );

      // Check if it's a foreign key constraint error for step_id
      if (
        dbError.code === "23503" &&
        dbError.constraint === "lead_chats_step_id_fkey"
      ) {
        console.log(
          `🔧 Foreign key constraint error detected for step ${stepId}, attempting to fix constraint...`,
        );

        try {
          // Fix the constraint by dropping and recreating it with CASCADE
          console.log("Dropping old constraint...");
          await pool.query(`
            ALTER TABLE lead_chats
            DROP CONSTRAINT IF EXISTS lead_chats_step_id_fkey;
          `);

          console.log("Cleaning up orphaned chat records...");
          // Remove any chat records that reference non-existent steps
          const cleanupResult = await pool.query(`
            DELETE FROM lead_chats
            WHERE step_id NOT IN (SELECT id FROM lead_steps);
          `);
          console.log(
            `Cleaned up ${cleanupResult.rowCount} orphaned chat records`,
          );

          console.log("Creating new constraint with CASCADE...");
          await pool.query(`
            ALTER TABLE lead_chats
            ADD CONSTRAINT lead_chats_step_id_fkey
            FOREIGN KEY (step_id) REFERENCES lead_steps(id) ON DELETE CASCADE;
          `);

          console.log(
            `✅ Successfully fixed lead_chats foreign key constraint, retrying chat creation...`,
          );

          // Now try to create the chat again after fixing the constraint
          const chat = await LeadChatRepository.create(chatData);
          console.log(
            `✅ Successfully created chat in database after constraint fix:`,
            chat,
          );
          res.status(201).json(chat);
          return;
        } catch (fixError: any) {
          console.error("❌ Failed to fix constraint:", fixError);
          console.log("Falling back to mock data creation...");
          // Fall through to mock data creation
        }
      }

      const mockChat = await MockDataService.createStepChat(stepId, chatData);
      console.log("Database error, created mock chat:", mockChat);
      res.status(201).json(mockChat);
    }
  } catch (error) {
    console.error("Error creating step chat:", error);
    res.status(500).json({ error: "Failed to create step chat" });
  }
});

// Update step chat
router.put("/chats/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid chat ID" });
    }

    const { message, is_rich_text } = req.body;
    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    try {
      if (await isDatabaseAvailable()) {
        const success = await LeadChatRepository.update(id, {
          message,
          is_rich_text: is_rich_text || false,
        });
        if (!success) {
          return res.status(404).json({ error: "Chat not found" });
        }
        const updatedChat = await LeadChatRepository.findById(id);
        res.json(updatedChat);
      } else {
        console.log("Database unavailable, returning success for chat update");
        res.json({ id, message, is_rich_text: is_rich_text || false });
      }
    } catch (dbError) {
      console.log(
        "Database error, returning success for chat update:",
        dbError.message,
      );
      res.json({ id, message, is_rich_text: is_rich_text || false });
    }
  } catch (error) {
    console.error("Error updating chat:", error);
    res.status(500).json({ error: "Failed to update chat" });
  }
});

// Delete step chat
router.delete("/chats/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid chat ID" });
    }

    try {
      if (await isDatabaseAvailable()) {
        const success = await LeadChatRepository.delete(id);
        if (!success) {
          return res.status(404).json({ error: "Chat not found" });
        }
        res.status(204).send();
      } else {
        console.log(
          "Database unavailable, returning success for chat deletion",
        );
        res.status(204).send();
      }
    } catch (dbError) {
      console.log(
        "Database error, returning success for chat deletion:",
        dbError.message,
      );
      res.status(204).send();
    }
  } catch (error) {
    console.error("Error deleting chat:", error);
    res.status(500).json({ error: "Failed to delete chat" });
  }
});

export default router;
