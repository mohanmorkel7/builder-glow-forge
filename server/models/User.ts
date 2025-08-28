import { pool } from "../database/connection";
import bcrypt from "bcryptjs";

export interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  role:
    | "admin"
    | "sales"
    | "product"
    | "development"
    | "db"
    | "finops"
    | "finance"
    | "hr_management"
    | "infra"
    | "switch_team"
    | "unknown";
  department?: string;
  manager_id?: number;
  status: "active" | "inactive" | "pending";
  start_date?: string;
  last_login?: string;
  two_factor_enabled: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateUserData {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  password: string;
  role:
    | "admin"
    | "sales"
    | "product"
    | "development"
    | "db"
    | "finops"
    | "finance"
    | "hr_management"
    | "infra"
    | "switch_team"
    | "unknown";
  department?: string;
  manager_id?: number;
  start_date?: string;
  two_factor_enabled?: boolean;
  notes?: string;
}

export interface UpdateUserData {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  password_hash?: string;
  role?:
    | "admin"
    | "sales"
    | "product"
    | "development"
    | "db"
    | "finops"
    | "finance"
    | "hr_management"
    | "infra"
    | "switch_team"
    | "unknown";
  department?: string;
  manager_id?: number;
  status?: "active" | "inactive" | "pending";
  start_date?: string;
  two_factor_enabled?: boolean;
  notes?: string;
}

export class UserRepository {
  static async findAll(): Promise<User[]> {
    const query = `
      SELECT id, first_name, last_name, email, phone, role, department,
             manager_id, status, start_date, last_login, two_factor_enabled,
             notes, created_at, updated_at, azure_object_id, sso_provider, job_title
      FROM users
      ORDER BY created_at DESC
    `;
    const result = await pool.query(query);
    return result.rows;
  }

  static async findById(id: number): Promise<User | null> {
    const query = `
      SELECT id, first_name, last_name, email, phone, role, department,
             manager_id, status, start_date, last_login, two_factor_enabled,
             notes, created_at, updated_at, azure_object_id, sso_provider, job_title
      FROM users
      WHERE id = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }

  static async findByIdWithPassword(
    id: number,
  ): Promise<(User & { password_hash: string }) | null> {
    const query = `
      SELECT id, first_name, last_name, email, phone, role, department,
             manager_id, status, start_date, last_login, two_factor_enabled,
             notes, created_at, updated_at, password_hash, azure_object_id, sso_provider, job_title
      FROM users
      WHERE id = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }

  static async findByEmail(email: string): Promise<User | null> {
    const query = `
      SELECT id, first_name, last_name, email, phone, role, department,
             manager_id, status, start_date, last_login, two_factor_enabled,
             notes, created_at, updated_at, password_hash, azure_object_id, sso_provider, job_title
      FROM users
      WHERE email = $1
    `;
    const result = await pool.query(query, [email]);
    return result.rows[0] || null;
  }

  static async create(userData: CreateUserData): Promise<User> {
    const passwordHash = await bcrypt.hash(userData.password, 10);

    const query = `
      INSERT INTO users (first_name, last_name, email, phone, password_hash, role, 
                        department, manager_id, start_date, two_factor_enabled, notes)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING id, first_name, last_name, email, phone, role, department, 
                manager_id, status, start_date, last_login, two_factor_enabled, 
                notes, created_at, updated_at
    `;

    const values = [
      userData.first_name,
      userData.last_name,
      userData.email,
      userData.phone || null,
      passwordHash,
      userData.role,
      userData.department || null,
      userData.manager_id || null,
      userData.start_date || null,
      userData.two_factor_enabled || false,
      userData.notes || null,
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async update(
    id: number,
    userData: UpdateUserData,
  ): Promise<User | null> {
    const setClause = [];
    const values = [];
    let paramIndex = 1;

    // Date fields that should be converted from empty string to null
    const dateFields = ["start_date"];

    for (const [key, value] of Object.entries(userData)) {
      if (value !== undefined) {
        setClause.push(`${key} = $${paramIndex}`);

        // Convert empty strings to null for date fields
        if (dateFields.includes(key) && value === "") {
          values.push(null);
        } else {
          values.push(value);
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
      UPDATE users
      SET ${setClause.join(", ")}
      WHERE id = $${paramIndex}
      RETURNING id, first_name, last_name, email, phone, role, department,
                manager_id, status, start_date, last_login, two_factor_enabled,
                notes, created_at, updated_at, azure_object_id, sso_provider, job_title
    `;

    const result = await pool.query(query, values);
    return result.rows[0] || null;
  }

  static async delete(id: number): Promise<boolean> {
    const query = "DELETE FROM users WHERE id = $1";
    const result = await pool.query(query, [id]);
    return result.rowCount > 0;
  }

  static async updateLastLogin(id: number): Promise<void> {
    const query =
      "UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1";
    await pool.query(query, [id]);
  }

  static async verifyPassword(
    email: string,
    password: string,
  ): Promise<User | null> {
    const user: any = await this.findByEmail(email);
    if (!user || !user.password_hash) {
      return null;
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return null;
    }

    // Remove password_hash from returned user
    const { password_hash, ...userWithoutPassword } = user;
    return userWithoutPassword as User;
  }
}
