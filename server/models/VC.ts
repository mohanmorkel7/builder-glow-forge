import { pool, withTimeout } from "../database/connection";

export interface VC {
  id: number;
  vc_id: string; // #VC001, #VC002, etc.

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

  // Round Information (instead of Project Information)
  round_title?: string;
  round_description?: string;
  round_stage?:
    | "pre_seed"
    | "pre_series_a"
    | "seed"
    | "series_a"
    | "series_b"
    | "series_c"
    | "bridge"
    | "growth"
    | "ipo";
  round_size?: string;
  valuation?: string;

  // Investor Information (instead of Client Information)
  investor_category?:
    | "angel"
    | "vc"
    | "private_equity"
    | "family_office"
    | "merchant_banker"
    | "individual";
  investor_name?: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  website?: string;
  company_size?: string;

  // Investment Details
  potential_lead_investor?: boolean;
  minimum_size?: number; // in rupees
  maximum_size?: number; // in rupees
  minimum_arr_requirement?: number;

  // Enhanced Round Info
  priority_level?: "high" | "medium" | "low";
  start_date?: string;
  targeted_end_date?: string;
  spoc?: string; // Single Point of Contact

  // Billing
  billing_currency?: "INR" | "USD" | "AED";

  // Template association
  template_id?: number;

  // Additional contacts
  contacts?: string; // JSON array of contact objects

  // Metadata
  created_by?: number;
  assigned_to?: number;
  created_at?: string;
  updated_at?: string;
  notes?: string;
  is_partial?: boolean;
}

export interface CreateVCData {
  lead_source: VC["lead_source"];
  lead_source_value?: string;
  lead_created_by?: string;
  status: VC["status"];
  round_title?: string;
  round_description?: string;
  round_stage?: VC["round_stage"];
  round_size?: string;
  valuation?: string;
  investor_category?: VC["investor_category"];
  investor_name?: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  website?: string;
  company_size?: string;
  potential_lead_investor?: boolean;
  minimum_size?: number;
  maximum_size?: number;
  minimum_arr_requirement?: number;
  priority_level?: VC["priority_level"];
  start_date?: string;
  targeted_end_date?: string;
  spoc?: string;
  billing_currency?: VC["billing_currency"];
  template_id?: number;
  contacts?: string; // JSON array of contact objects
  created_by: number;
  assigned_to?: number;
  notes?: string;
  is_partial?: boolean;
}

export interface UpdateVCData {
  lead_source?: VC["lead_source"];
  lead_source_value?: string;
  lead_created_by?: string;
  status?: VC["status"];
  round_title?: string;
  round_description?: string;
  round_stage?: VC["round_stage"];
  round_size?: string;
  valuation?: string;
  investor_category?: VC["investor_category"];
  investor_name?: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  website?: string;
  company_size?: string;
  potential_lead_investor?: boolean;
  minimum_size?: number;
  maximum_size?: number;
  minimum_arr_requirement?: number;
  priority_level?: VC["priority_level"];
  start_date?: string;
  targeted_end_date?: string;
  spoc?: string;
  billing_currency?: VC["billing_currency"];
  template_id?: number;
  contacts?: string; // JSON array of contact objects
  assigned_to?: number;
  notes?: string;
  is_partial?: boolean;
}

export class VCRepository {
  static async findAll(): Promise<VC[]> {
    const query = `
      SELECT
        id, vc_id, lead_source, lead_source_value, lead_created_by, status,
        round_title, round_description, round_stage, round_size, valuation,
        investor_category, investor_name, contact_person, email, phone,
        address, city, state, country, website, company_size, industry,
        potential_lead_investor, minimum_size, maximum_size, minimum_arr_requirement,
        priority_level,
        start_date::text as start_date,
        targeted_end_date::text as targeted_end_date,
        spoc, billing_currency, template_id, contacts, created_by, assigned_to,
        notes, created_at, updated_at, is_partial
      FROM vcs
      WHERE is_partial = false OR is_partial IS NULL
      ORDER BY created_at DESC
    `;
    const result = await withTimeout(pool.query(query), 5000);
    return result.rows;
  }

