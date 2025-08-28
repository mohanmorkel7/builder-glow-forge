import { pool } from "../database/connection";
import { RowDataPacket, ResultSetHeader } from "mysql2";

// Type definitions for FinOps entities
export interface FinOpsAccount {
  id: number;
  account_code: string;
  account_name: string;
  account_type: "asset" | "liability" | "equity" | "revenue" | "expense";
  parent_account_id?: number;
  description?: string;
  is_active: boolean;
  balance_type: "debit" | "credit";
  created_at: string;
  updated_at: string;
  created_by: number;
  parent_account?: FinOpsAccount;
  balance?: number;
}

export interface FinOpsTransaction {
  id: number;
  transaction_number: string;
  transaction_date: string;
  reference_type: "lead" | "client" | "deployment" | "manual" | "recurring";
  reference_id?: number;
  description: string;
  total_amount: number;
  currency: string;
  transaction_type: "income" | "expense" | "transfer" | "adjustment";
  status: "pending" | "approved" | "rejected" | "posted";
  created_at: string;
  updated_at: string;
  created_by: number;
  approved_by?: number;
  approved_at?: string;
  transaction_lines?: FinOpsTransactionLine[];
}

export interface FinOpsTransactionLine {
  id: number;
  transaction_id: number;
  account_id: number;
  debit_amount: number;
  credit_amount: number;
  description?: string;
  line_order: number;
  created_at: string;
  account?: FinOpsAccount;
}

export interface FinOpsBudget {
  id: number;
  budget_name: string;
  budget_type:
    | "project"
    | "department"
    | "client"
    | "annual"
    | "quarterly"
    | "monthly";
  reference_type?: "lead" | "client" | "deployment" | "department" | "company";
  reference_id?: number;
  start_date: string;
  end_date: string;
  total_budget: number;
  currency: string;
  status: "draft" | "active" | "locked" | "closed";
  description?: string;
  created_at: string;
  updated_at: string;
  created_by: number;
  budget_lines?: FinOpsBudgetLine[];
  spent_amount?: number;
  remaining_amount?: number;
  utilization_percentage?: number;
}

export interface FinOpsBudgetLine {
  id: number;
  budget_id: number;
  account_id: number;
  category_name: string;
  allocated_amount: number;
  spent_amount: number;
  description?: string;
  created_at: string;
  updated_at: string;
  account?: FinOpsAccount;
  remaining_amount?: number;
  utilization_percentage?: number;
}

export interface FinOpsInvoice {
  id: number;
  invoice_number: string;
  client_id?: number;
  lead_id?: number;
  deployment_id?: number;
  invoice_date: string;
  due_date: string;
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  currency: string;
  status: "draft" | "sent" | "paid" | "overdue" | "cancelled";
  payment_terms?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  created_by: number;
  invoice_lines?: FinOpsInvoiceLine[];
  payments?: FinOpsPayment[];
  client_name?: string;
  paid_amount?: number;
  outstanding_amount?: number;
}

export interface FinOpsInvoiceLine {
  id: number;
  invoice_id: number;
  description: string;
  quantity: number;
  unit_price: number;
  line_total: number;
  tax_rate: number;
  created_at: string;
}

export interface FinOpsPayment {
  id: number;
  payment_number: string;
  invoice_id?: number;
  payment_date: string;
  amount: number;
  currency: string;
  payment_method:
    | "bank_transfer"
    | "check"
    | "cash"
    | "credit_card"
    | "online"
    | "other";
  payment_reference?: string;
  notes?: string;
  status: "pending" | "cleared" | "failed" | "cancelled";
  created_at: string;
  updated_at: string;
  created_by: number;
  invoice?: FinOpsInvoice;
}

export interface FinOpsCost {
  id: number;
  cost_category:
    | "infrastructure"
    | "personnel"
    | "tools"
    | "travel"
    | "marketing"
    | "operations"
    | "other";
  reference_type: "lead" | "client" | "deployment" | "department" | "project";
  reference_id: number;
  description: string;
  cost_amount: number;
  currency: string;
  cost_date: string;
  is_recurring: boolean;
  recurring_frequency?: "daily" | "weekly" | "monthly" | "quarterly" | "yearly";
  vendor?: string;
  cost_center?: string;
  created_at: string;
  updated_at: string;
  created_by: number;
}

