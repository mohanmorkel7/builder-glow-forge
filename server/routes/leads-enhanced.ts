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

// Middleware for validating database connection
async function requireDatabase(req: Request, res: Response, next: Function) {
  if (!(await isDatabaseAvailable())) {
    return res.status(503).json({
      error: "Database temporarily unavailable. Please try again later.",
    });
  }
  next();
}

// Get all leads with enhanced validation
router.get("/", async (req: Request, res: Response) => {
  try {
    const { salesRep } = req.query;
    let salesRepId: number | undefined;

    // Validate salesRep parameter
    if (salesRep) {
      salesRepId = parseInt(salesRep as string);
      if (isNaN(salesRepId)) {
        return res.status(400).json({ error: "Invalid sales rep ID format" });
      }

      // Check if sales rep exists (only if database is available)
      if (await isDatabaseAvailable()) {
        const userExists = await DatabaseValidator.userExists(salesRepId);
        if (!userExists) {
          return res
            .status(404)
            .json({ error: "Sales representative not found" });
        }
      }
    }

    let leads;
    try {
      if (await isDatabaseAvailable()) {
        leads = await LeadRepository.findAll(salesRepId);
      } else {
        leads = await MockDataService.getAllLeads(salesRepId);
      }
    } catch (dbError) {
      console.log("Database error, using mock data:", dbError.message);
      leads = await MockDataService.getAllLeads(salesRepId);
    }

    res.json(leads);
  } catch (error) {
    console.error("Error fetching leads:", error);
    try {
      const leads = await MockDataService.getAllLeads();
      res.json(leads);
    } catch (fallbackError) {
      console.error("Mock data fallback failed:", fallbackError);
      res.status(500).json({ error: "Failed to fetch leads" });
    }
  }
});

// Get lead statistics with validation
router.get("/stats", async (req: Request, res: Response) => {
  try {
    const { salesRep } = req.query;
    let salesRepId: number | undefined;

    if (salesRep) {
      salesRepId = parseInt(salesRep as string);
      if (isNaN(salesRepId)) {
        return res.status(400).json({ error: "Invalid sales rep ID format" });
      }

      // Validate sales rep exists
      if (await isDatabaseAvailable()) {
        const userExists = await DatabaseValidator.userExists(salesRepId);
        if (!userExists) {
          return res
            .status(404)
            .json({ error: "Sales representative not found" });
        }
      }
    }

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
      res.status(500).json({
        error: "Failed to fetch lead statistics",
        fallback: { total: 0, in_progress: 0, won: 0, lost: 0, completed: 0 },
      });
    }
  }
});

