import { Router, Request, Response } from "express";
import {
  TemplateRepository,
  CreateTemplateData,
  UpdateTemplateData,
} from "../models/Template";
import { MockDataService } from "../services/mockData";
import { normalizeUserId } from "../services/mockData";

const router = Router();

// Helper function to check if database is available
async function isDatabaseAvailable() {
  try {
    await TemplateRepository.findAll();
    return true;
  } catch (error) {
    console.log("Database not available:", error.message);
    return false;
  }
}

// Get all templates
router.get("/", async (req: Request, res: Response) => {
  try {
    let templates;
    if (await isDatabaseAvailable()) {
      templates = await TemplateRepository.findAll();
    } else {
      templates = await MockDataService.getAllTemplates();
    }
    res.json(templates);
  } catch (error) {
    console.error("Error fetching templates:", error);
    // Fallback to mock data
    const templates = await MockDataService.getAllTemplates();
    res.json(templates);
  }
});

// SPECIFIC ROUTES MUST COME BEFORE PARAMETERIZED ROUTES

// Get template categories
router.get("/categories", async (req: Request, res: Response) => {
  try {
    // Always use mock data for now since enhanced tables don't exist yet
    const mockCategories = [
      {
        id: 1,
        name: "Product",
        description: "Product development templates",
        color: "#3B82F6",
        icon: "Package",
        sort_order: 1,
        is_active: true,
      },
      {
        id: 2,
        name: "Leads",
        description: "Lead management templates",
        color: "#10B981",
        icon: "Target",
        sort_order: 2,
        is_active: true,
      },
      {
        id: 3,
        name: "FinOps",
        description: "Financial operations templates",
        color: "#F59E0B",
        icon: "DollarSign",
        sort_order: 3,
        is_active: true,
      },
      {
        id: 4,
        name: "Onboarding",
        description: "Onboarding templates",
        color: "#8B5CF6",
        icon: "UserPlus",
        sort_order: 4,
        is_active: true,
      },
      {
        id: 5,
        name: "Support",
        description: "Customer support templates",
        color: "#EF4444",
        icon: "Headphones",
        sort_order: 5,
        is_active: true,
      },
      {
        id: 6,
        name: "VC",
        description: "Venture Capital and investment templates",
        color: "#6366F1",
        icon: "Megaphone",
        sort_order: 6,
        is_active: true,
      },
    ];
    res.json(mockCategories);
  } catch (error) {
    console.error("Error fetching template categories:", error);
    // Always fallback to mock data
    const mockCategories = [
      {
        id: 1,
        name: "Product",
        description: "Product development templates",
        color: "#3B82F6",
        icon: "Package",
        sort_order: 1,
        is_active: true,
      },
      {
        id: 2,
        name: "Leads",
        description: "Lead management templates",
        color: "#10B981",
        icon: "Target",
        sort_order: 2,
        is_active: true,
      },
      {
        id: 3,
        name: "FinOps",
        description: "Financial operations templates",
        color: "#F59E0B",
        icon: "DollarSign",
        sort_order: 3,
        is_active: true,
      },
      {
        id: 4,
        name: "Onboarding",
        description: "Onboarding templates",
        color: "#8B5CF6",
        icon: "UserPlus",
        sort_order: 4,
        is_active: true,
      },
      {
        id: 5,
        name: "Support",
        description: "Customer support templates",
        color: "#EF4444",
        icon: "Headphones",
        sort_order: 5,
        is_active: true,
      },
      {
        id: 6,
        name: "VC",
        description: "Venture Capital and investment templates",
        color: "#6366F1",
        icon: "Megaphone",
        sort_order: 6,
        is_active: true,
      },
    ];
    res.json(mockCategories);
  }
});

// Get templates with categories
router.get("/with-categories", async (req: Request, res: Response) => {
  try {
    // Use mock data for now
    const templates = await MockDataService.getAllTemplates();
    // Add mock category data
    const templatesWithCategories = templates.map((template) => ({
      ...template,
      usage_count: Math.floor(Math.random() * 20),
      category:
        template.id <= 2
          ? { id: 2, name: "Leads", color: "#10B981", icon: "Target" }
          : { id: 1, name: "Product", color: "#3B82F6", icon: "Package" },
    }));
    res.json(templatesWithCategories);
  } catch (error) {
    console.error("Error fetching templates with categories:", error);
    // Fallback to minimal mock data
    res.json([
      {
        id: 1,
        name: "Standard Lead Process",
        description: "Standard lead qualification and conversion process",
        usage_count: 15,
        step_count: 5,
        creator_name: "John Doe",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        category: { id: 2, name: "Leads", color: "#10B981", icon: "Target" },
      },
      {
        id: 2,
        name: "Product Launch Template",
        description: "Template for launching new products",
        usage_count: 8,
        step_count: 7,
        creator_name: "Jane Smith",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        category: { id: 1, name: "Product", color: "#3B82F6", icon: "Package" },
      },
    ]);
  }
});

