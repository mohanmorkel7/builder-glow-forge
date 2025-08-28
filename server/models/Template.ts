import { pool } from "../database/connection";

export interface TemplateCategory {
  id: number;
  name: string;
  description?: string;
  color: string;
  icon?: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TemplateType {
  id: number;
  name: string;
  description?: string;
  category_id: number;
  is_active: boolean;
  created_at: string;
}

export interface StepCategory {
  id: number;
  name: string;
  description?: string;
  color: string;
  created_at: string;
}

export interface Template {
  id: number;
  name: string;
  description?: string;
  type: "standard" | "enterprise" | "smb";
  category_id?: number;
  template_type_id?: number;
  tags?: string[];
  usage_count: number;
  last_used_at?: string;
  is_active: boolean;
  created_by: number;
  created_at: string;
  updated_at: string;
  steps?: TemplateStep[];
  step_count?: number;
  creator_name?: string;
  category?: TemplateCategory;
  template_type?: TemplateType;
}

export interface TemplateStep {
  id: number;
  template_id: number;
  step_order: number;
  name: string;
  description?: string;
  default_eta_days: number;
  auto_alert: boolean;
  email_reminder: boolean;
  step_category_id?: number;
  assigned_role?: string;
  required_documents?: string[];
  approval_required: boolean;
  parallel_execution: boolean;
  dependencies?: string[];
  custom_fields?: Record<string, any>;
  probability_percent?: number;
  created_at: string;
  step_category?: StepCategory;
}

export interface CreateTemplateData {
  name: string;
  description?: string;
  type?: "standard" | "enterprise" | "smb";
  category_id?: number;
  template_type_id?: number;
  tags?: string[];
  created_by: number;
  steps: CreateTemplateStepData[];
}

export interface CreateTemplateStepData {
  step_order: number;
  name: string;
  description?: string;
  default_eta_days: number;
  auto_alert: boolean;
  email_reminder: boolean;
  step_category_id?: number;
  assigned_role?: string;
  required_documents?: string[];
  approval_required?: boolean;
  parallel_execution?: boolean;
  dependencies?: string[];
  custom_fields?: Record<string, any>;
  probability_percent?: number;
}

export interface UpdateTemplateData {
  name?: string;
  description?: string;
  type?: "standard" | "enterprise" | "smb";
  is_active?: boolean;
  steps?: CreateTemplateStepData[];
}

export class TemplateRepository {
  static async findAll(): Promise<Template[]> {
    const query = `
      SELECT t.*, 
             COUNT(ts.id) as step_count,
             CONCAT(u.first_name, ' ', u.last_name) as creator_name
      FROM onboarding_templates t
      LEFT JOIN template_steps ts ON t.id = ts.template_id
      LEFT JOIN users u ON t.created_by = u.id
      WHERE t.is_active = true
      GROUP BY t.id, u.first_name, u.last_name
      ORDER BY t.created_at DESC
    `;
    const result = await pool.query(query);
    return result.rows;
  }

  static async findById(id: number): Promise<Template | null> {
    const templateQuery = `
      SELECT t.*, 
             CONCAT(u.first_name, ' ', u.last_name) as creator_name
      FROM onboarding_templates t
      LEFT JOIN users u ON t.created_by = u.id
      WHERE t.id = $1
    `;

    const stepsQuery = `
      SELECT * FROM template_steps 
      WHERE template_id = $1 
      ORDER BY step_order ASC
    `;

    const templateResult = await pool.query(templateQuery, [id]);
    if (templateResult.rows.length === 0) {
      return null;
    }

    const stepsResult = await pool.query(stepsQuery, [id]);

    const template = templateResult.rows[0];
    template.steps = stepsResult.rows;
    template.step_count = stepsResult.rows.length;

    return template;
  }

