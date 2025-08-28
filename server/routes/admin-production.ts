import { Router, Request, Response } from "express";
import { UserRepository, CreateUserData, UpdateUserData } from "../models/User";
import {
  ClientRepository,
  CreateClientData,
  UpdateClientData,
} from "../models/Client";
import {
  TemplateRepository,
  CreateTemplateData,
  UpdateTemplateData,
} from "../models/Template";
import { DatabaseValidator } from "../utils/validation";
import { pool } from "../database/connection";
import bcrypt from "bcryptjs";

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

// ===== USER ROUTES =====

// Get all users
router.get("/users", async (req: Request, res: Response) => {
  try {
    await requireDatabase();
    const users = await UserRepository.findAll();
    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({
      error: "Failed to fetch users",
      message: error.message,
    });
  }
});

// Get user by ID
router.get("/users/:id", async (req: Request, res: Response) => {
  try {
    await requireDatabase();

    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    const user = await UserRepository.findById(id);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({
      error: "Failed to fetch user",
      message: error.message,
    });
  }
});

// Create new user
router.post("/users", async (req: Request, res: Response) => {
  try {
    await requireDatabase();

    const userData: CreateUserData = req.body;

    // Validate required fields
    if (
      !userData.first_name ||
      !userData.last_name ||
      !userData.email ||
      !userData.password ||
      !userData.role
    ) {
      return res.status(400).json({
        error: "Missing required fields",
        required: ["first_name", "last_name", "email", "password", "role"],
      });
    }

    // Validate role
    const validRoles = [
      "admin",
      "sales",
      "product",
      "development",
      "db",
      "finops",
      "finance",
      "hr_management",
      "infra",
      "switch_team",
      "unknown",
    ];
    if (!validRoles.includes(userData.role)) {
      return res.status(400).json({
        error: "Invalid role",
        validRoles: validRoles,
        receivedRole: userData.role,
      });
    }

    // Check if email already exists
    const existingUser = await UserRepository.findByEmail(userData.email);
    if (existingUser) {
      return res
        .status(409)
        .json({ error: "User with this email already exists" });
    }

    // Hash password
    const saltRounds = 10;
    userData.password_hash = await bcrypt.hash(userData.password, saltRounds);
    delete userData.password; // Remove plain text password

    const user = await UserRepository.create(userData);

    // Remove password hash from response
    const { password_hash, ...userResponse } = user;
    res.status(201).json(userResponse);
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({
      error: "Failed to create user",
      message: error.message,
    });
  }
});

// Update user
router.put("/users/:id", async (req: Request, res: Response) => {
  try {
    await requireDatabase();

    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    const userData: UpdateUserData = req.body;

    // Validate role if provided
    const validRoles = [
      "admin",
      "sales",
      "product",
      "development",
      "db",
      "finops",
      "finance",
      "hr_management",
      "infra",
      "switch_team",
      "unknown",
    ];
    if (userData.role && !validRoles.includes(userData.role)) {
      return res.status(400).json({
        error: "Invalid role",
        validRoles: validRoles,
        receivedRole: userData.role,
      });
    }

    // Check if user exists
    const existingUser = await UserRepository.findById(id);
    if (!existingUser) {
      return res.status(404).json({ error: "User not found" });
    }

    // If email is being updated, check if it's already taken
    if (userData.email && userData.email !== existingUser.email) {
      const emailTaken = await UserRepository.findByEmail(userData.email);
      if (emailTaken) {
        return res.status(409).json({ error: "Email already taken" });
      }
    }

    // Hash password if provided
    if (userData.password) {
      const saltRounds = 10;
      userData.password_hash = await bcrypt.hash(userData.password, saltRounds);
      delete userData.password;
    }

    const user = await UserRepository.update(id, userData);

    // Remove password hash from response
    const { password_hash, ...userResponse } = user;
    res.json(userResponse);
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({
      error: "Failed to update user",
      message: error.message,
    });
  }
});

// Delete user
router.delete("/users/:id", async (req: Request, res: Response) => {
  try {
    await requireDatabase();

    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    const success = await UserRepository.delete(id);
    if (!success) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(204).send();
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({
      error: "Failed to delete user",
      message: error.message,
    });
  }
});

// ===== CLIENT ROUTES =====

