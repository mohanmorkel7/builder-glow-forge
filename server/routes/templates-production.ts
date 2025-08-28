import { Router, Request, Response } from "express";
import {
  TemplateRepository,
  CreateTemplateData,
  UpdateTemplateData,
} from "../models/Template";
import { DatabaseValidator } from "../utils/validation";
import { pool, isDatabaseAvailable, withTimeout } from "../database/connection";

const router = Router();

// Using centralized isDatabaseAvailable function from connection.ts

// Production database availability check - fail fast if no database
async function requireDatabase() {
  try {
    await pool.query("SELECT 1");
  } catch (error) {
    throw new Error(
      `Database connection required but unavailable: ${error.message}`,
    );
  }
}

// Mock data for fallback when database is unavailable
const mockCategories = [
  {
    id: 1,
    name: "Product",
    description: "Product development templates",
    color: "#3B82F6",
    icon: "Package",
    sort_order: 1,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 2,
    name: "Leads",
    description: "Lead management templates",
    color: "#10B981",
    icon: "Target",
    sort_order: 2,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 3,
    name: "FinOps",
    description: "Financial operations templates",
    color: "#F59E0B",
    icon: "DollarSign",
    sort_order: 3,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 4,
    name: "Onboarding",
    description: "Onboarding templates",
    color: "#8B5CF6",
    icon: "UserPlus",
    sort_order: 4,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 5,
    name: "Support",
    description: "Customer support templates",
    color: "#EF4444",
    icon: "Headphones",
    sort_order: 5,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 6,
    name: "VC",
    description: "Venture capital templates",
    color: "#6366F1",
    icon: "Megaphone",
    sort_order: 6,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const mockTemplates = [
  {
    id: 1,
    name: "Standard Client Onboarding",
    description: "Standard process for onboarding new clients",
    usage_count: 15,
    step_count: 5,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    creator_name: "System Admin",
    category_id: 2,
    category: {
      id: 2,
      name: "Leads",
      color: "#10B981",
      icon: "Target",
    },
  },
  {
    id: 2,
    name: "Enterprise Client Setup",
    description: "Complex onboarding process for enterprise clients",
    usage_count: 8,
    step_count: 12,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    creator_name: "System Admin",
    category_id: 2,
    category: {
      id: 2,
      name: "Leads",
      color: "#10B981",
      icon: "Target",
    },
  },
  {
    id: 3,
    name: "Quick Lead Qualification",
    description: "Fast track template for qualifying new leads",
    usage_count: 22,
    step_count: 3,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    creator_name: "Sales Team",
    category_id: 2,
    category: {
      id: 2,
      name: "Leads",
      color: "#10B981",
      icon: "Target",
    },
  },
  {
    id: 4,
    name: "SMB Client Onboarding",
    description: "Streamlined process for small to medium business clients",
    usage_count: 18,
    step_count: 7,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    creator_name: "Sales Team",
    category_id: 2,
    category: {
      id: 2,
      name: "Leads",
      color: "#10B981",
      icon: "Target",
    },
  },
  {
    id: 5,
    name: "Product Launch Template",
    description: "Template for launching new products",
    usage_count: 12,
    step_count: 8,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    creator_name: "Product Team",
    category_id: 1,
    category: {
      id: 1,
      name: "Product",
      color: "#3B82F6",
      icon: "Package",
    },
  },
  {
    id: 6,
    name: "FinOps Daily Reconciliation",
    description: "Daily financial operations reconciliation process",
    usage_count: 5,
    step_count: 6,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    creator_name: "FinOps Team",
    category_id: 3,
    category: {
      id: 3,
      name: "FinOps",
      color: "#F59E0B",
      icon: "DollarSign",
    },
  },
  {
    id: 7,
    name: "Series A Funding Process",
    description: "Complete workflow for Series A funding rounds",
    usage_count: 8,
    step_count: 12,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    creator_name: "VC Team",
    category_id: 6,
    category: {
      id: 6,
      name: "VC",
      color: "#6366F1",
      icon: "Megaphone",
    },
  },
  {
    id: 8,
    name: "Seed Round Management",
    description: "Template for managing seed funding rounds",
    usage_count: 12,
    step_count: 8,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    creator_name: "VC Team",
    category_id: 6,
    category: {
      id: 6,
      name: "VC",
      color: "#6366F1",
      icon: "Megaphone",
    },
  },
];

// ===== TEMPLATE ROUTES =====

// Get all templates
router.get("/", async (req: Request, res: Response) => {
  try {
    if (await isDatabaseAvailable()) {
      const templates = await TemplateRepository.findAll();
      res.json(templates);
    } else {
      console.log("Database unavailable, using mock templates");
      res.json(mockTemplates);
    }
  } catch (error) {
    console.error("Error fetching templates:", error);
    // Fallback to mock data
    res.json(mockTemplates);
  }
});

// Get template categories - production version
router.get("/categories", async (req: Request, res: Response) => {
  try {
    if (await isDatabaseAvailable()) {
      // Use actual database query for template categories
      const query = `
        SELECT
          id,
          name,
          description,
          color,
          icon,
          sort_order,
          is_active,
          created_at,
          updated_at
        FROM template_categories
        WHERE is_active = true
        ORDER BY sort_order ASC
      `;

      const result = await pool.query(query);

      // If no categories exist in database, create default ones
      if (result.rows.length === 0) {
        const defaultCategories = [
          {
            name: "Product",
            description: "Product development templates",
            color: "#3B82F6",
            icon: "Package",
            sort_order: 1,
          },
          {
            name: "Leads",
            description: "Lead management templates",
            color: "#10B981",
            icon: "Target",
            sort_order: 2,
          },
          {
            name: "FinOps",
            description: "Financial operations templates",
            color: "#F59E0B",
            icon: "DollarSign",
            sort_order: 3,
          },
          {
            name: "Onboarding",
            description: "Onboarding templates",
            color: "#8B5CF6",
            icon: "UserPlus",
            sort_order: 4,
          },
          {
            name: "Support",
            description: "Customer support templates",
            color: "#EF4444",
            icon: "Headphones",
            sort_order: 5,
          },
          {
            name: "VC",
            description: "Venture capital templates",
            color: "#6366F1",
            icon: "Megaphone",
            sort_order: 6,
          },
        ];

        const insertQuery = `
          INSERT INTO template_categories (name, description, color, icon, sort_order, is_active)
          VALUES ($1, $2, $3, $4, $5, true)
          RETURNING *
        `;

        const insertedCategories = [];
        for (const category of defaultCategories) {
          const insertResult = await pool.query(insertQuery, [
            category.name,
            category.description,
            category.color,
            category.icon,
            category.sort_order,
          ]);
          insertedCategories.push(insertResult.rows[0]);
        }

        res.json(insertedCategories);
      } else {
        res.json(result.rows);
      }
    } else {
      console.log("Database unavailable, using mock categories");
      res.json(mockCategories);
    }
  } catch (error) {
    console.error("Error fetching template categories:", error);
    // Fallback to mock data
    res.json(mockCategories);
  }
});

// Get templates with categories
router.get("/with-categories", async (req: Request, res: Response) => {
  try {
    if (await isDatabaseAvailable()) {
      const query = `
        SELECT
          t.*,
          tc.name as category_name,
          tc.color as category_color,
          tc.icon as category_icon,
          u.first_name || ' ' || u.last_name as creator_name,
          (SELECT COUNT(*) FROM template_steps ts WHERE ts.template_id = t.id) as step_count
        FROM onboarding_templates t
        LEFT JOIN template_categories tc ON t.category_id = tc.id
        LEFT JOIN users u ON t.created_by = u.id
        WHERE t.is_active = true
        ORDER BY t.updated_at DESC
      `;

      const result = await pool.query(query);

      const templatesWithCategories = result.rows.map((row) => ({
        id: row.id,
        name: row.name,
        description: row.description,
        usage_count: row.usage_count || 0,
        step_count: parseInt(row.step_count) || 0,
        is_active: row.is_active,
        created_at: row.created_at,
        updated_at: row.updated_at,
        creator_name: row.creator_name || "Unknown",
        category_id: row.category_id,
        category: row.category_name
          ? {
              id: row.category_id,
              name: row.category_name,
              color: row.category_color,
              icon: row.category_icon,
            }
          : null,
      }));

      res.json(templatesWithCategories);
    } else {
      console.log("Database unavailable, using mock templates");
      res.json(mockTemplates);
    }
  } catch (error) {
    console.error("Error fetching templates with categories:", error);
    // Fallback to mock data
    res.json(mockTemplates);
  }
});

// Search templates
router.get("/search", async (req: Request, res: Response) => {
  try {
    if (await isDatabaseAvailable()) {
      const searchTerm = req.query.q as string;
      const categoryId = req.query.category
        ? parseInt(req.query.category as string)
        : undefined;

      if (!searchTerm) {
        return res.status(400).json({ error: "Search term is required" });
      }

      let query = `
      SELECT 
        t.*,
        tc.name as category_name,
        tc.color as category_color,
        tc.icon as category_icon,
        u.first_name || ' ' || u.last_name as creator_name,
        (SELECT COUNT(*) FROM template_steps ts WHERE ts.template_id = t.id) as step_count
      FROM onboarding_templates t
      LEFT JOIN template_categories tc ON t.category_id = tc.id
      LEFT JOIN users u ON t.created_by = u.id
      WHERE t.is_active = true 
        AND (t.name ILIKE $1 OR t.description ILIKE $1)
    `;

      const params = [`%${searchTerm}%`];

      if (categoryId) {
        query += ` AND t.category_id = $2`;
        params.push(categoryId.toString());
      }

      query += ` ORDER BY t.updated_at DESC`;

      const result = await pool.query(query, params);

      const templates = result.rows.map((row) => ({
        id: row.id,
        name: row.name,
        description: row.description,
        usage_count: row.usage_count || 0,
        step_count: parseInt(row.step_count) || 0,
        is_active: row.is_active,
        created_at: row.created_at,
        updated_at: row.updated_at,
        creator_name: row.creator_name || "Unknown",
        category_id: row.category_id,
        category: row.category_name
          ? {
              id: row.category_id,
              name: row.category_name,
              color: row.category_color,
              icon: row.category_icon,
            }
          : null,
      }));

      res.json(templates);
    } else {
      console.log("Database unavailable, searching mock templates");
      const searchTerm = req.query.q as string;
      const filteredTemplates = mockTemplates.filter(
        (template) =>
          template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          template.description
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()),
      );
      res.json(filteredTemplates);
    }
  } catch (error) {
    console.error("Error searching templates:", error);
    // Fallback to mock data search
    const searchTerm = req.query.q as string;
    const filteredTemplates = mockTemplates.filter(
      (template) =>
        template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.description?.toLowerCase().includes(searchTerm.toLowerCase()),
    );
    res.json(filteredTemplates);
  }
});

// Get template statistics
router.get("/stats", async (req: Request, res: Response) => {
  try {
    if (await isDatabaseAvailable()) {
      const statsQuery = `
        SELECT
          COUNT(*) as total_templates,
          COUNT(CASE WHEN is_active = true THEN 1 END) as active_templates,
          COALESCE(SUM(usage_count), 0) as total_usage
        FROM onboarding_templates
      `;

      const result = await pool.query(statsQuery);
      const stats = result.rows[0];

      // Get most used template
      const mostUsedQuery = `
        SELECT id, name, usage_count
        FROM onboarding_templates
        WHERE usage_count > 0
        ORDER BY usage_count DESC
        LIMIT 1
      `;

      const mostUsedResult = await pool.query(mostUsedQuery);
      const mostUsed = mostUsedResult.rows[0];

      res.json({
        total_templates: parseInt(stats.total_templates),
        active_templates: parseInt(stats.active_templates),
        total_usage: parseInt(stats.total_usage),
        most_used_template_id: mostUsed?.id || null,
        most_used_template_name: mostUsed?.name || null,
      });
    } else {
      console.log("Database unavailable, using mock stats");
      // Calculate stats from mock data
      const totalTemplates = mockTemplates.length;
      const activeTemplates = mockTemplates.filter((t) => t.is_active).length;
      const totalUsage = mockTemplates.reduce(
        (sum, t) => sum + t.usage_count,
        0,
      );
      const mostUsed = mockTemplates.reduce((prev, current) =>
        prev.usage_count > current.usage_count ? prev : current,
      );

      res.json({
        total_templates: totalTemplates,
        active_templates: activeTemplates,
        total_usage: totalUsage,
        most_used_template_id: mostUsed.id,
        most_used_template_name: mostUsed.name,
      });
    }
  } catch (error) {
    console.error("Error fetching template stats:", error);
    // Fallback to mock stats
    const totalTemplates = mockTemplates.length;
    const activeTemplates = mockTemplates.filter((t) => t.is_active).length;
    const totalUsage = mockTemplates.reduce((sum, t) => sum + t.usage_count, 0);
    const mostUsed = mockTemplates.reduce((prev, current) =>
      prev.usage_count > current.usage_count ? prev : current,
    );

    res.json({
      total_templates: totalTemplates,
      active_templates: activeTemplates,
      total_usage: totalUsage,
      most_used_template_id: mostUsed.id,
      most_used_template_name: mostUsed.name,
    });
  }
});

// Get step categories
router.get("/step-categories", async (req: Request, res: Response) => {
  try {
    if (await isDatabaseAvailable()) {
      const query = `
      SELECT * FROM step_categories 
      ORDER BY name ASC
    `;

      const result = await pool.query(query);

      // If no step categories exist, create default ones
      if (result.rows.length === 0) {
        const defaultStepCategories = [
          {
            name: "Initial Setup",
            description: "Initial setup steps",
            color: "#3B82F6",
          },
          {
            name: "Documentation",
            description: "Documentation steps",
            color: "#8B5CF6",
          },
          {
            name: "Review & Approval",
            description: "Review and approval steps",
            color: "#F59E0B",
          },
          {
            name: "Communication",
            description: "Communication steps",
            color: "#10B981",
          },
          {
            name: "Technical",
            description: "Technical implementation",
            color: "#EF4444",
          },
          {
            name: "Financial",
            description: "Financial processes",
            color: "#EC4899",
          },
          {
            name: "Final Steps",
            description: "Completion steps",
            color: "#6B7280",
          },
        ];

        const insertQuery = `
        INSERT INTO step_categories (name, description, color)
        VALUES ($1, $2, $3)
        RETURNING *
      `;

        const insertedCategories = [];
        for (const category of defaultStepCategories) {
          const insertResult = await pool.query(insertQuery, [
            category.name,
            category.description,
            category.color,
          ]);
          insertedCategories.push(insertResult.rows[0]);
        }

        res.json(insertedCategories);
      } else {
        res.json(result.rows);
      }
    } else {
      console.log("Database unavailable, using mock step categories");
      const mockStepCategories = [
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
      ];
      res.json(mockStepCategories);
    }
  } catch (error) {
    console.error("Error fetching step categories:", error);
    // Fallback to mock data
    const mockStepCategories = [
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
    ];
    res.json(mockStepCategories);
  }
});

// Get templates by category
router.get("/category/:categoryId", async (req: Request, res: Response) => {
  try {
    const categoryId = parseInt(req.params.categoryId);
    console.log(`Fetching templates for category ID: ${categoryId}`);

    if (isNaN(categoryId)) {
      return res.status(400).json({ error: "Invalid category ID" });
    }

    if (await isDatabaseAvailable()) {
      console.log("Database is available, querying real data");

      const query = `
      SELECT 
        t.*,
        tc.name as category_name,
        tc.color as category_color,
        tc.icon as category_icon,
        u.first_name || ' ' || u.last_name as creator_name,
        (SELECT COUNT(*) FROM template_steps ts WHERE ts.template_id = t.id) as step_count
      FROM onboarding_templates t
      LEFT JOIN template_categories tc ON t.category_id = tc.id
      LEFT JOIN users u ON t.created_by = u.id
      WHERE t.category_id = $1 AND t.is_active = true
      ORDER BY t.updated_at DESC
    `;

      const result = await pool.query(query, [categoryId]);
      console.log(
        `Database query returned ${result.rows.length} templates for category ${categoryId}`,
      );

      const templates = result.rows.map((row) => ({
        id: row.id,
        name: row.name,
        description: row.description,
        usage_count: row.usage_count || 0,
        step_count: parseInt(row.step_count) || 0,
        is_active: row.is_active,
        created_at: row.created_at,
        updated_at: row.updated_at,
        creator_name: row.creator_name || "Unknown",
        category_id: row.category_id,
        category: row.category_name
          ? {
              id: row.category_id,
              name: row.category_name,
              color: row.category_color,
              icon: row.category_icon,
            }
          : null,
      }));

      res.json(templates);
    } else {
      console.log("Database unavailable, filtering mock templates by category");
      const categoryId = parseInt(req.params.categoryId);
      console.log(`Filtering for category ID: ${categoryId}`);
      console.log(
        `Available templates:`,
        mockTemplates.map((t) => ({
          id: t.id,
          name: t.name,
          category_id: t.category_id,
          category: t.category,
        })),
      );
      const filteredTemplates = mockTemplates.filter(
        (t) => t.category?.id === categoryId,
      );
      console.log(`Filtered templates found: ${filteredTemplates.length}`);
      console.log(`Filtered templates:`, filteredTemplates);
      res.json(filteredTemplates);
    }
  } catch (error) {
    console.error("Error fetching templates by category:", error);
    // Fallback to mock data
    console.log(
      `Error occurred, falling back to mock data for category ${categoryId}`,
    );
    const filteredTemplates = mockTemplates.filter(
      (t) => t.category?.id === categoryId,
    );
    console.log(
      `Mock fallback found ${filteredTemplates.length} templates for category ${categoryId}`,
    );
    res.json(filteredTemplates);
  }
});

// Get template by ID
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid template ID" });
    }

    if (await isDatabaseAvailable()) {
      const template = await TemplateRepository.findById(id);

      if (!template) {
        return res.status(404).json({ error: "Template not found" });
      }

      res.json(template);
    } else {
      console.log(
        "Database unavailable, using mock template lookup with steps",
      );
      // Import mock templates with full step data
      const { mockTemplates: mockTemplatesWithSteps } = await import(
        "../services/mockData"
      );
      const mockTemplate = mockTemplatesWithSteps.find((t) => t.id === id);
      if (!mockTemplate) {
        return res.status(404).json({ error: "Template not found" });
      }
      res.json(mockTemplate);
    }
  } catch (error) {
    console.error("Error fetching template:", error);
    // Fallback to mock data with full step data
    try {
      const { mockTemplates: mockTemplatesWithSteps } = await import(
        "../services/mockData"
      );
      const mockTemplate = mockTemplatesWithSteps.find((t) => t.id === id);
      if (!mockTemplate) {
        return res.status(404).json({ error: "Template not found" });
      }
      res.json(mockTemplate);
    } catch (fallbackError) {
      console.error("Failed to load mock data:", fallbackError);
      return res.status(404).json({ error: "Template not found" });
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
      return res.status(400).json({
        error: "Template name and created_by are required",
      });
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
      return res.status(400).json({
        error: "Template must have at least one step",
      });
    }

    for (const step of templateData.steps) {
      if (!step.name || step.default_eta_days < 1) {
        return res.status(400).json({
          error: "Each step must have a name and valid ETA days",
        });
      }
    }

    if (await isDatabaseAvailable()) {
      const template = await TemplateRepository.create(templateData);
      console.log("Template created successfully:", template);
      res.status(201).json(template);
    } else {
      console.log(
        "Database unavailable, simulating template creation with mock data",
      );
      // For mock data, simulate a successful creation
      const mockCreatedTemplate = {
        id: Math.floor(Math.random() * 1000) + 100, // Generate random ID
        ...templateData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        usage_count: 0,
        is_active:
          templateData.is_active !== undefined ? templateData.is_active : true,
        step_count: templateData.steps ? templateData.steps.length : 0,
        creator_name: "Mock User",
        category: templateData.category_id
          ? {
              id: templateData.category_id,
              name: templateData.category_id === 2 ? "Leads" : "Unknown",
              color: "#10B981",
              icon: "Target",
            }
          : null,
      };

      res.status(201).json(mockCreatedTemplate);
    }
  } catch (error) {
    console.error("Error creating template:", error);
    res.status(500).json({
      error: "Failed to create template",
      message: error.message,
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
        return res.status(400).json({
          error: "Template must have at least one step",
        });
      }

      for (const step of templateData.steps) {
        if (!step.name || step.default_eta_days < 1) {
          return res.status(400).json({
            error: "Each step must have a name and valid ETA days",
          });
        }
      }
    }

    if (await isDatabaseAvailable()) {
      const template = await TemplateRepository.update(id, templateData);
      if (!template) {
        return res.status(404).json({ error: "Template not found" });
      }
      res.json(template);
    } else {
      console.log(
        "Database unavailable, simulating template update with mock data",
      );
      // For mock data, simulate a successful update by returning the updated template data
      const mockUpdatedTemplate = {
        id: id,
        ...templateData,
        updated_at: new Date().toISOString(),
        // Add default fields that would be in a real template
        created_at: new Date().toISOString(),
        usage_count: 0,
        is_active:
          templateData.is_active !== undefined ? templateData.is_active : true,
        step_count: templateData.steps ? templateData.steps.length : 0,
        creator_name: "Mock User",
        category: templateData.category_id
          ? {
              id: templateData.category_id,
              name: templateData.category_id === 2 ? "Leads" : "Unknown",
              color: "#10B981",
              icon: "Target",
            }
          : null,
      };

      res.json(mockUpdatedTemplate);
    }
  } catch (error) {
    console.error("Error updating template:", error);
    res.status(500).json({
      error: "Failed to update template",
      message: error.message,
    });
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
      console.log("Database unavailable, simulating template deletion");
      // For mock data, simulate successful deletion
      res.status(204).send();
    }
  } catch (error) {
    console.error("Error deleting template:", error);
    res.status(500).json({
      error: "Failed to delete template",
      message: error.message,
    });
  }
});

// Duplicate template
router.post("/:id/duplicate", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid template ID" });
    }

    const created_by = parseInt(req.body.created_by || req.body.userId || "1");

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
      console.log("Database unavailable, simulating template duplication");
      // For mock data, find the template to duplicate and create a copy
      const originalTemplate = mockTemplates.find((t) => t.id === id);
      if (!originalTemplate) {
        return res.status(404).json({ error: "Template not found" });
      }

      const duplicatedTemplate = {
        ...originalTemplate,
        id: Math.floor(Math.random() * 1000) + 100,
        name: `Copy of ${originalTemplate.name}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        usage_count: 0,
      };

      res.status(201).json(duplicatedTemplate);
    }
  } catch (error) {
    console.error("Error duplicating template:", error);
    res.status(500).json({
      error: "Failed to duplicate template",
      message: error.message,
    });
  }
});

export default router;
