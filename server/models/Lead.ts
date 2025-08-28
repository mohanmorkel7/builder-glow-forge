import { pool } from "../database/connection";

export interface Lead {
  id: number;
  lead_id: string; // #001, #002, etc.

  // Lead Source Information
  lead_source:
    | "email"
    | "social-media"
    | "phone"
    | "website"
    | "referral"
    | "cold-call"
    | "event"
    | "other";
  lead_source_value?: string;
  lead_created_by?: string;

  // Status
  status: "in-progress" | "won" | "lost" | "completed";

  // Project Information
  project_title?: string;
  project_description?: string;

  project_requirements?: string;

  // Enhanced Project Info
  solutions?: string[]; // CardToken, MylapaySecure, FRM, etc.
  priority_level?: "high" | "medium" | "low";
  start_date?: string; // expected or confirmed
  targeted_end_date?: string;
  expected_daily_txn_volume?: number;
  expected_daily_txn_volume_year1?: number;
  expected_daily_txn_volume_year2?: number;
  expected_daily_txn_volume_year3?: number;
  expected_daily_txn_volume_year5?: number;
  spoc?: string; // Single Point of Contact

  // Commercials
  billing_currency?: "INR" | "USD" | "AED";
  flat_fee_config?: Array<{
    id: string;
    component_name: string;
    value: number;
    currency: "INR" | "USD" | "AED";
    type: "one_time" | "recurring";
    recurring_period?: "monthly" | "quarterly" | "yearly";
  }>;
  transaction_fee_config?: Array<{
    solution: string;
    value: number;
    currency: "INR" | "USD" | "AED";
  }>;

  // Client Information
  client_name: string;
  client_type?: "new" | "existing";
  company?: string;
  company_location?: string;
  category?: "aggregator" | "banks";
  country?:
    | "india"
    | "usa"
    | "uae"
    | "uk"
    | "singapore"
    | "canada"
    | "australia"
    | "other";

  // Contact Information (multiple contacts)
  contacts?: Array<{
    contact_name: string;
    designation: string;
    phone: string;
    email: string;
    linkedin: string;
  }>;

  // Additional Information
  priority: "low" | "medium" | "high" | "urgent";
  expected_close_date?: string;
  probability?: number; // 0-100%
  notes?: string;

  // Template Reference
  template_id?: number;

  // Partial save support
  is_partial?: boolean;
  partial_data?: any;

  // Metadata
  created_by: number;
  assigned_to?: number;
  created_at: string;
  updated_at: string;

  // Relations
  sales_rep_name?: string;
  creator_name?: string;
}

export interface LeadStep {
  id: number;
  lead_id: number;
  name: string;
  description?: string;
  status: "pending" | "in_progress" | "completed" | "cancelled";
  step_order: number;
  due_date?: string;
  completed_date?: string;
  estimated_days: number;
  assigned_to?: number;
  created_at: string;
  updated_at: string;
}

export interface LeadChat {
  id: number;
  step_id: number;
  user_id?: number;
  user_name: string;
  message: string;
  message_type: "text" | "file" | "system";
  is_rich_text: boolean;
  created_at: string;

  // File attachments
  attachments?: LeadChatAttachment[];
}

export interface LeadChatAttachment {
  id: number;
  chat_id: number;
  file_name: string;
  file_path: string;
  file_size: number;
  file_type: string;
  uploaded_at: string;
}

export interface CreateLeadData {
  lead_id?: string; // Optional, will be auto-generated if not provided
  lead_source?:
    | "email"
    | "social-media"
    | "phone"
    | "website"
    | "referral"
    | "cold-call"
    | "event"
    | "other";
  lead_source_value?: string;
  lead_created_by?: string;

  // Project Information
  project_title?: string;
  project_description?: string;

  project_requirements?: string;

  // Enhanced Project Info
  solutions?: string[];
  priority_level?: "high" | "medium" | "low";
  start_date?: string;
  targeted_end_date?: string;
  expected_daily_txn_volume?: number;
  expected_daily_txn_volume_year1?: number;
  expected_daily_txn_volume_year2?: number;
  expected_daily_txn_volume_year3?: number;
  expected_daily_txn_volume_year5?: number;
  spoc?: string;

  // Commercials
  billing_currency?: "INR" | "USD" | "AED";
  flat_fee_config?: string; // JSON string
  transaction_fee_config?: string; // JSON string