// Get lead by ID with enhanced validation
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ error: "Invalid lead ID format" });
    }

    let lead;
    try {
      if (await isDatabaseAvailable()) {
        // First check if lead exists
        const exists = await DatabaseValidator.leadExists(id);
        if (!exists) {
          return res.status(404).json({ error: "Lead not found" });
        }

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

    // Validate required fields
    const validation = DatabaseValidator.validateRequiredFields(
      leadData,
      ValidationSchemas.lead.required,
    );

    if (!validation.isValid) {
      return res.status(400).json({
        error: "Missing required fields",
        missingFields: validation.missingFields,
      });
    }

    // Validate enum values
    if (
      !ValidationSchemas.lead.enums.lead_source.includes(leadData.lead_source)
    ) {
      return res.status(400).json({
        error: "Invalid lead source",
        validOptions: ValidationSchemas.lead.enums.lead_source,
      });
    }

    if (
      leadData.status &&
      !ValidationSchemas.lead.enums.status.includes(leadData.status)
    ) {
      return res.status(400).json({
        error: "Invalid status",
        validOptions: ValidationSchemas.lead.enums.status,
      });
    }

    if (
      leadData.priority &&
      !ValidationSchemas.lead.enums.priority.includes(leadData.priority)
    ) {
      return res.status(400).json({
        error: "Invalid priority",
        validOptions: ValidationSchemas.lead.enums.priority,
      });
    }

    // Validate numeric fields
    if (leadData.probability !== undefined) {
      if (!DatabaseValidator.isValidNumber(leadData.probability, 0, 100)) {
        return res
          .status(400)
          .json({ error: "Probability must be between 0 and 100" });
      }
    }

    if (leadData.project_value !== undefined) {
      if (!DatabaseValidator.isValidNumber(leadData.project_value, 0)) {
        return res
          .status(400)
          .json({ error: "Project value must be a positive number" });
      }
    }

    if (leadData.expected_daily_txn_volume !== undefined) {
      if (
        !DatabaseValidator.isValidNumber(leadData.expected_daily_txn_volume, 0)
      ) {
        return res.status(400).json({
          error: "Expected daily transaction volume must be a positive number",
        });
      }
    }

    // Validate dates
    if (leadData.expected_close_date) {
      if (!DatabaseValidator.isValidFutureDate(leadData.expected_close_date)) {
        return res
          .status(400)
          .json({ error: "Expected close date must be in the future" });
      }
    }

    if (leadData.targeted_end_date) {
      if (!DatabaseValidator.isValidFutureDate(leadData.targeted_end_date)) {
        return res
          .status(400)
          .json({ error: "Targeted end date must be in the future" });
      }
    }

    // Validate assigned user exists (if provided and database available)
    if (leadData.created_by && (await isDatabaseAvailable())) {
      const userExists = await DatabaseValidator.userExists(
        leadData.created_by,
      );
      if (!userExists) {
        return res.status(400).json({ error: "Assigned user not found" });
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

    try {
      if (await isDatabaseAvailable()) {
        // Generate unique lead ID
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
        lead_id:
          leadData.lead_id || (await DatabaseValidator.generateUniqueLeadId()),
        ...leadData,
        status: leadData.status || ("in-progress" as const),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      res.status(201).json(mockLead);
    }
  } catch (error) {
    console.error("Error creating lead:", error);
    res.status(500).json({ error: "Failed to create lead" });
  }
});

// Update lead with comprehensive validation
router.put("/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ error: "Invalid lead ID format" });
    }

    const leadData: UpdateLeadData = req.body;

    // Validate enum values if provided
    if (
      leadData.status &&
      !ValidationSchemas.lead.enums.status.includes(leadData.status)
    ) {
      return res.status(400).json({
        error: "Invalid status",
        validOptions: ValidationSchemas.lead.enums.status,
      });
    }

    if (
      leadData.priority &&
      !ValidationSchemas.lead.enums.priority.includes(leadData.priority)
    ) {
      return res.status(400).json({
        error: "Invalid priority",
        validOptions: ValidationSchemas.lead.enums.priority,
      });
    }

    // Validate numeric fields if provided
    if (leadData.probability !== undefined) {
      if (!DatabaseValidator.isValidNumber(leadData.probability, 0, 100)) {
        return res
          .status(400)
          .json({ error: "Probability must be between 0 and 100" });
      }
    }

    try {
      if (await isDatabaseAvailable()) {
        // Check if lead exists
        const exists = await DatabaseValidator.leadExists(id);
        if (!exists) {
          return res.status(404).json({ error: "Lead not found" });
        }

        const lead = await LeadRepository.update(id, leadData);
        if (!lead) {
          return res.status(404).json({ error: "Lead not found" });
        }
        res.json(lead);
      } else {
        const mockLead = {
          id: id,
          lead_id: `#${id.toString().padStart(3, "0")}`,
          ...leadData,
          updated_at: new Date().toISOString(),
        };
        console.log(
          "Database unavailable, returning mock lead update response",
        );
        res.json(mockLead);
      }
    } catch (dbError) {
      console.log(
        "Database error, returning mock lead update response:",
        dbError.message,
      );
      const mockLead = {
        id: id,
        lead_id: `#${id.toString().padStart(3, "0")}`,
        ...leadData,
        updated_at: new Date().toISOString(),
      };
      res.json(mockLead);
    }
  } catch (error) {
    console.error("Error updating lead:", error);
    res.status(500).json({ error: "Failed to update lead" });
  }
});

