import { pool } from "../database/connection";

// Database validation utilities
export class DatabaseValidator {
  /**
   * Check if database is available and connected
   */
  static async isDatabaseAvailable(): Promise<boolean> {
    try {
      await pool.query("SELECT 1");
      return true;
    } catch (error) {
      console.log("Database not available:", error.message);
      return false;
    }
  }

  /**
   * Check if a user exists by ID
   */
  static async userExists(userId: number): Promise<boolean> {
    try {
      const result = await pool.query(
        "SELECT id FROM users WHERE id = $1 AND status != 'inactive'",
        [userId],
      );
      return result.rows.length > 0;
    } catch (error) {
      console.error("Error checking user existence:", error);
      return false;
    }
  }

  /**
   * Check if a client exists by ID
   */
  static async clientExists(clientId: number): Promise<boolean> {
    try {
      const result = await pool.query("SELECT id FROM clients WHERE id = $1", [
        clientId,
      ]);
      return result.rows.length > 0;
    } catch (error) {
      console.error("Error checking client existence:", error);
      return false;
    }
  }

  /**
   * Check if a lead exists by ID
   */
  static async leadExists(leadId: number): Promise<boolean> {
    try {
      const result = await pool.query("SELECT id FROM leads WHERE id = $1", [
        leadId,
      ]);
      return result.rows.length > 0;
    } catch (error) {
      console.error("Error checking lead existence:", error);
      return false;
    }
  }

  /**
   * Check if a lead step exists by ID
   */
  static async leadStepExists(stepId: number): Promise<boolean> {
    try {
      const result = await pool.query(
        "SELECT id FROM lead_steps WHERE id = $1",
        [stepId],
      );
      return result.rows.length > 0;
    } catch (error) {
      console.error("Error checking lead step existence:", error);
      return false;
    }
  }

  /**
   * Check if an onboarding step exists by ID
   */
  static async onboardingStepExists(stepId: number): Promise<boolean> {
    try {
      const result = await pool.query(
        "SELECT id FROM onboarding_step_instances WHERE id = $1",
        [stepId],
      );
      return result.rows.length > 0;
    } catch (error) {
      console.error("Error checking onboarding step existence:", error);
      return false;
    }
  }

  /**
   * Check if a product exists by ID
   */
  static async productExists(productId: number): Promise<boolean> {
    try {
      const result = await pool.query(
        "SELECT id FROM products WHERE id = $1 AND is_active = true",
        [productId],
      );
      return result.rows.length > 0;
    } catch (error) {
      console.error("Error checking product existence:", error);
      return false;
    }
  }

  /**
   * Check if a template exists by ID
   */
  static async templateExists(templateId: number): Promise<boolean> {
    try {
      const result = await pool.query(
        "SELECT id FROM onboarding_templates WHERE id = $1 AND is_active = true",
        [templateId],
      );
      return result.rows.length > 0;
    } catch (error) {
      console.error("Error checking template existence:", error);
      return false;
    }
  }

  /**
   * Check if a deployment exists by ID
   */
  static async deploymentExists(deploymentId: number): Promise<boolean> {
    try {
      const result = await pool.query(
        "SELECT id FROM deployments WHERE id = $1",
        [deploymentId],
      );
      return result.rows.length > 0;
    } catch (error) {
      console.error("Error checking deployment existence:", error);
      return false;
    }
  }

  /**
   * Check if email is already taken by another user
   */
  static async isEmailTaken(
    email: string,
    excludeUserId?: number,
  ): Promise<boolean> {
    try {
      let query = "SELECT id FROM users WHERE email = $1";
      const params: any[] = [email];

      if (excludeUserId) {
        query += " AND id != $2";
        params.push(excludeUserId);
      }

      const result = await pool.query(query, params);
      return result.rows.length > 0;
    } catch (error) {
      console.error("Error checking email availability:", error);
      return false;
    }
  }

  /**
   * Check if a lead ID is already taken
   */
  static async isLeadIdTaken(
    leadId: string,
    excludeId?: number,
  ): Promise<boolean> {
    try {
      let query = "SELECT id FROM leads WHERE lead_id = $1";
      const params: any[] = [leadId];

      if (excludeId) {
        query += " AND id != $2";
        params.push(excludeId);
      }

      const result = await pool.query(query, params);
      return result.rows.length > 0;
    } catch (error) {
      console.error("Error checking lead ID availability:", error);
      return false;
    }
  }