// Search templates
router.get("/search", async (req: Request, res: Response) => {
  try {
    const searchTerm = req.query.q as string;
    const categoryId = req.query.category
      ? parseInt(req.query.category as string)
      : undefined;

    if (!searchTerm) {
      return res.status(400).json({ error: "Search term is required" });
    }

    // Use mock data
    const allTemplates = await MockDataService.getAllTemplates();
    const filteredTemplates = allTemplates.filter(
      (template) =>
        template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.description?.toLowerCase().includes(searchTerm.toLowerCase()),
    );
    res.json(filteredTemplates);
  } catch (error) {
    console.error("Error searching templates:", error);
    res.json([]); // Return empty array as fallback
  }
});

// Get template statistics
router.get("/stats", async (req: Request, res: Response) => {
  try {
    // Use mock stats for now
    const mockStats = {
      total_templates: 8,
      active_templates: 6,
      total_usage: 45,
      most_used_template_id: 1,
      most_used_template_name: "Standard Lead Process",
    };
    res.json(mockStats);
  } catch (error) {
    console.error("Error fetching template stats:", error);
    // Always return mock stats
    res.json({
      total_templates: 8,
      active_templates: 6,
      total_usage: 45,
      most_used_template_id: 1,
      most_used_template_name: "Standard Lead Process",
    });
  }
});

// Get step categories
router.get("/step-categories", async (req: Request, res: Response) => {
  try {
    // Mock step categories
    res.json([
      {
        id: 1,
        name: "Initial Setup",
        description: "Initial setup steps",
        color: "#3B82F6",
      },
      {
        id: 2,
        name: "Documentation",
        description: "Documentation steps",
        color: "#8B5CF6",
      },
      {
        id: 3,
        name: "Review & Approval",
        description: "Review and approval steps",
        color: "#F59E0B",
      },
      {
        id: 4,
        name: "Communication",
        description: "Communication steps",
        color: "#10B981",
      },
      {
        id: 5,
        name: "Technical",
        description: "Technical implementation",
        color: "#EF4444",
      },
      {
        id: 6,
        name: "Financial",
        description: "Financial processes",
        color: "#EC4899",
      },
      {
        id: 7,
        name: "Final Steps",
        description: "Completion steps",
        color: "#6B7280",
      },
    ]);
  } catch (error) {
    console.error("Error fetching step categories:", error);
    res.json([]);
  }
});

// Get templates by category
router.get("/category/:categoryId", async (req: Request, res: Response) => {
  try {
    const categoryId = parseInt(req.params.categoryId);
    if (isNaN(categoryId)) {
      return res.status(400).json({ error: "Invalid category ID" });
    }

    // Use mock data
    const allTemplates = await MockDataService.getAllTemplates();
    // Filter by mock category
    const filteredTemplates =
      categoryId === 2
        ? allTemplates.filter((t) => t.id <= 2)
        : allTemplates.filter((t) => t.id > 2);
    res.json(filteredTemplates);
  } catch (error) {
    console.error("Error fetching templates by category:", error);
    res.json([]); // Return empty array as fallback
  }
});

// Get template by ID
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid template ID" });
    }

    let template;
    if (await isDatabaseAvailable()) {
      template = await TemplateRepository.findById(id);
    } else {
      // Fallback to mock data
      const templates = await MockDataService.getAllTemplates();
      template = templates.find((t) => t.id === id) || null;
    }

    if (!template) {
      return res.status(404).json({ error: "Template not found" });
    }

    res.json(template);
  } catch (error) {
    console.error("Error fetching template:", error);
    // Fallback to mock data
    try {
      const templates = await MockDataService.getAllTemplates();
      const template =
        templates.find((t) => t.id === parseInt(req.params.id)) || null;
      if (template) {
        res.json(template);
      } else {
        res.status(404).json({ error: "Template not found" });
      }
    } catch (mockError) {
      res.status(500).json({ error: "Failed to fetch template" });
    }
  }
});