  // Client Information
  client_name: string;
  client_type?: "new" | "existing";
  company?: string;
  company_location?: string;
  category?: "aggregator" | "banks";
  country?:
    | "india"
    | "usa"
    | "uae"
    | "uk"
    | "singapore"
    | "canada"
    | "australia"
    | "other";
  // Contact Information
  contacts?: Array<{
    contact_name: string;
    designation: string;
    phone: string;
    email: string;
    linkedin: string;
  }>;

  // Additional Information
  priority?: "low" | "medium" | "high" | "urgent";
  expected_close_date?: string;
  probability?: number;
  notes?: string;

  // Template Reference
  template_id?: number;
  selected_template_id?: number;

  // Partial save support
  is_partial?: boolean;
  partial_data?: any;

  // Metadata
  created_by: number;
  assigned_to?: number;
}

export interface UpdateLeadData {
  lead_source?:
    | "email"
    | "social-media"
    | "phone"
    | "website"
    | "referral"
    | "cold-call"
    | "event"
    | "other";
  lead_source_value?: string;
  lead_created_by?: string;
  status?: "in-progress" | "won" | "lost" | "completed";

  // Project Information
  project_title?: string;
  project_description?: string;

  project_requirements?: string;

  // Enhanced Project Info
  solutions?: string[];
  priority_level?: "high" | "medium" | "low";
  start_date?: string;
  targeted_end_date?: string;
  expected_daily_txn_volume?: number;
  expected_daily_txn_volume_year1?: number;
  expected_daily_txn_volume_year2?: number;
  expected_daily_txn_volume_year3?: number;
  expected_daily_txn_volume_year5?: number;
  spoc?: string;

  // Commercials
  billing_currency?: "INR" | "USD" | "AED";
  flat_fee_config?: string; // JSON string
  transaction_fee_config?: string; // JSON string

  // Client Information
  client_name?: string;
  client_type?: "new" | "existing";
  company?: string;
  company_location?: string;
  category?: "aggregator" | "banks";
  country?:
    | "india"
    | "usa"
    | "uae"
    | "uk"
    | "singapore"
    | "canada"
    | "australia"
    | "other";
  // Contact Information
  contacts?: Array<{
    contact_name: string;
    designation: string;
    phone: string;
    email: string;
    linkedin: string;
  }>;

  // Additional Information
  priority?: "low" | "medium" | "high" | "urgent";
  expected_close_date?: string;
  probability?: number;
  notes?: string;

  // Template Reference
  template_id?: number;

  // Metadata
  assigned_to?: number;
}

export interface CreateLeadStepData {
  lead_id: number;
  name: string;
  description?: string;
  due_date?: string;
  estimated_days: number;
  probability_percent?: number;
  step_order?: number;
  assigned_to?: number;
}

export interface UpdateLeadStepData {
  name?: string;
  description?: string;
  status?: "pending" | "in_progress" | "completed" | "cancelled";
  due_date?: string;
  completed_date?: string;
  estimated_days?: number;
  probability_percent?: number;
  step_order?: number;
  assigned_to?: number;
}

export interface CreateLeadChatData {
  step_id: number;
  user_id?: number;
  user_name: string;
  message: string;
  message_type?: "text" | "file" | "system";
  is_rich_text?: boolean;
  attachments?: {
    file_name: string;
    file_path: string;
    file_size: number;
    file_type: string;
  }[];
}

export class LeadRepository {
  static async findAll(
    salesRepId?: number,
    isPartialOnly?: boolean,
    createdById?: number,
    isPartialSavesOnly?: boolean,
  ): Promise<Lead[]> {
    let whereConditions = [];
    let values = [];
    let paramIndex = 1;

    if (salesRepId) {
      whereConditions.push(`l.assigned_to = $${paramIndex}`);
      values.push(salesRepId);
      paramIndex++;
    }

    if (createdById) {
      whereConditions.push(`l.created_by = $${paramIndex}`);
      values.push(createdById);
      paramIndex++;
    }

    if (isPartialOnly !== undefined) {
      whereConditions.push(`l.is_partial = $${paramIndex}`);
      values.push(isPartialOnly);
      paramIndex++;
    }

    if (isPartialSavesOnly) {
      // Add JSON validation to prevent parsing errors
      whereConditions.push(
        `l.notes IS NOT NULL AND
         l.notes != '' AND
         l.notes ~ '^\\s*[{[]' AND
         (l.notes::jsonb ? 'isPartialSave') AND
         (l.notes::jsonb->>'isPartialSave')::boolean = true`,
      );
    }

    const whereClause =
      whereConditions.length > 0
        ? `WHERE ${whereConditions.join(" AND ")}`
        : "";

    const query = `
      SELECT l.*,
             CONCAT(u.first_name, ' ', u.last_name) as sales_rep_name,
             CONCAT(c.first_name, ' ', c.last_name) as creator_name
      FROM leads l
      LEFT JOIN users u ON l.assigned_to = u.id
      LEFT JOIN users c ON l.created_by = c.id
      ${whereClause}
      ORDER BY l.created_at DESC
    `;

    const result = await pool.query(query, values);

    // Parse contacts field if it's a string (for backward compatibility)
    return result.rows.map((lead) => {
      if (lead.contacts && typeof lead.contacts === "string") {
        try {
          lead.contacts = JSON.parse(lead.contacts);
        } catch (error) {
          console.warn(`Failed to parse contacts for lead ${lead.id}:`, error);
          lead.contacts = [];
        }
      }
      return lead;
    });
  }

