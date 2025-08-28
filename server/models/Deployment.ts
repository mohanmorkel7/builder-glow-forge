import { pool } from "../database/connection";

export interface Deployment {
  id: number;
  product_id: number;
  version: string;
  environment: "development" | "staging" | "qa" | "production";
  status:
    | "pending"
    | "scheduled"
    | "in_progress"
    | "completed"
    | "failed"
    | "cancelled";
  description?: string;
  assigned_to?: number;
  scheduled_date?: string;
  started_at?: string;
  completed_at?: string;
  auto_rollback: boolean;
  run_tests: boolean;
  notify_team: boolean;
  require_approval: boolean;
  release_notes?: string;
  created_by: number;
  created_at: string;
  updated_at: string;
  product_name?: string;
  assigned_to_name?: string;
  created_by_name?: string;
}

export interface Product {
  id: number;
  name: string;
  description?: string;
  current_version?: string;
  repository_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateDeploymentData {
  product_id: number;
  version: string;
  environment: "development" | "staging" | "qa" | "production";
  description?: string;
  assigned_to?: number;
  scheduled_date?: string;
  auto_rollback?: boolean;
  run_tests?: boolean;
  notify_team?: boolean;
  require_approval?: boolean;
  release_notes?: string;
  created_by: number;
}

export interface UpdateDeploymentData {
  version?: string;
  environment?: "development" | "staging" | "qa" | "production";
  status?:
    | "pending"
    | "scheduled"
    | "in_progress"
    | "completed"
    | "failed"
    | "cancelled";
  description?: string;
  assigned_to?: number;
  scheduled_date?: string;
  auto_rollback?: boolean;
  run_tests?: boolean;
  notify_team?: boolean;
  require_approval?: boolean;
  release_notes?: string;
}

export class DeploymentRepository {
  static async findAll(): Promise<Deployment[]> {
    const query = `
      SELECT d.*, 
             p.name as product_name,
             CONCAT(u1.first_name, ' ', u1.last_name) as assigned_to_name,
             CONCAT(u2.first_name, ' ', u2.last_name) as created_by_name
      FROM deployments d
      LEFT JOIN products p ON d.product_id = p.id
      LEFT JOIN users u1 ON d.assigned_to = u1.id
      LEFT JOIN users u2 ON d.created_by = u2.id
      ORDER BY d.created_at DESC
    `;
    const result = await pool.query(query);
    return result.rows;
  }

  static async findById(id: number): Promise<Deployment | null> {
    const query = `
      SELECT d.*, 
             p.name as product_name,
             CONCAT(u1.first_name, ' ', u1.last_name) as assigned_to_name,
             CONCAT(u2.first_name, ' ', u2.last_name) as created_by_name
      FROM deployments d
      LEFT JOIN products p ON d.product_id = p.id
      LEFT JOIN users u1 ON d.assigned_to = u1.id
      LEFT JOIN users u2 ON d.created_by = u2.id
      WHERE d.id = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }

  static async findByAssignee(assigneeId: number): Promise<Deployment[]> {
    const query = `
      SELECT d.*, 
             p.name as product_name,
             CONCAT(u1.first_name, ' ', u1.last_name) as assigned_to_name,
             CONCAT(u2.first_name, ' ', u2.last_name) as created_by_name
      FROM deployments d
      LEFT JOIN products p ON d.product_id = p.id
      LEFT JOIN users u1 ON d.assigned_to = u1.id
      LEFT JOIN users u2 ON d.created_by = u2.id
      WHERE d.assigned_to = $1
      ORDER BY d.created_at DESC
    `;
    const result = await pool.query(query, [assigneeId]);
    return result.rows;
  }

  static async create(
    deploymentData: CreateDeploymentData,
  ): Promise<Deployment> {
    const query = `
      INSERT INTO deployments (product_id, version, environment, description, assigned_to,
                              scheduled_date, auto_rollback, run_tests, notify_team, 
                              require_approval, release_notes, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `;

    const values = [
      deploymentData.product_id,
      deploymentData.version,
      deploymentData.environment,
      deploymentData.description || null,
      deploymentData.assigned_to || null,
      deploymentData.scheduled_date || null,
      deploymentData.auto_rollback ?? true,
      deploymentData.run_tests ?? true,
      deploymentData.notify_team ?? true,
      deploymentData.require_approval ?? false,
      deploymentData.release_notes || null,
      deploymentData.created_by,
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async update(
    id: number,
    deploymentData: UpdateDeploymentData,
  ): Promise<Deployment | null> {
    const setClause = [];
    const values = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(deploymentData)) {
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
      UPDATE deployments 
      SET ${setClause.join(", ")}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await pool.query(query, values);
    return result.rows[0] || null;
  }

  static async delete(id: number): Promise<boolean> {
    const query = "DELETE FROM deployments WHERE id = $1";
    const result = await pool.query(query, [id]);
    return result.rowCount > 0;
  }

  static async updateStatus(
    id: number,
    status: Deployment["status"],
  ): Promise<Deployment | null> {
    const updateData: any = { status };

    if (status === "in_progress") {
      updateData.started_at = new Date().toISOString();
    } else if (status === "completed" || status === "failed") {
      updateData.completed_at = new Date().toISOString();
    }

    return this.update(id, updateData);
  }

  static async getStats(): Promise<{
    total: number;
    completed: number;
    failed: number;
    pending: number;
  }> {
    const query = `
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed,
        COUNT(CASE WHEN status IN ('pending', 'scheduled') THEN 1 END) as pending
      FROM deployments
    `;
    const result = await pool.query(query);
    return result.rows[0];
  }
}

export class ProductRepository {
  static async findAll(): Promise<Product[]> {
    const query =
      "SELECT * FROM products WHERE is_active = true ORDER BY name ASC";
    const result = await pool.query(query);
    return result.rows;
  }

  static async findById(id: number): Promise<Product | null> {
    const query = "SELECT * FROM products WHERE id = $1";
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }
}