export interface FinOpsMetric {
  id: number;
  metric_name: string;
  metric_type: "revenue" | "cost" | "profit" | "margin" | "ratio" | "count";
  metric_value: number;
  metric_target?: number;
  measurement_period: "daily" | "weekly" | "monthly" | "quarterly" | "yearly";
  measurement_date: string;
  reference_type: "company" | "department" | "client" | "lead" | "project";
  reference_id?: number;
  currency: string;
  notes?: string;
  created_at: string;
  created_by: number;
}

// Data transfer objects for creating/updating entities
export interface CreateFinOpsAccountData {
  account_code: string;
  account_name: string;
  account_type: "asset" | "liability" | "equity" | "revenue" | "expense";
  parent_account_id?: number;
  description?: string;
  balance_type: "debit" | "credit";
  created_by: number;
}

export interface CreateFinOpsTransactionData {
  transaction_number: string;
  transaction_date: string;
  reference_type: "lead" | "client" | "deployment" | "manual" | "recurring";
  reference_id?: number;
  description: string;
  total_amount: number;
  currency?: string;
  transaction_type: "income" | "expense" | "transfer" | "adjustment";
  created_by: number;
  transaction_lines: Array<{
    account_id: number;
    debit_amount: number;
    credit_amount: number;
    description?: string;
    line_order?: number;
  }>;
}

export interface CreateFinOpsBudgetData {
  budget_name: string;
  budget_type:
    | "project"
    | "department"
    | "client"
    | "annual"
    | "quarterly"
    | "monthly";
  reference_type?: "lead" | "client" | "deployment" | "department" | "company";
  reference_id?: number;
  start_date: string;
  end_date: string;
  total_budget: number;
  currency?: string;
  description?: string;
  created_by: number;
  budget_lines?: Array<{
    account_id: number;
    category_name: string;
    allocated_amount: number;
    description?: string;
  }>;
}

export interface CreateFinOpsInvoiceData {
  invoice_number: string;
  client_id?: number;
  lead_id?: number;
  deployment_id?: number;
  invoice_date: string;
  due_date: string;
  subtotal: number;
  tax_amount?: number;
  discount_amount?: number;
  currency?: string;
  payment_terms?: string;
  notes?: string;
  created_by: number;
  invoice_lines: Array<{
    description: string;
    quantity: number;
    unit_price: number;
    tax_rate?: number;
  }>;
}