  static async create(templateData: CreateTemplateData): Promise<Template> {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      // Create template
      const templateQuery = `
        INSERT INTO onboarding_templates (name, description, type, category_id, template_type_id, created_by)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `;

      const templateValues = [
        templateData.name,
        templateData.description || null,
        templateData.type || "standard",
        templateData.category_id || null,
        templateData.template_type_id || null,
        templateData.created_by,
      ];

      const templateResult = await client.query(templateQuery, templateValues);
      const template = templateResult.rows[0];

      // Create steps
      if (templateData.steps && templateData.steps.length > 0) {
        const stepQueries = templateData.steps.map((step, index) => {
          return client.query(
            `
            INSERT INTO template_steps (template_id, step_order, name, description,
                                      default_eta_days, auto_alert, email_reminder, probability_percent)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *
          `,
            [
              template.id,
              step.step_order || index + 1,
              step.name,
              step.description || null,
              step.default_eta_days,
              step.auto_alert,
              step.email_reminder,
              step.probability_percent || 0,
            ],
          );
        });

        const stepResults = await Promise.all(stepQueries);
        template.steps = stepResults.map((result) => result.rows[0]);
        template.step_count = template.steps.length;
      }

      await client.query("COMMIT");
      return template;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  static async update(
    id: number,
    templateData: UpdateTemplateData,
  ): Promise<Template | null> {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      // Update template
      const setClause = [];
      const values = [];
      let paramIndex = 1;

      for (const [key, value] of Object.entries(templateData)) {
        if (key !== "steps" && value !== undefined) {
          setClause.push(`${key} = $${paramIndex}`);
          values.push(value);
          paramIndex++;
        }
      }

      if (setClause.length > 0) {
        setClause.push(`updated_at = CURRENT_TIMESTAMP`);
        values.push(id);

        const templateQuery = `
          UPDATE onboarding_templates 
          SET ${setClause.join(", ")}
          WHERE id = $${paramIndex}
        `;

        await client.query(templateQuery, values);
      }

      // Update steps if provided
      if (templateData.steps) {
        // Delete existing steps
        await client.query(
          "DELETE FROM template_steps WHERE template_id = $1",
          [id],
        );

        // Insert new steps
        if (templateData.steps.length > 0) {
          const stepQueries = templateData.steps.map((step, index) => {
            return client.query(
              `
              INSERT INTO template_steps (template_id, step_order, name, description,
                                        default_eta_days, auto_alert, email_reminder, probability_percent)
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            `,
              [
                id,
                step.step_order || index + 1,
                step.name,
                step.description || null,
                step.default_eta_days,
                step.auto_alert,
                step.email_reminder,
                step.probability_percent || 0,
              ],
            );
          });

          await Promise.all(stepQueries);
        }
      }

      await client.query("COMMIT");
      return this.findById(id);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  static async delete(id: number): Promise<boolean> {
    // Soft delete by setting is_active to false
    const query =
      "UPDATE onboarding_templates SET is_active = false WHERE id = $1";
    const result = await pool.query(query, [id]);
    return result.rowCount > 0;
  }

  static async duplicate(
    id: number,
    createdBy: number,
  ): Promise<Template | null> {
    const originalTemplate = await this.findById(id);
    if (!originalTemplate) {
      return null;
    }

    const duplicateData: CreateTemplateData = {
      name: `${originalTemplate.name} (Copy)`,
      description: originalTemplate.description,
      type: originalTemplate.type,
      created_by: createdBy,
      steps:
        originalTemplate.steps?.map((step) => ({
          step_order: step.step_order,
          name: step.name,
          description: step.description,
          default_eta_days: step.default_eta_days,
          auto_alert: step.auto_alert,
          email_reminder: step.email_reminder,
        })) || [],
    };

    return this.create(duplicateData);
  }

  // Category management methods
  static async getAllCategories(): Promise<TemplateCategory[]> {
    const query = `
      SELECT * FROM template_categories
      WHERE is_active = true
      ORDER BY sort_order ASC, name ASC
    `;
    const result = await pool.query(query);
    return result.rows;
  }

  static async getCategoryById(id: number): Promise<TemplateCategory | null> {
    const query = "SELECT * FROM template_categories WHERE id = $1";
    const result = await pool.query(query, [id]);
    return result.rows.length > 0 ? result.rows[0] : null;
  }

  static async createCategory(categoryData: {
    name: string;
    description?: string;
    color?: string;
    icon?: string;
    sort_order?: number;
  }): Promise<TemplateCategory> {
    const query = `
      INSERT INTO template_categories (name, description, color, icon, sort_order)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    const values = [
      categoryData.name,
      categoryData.description,
      categoryData.color || "#6B7280",
      categoryData.icon,
      categoryData.sort_order || 0,
    ];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  // Template type management methods
  static async getTemplateTypesByCategory(
    categoryId: number,
  ): Promise<TemplateType[]> {
    const query = `
      SELECT * FROM template_types
      WHERE category_id = $1 AND is_active = true
      ORDER BY name ASC
    `;
    const result = await pool.query(query, [categoryId]);
    return result.rows;
  }

  static async getAllTemplateTypes(): Promise<TemplateType[]> {
    const query = `
      SELECT * FROM template_types
      WHERE is_active = true
      ORDER BY name ASC
    `;
    const result = await pool.query(query);
    return result.rows;
  }

  // Step category management methods
  static async getAllStepCategories(): Promise<StepCategory[]> {
    const query = "SELECT * FROM step_categories ORDER BY name ASC";
    const result = await pool.query(query);
    return result.rows;
  }

  // Enhanced template queries with categories
  static async findAllWithCategories(): Promise<Template[]> {
    const query = `
      SELECT t.*,
             COUNT(ts.id) as step_count,
             CONCAT(u.first_name, ' ', u.last_name) as creator_name,
             tc.name as category_name,
             tc.color as category_color,
             tc.icon as category_icon,
             tt.name as template_type_name
      FROM templates t
      LEFT JOIN template_steps ts ON t.id = ts.template_id
      LEFT JOIN users u ON t.created_by = u.id
      LEFT JOIN template_categories tc ON t.category_id = tc.id
      LEFT JOIN template_types tt ON t.template_type_id = tt.id
      WHERE t.is_active = true
      GROUP BY t.id, u.first_name, u.last_name, tc.name, tc.color, tc.icon, tt.name
      ORDER BY t.updated_at DESC
    `;
    const result = await pool.query(query);
    return result.rows.map((row) => ({
      ...row,
      category: row.category_name
        ? {
            id: row.category_id,
            name: row.category_name,
            color: row.category_color,
            icon: row.category_icon,
          }
        : undefined,
      template_type: row.template_type_name
        ? {
            id: row.template_type_id,
            name: row.template_type_name,
          }
        : undefined,
    }));
  }

  static async findByCategory(categoryId: number): Promise<Template[]> {
    const query = `
      SELECT t.*,
             COUNT(ts.id) as step_count,
             CONCAT(u.first_name, ' ', u.last_name) as creator_name,
             tc.name as category_name,
             tc.color as category_color
      FROM templates t
      LEFT JOIN template_steps ts ON t.id = ts.template_id
      LEFT JOIN users u ON t.created_by = u.id
      LEFT JOIN template_categories tc ON t.category_id = tc.id
      WHERE t.is_active = true AND t.category_id = $1
      GROUP BY t.id, u.first_name, u.last_name, tc.name, tc.color
      ORDER BY t.updated_at DESC
    `;
    const result = await pool.query(query, [categoryId]);
    return result.rows;
  }

  // Template usage tracking
  static async recordUsage(
    templateId: number,
    userId: number,
    entityType: string,
    entityId: number,
  ): Promise<void> {
    const query = "SELECT increment_template_usage($1, $2, $3, $4)";
    await pool.query(query, [templateId, userId, entityType, entityId]);
  }

  static async getTemplateStats(): Promise<any> {
    const query = "SELECT * FROM get_template_stats()";
    const result = await pool.query(query);
    return result.rows[0];
  }

  // Search templates
  static async searchTemplates(
    searchTerm: string,
    categoryId?: number,
  ): Promise<Template[]> {
    let query = `
      SELECT t.*,
             COUNT(ts.id) as step_count,
             CONCAT(u.first_name, ' ', u.last_name) as creator_name,
             tc.name as category_name,
             tc.color as category_color
      FROM templates t
      LEFT JOIN template_steps ts ON t.id = ts.template_id
      LEFT JOIN users u ON t.created_by = u.id
      LEFT JOIN template_categories tc ON t.category_id = tc.id
      WHERE t.is_active = true
        AND (t.name ILIKE $1 OR t.description ILIKE $1 OR $2 = ANY(t.tags))
    `;

    const params = [`%${searchTerm}%`, searchTerm];

    if (categoryId) {
      query += ` AND t.category_id = $3`;
      params.push(categoryId);
    }

    query += `
      GROUP BY t.id, u.first_name, u.last_name, tc.name, tc.color
      ORDER BY t.usage_count DESC, t.updated_at DESC
    `;

    const result = await pool.query(query, params);
    return result.rows;
  }
}