  /**
   * Check if user has permission to access a resource
   */
  static async userHasPermission(
    userId: number,
    resourceType: string,
    resourceId?: number,
  ): Promise<boolean> {
    try {
      const userResult = await pool.query(
        "SELECT role FROM users WHERE id = $1 AND status = 'active'",
        [userId],
      );

      if (userResult.rows.length === 0) {
        return false;
      }

      const userRole = userResult.rows[0].role;

      // Admin has access to everything
      if (userRole === "admin") {
        return true;
      }

      // Sales users can access leads and clients
      if (userRole === "sales" && ["lead", "client"].includes(resourceType)) {
        return true;
      }

      // Product users can access deployments and products
      if (
        userRole === "product" &&
        ["deployment", "product", "template"].includes(resourceType)
      ) {
        return true;
      }

      return false;
    } catch (error) {
      console.error("Error checking user permissions:", error);
      return false;
    }
  }

  /**
   * Validate and sanitize input data
   */
  static validateRequiredFields(
    data: any,
    requiredFields: string[],
  ): { isValid: boolean; missingFields: string[] } {
    const missingFields: string[] = [];

    for (const field of requiredFields) {
      if (
        !data[field] ||
        (typeof data[field] === "string" && data[field].trim() === "")
      ) {
        missingFields.push(field);
      }
    }

    return {
      isValid: missingFields.length === 0,
      missingFields,
    };
  }

  /**
   * Validate email format
   */
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate phone format
   */
  static isValidPhone(phone: string): boolean {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ""));
  }

  /**
   * Validate date format and ensure it's not in the past (for due dates)
   */
  static isValidFutureDate(dateString: string): boolean {
    try {
      const date = new Date(dateString);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return date >= today;
    } catch (error) {
      return false;
    }
  }

  /**
   * Validate numeric value within range
   */
  static isValidNumber(value: any, min?: number, max?: number): boolean {
    const num = parseFloat(value);
    if (isNaN(num)) return false;
    if (min !== undefined && num < min) return false;
    if (max !== undefined && num > max) return false;
    return true;
  }

  /**
   * Validate string length
   */
  static isValidLength(
    str: string,
    minLength?: number,
    maxLength?: number,
  ): boolean {
    if (minLength !== undefined && str.length < minLength) return false;
    if (maxLength !== undefined && str.length > maxLength) return false;
    return true;
  }

  /**
   * Sanitize HTML content to prevent XSS
   */
  static sanitizeHtml(html: string): string {
    // Basic HTML sanitization - in production, use a proper library like DOMPurify
    return html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")
      .replace(/javascript:/gi, "")
      .replace(/on\w+=/gi, "");
  }

  /**
   * Generate unique lead ID in sequential format #0001
   */
  static async generateUniqueLeadId(): Promise<string> {
    try {
      if (await this.isDatabaseAvailable()) {
        // Get the highest existing lead ID number from the database
        const query = `
          SELECT lead_id FROM leads
          WHERE lead_id ~ '^#[0-9]+$'
          ORDER BY CAST(SUBSTRING(lead_id FROM 2) AS INTEGER) DESC
          LIMIT 1
        `;

        const result = await pool.query(query);

        let nextNumber = 1;
        if (result.rows.length > 0) {
          const lastId = result.rows[0].lead_id;
          const lastNumber = parseInt(lastId.substring(1));
          nextNumber = lastNumber + 1;
        }

        // Format as #0001, #0002, etc.
        const leadId = `#${nextNumber.toString().padStart(4, "0")}`;

        // Double-check that this ID isn't already taken (unlikely but safe)
        const isTaken = await this.isLeadIdTaken(leadId);
        if (!isTaken) {
          return leadId;
        }
      }
    } catch (error) {
      console.error("Error generating sequential lead ID:", error);
    }

    // Fallback to timestamp-based ID if database is unavailable or error occurs
    const fallbackNumber = parseInt(Date.now().toString().slice(-4));
    return `#${fallbackNumber.toString().padStart(4, "0")}`;
  }
}