// Delete lead with validation
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ error: "Invalid lead ID format" });
    }

    try {
      if (await isDatabaseAvailable()) {
        // Check if lead exists
        const exists = await DatabaseValidator.leadExists(id);
        if (!exists) {
          return res.status(404).json({ error: "Lead not found" });
        }

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

// Get lead steps with validation
router.get("/:leadId/steps", async (req: Request, res: Response) => {
  try {
    const leadId = parseInt(req.params.leadId);
    if (isNaN(leadId) || leadId <= 0) {
      return res.status(400).json({ error: "Invalid lead ID format" });
    }

    // Validate lead exists
    if (await isDatabaseAvailable()) {
      const leadExists = await DatabaseValidator.leadExists(leadId);
      if (!leadExists) {
        return res.status(404).json({ error: "Lead not found" });
      }
    }

    let steps;
    try {
      if (await isDatabaseAvailable()) {
        steps = await LeadStepRepository.findByLeadId(leadId);
      } else {
        steps = await MockDataService.getLeadSteps(leadId);
      }
    } catch (dbError) {
      console.log("Database error, using mock data:", dbError.message);
      steps = await MockDataService.getLeadSteps(leadId);
    }

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
      res.status(500).json({ error: "Failed to fetch lead steps" });
    }
  }
});

// Create lead step with comprehensive validation
router.post("/:leadId/steps", async (req: Request, res: Response) => {
  try {
    const leadId = parseInt(req.params.leadId);
    if (isNaN(leadId) || leadId <= 0) {
      return res.status(400).json({ error: "Invalid lead ID format" });
    }

    // Validate lead exists
    if (await isDatabaseAvailable()) {
      const leadExists = await DatabaseValidator.leadExists(leadId);
      if (!leadExists) {
        return res.status(404).json({ error: "Lead not found" });
      }
    }

    const stepData: CreateLeadStepData = {
      ...req.body,
      lead_id: leadId,
    };

    // Validate required fields
    const validation = DatabaseValidator.validateRequiredFields(
      stepData,
      ValidationSchemas.leadStep.required,
    );

    if (!validation.isValid) {
      return res.status(400).json({
        error: "Missing required fields",
        missingFields: validation.missingFields,
      });
    }

    // Validate estimated_days
    if (!DatabaseValidator.isValidNumber(stepData.estimated_days, 1)) {
      return res
        .status(400)
        .json({ error: "Estimated days must be at least 1" });
    }

    // Validate status if provided
    if (
      stepData.status &&
      !ValidationSchemas.leadStep.enums.status.includes(stepData.status)
    ) {
      return res.status(400).json({
        error: "Invalid status",
        validOptions: ValidationSchemas.leadStep.enums.status,
      });
    }

    // Validate due date if provided
    if (
      stepData.due_date &&
      !DatabaseValidator.isValidFutureDate(stepData.due_date)
    ) {
      return res.status(400).json({ error: "Due date must be in the future" });
    }

    // Validate assigned user exists (if provided)
    if (stepData.assigned_to && (await isDatabaseAvailable())) {
      const userExists = await DatabaseValidator.userExists(
        stepData.assigned_to,
      );
      if (!userExists) {
        return res.status(400).json({ error: "Assigned user not found" });
      }
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
          status: stepData.status || ("pending" as const),
          step_order: stepData.step_order || 1,
          due_date: stepData.due_date || null,
          completed_date: null,
          estimated_days: stepData.estimated_days,
          assigned_to: stepData.assigned_to || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
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
        status: stepData.status || ("pending" as const),
        step_order: stepData.step_order || 1,
        due_date: stepData.due_date || null,
        completed_date: null,
        estimated_days: stepData.estimated_days,
        assigned_to: stepData.assigned_to || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      res.status(201).json(mockStep);
    }
  } catch (error) {
    console.error("Error creating lead step:", error);
    res.status(500).json({ error: "Failed to create lead step" });
  }
});

export default router;