  static async findById(id: number): Promise<Lead | null> {
    const query = `
      SELECT l.*,
             CONCAT(u.first_name, ' ', u.last_name) as sales_rep_name,
             CONCAT(c.first_name, ' ', c.last_name) as creator_name
      FROM leads l
      LEFT JOIN users u ON l.assigned_to = u.id
      LEFT JOIN users c ON l.created_by = c.id
      WHERE l.id = $1
    `;

    const result = await pool.query(query, [id]);
    if (result.rows.length > 0) {
      const lead = result.rows[0];

      // Parse contacts if it's a string (for backward compatibility)
      if (lead.contacts && typeof lead.contacts === "string") {
        try {
          lead.contacts = JSON.parse(lead.contacts);
        } catch (error) {
          console.warn(`Failed to parse contacts for lead ${id}:`, error);
          lead.contacts = [];
        }
      }

      return lead;
    }
    return null;
  }

  static async create(leadData: CreateLeadData): Promise<Lead> {
    // Generate lead ID if not provided
    let leadId = leadData.lead_id;
    if (!leadId) {
      const countResult = await pool.query(
        "SELECT COUNT(*) as count FROM leads",
      );
      const count = parseInt(countResult.rows[0].count) + 1;
      leadId = `#${count.toString().padStart(4, "0")}`;
    }

    const query = `
      INSERT INTO leads (
        lead_id, lead_source, lead_source_value, project_title, project_description,
        project_requirements, solutions, priority_level,
        start_date, targeted_end_date, expected_daily_txn_volume, project_value, spoc,
        commercials, commercial_pricing, client_name, client_type, company,
        company_location, category, country, contacts, priority, expected_close_date,
        probability, notes, template_id, created_by, assigned_to
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13,
        $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24,
        $25, $26, $27, $28, $29
      )
      RETURNING *
    `;

    const values = [
      leadId, // $1
      leadData.lead_source || "other", // $2
      leadData.lead_source_value || null, // $3
      leadData.project_title || null, // $4
      leadData.project_description || null, // $5
      leadData.project_requirements || null, // $6
      JSON.stringify(leadData.solutions || []), // $7
      leadData.priority_level || "medium", // $8
      leadData.start_date || null, // $9
      leadData.targeted_end_date || null, // $10
      leadData.expected_daily_txn_volume || null, // $11
      leadData.project_value || null, // $12
      leadData.spoc || null, // $13
      JSON.stringify(leadData.commercials || []), // $14
      JSON.stringify(leadData.commercial_pricing || []), // $15
      leadData.client_name || "New Lead", // $16
      leadData.client_type || null, // $17
      leadData.company || null, // $18
      leadData.company_location || null, // $19
      leadData.category || null, // $20
      leadData.country || null, // $21
      JSON.stringify(leadData.contacts || []), // $22
      leadData.priority || "medium", // $23
      leadData.expected_close_date || null, // $24
      leadData.probability !== undefined ? leadData.probability : 0, // $25
      leadData.notes || null, // $26
      leadData.template_id || leadData.selected_template_id || null, // $27
      leadData.created_by, // $28
      leadData.assigned_to || null, // $29
    ];

    const result = await pool.query(query, values);
    const lead = result.rows[0];

    // If a template was selected, auto-populate steps from the template
    if (leadData.selected_template_id || leadData.template_id) {
      await this.populateStepsFromTemplate(
        lead.id,
        leadData.selected_template_id || leadData.template_id,
      );
    } else {
      // Create default lead steps when no template is selected
      await this.createDefaultSteps(lead.id);
    }

    return lead;
  }