// Input validation schemas
export const ValidationSchemas = {
  user: {
    required: ["first_name", "last_name", "email", "password", "role"],
    optional: [
      "phone",
      "department",
      "manager_id",
      "status",
      "start_date",
      "notes",
    ],
    enums: {
      role: [
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
      ],
      status: ["active", "inactive", "pending"],
    },
  },

  client: {
    required: ["client_name", "contact_person", "email"],
    optional: [
      "phone",
      "company_size",
      "industry",
      "address",
      "city",
      "state",
      "zip_code",
      "country",
      "expected_value",
      "priority",
      "status",
      "sales_rep_id",
      "start_date",
      "notes",
    ],
    enums: {
      priority: ["low", "medium", "high", "urgent"],
      status: ["active", "inactive", "onboarding", "completed"],
    },
  },

  lead: {
    required: ["client_name", "lead_source", "created_by"],
    optional: [
      "lead_id",
      "lead_source_value",
      "status",
      // Project Information
      "project_title",
      "project_description",
      "project_requirements",
      // Enhanced Project Info
      "solutions",
      "priority_level",
      "start_date",
      "targeted_end_date",
      "expected_daily_txn_volume",
      "project_value",
      "spoc",
      // Commercials
      "commercials",
      "commercial_pricing",
      // Client Information
      "client_type",
      "company",
      "company_location",
      "category",
      "country",
      // Contact Information
      "contacts",
      // Additional Information
      "priority",
      "expected_close_date",
      "probability",
      "notes",
      "assigned_to",
    ],
    enums: {
      lead_source: [
        "email",
        "social-media",
        "phone",
        "website",
        "referral",
        "cold-call",
        "event",
        "other",
      ],
      status: ["in-progress", "won", "lost", "completed"],
      priority: ["low", "medium", "high", "urgent"],
      priority_level: ["high", "medium", "low"],
      client_type: ["new", "existing"],
      category: ["aggregator", "banks", "partner"],
      country: [
        "india",
        "usa",
        "uae",
        "uk",
        "singapore",
        "canada",
        "australia",
        "other",
      ],
    },
  },

  leadStep: {
    required: ["name", "estimated_days"],
    optional: [
      "description",
      "status",
      "step_order",
      "due_date",
      "completed_date",
      "assigned_to",
    ],
    enums: {
      status: ["pending", "in_progress", "completed", "cancelled", "blocked"],
    },
  },

  deployment: {
    required: ["product_id", "version", "environment", "created_by"],
    optional: [
      "status",
      "description",
      "assigned_to",
      "scheduled_date",
      "auto_rollback",
      "run_tests",
      "notify_team",
      "require_approval",
      "release_notes",
    ],
    enums: {
      environment: ["development", "staging", "qa", "production"],
      status: [
        "pending",
        "scheduled",
        "in_progress",
        "completed",
        "failed",
        "cancelled",
      ],
    },
  },

  template: {
    required: ["name", "created_by"],
    optional: ["description", "type", "is_active", "steps"],
    enums: {
      type: ["standard", "enterprise", "smb"],
    },
  },

  finopsTask: {
    required: [
      "task_name",
      "assigned_to",
      "effective_from",
      "duration",
      "created_by",
    ],
    optional: [
      "description",
      "reporting_managers",
      "escalation_managers",
      "is_active",
      "status",
    ],
    enums: {
      duration: ["daily", "weekly", "monthly"],
      status: ["active", "inactive", "completed", "overdue"],
    },
  },

  finopsSubtask: {
    required: ["task_id", "name"],
    optional: [
      "description",
      "sla_hours",
      "sla_minutes",
      "order_position",
      "status",
      "assigned_to",
      "delay_reason",
      "delay_notes",
    ],
    enums: {
      status: ["pending", "in_progress", "completed", "overdue", "delayed"],
    },
  },

  followUp: {
    required: ["title"],
    optional: [
      "description",
      "due_date",
      "status",
      "follow_up_type",
      "assigned_to",
      "created_by",
      "client_id",
      "lead_id",
      "ticket_id",
    ],
    enums: {
      status: ["pending", "completed", "overdue"],
      follow_up_type: [
        "call",
        "email",
        "meeting",
        "document",
        "proposal",
        "contract",
        "onboarding",
        "general",
        "sales",
        "support",
        "other",
      ],
    },
  },

  ticket: {
    required: ["subject", "created_by"],
    optional: [
      "description",
      "priority_id",
      "status_id",
      "category_id",
      "assigned_to",
      "related_lead_id",
      "related_client_id",
    ],
    enums: {
      // Ticket enums are handled by separate tables (ticket_priorities, ticket_statuses, ticket_categories)
    },
  },

  workflow: {
    required: ["name", "project_type", "created_by"],
    optional: [
      "description",
      "source_type",
      "source_id",
      "status",
      "priority",
      "assigned_team",
      "project_manager_id",
    ],
    enums: {
      source_type: ["lead", "manual"],
      project_type: ["product_development", "finops_process", "integration"],
      status: [
        "created",
        "in_progress",
        "review",
        "completed",
        "on_hold",
        "cancelled",
      ],
      priority: ["low", "medium", "high", "critical"],
    },
  },
};