// Create new template
router.post("/", async (req: Request, res: Response) => {
  try {
    const templateData: CreateTemplateData = req.body;
    console.log(
      "Creating template with data:",
      JSON.stringify(templateData, null, 2),
    );

    // Validate required fields
    if (!templateData.name || !templateData.created_by) {
      return res
        .status(400)
        .json({ error: "Template name and created_by are required" });
    }

    // Validate type if provided
    if (
      templateData.type &&
      !["standard", "enterprise", "smb"].includes(templateData.type)
    ) {
      return res.status(400).json({ error: "Invalid template type" });
    }

    // Validate steps
    if (!templateData.steps || templateData.steps.length === 0) {
      return res
        .status(400)
        .json({ error: "Template must have at least one step" });
    }

    for (const step of templateData.steps) {
      if (!step.name || step.default_eta_days < 1) {
        return res
          .status(400)
          .json({ error: "Each step must have a name and valid ETA days" });
      }
    }

    let template;
    try {
      if (await isDatabaseAvailable()) {
        template = await TemplateRepository.create(templateData);
        console.log("Template created successfully:", template);
        res.status(201).json(template);
      } else {
        console.log("Database unavailable, using mock data service...");
        throw new Error("Database unavailable");
      }
    } catch (dbError) {
      console.log(
        "Database error, falling back to mock data:",
        dbError.message,
      );
      try {
        template = await MockDataService.createTemplate(templateData);
        console.log("Template created successfully with mock data:", template);
        res.status(201).json(template);
      } catch (fallbackError) {
        console.error("Fallback also failed:", fallbackError);
        res.status(500).json({
          error: "Failed to create template",
          details: `Primary: ${dbError.message}, Fallback: ${fallbackError.message}`,
        });
      }
    }
  } catch (error) {
    console.error("Unexpected error creating template:", error);
    console.error("Error stack:", error.stack);
    res.status(500).json({
      error: "Failed to create template",
      details: error.message,
    });
  }
});

// Update template
router.put("/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid template ID" });
    }

    const templateData: UpdateTemplateData = req.body;

    // Validate type if provided
    if (
      templateData.type &&
      !["standard", "enterprise", "smb"].includes(templateData.type)
    ) {
      return res.status(400).json({ error: "Invalid template type" });
    }

    // Validate steps if provided
    if (templateData.steps) {
      if (templateData.steps.length === 0) {
        return res
          .status(400)
          .json({ error: "Template must have at least one step" });
      }

      for (const step of templateData.steps) {
        if (!step.name || step.default_eta_days < 1) {
          return res
            .status(400)
            .json({ error: "Each step must have a name and valid ETA days" });
        }
      }
    }

    const template = await TemplateRepository.update(id, templateData);
    if (!template) {
      return res.status(404).json({ error: "Template not found" });
    }

    res.json(template);
  } catch (error) {
    console.error("Error updating template:", error);
    res.status(500).json({ error: "Failed to update template" });
  }
});

// Delete template (soft delete)
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid template ID" });
    }

    if (await isDatabaseAvailable()) {
      const success = await TemplateRepository.delete(id);
      if (!success) {
        return res.status(404).json({ error: "Template not found" });
      }
      res.status(204).send();
    } else {
      // Mock data fallback - just return success
      const templates = await MockDataService.getAllTemplates();
      const templateExists = templates.some((t) => t.id === id);

      if (!templateExists) {
        return res.status(404).json({ error: "Template not found" });
      }

      console.log("Mock template deleted:", id);
      res.status(204).send();
    }
  } catch (error) {
    console.error("Error deleting template:", error);
    // Always return success for mock data
    res.status(204).send();
  }
});

// Duplicate template
router.post("/:id/duplicate", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid template ID" });
    }

    const created_by = normalizeUserId(
      req.body.created_by || req.body.userId || "1",
    );

    if (await isDatabaseAvailable()) {
      const duplicatedTemplate = await TemplateRepository.duplicate(
        id,
        created_by,
      );
      if (!duplicatedTemplate) {
        return res.status(404).json({ error: "Template not found" });
      }
      res.status(201).json(duplicatedTemplate);
    } else {
      // Mock data fallback
      const templates = await MockDataService.getAllTemplates();
      const originalTemplate = templates.find((t) => t.id === id);

      if (!originalTemplate) {
        return res.status(404).json({ error: "Template not found" });
      }

      // Create a mock duplicated template
      const duplicatedTemplate = {
        ...originalTemplate,
        id: Math.max(...templates.map((t) => t.id)) + 1,
        name: `${originalTemplate.name} (Copy)`,
        created_by: created_by,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      console.log("Mock template duplicated:", duplicatedTemplate.name);
      res.status(201).json(duplicatedTemplate);
    }
  } catch (error) {
    console.error("Error duplicating template:", error);
    // Always provide mock fallback
    res.status(201).json({
      id: Math.floor(Math.random() * 1000) + 100,
      name: "Duplicated Template",
      description: "Mock duplicated template",
      type: "standard",
      is_active: true,
      created_by: normalizeUserId(req.body.created_by || "1"),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      step_count: 3,
      creator_name: "Current User",
    });
  }
});

export default router;