  static async createDefaultSteps(leadId: number): Promise<void> {
    try {
      const defaultSteps = [
        {
          name: "Initial Contact & Discovery",
          description: "First contact with prospect to understand their needs",
          step_order: 1,
          estimated_days: 1,
        },
        {
          name: "Needs Assessment & Demo",
          description: "Detailed needs assessment and product demonstration",
          step_order: 2,
          estimated_days: 3,
        },
        {
          name: "Proposal Preparation",
          description: "Prepare detailed proposal based on requirements",
          step_order: 3,
          estimated_days: 4,
        },
        {
          name: "Proposal Review & Negotiation",
          description: "Present proposal and handle negotiations",
          step_order: 4,
          estimated_days: 5,
        },
        {
          name: "Contract Finalization",
          description: "Finalize contract terms and get signatures",
          step_order: 5,
          estimated_days: 3,
        },
        {
          name: "Onboarding Preparation",
          description: "Prepare onboarding materials and timeline",
          step_order: 6,
          estimated_days: 2,
        },
        {
          name: "Implementation Planning",
          description: "Plan technical implementation and project timeline",
          step_order: 7,
          estimated_days: 5,
        },
        {
          name: "System Integration",
          description: "Integrate systems and perform testing",
          step_order: 8,
          estimated_days: 7,
        },
        {
          name: "Go-Live & Support",
          description: "Go live with the solution and provide initial support",
          step_order: 9,
          estimated_days: 3,
        },
        {
          name: "Project Closure",
          description: "Complete project documentation and handover",
          step_order: 10,
          estimated_days: 2,
        },
      ];

      const insertPromises = defaultSteps.map((step) => {
        const insertStepQuery = `
          INSERT INTO lead_steps (
            lead_id, name, description, status, step_order, estimated_days, probability_percent
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7)
        `;

        return pool.query(insertStepQuery, [
          leadId,
          step.name,
          step.description,
          "pending",
          step.step_order,
          step.estimated_days,
          step.probability_percent || Math.floor(100 / defaultSteps.length),
        ]);
      });

      await Promise.all(insertPromises);
      console.log(
        `Created ${defaultSteps.length} default steps for lead ${leadId}`,
      );
    } catch (error) {
      console.error("Error creating default steps:", error);
      // Don't throw error as lead creation should still succeed
    }
  }

  static async populateStepsFromTemplate(
    leadId: number,
    templateId: number,
  ): Promise<void> {
    try {
      // Get template steps
      const templateStepsQuery = `
        SELECT * FROM template_steps
        WHERE template_id = $1
        ORDER BY step_order ASC
      `;
      const templateStepsResult = await pool.query(templateStepsQuery, [
        templateId,
      ]);

      if (templateStepsResult.rows.length === 0) {
        console.log(
          `No template steps found for template ${templateId}, creating default steps`,
        );
        await this.createDefaultSteps(leadId);
        return;
      }

      // Insert lead steps based on template steps
      const insertPromises = templateStepsResult.rows.map(
        (templateStep, index) => {
          const insertStepQuery = `
          INSERT INTO lead_steps (
            lead_id, name, description, status, step_order, estimated_days
          )
          VALUES ($1, $2, $3, $4, $5, $6)
        `;

          return pool.query(insertStepQuery, [
            leadId,
            templateStep.name,
            templateStep.description || null,
            "pending",
            templateStep.step_order || index + 1,
            templateStep.default_eta_days || 3,
          ]);
        },
      );

      await Promise.all(insertPromises);
      console.log(
        `Created ${templateStepsResult.rows.length} steps from template ${templateId} for lead ${leadId}`,
      );
    } catch (error) {
      console.error("Error populating steps from template:", error);
      // Don't throw error as lead creation should still succeed
    }
  }