  static async findPartialSaves(createdBy?: number): Promise<VC[]> {
    let query = `
      SELECT * FROM vcs
      WHERE is_partial = true
    `;
    const values: any[] = [];

    if (createdBy) {
      query += ` AND created_by = $1`;
      values.push(createdBy);
    }

    query += ` ORDER BY created_at DESC`;

    const result = await withTimeout(pool.query(query, values), 5000);
    return result.rows;
  }

  static async findById(id: number): Promise<VC | null> {
    const query = `
      SELECT
        id, vc_id, lead_source, lead_source_value, lead_created_by, status,
        round_title, round_description, round_stage, round_size, valuation,
        investor_category, investor_name, contact_person, email, phone,
        address, city, state, country, website, company_size, industry,
        potential_lead_investor, minimum_size, maximum_size, minimum_arr_requirement,
        priority_level,
        start_date::text as start_date,
        targeted_end_date::text as targeted_end_date,
        spoc, billing_currency, template_id, contacts, created_by, assigned_to,
        notes, created_at, updated_at, is_partial
      FROM vcs
      WHERE id = $1
    `;
    const result = await pool.query(query, [id]);
    const vc = result.rows[0] || null;

    if (vc) {
      console.log("🐛 DEBUG - Server findById date fields:", {
        id: vc.id,
        start_date: vc.start_date,
        targeted_end_date: vc.targeted_end_date,
        start_date_type: typeof vc.start_date,
        targeted_end_date_type: typeof vc.targeted_end_date,
      });
    }

    return vc;
  }

  static async findByInvestorCategory(category: string): Promise<VC[]> {
    const query = `
      SELECT * FROM vcs 
      WHERE investor_category = $1
      ORDER BY created_at DESC
    `;
    const result = await pool.query(query, [category]);
    return result.rows;
  }

  static async findByStatus(status: string): Promise<VC[]> {
    const query = `
      SELECT * FROM vcs 
      WHERE status = $1
      ORDER BY created_at DESC
    `;
    const result = await pool.query(query, [status]);
    return result.rows;
  }

  static async getStats(): Promise<{
    total: number;
    in_progress: number;
    won: number;
    lost: number;
    completed: number;
  }> {
    const query = `
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'in-progress' THEN 1 END) as in_progress,
        COUNT(CASE WHEN status = 'won' THEN 1 END) as won,
        COUNT(CASE WHEN status = 'lost' THEN 1 END) as lost,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed
      FROM vcs
    `;
    const result = await withTimeout(pool.query(query), 5000);
    return {
      total: parseInt(result.rows[0].total),
      in_progress: parseInt(result.rows[0].in_progress),
      won: parseInt(result.rows[0].won),
      lost: parseInt(result.rows[0].lost),
      completed: parseInt(result.rows[0].completed),
    };
  }

