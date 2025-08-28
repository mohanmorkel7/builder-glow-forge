import { pool } from "../database/connection";

export interface Client {
  id: number;
  client_name: string;
  contact_person: string;
  email: string;
  phone?: string;
  company_size?: string;
  industry?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  country?: string;
  expected_value?: number;
  priority: "low" | "medium" | "high" | "urgent";
  status: "active" | "inactive" | "onboarding" | "completed";
  sales_rep_id?: number;
  start_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  sales_rep_name?: string;
}

export interface CreateClientData {
  client_name: string;
  contact_person: string;
  email: string;
  phone?: string;
  company_size?: string;
  industry?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  country?: string;
  expected_value?: number;
  priority?: "low" | "medium" | "high" | "urgent";
  sales_rep_id?: number;
  start_date?: string;
  notes?: string;
}

export interface UpdateClientData {
  client_name?: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  company_size?: string;
  industry?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  country?: string;
  expected_value?: number;
  priority?: "low" | "medium" | "high" | "urgent";
  status?: "active" | "inactive" | "onboarding" | "completed";
  sales_rep_id?: number;
  start_date?: string;
  notes?: string;
}

export class ClientRepository {
  static async findAll(): Promise<Client[]> {
    const query = `
      SELECT c.*, 
             CONCAT(u.first_name, ' ', u.last_name) as sales_rep_name
      FROM clients c
      LEFT JOIN users u ON c.sales_rep_id = u.id
      ORDER BY c.created_at DESC
    `;
    const result = await pool.query(query);
    return result.rows;
  }

  static async findById(id: number): Promise<Client | null> {
    const query = `
      SELECT c.*, 
             CONCAT(u.first_name, ' ', u.last_name) as sales_rep_name
      FROM clients c
      LEFT JOIN users u ON c.sales_rep_id = u.id
      WHERE c.id = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }

  static async findBySalesRep(salesRepId: number): Promise<Client[]> {
    const query = `
      SELECT c.*, 
             CONCAT(u.first_name, ' ', u.last_name) as sales_rep_name
      FROM clients c
      LEFT JOIN users u ON c.sales_rep_id = u.id
      WHERE c.sales_rep_id = $1
      ORDER BY c.created_at DESC
    `;
    const result = await pool.query(query, [salesRepId]);
    return result.rows;
  }

  static async create(clientData: CreateClientData): Promise<Client> {
    const query = `
      INSERT INTO clients (client_name, contact_person, email, phone, company_size, 
                          industry, address, city, state, zip_code, country, 
                          expected_value, priority, sales_rep_id, start_date, notes)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING *
    `;

    const values = [
      clientData.client_name,
      clientData.contact_person,
      clientData.email,
      clientData.phone || null,
      clientData.company_size || null,
      clientData.industry || null,
      clientData.address || null,
      clientData.city || null,
      clientData.state || null,
      clientData.zip_code || null,
      clientData.country || null,
      clientData.expected_value || null,
      clientData.priority || "medium",
      clientData.sales_rep_id || null,
      clientData.start_date || null,
      clientData.notes || null,
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async update(
    id: number,
    clientData: UpdateClientData,
  ): Promise<Client | null> {
    const setClause = [];
    const values = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(clientData)) {
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
      UPDATE clients 
      SET ${setClause.join(", ")}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await pool.query(query, values);
    return result.rows[0] || null;
  }

  static async delete(id: number): Promise<boolean> {
    const query = "DELETE FROM clients WHERE id = $1";
    const result = await pool.query(query, [id]);
    return result.rowCount > 0;
  }

  static async getStats(): Promise<{
    total: number;
    active: number;
    onboarding: number;
    completed: number;
  }> {
    const query = `
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active,
        COUNT(CASE WHEN status = 'onboarding' THEN 1 END) as onboarding,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed
      FROM clients
    `;
    const result = await pool.query(query);
    return result.rows[0];
  }
}