  static async update(
    id: number,
    leadData: UpdateLeadData,
  ): Promise<Lead | null> {
    const setClause = [];
    const values = [];
    let paramIndex = 1;

    // Date fields that need empty string to null conversion
    const dateFields = [
      "start_date",
      "targeted_end_date",
      "expected_close_date",
      "created_at",
      "updated_at",
    ];

    for (const [key, value] of Object.entries(leadData)) {
      if (value !== undefined) {
        let processedValue = value;

        // Convert empty strings to null for date fields
        if (dateFields.includes(key) && value === "") {
          processedValue = null;
        }

        if (
          key === "solutions" ||
          key === "commercials" ||
          key === "commercial_pricing" ||
          key === "contacts"
        ) {
          // Handle JSON fields
          setClause.push(`${key} = $${paramIndex}`);
          values.push(JSON.stringify(processedValue));
        } else {
          setClause.push(`${key} = $${paramIndex}`);
          values.push(processedValue);
        }
        paramIndex++;
      }
    }

    if (setClause.length === 0) {
      return this.findById(id);
    }

    setClause.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const query = `
      UPDATE leads 
      SET ${setClause.join(", ")}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await pool.query(query, values);
    return result.rows.length > 0 ? result.rows[0] : null;
  }

  static async delete(id: number): Promise<boolean> {
    // First, try to apply the foreign key fix if needed
    try {
      await pool.query(`
        ALTER TABLE follow_ups DROP CONSTRAINT IF EXISTS follow_ups_lead_id_fkey;
        ALTER TABLE follow_ups ADD CONSTRAINT follow_ups_lead_id_fkey
            FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE;
      `);
    } catch (migrationError) {
      console.log(
        "Foreign key migration already applied or failed:",
        migrationError.message,
      );
    }

    // Now delete the lead - cascading deletes should handle follow-ups
    const query = "DELETE FROM leads WHERE id = $1";
    const result = await pool.query(query, [id]);
    return result.rowCount > 0;
  }

  static async getStats(salesRepId?: number) {
    const query = `
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'in-progress') as in_progress,
        COUNT(*) FILTER (WHERE status = 'won') as won,
        COUNT(*) FILTER (WHERE status = 'lost') as lost,
        COUNT(*) FILTER (WHERE status = 'completed') as completed
      FROM leads
      ${salesRepId ? "WHERE assigned_to = $1" : ""}
    `;

    const values = salesRepId ? [salesRepId] : [];
    const result = await pool.query(query, values);
    return result.rows[0];
  }
}

export class LeadStepRepository {
  static async findByLeadId(leadId: number): Promise<LeadStep[]> {
    const query = `
      SELECT ls.*, 
             CONCAT(u.first_name, ' ', u.last_name) as assigned_user_name
      FROM lead_steps ls
      LEFT JOIN users u ON ls.assigned_to = u.id
      WHERE ls.lead_id = $1 
      ORDER BY ls.step_order ASC, ls.created_at ASC
    `;
    const result = await pool.query(query, [leadId]);
    return result.rows;
  }

  static async create(stepData: CreateLeadStepData): Promise<LeadStep> {
    // Get next step order if not provided
    let stepOrder = stepData.step_order;
    if (!stepOrder) {
      const orderQuery = `
        SELECT COALESCE(MAX(step_order), 0) + 1 as next_order 
        FROM lead_steps 
        WHERE lead_id = $1
      `;
      const orderResult = await pool.query(orderQuery, [stepData.lead_id]);
      stepOrder = orderResult.rows[0].next_order;
    }

    const query = `
      INSERT INTO lead_steps
      (lead_id, name, description, due_date, estimated_days, probability_percent, step_order, assigned_to)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;

