import path from "path";
import { fileURLToPath } from "url";
import "dotenv/config";
import express, { Router } from "express";
import cors from "cors";
import { Pool } from "pg";
import bcrypt from "bcryptjs";
const pool = new Pool({
  user: process.env.PG_USER || "crmuser",
  host: process.env.PG_HOST || "10.30.11.95",
  database: process.env.PG_DB || "crm",
  password: process.env.PG_PASSWORD || "myl@p@y-crm$102019",
  port: Number(process.env.PG_PORT) || 2019,
  ssl: false
  // Change to { rejectUnauthorized: false } if required in production
});
async function initializeDatabase() {
  try {
    const client = await pool.connect();
    console.log("Database initialized successfully");
    client.release();
  } catch (error) {
    console.error("Database initialization error:", error);
    console.log("Continuing without database connection...");
  }
}
const handleDemo = (req, res) => {
  const response = {
    message: "Hello from Express server"
  };
  res.status(200).json(response);
};
class UserRepository {
  static async findAll() {
    const query = `
      SELECT id, first_name, last_name, email, phone, role, department, 
             manager_id, status, start_date, last_login, two_factor_enabled, 
             notes, created_at, updated_at
      FROM users 
      ORDER BY created_at DESC
    `;
    const result = await pool.query(query);
    return result.rows;
  }
  static async findById(id) {
    const query = `
      SELECT id, first_name, last_name, email, phone, role, department, 
             manager_id, status, start_date, last_login, two_factor_enabled, 
             notes, created_at, updated_at
      FROM users 
      WHERE id = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }
  static async findByEmail(email) {
    const query = `
      SELECT id, first_name, last_name, email, phone, role, department, 
             manager_id, status, start_date, last_login, two_factor_enabled, 
             notes, created_at, updated_at, password_hash
      FROM users 
      WHERE email = $1
    `;
    const result = await pool.query(query, [email]);
    return result.rows[0] || null;
  }
  static async create(userData) {
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
      userData.notes || null
    ];
    const result = await pool.query(query, values);
    return result.rows[0];
  }
  static async update(id, userData) {
    const setClause = [];
    const values = [];
    let paramIndex = 1;
    for (const [key, value] of Object.entries(userData)) {
      if (value !== void 0) {
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
      UPDATE users 
      SET ${setClause.join(", ")}
      WHERE id = $${paramIndex}
      RETURNING id, first_name, last_name, email, phone, role, department, 
                manager_id, status, start_date, last_login, two_factor_enabled, 
                notes, created_at, updated_at
    `;
    const result = await pool.query(query, values);
    return result.rows[0] || null;
  }
  static async delete(id) {
    const query = "DELETE FROM users WHERE id = $1";
    const result = await pool.query(query, [id]);
    return result.rowCount > 0;
  }
  static async updateLastLogin(id) {
    const query = "UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1";
    await pool.query(query, [id]);
  }
  static async verifyPassword(email, password) {
    const user = await this.findByEmail(email);
    if (!user || !user.password_hash) {
      return null;
    }
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return null;
    }
    const { password_hash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}
const mockUsers = [
  {
    id: 1,
    first_name: "John",
    last_name: "Doe",
    email: "admin@banani.com",
    phone: "+1 (555) 123-4567",
    password_hash: "$2b$10$rOyZUjbEf8Z8gzLl5wF9YeS7YbZzI.sVGzJxJ8MG8KnYxRgQ8nO0y",
    // 'password'
    role: "admin",
    department: "Administration",
    manager_id: null,
    status: "active",
    start_date: "2023-01-10",
    last_login: "2024-01-15T10:30:00Z",
    two_factor_enabled: false,
    notes: "System administrator",
    created_at: "2023-01-10T09:00:00Z",
    updated_at: "2024-01-15T10:30:00Z"
  },
  {
    id: 2,
    first_name: "Jane",
    last_name: "Smith",
    email: "sales@banani.com",
    phone: "+1 (555) 234-5678",
    password_hash: "$2b$10$rOyZUjbEf8Z8gzLl5wF9YeS7YbZzI.sVGzJxJ8MG8KnYxRgQ8nO0y",
    // 'password'
    role: "sales",
    department: "Sales & Marketing",
    manager_id: 1,
    status: "active",
    start_date: "2023-02-15",
    last_login: "2024-01-14T14:20:00Z",
    two_factor_enabled: true,
    notes: "Senior sales representative",
    created_at: "2023-02-15T09:00:00Z",
    updated_at: "2024-01-14T14:20:00Z"
  },
  {
    id: 3,
    first_name: "Mike",
    last_name: "Johnson",
    email: "product@banani.com",
    phone: "+1 (555) 345-6789",
    password_hash: "$2b$10$rOyZUjbEf8Z8gzLl5wF9YeS7YbZzI.sVGzJxJ8MG8KnYxRgQ8nO0y",
    // 'password'
    role: "product",
    department: "Product Development",
    manager_id: 1,
    status: "active",
    start_date: "2023-03-20",
    last_login: "2024-01-13T16:45:00Z",
    two_factor_enabled: false,
    notes: "Lead product manager",
    created_at: "2023-03-20T09:00:00Z",
    updated_at: "2024-01-13T16:45:00Z"
  },
  {
    id: 4,
    first_name: "Sarah",
    last_name: "Wilson",
    email: "sarah@banani.com",
    phone: "+1 (555) 456-7890",
    password_hash: "$2b$10$rOyZUjbEf8Z8gzLl5wF9YeS7YbZzI.sVGzJxJ8MG8KnYxRgQ8nO0y",
    // 'password'
    role: "sales",
    department: "Sales & Marketing",
    manager_id: 2,
    status: "inactive",
    start_date: "2023-04-01",
    last_login: "2023-12-20T12:00:00Z",
    two_factor_enabled: false,
    notes: "On temporary leave",
    created_at: "2023-04-01T09:00:00Z",
    updated_at: "2023-12-20T12:00:00Z"
  },
  {
    id: 5,
    first_name: "Tom",
    last_name: "Brown",
    email: "tom@banani.com",
    phone: "+1 (555) 567-8901",
    password_hash: "$2b$10$rOyZUjbEf8Z8gzLl5wF9YeS7YbZzI.sVGzJxJ8MG8KnYxRgQ8nO0y",
    // 'password'
    role: "product",
    department: "Product Development",
    manager_id: 3,
    status: "pending",
    start_date: "2024-01-10",
    last_login: null,
    two_factor_enabled: false,
    notes: "New hire - pending setup",
    created_at: "2024-01-10T09:00:00Z",
    updated_at: "2024-01-10T09:00:00Z"
  }
];
const mockClients = [
  {
    id: 1,
    client_name: "Acme Corp",
    contact_person: "Jane Doe",
    email: "jane@acme.com",
    phone: "+1 (555) 123-4567",
    company_size: "large",
    industry: "technology",
    address: "123 Business Ave",
    city: "New York",
    state: "NY",
    zip_code: "10001",
    country: "us",
    expected_value: 5e4,
    priority: "high",
    status: "active",
    sales_rep_id: 2,
    start_date: "2023-10-26",
    notes: "Important enterprise client",
    created_at: "2023-10-26T09:00:00Z",
    updated_at: "2024-01-15T10:30:00Z",
    sales_rep_name: "Jane Smith"
  },
  {
    id: 2,
    client_name: "Globex Inc.",
    contact_person: "Bob Wilson",
    email: "bob@globex.com",
    phone: "+1 (555) 234-5678",
    company_size: "medium",
    industry: "finance",
    address: "456 Corporate Blvd",
    city: "Chicago",
    state: "IL",
    zip_code: "60601",
    country: "us",
    expected_value: 25e3,
    priority: "medium",
    status: "onboarding",
    sales_rep_id: 2,
    start_date: "2023-10-20",
    notes: "In onboarding process",
    created_at: "2023-10-20T09:00:00Z",
    updated_at: "2024-01-14T14:20:00Z",
    sales_rep_name: "Jane Smith"
  },
  {
    id: 3,
    client_name: "Soylent Corp",
    contact_person: "Alice Green",
    email: "alice@soylent.com",
    phone: "+1 (555) 345-6789",
    company_size: "small",
    industry: "manufacturing",
    address: "789 Industrial Way",
    city: "Detroit",
    state: "MI",
    zip_code: "48201",
    country: "us",
    expected_value: 15e3,
    priority: "low",
    status: "completed",
    sales_rep_id: 2,
    start_date: "2023-09-15",
    notes: "Successfully onboarded",
    created_at: "2023-09-15T09:00:00Z",
    updated_at: "2023-11-01T16:00:00Z",
    sales_rep_name: "Jane Smith"
  },
  {
    id: 4,
    client_name: "Initech",
    contact_person: "Peter Gibbons",
    email: "peter@initech.com",
    phone: "+1 (555) 456-7890",
    company_size: "medium",
    industry: "technology",
    address: "321 Office Park Dr",
    city: "Austin",
    state: "TX",
    zip_code: "73301",
    country: "us",
    expected_value: 35e3,
    priority: "high",
    status: "active",
    sales_rep_id: 2,
    start_date: "2023-10-25",
    notes: "Rapid growth potential",
    created_at: "2023-10-25T09:00:00Z",
    updated_at: "2024-01-13T11:15:00Z",
    sales_rep_name: "Jane Smith"
  }
];
const mockTemplates = [
  {
    id: 1,
    name: "Standard Client Onboarding",
    description: "A comprehensive template for standard client onboarding, covering initial contact to final setup.",
    type: "standard",
    is_active: true,
    created_by: 1,
    created_at: "2023-01-15T09:00:00Z",
    updated_at: "2023-01-15T09:00:00Z",
    step_count: 5,
    creator_name: "John Doe",
    steps: [
      {
        id: 1,
        template_id: 1,
        step_order: 1,
        name: "Initial Contact",
        description: "Reach out to the client to introduce the onboarding process.",
        default_eta_days: 2,
        auto_alert: true,
        email_reminder: true,
        created_at: "2023-01-15T09:00:00Z"
      },
      {
        id: 2,
        template_id: 1,
        step_order: 2,
        name: "Document Collection",
        description: "Gather all necessary legal and financial documents from the client.",
        default_eta_days: 5,
        auto_alert: true,
        email_reminder: true,
        created_at: "2023-01-15T09:00:00Z"
      },
      {
        id: 3,
        template_id: 1,
        step_order: 3,
        name: "Contract Signing",
        description: "Review and execute service agreements.",
        default_eta_days: 3,
        auto_alert: true,
        email_reminder: false,
        created_at: "2023-01-15T09:00:00Z"
      },
      {
        id: 4,
        template_id: 1,
        step_order: 4,
        name: "Account Setup",
        description: "Create client accounts and configure initial settings.",
        default_eta_days: 2,
        auto_alert: false,
        email_reminder: true,
        created_at: "2023-01-15T09:00:00Z"
      },
      {
        id: 5,
        template_id: 1,
        step_order: 5,
        name: "Training Session",
        description: "Conduct onboarding training and knowledge transfer.",
        default_eta_days: 7,
        auto_alert: false,
        email_reminder: true,
        created_at: "2023-01-15T09:00:00Z"
      }
    ]
  },
  {
    id: 2,
    name: "Enterprise Client Onboarding",
    description: "Tailored onboarding process for large enterprise clients with complex integration requirements.",
    type: "enterprise",
    is_active: true,
    created_by: 1,
    created_at: "2023-01-15T09:00:00Z",
    updated_at: "2023-01-15T09:00:00Z",
    step_count: 8,
    creator_name: "John Doe"
  },
  {
    id: 3,
    name: "SMB Onboarding Lite",
    description: "A streamlined onboarding template for small to medium businesses with essential steps.",
    type: "smb",
    is_active: true,
    created_by: 1,
    created_at: "2023-01-15T09:00:00Z",
    updated_at: "2023-01-15T09:00:00Z",
    step_count: 3,
    creator_name: "John Doe"
  }
];
const mockDeployments = [
  {
    id: 1,
    product_id: 1,
    version: "v2.1.0",
    environment: "production",
    status: "completed",
    description: "Major release with new features",
    assigned_to: 3,
    scheduled_date: "2024-07-18T10:00:00Z",
    started_at: "2024-07-18T10:00:00Z",
    completed_at: "2024-07-18T11:30:00Z",
    auto_rollback: true,
    run_tests: true,
    notify_team: true,
    require_approval: true,
    release_notes: "Added new dashboard features and performance improvements",
    created_by: 3,
    created_at: "2024-07-15T09:00:00Z",
    updated_at: "2024-07-18T11:30:00Z",
    product_name: "Core App",
    assigned_to_name: "Mike Johnson",
    created_by_name: "Mike Johnson"
  },
  {
    id: 2,
    product_id: 2,
    version: "v1.5.2",
    environment: "production",
    status: "failed",
    description: "Analytics module update",
    assigned_to: 3,
    scheduled_date: "2024-07-17T14:00:00Z",
    started_at: "2024-07-17T14:00:00Z",
    completed_at: "2024-07-17T14:45:00Z",
    auto_rollback: true,
    run_tests: true,
    notify_team: true,
    require_approval: false,
    release_notes: "Bug fixes and minor improvements",
    created_by: 3,
    created_at: "2024-07-16T09:00:00Z",
    updated_at: "2024-07-17T14:45:00Z",
    product_name: "Analytics Module",
    assigned_to_name: "Mike Johnson",
    created_by_name: "Mike Johnson"
  },
  {
    id: 3,
    product_id: 3,
    version: "v3.0.1",
    environment: "production",
    status: "completed",
    description: "API Gateway security patch",
    assigned_to: 3,
    scheduled_date: "2024-07-16T09:00:00Z",
    started_at: "2024-07-16T09:00:00Z",
    completed_at: "2024-07-16T09:30:00Z",
    auto_rollback: true,
    run_tests: true,
    notify_team: true,
    require_approval: true,
    release_notes: "Security updates and bug fixes",
    created_by: 3,
    created_at: "2024-07-15T16:00:00Z",
    updated_at: "2024-07-16T09:30:00Z",
    product_name: "API Gateway",
    assigned_to_name: "Mike Johnson",
    created_by_name: "Mike Johnson"
  },
  {
    id: 4,
    product_id: 4,
    version: "v1.2.3",
    environment: "staging",
    status: "pending",
    description: "Mobile app feature update",
    assigned_to: 3,
    scheduled_date: "2024-07-20T10:00:00Z",
    started_at: null,
    completed_at: null,
    auto_rollback: true,
    run_tests: true,
    notify_team: true,
    require_approval: false,
    release_notes: "New user interface improvements",
    created_by: 3,
    created_at: "2024-07-15T10:00:00Z",
    updated_at: "2024-07-15T10:00:00Z",
    product_name: "Mobile App",
    assigned_to_name: "Mike Johnson",
    created_by_name: "Mike Johnson"
  }
];
const mockProducts = [
  {
    id: 1,
    name: "Core App",
    description: "Main application platform",
    current_version: "v2.0.9",
    repository_url: "https://github.com/company/core-app",
    is_active: true,
    created_at: "2023-01-01T00:00:00Z",
    updated_at: "2024-07-18T11:30:00Z"
  },
  {
    id: 2,
    name: "Analytics Module",
    description: "Data analytics and reporting",
    current_version: "v1.5.1",
    repository_url: "https://github.com/company/analytics",
    is_active: true,
    created_at: "2023-01-01T00:00:00Z",
    updated_at: "2024-07-17T14:45:00Z"
  },
  {
    id: 3,
    name: "API Gateway",
    description: "API management and routing",
    current_version: "v3.0.0",
    repository_url: "https://github.com/company/api-gateway",
    is_active: true,
    created_at: "2023-01-01T00:00:00Z",
    updated_at: "2024-07-16T09:30:00Z"
  },
  {
    id: 4,
    name: "Mobile App",
    description: "Mobile application",
    current_version: "v1.2.2",
    repository_url: "https://github.com/company/mobile-app",
    is_active: true,
    created_at: "2023-01-01T00:00:00Z",
    updated_at: "2024-07-15T10:00:00Z"
  },
  {
    id: 5,
    name: "Reporting Service",
    description: "Report generation service",
    current_version: "v0.8.9",
    repository_url: "https://github.com/company/reporting",
    is_active: true,
    created_at: "2023-01-01T00:00:00Z",
    updated_at: "2024-07-14T16:00:00Z"
  }
];
class MockDataService {
  static users = [...mockUsers];
  static clients = [...mockClients];
  static templates = [...mockTemplates];
  static deployments = [...mockDeployments];
  static nextUserId = 6;
  static nextClientId = 5;
  static nextTemplateId = 4;
  static nextDeploymentId = 5;
  // User operations
  static async findUserByEmail(email) {
    return this.users.find((user) => user.email === email) || null;
  }
  static async verifyPassword(email, password) {
    const user = await this.findUserByEmail(email);
    if (!user) return null;
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) return null;
    const { password_hash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
  static async getAllUsers() {
    return this.users.map(({ password_hash, ...user }) => user);
  }
  static async createUser(userData) {
    const passwordHash = await bcrypt.hash(userData.password, 10);
    const newUser = {
      id: this.nextUserId++,
      first_name: userData.first_name,
      last_name: userData.last_name,
      email: userData.email,
      phone: userData.phone || null,
      password_hash: passwordHash,
      role: userData.role,
      department: userData.department || null,
      manager_id: userData.manager_id || null,
      status: "active",
      start_date: userData.start_date || null,
      last_login: null,
      two_factor_enabled: userData.two_factor_enabled || false,
      notes: userData.notes || null,
      created_at: (/* @__PURE__ */ new Date()).toISOString(),
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    };
    this.users.push(newUser);
    const { password_hash, ...userWithoutPassword } = newUser;
    return userWithoutPassword;
  }
  static async updateUser(id, userData) {
    const index = this.users.findIndex((user) => user.id === id);
    if (index === -1) return null;
    this.users[index] = {
      ...this.users[index],
      ...userData,
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    };
    const { password_hash, ...userWithoutPassword } = this.users[index];
    return userWithoutPassword;
  }
  static async deleteUser(id) {
    const index = this.users.findIndex((user) => user.id === id);
    if (index === -1) return false;
    this.users.splice(index, 1);
    return true;
  }
  // Client operations
  static async getAllClients() {
    return this.clients;
  }
  static async createClient(clientData) {
    const newClient = {
      id: this.nextClientId++,
      ...clientData,
      created_at: (/* @__PURE__ */ new Date()).toISOString(),
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    };
    this.clients.push(newClient);
    return newClient;
  }
  static async updateClient(id, clientData) {
    const index = this.clients.findIndex((client) => client.id === id);
    if (index === -1) return null;
    this.clients[index] = {
      ...this.clients[index],
      ...clientData,
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    };
    return this.clients[index];
  }
  static async deleteClient(id) {
    const index = this.clients.findIndex((client) => client.id === id);
    if (index === -1) return false;
    this.clients.splice(index, 1);
    return true;
  }
  // Template operations
  static async getAllTemplates() {
    return this.templates;
  }
  static async createTemplate(templateData) {
    const newTemplate = {
      id: this.nextTemplateId++,
      ...templateData,
      created_at: (/* @__PURE__ */ new Date()).toISOString(),
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    };
    this.templates.push(newTemplate);
    return newTemplate;
  }
  // Deployment operations
  static async getAllDeployments() {
    return this.deployments;
  }
  static async createDeployment(deploymentData) {
    const product = mockProducts.find(
      (p) => p.id === deploymentData.product_id
    );
    const newDeployment = {
      id: this.nextDeploymentId++,
      ...deploymentData,
      product_name: product?.name || "Unknown Product",
      assigned_to_name: "Mike Johnson",
      created_by_name: "Mike Johnson",
      created_at: (/* @__PURE__ */ new Date()).toISOString(),
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    };
    this.deployments.push(newDeployment);
    return newDeployment;
  }
  // Products
  static async getAllProducts() {
    return mockProducts;
  }
  // Stats
  static async getClientStats() {
    return {
      total: this.clients.length,
      active: this.clients.filter((c) => c.status === "active").length,
      onboarding: this.clients.filter((c) => c.status === "onboarding").length,
      completed: this.clients.filter((c) => c.status === "completed").length
    };
  }
  static async getDeploymentStats() {
    return {
      total: this.deployments.length,
      completed: this.deployments.filter((d) => d.status === "completed").length,
      failed: this.deployments.filter((d) => d.status === "failed").length,
      pending: this.deployments.filter((d) => d.status === "pending").length
    };
  }
}
const router$3 = Router();
async function isDatabaseAvailable$3() {
  try {
    await UserRepository.findAll();
    return true;
  } catch (error) {
    return false;
  }
}
router$3.get("/", async (req, res) => {
  try {
    if (await isDatabaseAvailable$3()) {
      const users = await UserRepository.findAll();
      res.json(users);
    } else {
      const users = await MockDataService.getAllUsers();
      res.json(users);
    }
  } catch (error) {
    console.error("Error fetching users:", error);
    const users = await MockDataService.getAllUsers();
    res.json(users);
  }
});
router$3.get("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }
    let user;
    if (await isDatabaseAvailable$3()) {
      user = await UserRepository.findById(id);
    } else {
      const users = await MockDataService.getAllUsers();
      user = users.find((u) => u.id === id);
    }
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    try {
      const users = await MockDataService.getAllUsers();
      const user = users.find((u) => u.id === id);
      if (user) {
        res.json(user);
      } else {
        res.status(404).json({ error: "User not found" });
      }
    } catch (fallbackError) {
      res.status(500).json({ error: "Failed to fetch user" });
    }
  }
});
router$3.post("/", async (req, res) => {
  try {
    const userData = req.body;
    if (!userData.first_name || !userData.last_name || !userData.email || !userData.password || !userData.role) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    if (!["admin", "sales", "product"].includes(userData.role)) {
      return res.status(400).json({ error: "Invalid role" });
    }
    let user;
    if (await isDatabaseAvailable$3()) {
      const existingUser = await UserRepository.findByEmail(userData.email);
      if (existingUser) {
        return res.status(409).json({ error: "Email already exists" });
      }
      user = await UserRepository.create(userData);
    } else {
      const existingUser = await MockDataService.findUserByEmail(
        userData.email
      );
      if (existingUser) {
        return res.status(409).json({ error: "Email already exists" });
      }
      user = await MockDataService.createUser(userData);
    }
    res.status(201).json(user);
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ error: "Failed to create user" });
  }
});
router$3.put("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }
    const userData = req.body;
    if (userData.role && !["admin", "sales", "product"].includes(userData.role)) {
      return res.status(400).json({ error: "Invalid role" });
    }
    if (userData.status && !["active", "inactive", "pending"].includes(userData.status)) {
      return res.status(400).json({ error: "Invalid status" });
    }
    if (userData.email) {
      const existingUser = await UserRepository.findByEmail(userData.email);
      if (existingUser && existingUser.id !== id) {
        return res.status(409).json({ error: "Email already exists" });
      }
    }
    const user = await UserRepository.update(id, userData);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(user);
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ error: "Failed to update user" });
  }
});
router$3.delete("/:id", async (req, res) => {
  try {
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
    res.status(500).json({ error: "Failed to delete user" });
  }
});
router$3.post("/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }
    console.log("checking user.....");
    let user;
    if (await isDatabaseAvailable$3()) {
      user = await UserRepository.verifyPassword(email, password);
      console.log("checking user details : ", user);
      if (user) {
        await UserRepository.updateLastLogin(user.id);
      }
    } else {
      user = await MockDataService.verifyPassword(email, password);
    }
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    res.json({ user });
  } catch (error) {
    console.error("Error during login:", error);
    try {
      const user = await MockDataService.verifyPassword(
        req.body.email,
        req.body.password
      );
      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      res.json({ user });
    } catch (fallbackError) {
      res.status(500).json({ error: "Login failed" });
    }
  }
});
class ClientRepository {
  static async findAll() {
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
  static async findById(id) {
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
  static async findBySalesRep(salesRepId) {
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
  static async create(clientData) {
    const query = `
      INSERT INTO clients (client_name, contact_person, email, phone, company_size, 
                          industry, address, city, state, zip_code, country, 
                          expected_value, priority, sales_rep_id, start_date, notes)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING *
    `;
    const values = [
      clientData.clientName,
      clientData.contactPerson,
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
      clientData.notes || null
    ];
    const result = await pool.query(query, values);
    return result.rows[0];
  }
  static async update(id, clientData) {
    const setClause = [];
    const values = [];
    let paramIndex = 1;
    for (const [key, value] of Object.entries(clientData)) {
      if (value !== void 0) {
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
  static async delete(id) {
    const query = "DELETE FROM clients WHERE id = $1";
    const result = await pool.query(query, [id]);
    return result.rowCount > 0;
  }
  static async getStats() {
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
const router$2 = Router();
async function isDatabaseAvailable$2() {
  try {
    await ClientRepository.findAll();
    return true;
  } catch (error) {
    return false;
  }
}
router$2.get("/", async (req, res) => {
  try {
    const { salesRep } = req.query;
    let clients;
    if (await isDatabaseAvailable$2()) {
      if (salesRep) {
        const salesRepId = parseInt(salesRep);
        if (isNaN(salesRepId)) {
          return res.status(400).json({ error: "Invalid sales rep ID" });
        }
        clients = await ClientRepository.findBySalesRep(salesRepId);
      } else {
        clients = await ClientRepository.findAll();
      }
    } else {
      clients = await MockDataService.getAllClients();
      if (salesRep) {
        const salesRepId = parseInt(salesRep);
        clients = clients.filter(
          (client) => client.sales_rep_id === salesRepId
        );
      }
    }
    res.json(clients);
  } catch (error) {
    console.error("Error fetching clients:", error);
    const clients = await MockDataService.getAllClients();
    res.json(clients);
  }
});
router$2.get("/stats", async (req, res) => {
  try {
    let stats;
    if (await isDatabaseAvailable$2()) {
      stats = await ClientRepository.getStats();
    } else {
      stats = await MockDataService.getClientStats();
    }
    res.json(stats);
  } catch (error) {
    console.error("Error fetching client stats:", error);
    const stats = await MockDataService.getClientStats();
    res.json(stats);
  }
});
router$2.get("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid client ID" });
    }
    let client;
    if (await isDatabaseAvailable$2()) {
      client = await ClientRepository.findById(id);
    } else {
      const clients = await MockDataService.getAllClients();
      client = clients.find((c) => c.id === id);
    }
    if (!client) {
      return res.status(404).json({ error: "Client not found" });
    }
    res.json(client);
  } catch (error) {
    console.error("Error fetching client:", error);
    try {
      const clients = await MockDataService.getAllClients();
      const client = clients.find((c) => c.id === id);
      if (client) {
        res.json(client);
      } else {
        res.status(404).json({ error: "Client not found" });
      }
    } catch (fallbackError) {
      res.status(500).json({ error: "Failed to fetch client" });
    }
  }
});
router$2.post("/", async (req, res) => {
  try {
    const clientData = req.body;
    if (!clientData.clientName || !clientData.contactPerson || !clientData.email) {
      return res.status(400).json({
        error: "Missing required fields: client_name, contact_person, email"
      });
    }
    if (clientData.priority && !["low", "medium", "high", "urgent"].includes(clientData.priority)) {
      return res.status(400).json({ error: "Invalid priority value" });
    }
    const client = await ClientRepository.create(clientData);
    res.status(201).json(client);
  } catch (error) {
    console.error("Error creating client:", error);
    res.status(500).json({ error: "Failed to create client" });
  }
});
router$2.put("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid client ID" });
    }
    const clientData = req.body;
    if (clientData.priority && !["low", "medium", "high", "urgent"].includes(clientData.priority)) {
      return res.status(400).json({ error: "Invalid priority value" });
    }
    if (clientData.status && !["active", "inactive", "onboarding", "completed"].includes(
      clientData.status
    )) {
      return res.status(400).json({ error: "Invalid status value" });
    }
    const client = await ClientRepository.update(id, clientData);
    if (!client) {
      return res.status(404).json({ error: "Client not found" });
    }
    res.json(client);
  } catch (error) {
    console.error("Error updating client:", error);
    res.status(500).json({ error: "Failed to update client" });
  }
});
router$2.delete("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid client ID" });
    }
    const success = await ClientRepository.delete(id);
    if (!success) {
      return res.status(404).json({ error: "Client not found" });
    }
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting client:", error);
    res.status(500).json({ error: "Failed to delete client" });
  }
});
class TemplateRepository {
  static async findAll() {
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
  static async findById(id) {
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
  static async create(templateData) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const templateQuery = `
        INSERT INTO onboarding_templates (name, description, type, created_by)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `;
      const templateValues = [
        templateData.name,
        templateData.description || null,
        templateData.type || "standard",
        templateData.created_by
      ];
      const templateResult = await client.query(templateQuery, templateValues);
      const template = templateResult.rows[0];
      if (templateData.steps && templateData.steps.length > 0) {
        const stepQueries = templateData.steps.map((step, index) => {
          return client.query(
            `
            INSERT INTO template_steps (template_id, step_order, name, description, 
                                      default_eta_days, auto_alert, email_reminder)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *
          `,
            [
              template.id,
              step.step_order || index + 1,
              step.name,
              step.description || null,
              step.default_eta_days,
              step.auto_alert,
              step.email_reminder
            ]
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
  static async update(id, templateData) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const setClause = [];
      const values = [];
      let paramIndex = 1;
      for (const [key, value] of Object.entries(templateData)) {
        if (key !== "steps" && value !== void 0) {
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
      if (templateData.steps) {
        await client.query(
          "DELETE FROM template_steps WHERE template_id = $1",
          [id]
        );
        if (templateData.steps.length > 0) {
          const stepQueries = templateData.steps.map((step, index) => {
            return client.query(
              `
              INSERT INTO template_steps (template_id, step_order, name, description, 
                                        default_eta_days, auto_alert, email_reminder)
              VALUES ($1, $2, $3, $4, $5, $6, $7)
            `,
              [
                id,
                step.step_order || index + 1,
                step.name,
                step.description || null,
                step.default_eta_days,
                step.auto_alert,
                step.email_reminder
              ]
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
  static async delete(id) {
    const query = "UPDATE onboarding_templates SET is_active = false WHERE id = $1";
    const result = await pool.query(query, [id]);
    return result.rowCount > 0;
  }
  static async duplicate(id, createdBy) {
    const originalTemplate = await this.findById(id);
    if (!originalTemplate) {
      return null;
    }
    const duplicateData = {
      name: `${originalTemplate.name} (Copy)`,
      description: originalTemplate.description,
      type: originalTemplate.type,
      created_by: createdBy,
      steps: originalTemplate.steps?.map((step) => ({
        step_order: step.step_order,
        name: step.name,
        description: step.description,
        default_eta_days: step.default_eta_days,
        auto_alert: step.auto_alert,
        email_reminder: step.email_reminder
      })) || []
    };
    return this.create(duplicateData);
  }
}
const router$1 = Router();
async function isDatabaseAvailable$1() {
  try {
    await TemplateRepository.findAll();
    return true;
  } catch (error) {
    return false;
  }
}
router$1.get("/", async (req, res) => {
  try {
    let templates;
    if (await isDatabaseAvailable$1()) {
      templates = await TemplateRepository.findAll();
    } else {
      templates = await MockDataService.getAllTemplates();
    }
    res.json(templates);
  } catch (error) {
    console.error("Error fetching templates:", error);
    const templates = await MockDataService.getAllTemplates();
    res.json(templates);
  }
});
router$1.get("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid template ID" });
    }
    const template = await TemplateRepository.findById(id);
    if (!template) {
      return res.status(404).json({ error: "Template not found" });
    }
    res.json(template);
  } catch (error) {
    console.error("Error fetching template:", error);
    res.status(500).json({ error: "Failed to fetch template" });
  }
});
router$1.post("/", async (req, res) => {
  try {
    const templateData = req.body;
    if (!templateData.name || !templateData.created_by) {
      return res.status(400).json({ error: "Missing required fields: name, created_by" });
    }
    if (templateData.type && !["standard", "enterprise", "smb"].includes(templateData.type)) {
      return res.status(400).json({ error: "Invalid template type" });
    }
    if (!templateData.steps || templateData.steps.length === 0) {
      return res.status(400).json({ error: "Template must have at least one step" });
    }
    for (const step of templateData.steps) {
      if (!step.name || step.default_eta_days < 1) {
        return res.status(400).json({ error: "Each step must have a name and valid ETA days" });
      }
    }
    const template = await TemplateRepository.create(templateData);
    res.status(201).json(template);
  } catch (error) {
    console.error("Error creating template:", error);
    res.status(500).json({ error: "Failed to create template" });
  }
});
router$1.put("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid template ID" });
    }
    const templateData = req.body;
    if (templateData.type && !["standard", "enterprise", "smb"].includes(templateData.type)) {
      return res.status(400).json({ error: "Invalid template type" });
    }
    if (templateData.steps) {
      if (templateData.steps.length === 0) {
        return res.status(400).json({ error: "Template must have at least one step" });
      }
      for (const step of templateData.steps) {
        if (!step.name || step.default_eta_days < 1) {
          return res.status(400).json({ error: "Each step must have a name and valid ETA days" });
        }
      }
    }
    const template = await TemplateRepository.update(id, templateData);
    if (!template) {
      return res.status(404).json({ error: "Template not found" });
    }
    res.json(template);
  } catch (error) {
    console.error("Error updating template:", error);
    res.status(500).json({ error: "Failed to update template" });
  }
});
router$1.delete("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid template ID" });
    }
    const success = await TemplateRepository.delete(id);
    if (!success) {
      return res.status(404).json({ error: "Template not found" });
    }
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting template:", error);
    res.status(500).json({ error: "Failed to delete template" });
  }
});
router$1.post("/:id/duplicate", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid template ID" });
    }
    const { created_by } = req.body;
    if (!created_by) {
      return res.status(400).json({ error: "Missing created_by field" });
    }
    const duplicatedTemplate = await TemplateRepository.duplicate(
      id,
      created_by
    );
    if (!duplicatedTemplate) {
      return res.status(404).json({ error: "Template not found" });
    }
    res.status(201).json(duplicatedTemplate);
  } catch (error) {
    console.error("Error duplicating template:", error);
    res.status(500).json({ error: "Failed to duplicate template" });
  }
});
class DeploymentRepository {
  static async findAll() {
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
  static async findById(id) {
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
  static async findByAssignee(assigneeId) {
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
  static async create(deploymentData) {
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
      deploymentData.created_by
    ];
    const result = await pool.query(query, values);
    return result.rows[0];
  }
  static async update(id, deploymentData) {
    const setClause = [];
    const values = [];
    let paramIndex = 1;
    for (const [key, value] of Object.entries(deploymentData)) {
      if (value !== void 0) {
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
  static async delete(id) {
    const query = "DELETE FROM deployments WHERE id = $1";
    const result = await pool.query(query, [id]);
    return result.rowCount > 0;
  }
  static async updateStatus(id, status) {
    const updateData = { status };
    if (status === "in_progress") {
      updateData.started_at = (/* @__PURE__ */ new Date()).toISOString();
    } else if (status === "completed" || status === "failed") {
      updateData.completed_at = (/* @__PURE__ */ new Date()).toISOString();
    }
    return this.update(id, updateData);
  }
  static async getStats() {
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
class ProductRepository {
  static async findAll() {
    const query = "SELECT * FROM products WHERE is_active = true ORDER BY name ASC";
    const result = await pool.query(query);
    return result.rows;
  }
  static async findById(id) {
    const query = "SELECT * FROM products WHERE id = $1";
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }
}
const router = Router();
async function isDatabaseAvailable() {
  try {
    await DeploymentRepository.findAll();
    return true;
  } catch (error) {
    return false;
  }
}
router.get("/", async (req, res) => {
  try {
    const { assignee } = req.query;
    let deployments;
    if (await isDatabaseAvailable()) {
      if (assignee) {
        const assigneeId = parseInt(assignee);
        if (isNaN(assigneeId)) {
          return res.status(400).json({ error: "Invalid assignee ID" });
        }
        deployments = await DeploymentRepository.findByAssignee(assigneeId);
      } else {
        deployments = await DeploymentRepository.findAll();
      }
    } else {
      deployments = await MockDataService.getAllDeployments();
      if (assignee) {
        const assigneeId = parseInt(assignee);
        deployments = deployments.filter((d) => d.assigned_to === assigneeId);
      }
    }
    res.json(deployments);
  } catch (error) {
    console.error("Error fetching deployments:", error);
    const deployments = await MockDataService.getAllDeployments();
    res.json(deployments);
  }
});
router.get("/stats", async (req, res) => {
  try {
    let stats;
    if (await isDatabaseAvailable()) {
      stats = await DeploymentRepository.getStats();
    } else {
      stats = await MockDataService.getDeploymentStats();
    }
    res.json(stats);
  } catch (error) {
    console.error("Error fetching deployment stats:", error);
    try {
      const stats = await MockDataService.getDeploymentStats();
      res.json(stats);
    } catch (fallbackError) {
      res.status(500).json({ error: "Failed to fetch deployment statistics" });
    }
  }
});
router.get("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid deployment ID" });
    }
    const deployment = await DeploymentRepository.findById(id);
    if (!deployment) {
      return res.status(404).json({ error: "Deployment not found" });
    }
    res.json(deployment);
  } catch (error) {
    console.error("Error fetching deployment:", error);
    res.status(500).json({ error: "Failed to fetch deployment" });
  }
});
router.post("/", async (req, res) => {
  try {
    const deploymentData = req.body;
    if (!deploymentData.product_id || !deploymentData.version || !deploymentData.environment || !deploymentData.created_by) {
      return res.status(400).json({
        error: "Missing required fields: product_id, version, environment, created_by"
      });
    }
    if (!["development", "staging", "qa", "production"].includes(
      deploymentData.environment
    )) {
      return res.status(400).json({ error: "Invalid environment value" });
    }
    const product = await ProductRepository.findById(deploymentData.product_id);
    if (!product) {
      return res.status(400).json({ error: "Product not found" });
    }
    const deployment = await DeploymentRepository.create(deploymentData);
    res.status(201).json(deployment);
  } catch (error) {
    console.error("Error creating deployment:", error);
    res.status(500).json({ error: "Failed to create deployment" });
  }
});
router.put("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid deployment ID" });
    }
    const deploymentData = req.body;
    if (deploymentData.environment && !["development", "staging", "qa", "production"].includes(
      deploymentData.environment
    )) {
      return res.status(400).json({ error: "Invalid environment value" });
    }
    if (deploymentData.status && ![
      "pending",
      "scheduled",
      "in_progress",
      "completed",
      "failed",
      "cancelled"
    ].includes(deploymentData.status)) {
      return res.status(400).json({ error: "Invalid status value" });
    }
    const deployment = await DeploymentRepository.update(id, deploymentData);
    if (!deployment) {
      return res.status(404).json({ error: "Deployment not found" });
    }
    res.json(deployment);
  } catch (error) {
    console.error("Error updating deployment:", error);
    res.status(500).json({ error: "Failed to update deployment" });
  }
});
router.patch("/:id/status", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid deployment ID" });
    }
    const { status } = req.body;
    if (!status || ![
      "pending",
      "scheduled",
      "in_progress",
      "completed",
      "failed",
      "cancelled"
    ].includes(status)) {
      return res.status(400).json({ error: "Invalid status value" });
    }
    const deployment = await DeploymentRepository.updateStatus(id, status);
    if (!deployment) {
      return res.status(404).json({ error: "Deployment not found" });
    }
    res.json(deployment);
  } catch (error) {
    console.error("Error updating deployment status:", error);
    res.status(500).json({ error: "Failed to update deployment status" });
  }
});
router.delete("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid deployment ID" });
    }
    const success = await DeploymentRepository.delete(id);
    if (!success) {
      return res.status(404).json({ error: "Deployment not found" });
    }
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting deployment:", error);
    res.status(500).json({ error: "Failed to delete deployment" });
  }
});
router.get("/products/list", async (req, res) => {
  try {
    let products;
    if (await isDatabaseAvailable()) {
      products = await ProductRepository.findAll();
    } else {
      products = await MockDataService.getAllProducts();
    }
    res.json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    const products = await MockDataService.getAllProducts();
    res.json(products);
  }
});
function createServer() {
  const app2 = express();
  initializeDatabase().catch(console.error);
  app2.use(cors());
  app2.use(express.json());
  app2.use(express.urlencoded({ extended: true }));
  app2.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });
  app2.get("/api/demo", handleDemo);
  app2.get("/api/test", (_req, res) => {
    res.json({ message: "Server is working!" });
  });
  app2.post("/api/test-login", (req, res) => {
    const { email, password } = req.body;
    res.json({ message: "Test login endpoint working", email, password });
  });
  try {
    app2.use("/api/users", router$3);
    console.log("Users router loaded successfully");
  } catch (error) {
    console.error("Error loading users router:", error);
  }
  try {
    app2.use("/api/clients", router$2);
    console.log("Clients router loaded successfully");
  } catch (error) {
    console.error("Error loading clients router:", error);
  }
  try {
    app2.use("/api/templates", router$1);
    console.log("Templates router loaded successfully");
  } catch (error) {
    console.error("Error loading templates router:", error);
  }
  try {
    app2.use("/api/deployments", router);
    console.log("Deployments router loaded successfully");
  } catch (error) {
    console.error("Error loading deployments router:", error);
  }
  return app2;
}
const app = createServer();
const port = process.env.PORT || 5e3;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.join(__dirname, "../frontend");
app.use(express.static(distPath));
app.get("/{*splat}", (req, res) => {
  if (req.path.startsWith("/api/") || req.path.startsWith("/health")) {
    return res.status(404).json({ error: "API endpoint not found" });
  }
  res.sendFile(path.join(distPath, "index.html"));
});
app.listen(port, () => {
  console.log(`🚀 Fusion Starter server running on port ${port}`);
  console.log(`📱 Frontend: http://localhost:${port}`);
  console.log(`🔧 API: http://localhost:${port}/api`);
});
process.on("SIGTERM", () => {
  console.log("🛑 Received SIGTERM, shutting down gracefully");
  process.exit(0);
});
process.on("SIGINT", () => {
  console.log("🛑 Received SIGINT, shutting down gracefully");
  process.exit(0);
});
//# sourceMappingURL=node-build.mjs.map