// Repository class for FinOps operations
export class FinOpsRepository {
  // Account operations
  static async getAllAccounts(): Promise<FinOpsAccount[]> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT fa.*, pa.account_name as parent_account_name,
       COALESCE(
         SUM(ftl.debit_amount) - SUM(ftl.credit_amount), 0
       ) as balance
       FROM finops_accounts fa
       LEFT JOIN finops_accounts pa ON fa.parent_account_id = pa.id
       LEFT JOIN finops_transaction_lines ftl ON fa.id = ftl.account_id
       WHERE fa.is_active = true
       GROUP BY fa.id
       ORDER BY fa.account_code`,
    );
    return rows as FinOpsAccount[];
  }

  static async createAccount(
    data: CreateFinOpsAccountData,
  ): Promise<FinOpsAccount> {
    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO finops_accounts 
       (account_code, account_name, account_type, parent_account_id, description, balance_type, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        data.account_code,
        data.account_name,
        data.account_type,
        data.parent_account_id,
        data.description,
        data.balance_type,
        data.created_by,
      ],
    );

    const [newAccount] = await pool.execute<RowDataPacket[]>(
      "SELECT * FROM finops_accounts WHERE id = ?",
      [result.insertId],
    );
    return newAccount[0] as FinOpsAccount;
  }

  // Transaction operations
  static async getAllTransactions(
    limit: number = 50,
    offset: number = 0,
  ): Promise<FinOpsTransaction[]> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT ft.*, u.name as creator_name,
       COUNT(ftl.id) as line_count
       FROM finops_transactions ft
       LEFT JOIN users u ON ft.created_by = u.id
       LEFT JOIN finops_transaction_lines ftl ON ft.id = ftl.transaction_id
       GROUP BY ft.id
       ORDER BY ft.transaction_date DESC, ft.created_at DESC
       LIMIT ? OFFSET ?`,
      [limit, offset],
    );
    return rows as FinOpsTransaction[];
  }

  static async getTransactionById(
    id: number,
  ): Promise<FinOpsTransaction | null> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT ft.*, u.name as creator_name
       FROM finops_transactions ft
       LEFT JOIN users u ON ft.created_by = u.id
       WHERE ft.id = ?`,
      [id],
    );

    if (rows.length === 0) return null;

    const transaction = rows[0] as FinOpsTransaction;

    // Get transaction lines
    const [lineRows] = await pool.execute<RowDataPacket[]>(
      `SELECT ftl.*, fa.account_name, fa.account_code
       FROM finops_transaction_lines ftl
       JOIN finops_accounts fa ON ftl.account_id = fa.id
       WHERE ftl.transaction_id = ?
       ORDER BY ftl.line_order`,
      [id],
    );

    transaction.transaction_lines = lineRows as FinOpsTransactionLine[];
    return transaction;
  }

  static async createTransaction(
    data: CreateFinOpsTransactionData,
  ): Promise<FinOpsTransaction> {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Insert main transaction
      const [result] = await connection.execute<ResultSetHeader>(
        `INSERT INTO finops_transactions 
         (transaction_number, transaction_date, reference_type, reference_id, description, 
          total_amount, currency, transaction_type, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          data.transaction_number,
          data.transaction_date,
          data.reference_type,
          data.reference_id,
          data.description,
          data.total_amount,
          data.currency || "INR",
          data.transaction_type,
          data.created_by,
        ],
      );

      const transactionId = result.insertId;

      // Insert transaction lines
      for (const line of data.transaction_lines) {
        await connection.execute(
          `INSERT INTO finops_transaction_lines 
           (transaction_id, account_id, debit_amount, credit_amount, description, line_order)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            transactionId,
            line.account_id,
            line.debit_amount,
            line.credit_amount,
            line.description,
            line.line_order || 1,
          ],
        );
      }

      await connection.commit();

      const newTransaction = await this.getTransactionById(transactionId);
      return newTransaction!;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // Budget operations
  static async getAllBudgets(): Promise<FinOpsBudget[]> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT fb.*, u.name as creator_name,
       COALESCE(SUM(fbl.allocated_amount), 0) as total_allocated,
       COALESCE(SUM(fbl.spent_amount), 0) as total_spent
       FROM finops_budgets fb
       LEFT JOIN users u ON fb.created_by = u.id
       LEFT JOIN finops_budget_lines fbl ON fb.id = fbl.budget_id
       GROUP BY fb.id
       ORDER BY fb.created_at DESC`,
    );

    return rows.map((budget) => ({
      ...budget,
      remaining_amount: budget.total_budget - (budget.total_spent || 0),
      utilization_percentage:
        budget.total_budget > 0
          ? ((budget.total_spent || 0) / budget.total_budget) * 100
          : 0,
    })) as FinOpsBudget[];
  }

  // Invoice operations
  static async getAllInvoices(): Promise<FinOpsInvoice[]> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT fi.*, c.name as client_name,
       COALESCE(SUM(fp.amount), 0) as paid_amount
       FROM finops_invoices fi
       LEFT JOIN clients c ON fi.client_id = c.id
       LEFT JOIN finops_payments fp ON fi.id = fp.invoice_id AND fp.status = 'cleared'
       GROUP BY fi.id
       ORDER BY fi.invoice_date DESC`,
    );

    return rows.map((invoice) => ({
      ...invoice,
      outstanding_amount: invoice.total_amount - (invoice.paid_amount || 0),
    })) as FinOpsInvoice[];
  }

  // Cost tracking operations
  static async getCostsByReference(
    referenceType: string,
    referenceId: number,
  ): Promise<FinOpsCost[]> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT fc.*, u.name as creator_name
       FROM finops_costs fc
       LEFT JOIN users u ON fc.created_by = u.id
       WHERE fc.reference_type = ? AND fc.reference_id = ?
       ORDER BY fc.cost_date DESC`,
      [referenceType, referenceId],
    );
    return rows as FinOpsCost[];
  }

  static async createCost(
    costData: Omit<FinOpsCost, "id" | "created_at" | "updated_at">,
  ): Promise<FinOpsCost> {
    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO finops_costs 
       (cost_category, reference_type, reference_id, description, cost_amount, currency,
        cost_date, is_recurring, recurring_frequency, vendor, cost_center, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        costData.cost_category,
        costData.reference_type,
        costData.reference_id,
        costData.description,
        costData.cost_amount,
        costData.currency,
        costData.cost_date,
        costData.is_recurring,
        costData.recurring_frequency,
        costData.vendor,
        costData.cost_center,
        costData.created_by,
      ],
    );

    const [newCost] = await pool.execute<RowDataPacket[]>(
      "SELECT * FROM finops_costs WHERE id = ?",
      [result.insertId],
    );
    return newCost[0] as FinOpsCost;
  }

  // Financial metrics and reporting
  static async getFinancialMetrics(
    period: string,
    startDate: string,
    endDate: string,
  ): Promise<any> {
    const [revenueRows] = await pool.execute<RowDataPacket[]>(
      `SELECT SUM(total_amount) as total_revenue
       FROM finops_invoices 
       WHERE status = 'paid' AND invoice_date BETWEEN ? AND ?`,
      [startDate, endDate],
    );

    const [costRows] = await pool.execute<RowDataPacket[]>(
      `SELECT SUM(cost_amount) as total_costs
       FROM finops_costs 
       WHERE cost_date BETWEEN ? AND ?`,
      [startDate, endDate],
    );

    const [budgetRows] = await pool.execute<RowDataPacket[]>(
      `SELECT SUM(total_budget) as total_budgets,
       COUNT(*) as active_budgets
       FROM finops_budgets 
       WHERE status = 'active' AND start_date <= ? AND end_date >= ?`,
      [endDate, startDate],
    );

    const totalRevenue = revenueRows[0]?.total_revenue || 0;
    const totalCosts = costRows[0]?.total_costs || 0;
    const totalBudgets = budgetRows[0]?.total_budgets || 0;
    const activeBudgets = budgetRows[0]?.active_budgets || 0;

    return {
      total_revenue: totalRevenue,
      total_costs: totalCosts,
      profit: totalRevenue - totalCosts,
      profit_margin:
        totalRevenue > 0
          ? ((totalRevenue - totalCosts) / totalRevenue) * 100
          : 0,
      total_budgets: totalBudgets,
      active_budgets: activeBudgets,
      period: { start: startDate, end: endDate },
    };
  }

  // Dashboard data aggregation
  static async getDashboardData(): Promise<any> {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();
    const startOfMonth = `${currentYear}-${currentMonth.toString().padStart(2, "0")}-01`;
    const endOfMonth = new Date(currentYear, currentMonth, 0)
      .toISOString()
      .split("T")[0];

    const metrics = await this.getFinancialMetrics(
      "monthly",
      startOfMonth,
      endOfMonth,
    );

    // Get recent transactions
    const recentTransactions = await this.getAllTransactions(10, 0);

    // Get overdue invoices
    const [overdueInvoices] = await pool.execute<RowDataPacket[]>(
      `SELECT COUNT(*) as overdue_count, SUM(total_amount) as overdue_amount
       FROM finops_invoices 
       WHERE status IN ('sent', 'overdue') AND due_date < CURDATE()`,
    );

    // Get budget utilization
    const [budgetUtilization] = await pool.execute<RowDataPacket[]>(
      `SELECT fb.budget_name, fb.total_budget,
       COALESCE(SUM(fbl.spent_amount), 0) as spent_amount
       FROM finops_budgets fb
       LEFT JOIN finops_budget_lines fbl ON fb.id = fbl.budget_id
       WHERE fb.status = 'active'
       GROUP BY fb.id
       ORDER BY (COALESCE(SUM(fbl.spent_amount), 0) / fb.total_budget) DESC
       LIMIT 5`,
    );

    return {
      ...metrics,
      recent_transactions: recentTransactions,
      overdue_invoices: overdueInvoices[0] || {
        overdue_count: 0,
        overdue_amount: 0,
      },
      budget_utilization: budgetUtilization.map((budget: any) => ({
        ...budget,
        utilization_percentage:
          budget.total_budget > 0
            ? (budget.spent_amount / budget.total_budget) * 100
            : 0,
      })),
    };
  }
}