// Get all clients
router.get("/clients", async (req: Request, res: Response) => {
  try {
    await requireDatabase();

    const { salesRep } = req.query;
    let salesRepId: number | undefined;

    // Validate salesRep parameter
    if (salesRep) {
      salesRepId = parseInt(salesRep as string);
      if (isNaN(salesRepId) || salesRepId <= 0) {
        return res.status(400).json({ error: "Invalid sales rep ID format" });
      }

      // Check if sales rep exists
      const userExists = await DatabaseValidator.userExists(salesRepId);
      if (!userExists) {
        return res
          .status(404)
          .json({ error: "Sales representative not found" });
      }
    }

    let clients;
    if (salesRepId) {
      clients = await ClientRepository.findBySalesRep(salesRepId);
    } else {
      clients = await ClientRepository.findAll();
    }

    res.json(clients);
  } catch (error) {
    console.error("Error fetching clients:", error);
    res.status(500).json({
      error: "Failed to fetch clients",
      message: error.message,
    });
  }
});

// Get client statistics
router.get("/clients/stats", async (req: Request, res: Response) => {
  try {
    await requireDatabase();
    const stats = await ClientRepository.getStats();
    res.json(stats);
  } catch (error) {
    console.error("Error fetching client stats:", error);
    res.status(500).json({
      error: "Failed to fetch client statistics",
      message: error.message,
    });
  }
});

// ===== TEMPLATE ROUTES =====

// Get all templates
router.get("/templates", async (req: Request, res: Response) => {
  try {
    await requireDatabase();
    const templates = await TemplateRepository.findAll();
    res.json(templates);
  } catch (error) {
    console.error("Error fetching templates:", error);
    res.status(500).json({
      error: "Failed to fetch templates",
      message: error.message,
    });
  }
});

// Get template categories
router.get("/templates/categories", async (req: Request, res: Response) => {
  try {
    await requireDatabase();

    // Query template categories from database
    const query = `
      SELECT DISTINCT 
        category as name,
        category as id,
        COUNT(*) as template_count
      FROM onboarding_templates 
      WHERE category IS NOT NULL 
      GROUP BY category
      ORDER BY category
    `;

    const result = await pool.query(query);

    // If no categories found, return default categories
    if (result.rows.length === 0) {
      const defaultCategories = [
        {
          id: "product",
          name: "Product",
          template_count: 0,
          description: "Product development templates",
          color: "#3B82F6",
          icon: "Package",
        },
        {
          id: "leads",
          name: "Leads",
          template_count: 0,
          description: "Lead management templates",
          color: "#10B981",
          icon: "Target",
        },
        {
          id: "finops",
          name: "FinOps",
          template_count: 0,
          description: "Financial operations templates",
          color: "#F59E0B",
          icon: "DollarSign",
        },
      ];
      return res.json(defaultCategories);
    }

    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching template categories:", error);
    res.status(500).json({
      error: "Failed to fetch template categories",
      message: error.message,
    });
  }
});

// Create new template
router.post("/templates", async (req: Request, res: Response) => {
  try {
    await requireDatabase();

    const templateData: CreateTemplateData = req.body;

    // Validate required fields
    if (!templateData.name || !templateData.created_by) {
      return res.status(400).json({
        error: "Missing required fields",
        required: ["name", "created_by"],
      });
    }

    const template = await TemplateRepository.create(templateData);
    res.status(201).json(template);
  } catch (error) {
    console.error("Error creating template:", error);
    res.status(500).json({
      error: "Failed to create template",
      message: error.message,
    });
  }
});

// ===== SYSTEM ROUTES =====

// Get system statistics
router.get("/stats", async (req: Request, res: Response) => {
  try {
    await requireDatabase();

    // Get counts from various tables
    const statsQuery = `
      SELECT 
        (SELECT COUNT(*) FROM users WHERE status = 'active') as active_users,
        (SELECT COUNT(*) FROM leads) as total_leads,
        (SELECT COUNT(*) FROM leads WHERE status = 'in-progress') as active_leads,
        (SELECT COUNT(*) FROM onboarding_templates WHERE is_active = true) as active_templates,
        (SELECT COUNT(*) FROM finops_tasks WHERE is_active = true) as active_finops_tasks
    `;

    const result = await pool.query(statsQuery);
    const stats = result.rows[0];

    res.json({
      users: {
        active: parseInt(stats.active_users) || 0,
      },
      leads: {
        total: parseInt(stats.total_leads) || 0,
        active: parseInt(stats.active_leads) || 0,
      },
      templates: {
        active: parseInt(stats.active_templates) || 0,
      },
      finops: {
        active_tasks: parseInt(stats.active_finops_tasks) || 0,
      },
    });
  } catch (error) {
    console.error("Error fetching system stats:", error);
    res.status(500).json({
      error: "Failed to fetch system statistics",
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
      ORDER BY table_name
    `;

    const tablesResult = await pool.query(tablesQuery);
    const tables = tablesResult.rows.map((row) => row.table_name);

    const requiredTables = [
      "users",
      "clients",
      "leads",
      "onboarding_templates",
      "finops_tasks",
      "finops_subtasks",
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
        total: tables.length,
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