  static async create(vcData: CreateVCData): Promise<VC> {
    // Generate VC ID
    const vcIdQuery = `
      SELECT COUNT(*) + 1 as next_id FROM vcs
    `;
    const vcIdResult = await pool.query(vcIdQuery);
    const vcId = `#VC${vcIdResult.rows[0].next_id.toString().padStart(3, "0")}`;

    const query = `
      INSERT INTO vcs (
        vc_id, lead_source, lead_source_value, lead_created_by, status,
        round_title, round_description, round_stage, round_size, valuation,
        investor_category, investor_name, contact_person, email, phone,
        address, city, state, country, website, company_size,
        potential_lead_investor, minimum_size, maximum_size, minimum_arr_requirement,
        priority_level, start_date, targeted_end_date, spoc,
        billing_currency, template_id, contacts, created_by, assigned_to, notes, is_partial
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21,
        $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34, $35, $36
      )
      RETURNING *
    `;

    const countryValue = vcData.country || null;

    // Handle date fields to prevent timezone conversion
    const startDateValue = vcData.start_date
      ? vcData.start_date.includes("T")
        ? vcData.start_date.split("T")[0]
        : vcData.start_date
      : null;
    const targetedEndDateValue = vcData.targeted_end_date
      ? vcData.targeted_end_date.includes("T")
        ? vcData.targeted_end_date.split("T")[0]
        : vcData.targeted_end_date
      : null;

    console.log("🐛 DEBUG - Server date processing:", {
      original_start_date: vcData.start_date,
      processed_start_date: startDateValue,
      original_targeted_end_date: vcData.targeted_end_date,
      processed_targeted_end_date: targetedEndDateValue,
    });

    const values = [
      vcId,
      vcData.lead_source,
      vcData.lead_source_value || null,
      vcData.lead_created_by || null,
      vcData.status,
      vcData.round_title || null,
      vcData.round_description || null,
      vcData.round_stage || null,
      vcData.round_size || null,
      vcData.valuation || null,
      vcData.investor_category || null,
      vcData.investor_name || null,
      vcData.contact_person || null,
      vcData.email || null,
      vcData.phone || null,
      vcData.address || null,
      vcData.city || null,
      vcData.state || null,
      countryValue,
      vcData.website || null,
      vcData.company_size || null,
      vcData.potential_lead_investor || false,
      vcData.minimum_size || null,
      vcData.maximum_size || null,
      vcData.minimum_arr_requirement || null,
      vcData.priority_level || "medium",
      startDateValue,
      targetedEndDateValue,
      vcData.spoc || null,
      vcData.billing_currency || "INR",
      vcData.template_id || null,
      vcData.contacts || null,
      vcData.created_by,
      vcData.assigned_to || null,
      vcData.notes || null,
      vcData.is_partial || false,
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async update(id: number, vcData: UpdateVCData): Promise<VC | null> {
    // Preprocess date fields to prevent timezone conversion
    const processedVcData = { ...vcData };

    if (processedVcData.start_date) {
      processedVcData.start_date = processedVcData.start_date.includes("T")
        ? processedVcData.start_date.split("T")[0]
        : processedVcData.start_date;
      console.log("🐛 DEBUG - Update start_date processing:", {
        original: vcData.start_date,
        processed: processedVcData.start_date,
      });
    }

    if (processedVcData.targeted_end_date) {
      processedVcData.targeted_end_date =
        processedVcData.targeted_end_date.includes("T")
          ? processedVcData.targeted_end_date.split("T")[0]
          : processedVcData.targeted_end_date;
      console.log("🐛 DEBUG - Update targeted_end_date processing:", {
        original: vcData.targeted_end_date,
        processed: processedVcData.targeted_end_date,
      });
    }

    const fields = [];
    const values = [];
    let paramCount = 1;

    Object.entries(processedVcData).forEach(([key, value]) => {
      if (value !== undefined) {
        fields.push(`${key} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    });

    if (fields.length === 0) {
      return this.findById(id);
    }

    fields.push(`updated_at = NOW()`);
    values.push(id);

    const query = `
      UPDATE vcs
      SET ${fields.join(", ")}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await pool.query(query, values);
    return result.rows[0] || null;
  }

  static async delete(id: number): Promise<boolean> {
    const query = `
      DELETE FROM vcs 
      WHERE id = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rowCount > 0;
  }

  static async search(searchTerm: string): Promise<VC[]> {
    const query = `
      SELECT * FROM vcs 
      WHERE 
        round_title ILIKE $1 OR 
        investor_name ILIKE $1 OR 
        vc_id ILIKE $1 OR
        email ILIKE $1 OR
        contact_person ILIKE $1
      ORDER BY created_at DESC
    `;
    const result = await pool.query(query, [`%${searchTerm}%`]);
    return result.rows;
  }
}

// VC Steps model (similar to Lead Steps but for VCs)
export interface VCStep {
  id: number;
  vc_id: number;
  name: string;
  description?: string;
  status: "pending" | "in_progress" | "completed";
  priority: "high" | "medium" | "low";
  assigned_to?: number;
  due_date?: string;
  completed_date?: string;
  order_index: number;
  created_by: number;
  created_at: string;
  updated_at: string;
}

export interface CreateVCStepData {
  vc_id: number;
  name: string;
  description?: string;
  status?: VCStep["status"];
  priority?: VCStep["priority"];
  assigned_to?: number;
  due_date?: string;
  created_by: number;
}

export interface UpdateVCStepData {
  name?: string;
  description?: string;
  status?: VCStep["status"];
  priority?: VCStep["priority"];
  assigned_to?: number;
  due_date?: string;
  completed_date?: string;
}

export class VCStepRepository {
  static async findByVCId(vcId: number): Promise<VCStep[]> {
    const query = `
      SELECT * FROM vc_steps 
      WHERE vc_id = $1 
      ORDER BY order_index ASC, created_at ASC
    `;
    const result = await pool.query(query, [vcId]);
    return result.rows;
  }

  static async findById(id: number): Promise<VCStep | null> {
    const query = `
      SELECT * FROM vc_steps 
      WHERE id = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }

  static async create(stepData: CreateVCStepData): Promise<VCStep> {
    // Get the next order index
    const orderQuery = `
      SELECT COALESCE(MAX(order_index), -1) + 1 as next_order 
      FROM vc_steps 
      WHERE vc_id = $1
    `;
    const orderResult = await pool.query(orderQuery, [stepData.vc_id]);
    const orderIndex = orderResult.rows[0].next_order;

    const query = `
      INSERT INTO vc_steps (
        vc_id, name, description, status, priority, 
        assigned_to, due_date, order_index, created_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;

    const values = [
      stepData.vc_id,
      stepData.name,
      stepData.description || null,
      stepData.status || "pending",
      stepData.priority || "medium",
      stepData.assigned_to || null,
      stepData.due_date || null,
      orderIndex,
      stepData.created_by,
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async update(
    id: number,
    stepData: UpdateVCStepData,
  ): Promise<VCStep | null> {
    console.log(
      `🔧 VCStepRepository.update called for step ${id} with data:`,
      stepData,
    );

    const fields = [];
    const values = [];
    let paramCount = 1;

    Object.entries(stepData).forEach(([key, value]) => {
      if (value !== undefined) {
        fields.push(`${key} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    });

    if (fields.length === 0) {
      console.log(
        `⚠️ No fields to update for step ${id}, returning current data`,
      );
      return this.findById(id);
    }

    fields.push(`updated_at = NOW()`);
    values.push(id);

    const query = `
      UPDATE vc_steps
      SET ${fields.join(", ")}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    console.log(`📝 Executing query: ${query}`);
    console.log(`📊 Query values:`, values);

    const result = await pool.query(query, values);
    console.log(`✅ Update result for step ${id}:`, result.rows[0]);

    return result.rows[0] || null;
  }

  static async delete(id: number): Promise<boolean> {
    const query = `
      DELETE FROM vc_steps 
      WHERE id = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rowCount > 0;
  }

  static async reorderSteps(
    vcId: number,
    stepOrders: Array<{ id: number; order_index: number }>,
  ): Promise<void> {
    // Use a transaction to avoid constraint violations during reordering
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      // First, set all order_index values to negative to avoid conflicts
      const stepIds = stepOrders.map((step) => step.id);
      await client.query(
        `UPDATE vc_steps
         SET order_index = -order_index - 1000, updated_at = NOW()
         WHERE id = ANY($1) AND vc_id = $2`,
        [stepIds, vcId],
      );

      // Then update each step with its final order_index
      for (const { id, order_index } of stepOrders) {
        await client.query(
          `UPDATE vc_steps
           SET order_index = $1, updated_at = NOW()
           WHERE id = $2 AND vc_id = $3`,
          [order_index, id, vcId],
        );
      }

      await client.query("COMMIT");
      console.log(
        `✅ Successfully reordered ${stepOrders.length} steps for VC ${vcId}`,
      );
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("❌ Error during step reordering:", error);
      throw error;
    } finally {
      client.release();
    }
  }
}

// VC Comment interfaces
export interface VCComment {
  id: number;
  vc_id: number;
  step_id?: number;
  message: string;
  message_type: "text" | "image" | "file";
  is_rich_text: boolean;
  attachments: any[];
  user_id?: number;
  user_name: string;
  created_by: number;
  created_by_name: string;
  created_at: string;
  updated_at: string;
}

export interface CreateVCCommentData {
  vc_id: number;
  step_id?: number;
  message: string;
  message_type?: "text" | "image" | "file";
  is_rich_text?: boolean;
  attachments?: any[];
  user_id?: number;
  user_name: string;
  created_by: number;
}

export class VCCommentRepository {
  // Helper method to parse attachments
  private static parseAttachments(attachments: any): any[] {
    if (!attachments) return [];
    if (Array.isArray(attachments)) return attachments;
    if (typeof attachments === "string") {
      try {
        return JSON.parse(attachments);
      } catch (error) {
        console.warn("Failed to parse attachments:", attachments);
        return [];
      }
    }
    return [];
  }

  // Helper method to format comment with parsed attachments
  private static formatComment(comment: any): VCComment {
    return {
      ...comment,
      attachments: this.parseAttachments(comment.attachments),
    };
  }
  static async findByStepId(stepId: number): Promise<VCComment[]> {
    try {
      // First check if step_id column exists
      const columnCheck = await pool.query(`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'vc_comments' AND column_name = 'step_id'
      `);

      if (columnCheck.rows.length > 0) {
        // step_id column exists, use it
        const query = `
          SELECT c.*, u.first_name || ' ' || u.last_name as user_name
          FROM vc_comments c
          LEFT JOIN users u ON c.created_by = u.id
          WHERE c.step_id = $1
          ORDER BY c.created_at ASC
        `;
        const result = await pool.query(query, [stepId]);
        return result.rows.map((row) => this.formatComment(row));
      } else {
        // step_id column doesn't exist, return empty array for now
        console.log("⚠️ step_id column not found in vc_comments table");
        return [];
      }
    } catch (error) {
      console.error("Error in findByStepId:", error);
      throw error;
    }
  }

  static async findByVCId(vcId: number): Promise<VCComment[]> {
    const query = `
      SELECT c.*, u.first_name || ' ' || u.last_name as user_name
      FROM vc_comments c
      LEFT JOIN users u ON c.created_by = u.id
      WHERE c.vc_id = $1
      ORDER BY c.created_at ASC
    `;
    const result = await pool.query(query, [vcId]);
    return result.rows.map((row) => this.formatComment(row));
  }

  static async create(commentData: CreateVCCommentData): Promise<VCComment> {
    try {
      // Check which columns exist in the table
      const columnCheck = await pool.query(`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'vc_comments'
      `);

      const availableColumns = columnCheck.rows.map((row) => row.column_name);
      const hasStepId = availableColumns.includes("step_id");
      const hasMessageType = availableColumns.includes("message_type");
      const hasIsRichText = availableColumns.includes("is_rich_text");
      const hasAttachments = availableColumns.includes("attachments");
      const hasUserId = availableColumns.includes("user_id");
      const hasUserName = availableColumns.includes("user_name");

      // Build query based on available columns
      let fields = ["vc_id", "message", "created_by", "created_by_name"];
      let values = [
        commentData.vc_id,
        commentData.message,
        commentData.created_by,
        commentData.user_name,
      ];
      let placeholders = ["$1", "$2", "$3", "$4"];

      if (hasStepId && commentData.step_id) {
        fields.push("step_id");
        values.push(commentData.step_id);
        placeholders.push(`$${values.length}`);
      }

      if (hasMessageType) {
        fields.push("message_type");
        values.push(commentData.message_type || "text");
        placeholders.push(`$${values.length}`);
      }

      if (hasIsRichText) {
        fields.push("is_rich_text");
        values.push(commentData.is_rich_text || false);
        placeholders.push(`$${values.length}`);
      }

      if (hasAttachments) {
        fields.push("attachments");
        values.push(JSON.stringify(commentData.attachments || []));
        placeholders.push(`$${values.length}`);
      }

      if (hasUserId && commentData.user_id) {
        fields.push("user_id");
        values.push(commentData.user_id);
        placeholders.push(`$${values.length}`);
      }

      if (hasUserName) {
        fields.push("user_name");
        values.push(commentData.user_name);
        placeholders.push(`$${values.length}`);
      }

      const query = `
        INSERT INTO vc_comments (${fields.join(", ")})
        VALUES (${placeholders.join(", ")})
        RETURNING *
      `;

      const result = await pool.query(query, values);
      return this.formatComment(result.rows[0]);
    } catch (error) {
      console.error("Error in VCCommentRepository.create:", error);
      throw error;
    }
  }

  static async update(
    id: number,
    updateData: { message: string; is_rich_text: boolean },
  ): Promise<boolean> {
    const query = `
      UPDATE vc_comments
      SET message = $2, is_rich_text = $3, updated_at = NOW()
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
    const query = "DELETE FROM vc_comments WHERE id = $1";
    const result = await pool.query(query, [id]);
    return result.rowCount > 0;
  }

  static async findById(id: number): Promise<VCComment> {
    const query = `
      SELECT c.*, u.first_name || ' ' || u.last_name as user_name
      FROM vc_comments c
      LEFT JOIN users u ON c.created_by = u.id
      WHERE c.id = $1
    `;
    const result = await pool.query(query, [id]);
    return this.formatComment(result.rows[0]);
  }
}