    const values = [
      stepData.lead_id,
      stepData.name,
      stepData.description || null,
      stepData.due_date || null,
      stepData.estimated_days,
      stepData.probability_percent || 0,
      stepOrder,
      stepData.assigned_to || null,
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async update(
    id: number,
    stepData: UpdateLeadStepData,
  ): Promise<LeadStep | null> {
    const setClause = [];
    const values = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(stepData)) {
      if (value !== undefined) {
        if (
          key === "completed_date" &&
          stepData.status === "completed" &&
          !value
        ) {
          // Auto-set completed_date when status is set to completed
          setClause.push(`${key} = CURRENT_TIMESTAMP`);
        } else {
          setClause.push(`${key} = $${paramIndex}`);
          values.push(value);
          paramIndex++;
        }
      }
    }

    if (setClause.length === 0) {
      return this.findById(id);
    }

    setClause.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const query = `
      UPDATE lead_steps 
      SET ${setClause.join(", ")}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await pool.query(query, values);
    return result.rows.length > 0 ? result.rows[0] : null;
  }

  static async delete(id: number): Promise<boolean> {
    console.log(`LeadStepRepository.delete: Attempting to delete step ${id}`);

    // First check if the step exists
    const checkQuery = "SELECT id, name FROM lead_steps WHERE id = $1";
    const checkResult = await pool.query(checkQuery, [id]);

    if (checkResult.rows.length === 0) {
      console.log(`LeadStepRepository.delete: Step ${id} not found`);
      return false;
    }

    console.log(
      `LeadStepRepository.delete: Found step ${id}: ${checkResult.rows[0].name}`,
    );

    // Delete the step
    const query = "DELETE FROM lead_steps WHERE id = $1";
    const result = await pool.query(query, [id]);

    console.log(
      `LeadStepRepository.delete: Delete query affected ${result.rowCount} rows`,
    );

    return result.rowCount > 0;
  }

  static async reorderSteps(
    leadId: number,
    stepOrders: { id: number; order: number }[],
  ): Promise<void> {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Update lead step orders
      for (const { id, order } of stepOrders) {
        await client.query(
          "UPDATE lead_steps SET step_order = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND lead_id = $3",
          [order, id, leadId],
        );
      }

      // Check if this lead was created from a template
      const leadQuery = "SELECT template_id FROM leads WHERE id = $1";
      const leadResult = await client.query(leadQuery, [leadId]);

      if (leadResult.rows.length > 0 && leadResult.rows[0].template_id) {
        // Update template step orders as well
        await this.syncTemplateStepOrders(
          client,
          leadResult.rows[0].template_id,
          leadId,
          stepOrders,
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

  static async syncTemplateStepOrders(
    client: any,
    templateId: number,
    leadId: number,
    stepOrders: { id: number; order: number }[],
  ): Promise<void> {
    try {
      // Get current lead steps with their names to match with template steps
      const leadStepsQuery = `
        SELECT id, name, step_order
        FROM lead_steps
        WHERE lead_id = $1
        ORDER BY step_order ASC
      `;
      const leadStepsResult = await client.query(leadStepsQuery, [leadId]);

      // Get template steps
      const templateStepsQuery = `
        SELECT id, name, step_order
        FROM template_steps
        WHERE template_id = $1
        ORDER BY step_order ASC
      `;
      const templateStepsResult = await client.query(templateStepsQuery, [
        templateId,
      ]);

      // Create a mapping of step names to new orders based on lead step reordering
      const stepOrderMap = new Map();
      stepOrders.forEach(({ id, order }) => {
        const leadStep = leadStepsResult.rows.find((step) => step.id === id);
        if (leadStep) {
          stepOrderMap.set(leadStep.name, order);
        }
      });

      // Update template step orders based on the mapping
      for (const templateStep of templateStepsResult.rows) {
        const newOrder = stepOrderMap.get(templateStep.name);
        if (newOrder !== undefined) {
          await client.query(
            "UPDATE template_steps SET step_order = $1 WHERE id = $2",
            [newOrder, templateStep.id],
          );
        }
      }
    } catch (error) {
      console.error("Error syncing template step orders:", error);
      // Don't throw error as lead step reordering should still succeed
    }
  }

  private static async findById(id: number): Promise<LeadStep | null> {
    const query = "SELECT * FROM lead_steps WHERE id = $1";
    const result = await pool.query(query, [id]);
    return result.rows.length > 0 ? result.rows[0] : null;
  }
}

export class LeadChatRepository {
  static async findByStepId(stepId: number): Promise<LeadChat[]> {
    const query = `
      SELECT lc.*
      FROM lead_chats lc
      WHERE lc.step_id = $1
      ORDER BY lc.created_at ASC
    `;
    const result = await pool.query(query, [stepId]);
    return result.rows;
  }

  static async create(chatData: CreateLeadChatData): Promise<LeadChat> {
    const query = `
      INSERT INTO lead_chats 
      (step_id, user_id, user_name, message, message_type, is_rich_text, attachments)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;

    const values = [
      chatData.step_id,
      chatData.user_id || null,
      chatData.user_name,
      chatData.message,
      chatData.message_type || "text",
      chatData.is_rich_text || false,
      JSON.stringify(chatData.attachments || []),
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async update(
    id: number,
    updateData: { message: string; is_rich_text: boolean },
  ): Promise<boolean> {
    const query = `
      UPDATE lead_chats
      SET message = $2, is_rich_text = $3
      WHERE id = $1
    `;
    const result = await pool.query(query, [
      id,
      updateData.message,
      updateData.is_rich_text,
    ]);
    return result.rowCount > 0;
  }

  static async delete(id: number): Promise<boolean> {
    const query = "DELETE FROM lead_chats WHERE id = $1";
    const result = await pool.query(query, [id]);
    return result.rowCount > 0;
  }

  static async findById(id: number): Promise<LeadChat> {
    const query = `
      SELECT lc.*
      FROM lead_chats lc
      WHERE lc.id = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }
}
