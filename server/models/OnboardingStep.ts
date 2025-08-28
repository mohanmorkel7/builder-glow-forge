import { pool } from "../database/connection";

export interface OnboardingStep {
  id: number;
  client_id: number;
  name: string;
  description?: string;
  status: "pending" | "in_progress" | "completed";
  step_order: number;
  due_date?: string;
  completed_date?: string;
  estimated_days: number;
  created_at: string;
  updated_at: string;
}

export interface OnboardingDocument {
  id: number;
  step_id: number;
  name: string;
  file_path: string;
  file_size: number;
  file_type: string;
  uploaded_by: string;
  uploaded_at: string;
}

export interface OnboardingComment {
  id: number;
  step_id: number;
  user_id?: number;
  user_name: string;
  message: string;
  comment_type: "note" | "update" | "system";
  created_at: string;
}

export interface CreateStepData {
  client_id: number;
  name: string;
  description?: string;
  due_date?: string;
  estimated_days: number;
  step_order?: number;
}

export interface UpdateStepData {
  name?: string;
  description?: string;
  status?: "pending" | "in_progress" | "completed";
  due_date?: string;
  completed_date?: string;
  estimated_days?: number;
  step_order?: number;
}

export interface CreateDocumentData {
  step_id: number;
  name: string;
  file_path: string;
  file_size: number;
  file_type: string;
  uploaded_by: string;
}

export interface CreateCommentData {
  step_id: number;
  user_id?: number;
  user_name: string;
  message: string;
  comment_type?: "note" | "update" | "system";
}

export class OnboardingStepRepository {
  static async findByClientId(clientId: number): Promise<OnboardingStep[]> {
    const query = `
      SELECT * FROM client_onboarding_steps 
      WHERE client_id = $1 
      ORDER BY step_order ASC, created_at ASC
    `;
    const result = await pool.query(query, [clientId]);
    return result.rows;
  }

  static async findById(id: number): Promise<OnboardingStep | null> {
    const query = "SELECT * FROM client_onboarding_steps WHERE id = $1";
    const result = await pool.query(query, [id]);
    return result.rows.length > 0 ? result.rows[0] : null;
  }

  static async create(stepData: CreateStepData): Promise<OnboardingStep> {
    // Get next step order if not provided
    let stepOrder = stepData.step_order;
    if (!stepOrder) {
      const orderQuery = `
        SELECT COALESCE(MAX(step_order), 0) + 1 as next_order 
        FROM client_onboarding_steps 
        WHERE client_id = $1
      `;
      const orderResult = await pool.query(orderQuery, [stepData.client_id]);
      stepOrder = orderResult.rows[0].next_order;
    }

    const query = `
      INSERT INTO client_onboarding_steps 
      (client_id, name, description, due_date, estimated_days, step_order)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;

    const values = [
      stepData.client_id,
      stepData.name,
      stepData.description || null,
      stepData.due_date || null,
      stepData.estimated_days,
      stepOrder,
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async update(id: number, stepData: UpdateStepData): Promise<OnboardingStep | null> {
    const setClause = [];
    const values = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(stepData)) {
      if (value !== undefined) {
        setClause.push(`${key} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    }

    if (setClause.length === 0) {
      return this.findById(id);
    }

    setClause.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const query = `
      UPDATE client_onboarding_steps 
      SET ${setClause.join(", ")}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await pool.query(query, values);
    return result.rows.length > 0 ? result.rows[0] : null;
  }

  static async delete(id: number): Promise<boolean> {
    const query = "DELETE FROM client_onboarding_steps WHERE id = $1";
    const result = await pool.query(query, [id]);
    return result.rowCount > 0;
  }

  static async reorderSteps(clientId: number, stepOrders: { id: number; order: number }[]): Promise<void> {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      
      for (const { id, order } of stepOrders) {
        await client.query(
          "UPDATE client_onboarding_steps SET step_order = $1 WHERE id = $2 AND client_id = $3",
          [order, id, clientId]
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
}

export class OnboardingDocumentRepository {
  static async findByStepId(stepId: number): Promise<OnboardingDocument[]> {
    const query = `
      SELECT * FROM client_step_documents 
      WHERE step_id = $1 
      ORDER BY uploaded_at DESC
    `;
    const result = await pool.query(query, [stepId]);
    return result.rows;
  }

  static async findById(id: number): Promise<OnboardingDocument | null> {
    const query = "SELECT * FROM client_step_documents WHERE id = $1";
    const result = await pool.query(query, [id]);
    return result.rows.length > 0 ? result.rows[0] : null;
  }

  static async create(docData: CreateDocumentData): Promise<OnboardingDocument> {
    const query = `
      INSERT INTO client_step_documents 
      (step_id, name, file_path, file_size, file_type, uploaded_by)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;

    const values = [
      docData.step_id,
      docData.name,
      docData.file_path,
      docData.file_size,
      docData.file_type,
      docData.uploaded_by,
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async delete(id: number): Promise<boolean> {
    const query = "DELETE FROM client_step_documents WHERE id = $1";
    const result = await pool.query(query, [id]);
    return result.rowCount > 0;
  }
}

export class OnboardingCommentRepository {
  static async findByStepId(stepId: number): Promise<OnboardingComment[]> {
    const query = `
      SELECT * FROM client_step_comments 
      WHERE step_id = $1 
      ORDER BY created_at ASC
    `;
    const result = await pool.query(query, [stepId]);
    return result.rows;
  }

  static async create(commentData: CreateCommentData): Promise<OnboardingComment> {
    const query = `
      INSERT INTO client_step_comments 
      (step_id, user_id, user_name, message, comment_type)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;

    const values = [
      commentData.step_id,
      commentData.user_id || null,
      commentData.user_name,
      commentData.message,
      commentData.comment_type || "note",
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async delete(id: number): Promise<boolean> {
    const query = "DELETE FROM client_step_comments WHERE id = $1";
    const result = await pool.query(query, [id]);
    return result.rowCount > 0;
  }
}
