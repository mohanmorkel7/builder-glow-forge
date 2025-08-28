-- FinOps (Financial Operations) Module Database Schema
-- This module handles financial operations, budgeting, cost tracking, and financial reporting

-- Financial Accounts table for managing chart of accounts
CREATE TABLE IF NOT EXISTS finops_accounts (
    id SERIAL PRIMARY KEY,
    account_code VARCHAR(20) UNIQUE NOT NULL,
    account_name VARCHAR(255) NOT NULL,
    account_type ENUM('asset', 'liability', 'equity', 'revenue', 'expense') NOT NULL,
    parent_account_id INTEGER,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    balance_type ENUM('debit', 'credit') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by INTEGER,
    FOREIGN KEY (parent_account_id) REFERENCES finops_accounts(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Financial Transactions table for recording all financial movements
CREATE TABLE IF NOT EXISTS finops_transactions (
    id SERIAL PRIMARY KEY,
    transaction_number VARCHAR(50) UNIQUE NOT NULL,
    transaction_date DATE NOT NULL,
    reference_type ENUM('lead', 'client', 'deployment', 'manual', 'recurring') NOT NULL,
    reference_id INTEGER,
    description TEXT NOT NULL,
    total_amount DECIMAL(15,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'INR',
    transaction_type ENUM('income', 'expense', 'transfer', 'adjustment') NOT NULL,
    status ENUM('pending', 'approved', 'rejected', 'posted') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by INTEGER NOT NULL,
    approved_by INTEGER,
    approved_at TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (approved_by) REFERENCES users(id)
);

-- Transaction line items for double-entry bookkeeping
CREATE TABLE IF NOT EXISTS finops_transaction_lines (
    id SERIAL PRIMARY KEY,
    transaction_id INTEGER NOT NULL,
    account_id INTEGER NOT NULL,
    debit_amount DECIMAL(15,2) DEFAULT 0.00,
    credit_amount DECIMAL(15,2) DEFAULT 0.00,
    description TEXT,
    line_order INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (transaction_id) REFERENCES finops_transactions(id) ON DELETE CASCADE,
    FOREIGN KEY (account_id) REFERENCES finops_accounts(id)
);

-- Budget management table
CREATE TABLE IF NOT EXISTS finops_budgets (
    id SERIAL PRIMARY KEY,
    budget_name VARCHAR(255) NOT NULL,
    budget_type ENUM('project', 'department', 'client', 'annual', 'quarterly', 'monthly') NOT NULL,
    reference_type ENUM('lead', 'client', 'deployment', 'department', 'company') NULL,
    reference_id INTEGER NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_budget DECIMAL(15,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'INR',
    status ENUM('draft', 'active', 'locked', 'closed') DEFAULT 'draft',
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by INTEGER NOT NULL,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Budget line items for detailed budget allocation
CREATE TABLE IF NOT EXISTS finops_budget_lines (
    id SERIAL PRIMARY KEY,
    budget_id INTEGER NOT NULL,
    account_id INTEGER NOT NULL,
    category_name VARCHAR(255) NOT NULL,
    allocated_amount DECIMAL(15,2) NOT NULL,
    spent_amount DECIMAL(15,2) DEFAULT 0.00,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (budget_id) REFERENCES finops_budgets(id) ON DELETE CASCADE,
    FOREIGN KEY (account_id) REFERENCES finops_accounts(id)
);

-- Invoice management table
CREATE TABLE IF NOT EXISTS finops_invoices (
    id SERIAL PRIMARY KEY,
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    client_id INTEGER,
    lead_id INTEGER,
    deployment_id INTEGER,
    invoice_date DATE NOT NULL,
    due_date DATE NOT NULL,
    subtotal DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    tax_amount DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    discount_amount DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    total_amount DECIMAL(15,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'INR',
    status ENUM('draft', 'sent', 'paid', 'overdue', 'cancelled') DEFAULT 'draft',
    payment_terms VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by INTEGER NOT NULL,
    FOREIGN KEY (client_id) REFERENCES clients(id),
    FOREIGN KEY (lead_id) REFERENCES leads(id),
    FOREIGN KEY (deployment_id) REFERENCES deployments(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Invoice line items
CREATE TABLE IF NOT EXISTS finops_invoice_lines (
    id SERIAL PRIMARY KEY,
    invoice_id INTEGER NOT NULL,
    description TEXT NOT NULL,
    quantity DECIMAL(10,2) NOT NULL DEFAULT 1.00,
    unit_price DECIMAL(15,2) NOT NULL,
    line_total DECIMAL(15,2) NOT NULL,
    tax_rate DECIMAL(5,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (invoice_id) REFERENCES finops_invoices(id) ON DELETE CASCADE
);

-- Payment tracking table
CREATE TABLE IF NOT EXISTS finops_payments (
    id SERIAL PRIMARY KEY,
    payment_number VARCHAR(50) UNIQUE NOT NULL,
    invoice_id INTEGER,
    payment_date DATE NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'INR',
    payment_method ENUM('bank_transfer', 'check', 'cash', 'credit_card', 'online', 'other') NOT NULL,
    payment_reference VARCHAR(100),
    notes TEXT,
    status ENUM('pending', 'cleared', 'failed', 'cancelled') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by INTEGER NOT NULL,
    FOREIGN KEY (invoice_id) REFERENCES finops_invoices(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Cost tracking for projects/deployments
CREATE TABLE IF NOT EXISTS finops_costs (
    id SERIAL PRIMARY KEY,
    cost_category ENUM('infrastructure', 'personnel', 'tools', 'travel', 'marketing', 'operations', 'other') NOT NULL,
    reference_type ENUM('lead', 'client', 'deployment', 'department', 'project') NOT NULL,
    reference_id INTEGER NOT NULL,
    description TEXT NOT NULL,
    cost_amount DECIMAL(15,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'INR',
    cost_date DATE NOT NULL,
    is_recurring BOOLEAN DEFAULT false,
    recurring_frequency ENUM('daily', 'weekly', 'monthly', 'quarterly', 'yearly') NULL,
    vendor VARCHAR(255),
    cost_center VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by INTEGER NOT NULL,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Financial reports metadata
CREATE TABLE IF NOT EXISTS finops_reports (
    id SERIAL PRIMARY KEY,
    report_name VARCHAR(255) NOT NULL,
    report_type ENUM('profit_loss', 'balance_sheet', 'cash_flow', 'budget_variance', 'cost_analysis', 'revenue_report') NOT NULL,
    report_period_start DATE NOT NULL,
    report_period_end DATE NOT NULL,
    parameters JSON,
    generated_data JSON,
    status ENUM('generating', 'completed', 'failed') DEFAULT 'generating',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by INTEGER NOT NULL,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Financial KPIs and metrics tracking
CREATE TABLE IF NOT EXISTS finops_metrics (
    id SERIAL PRIMARY KEY,
    metric_name VARCHAR(255) NOT NULL,
    metric_type ENUM('revenue', 'cost', 'profit', 'margin', 'ratio', 'count') NOT NULL,
    metric_value DECIMAL(15,2) NOT NULL,
    metric_target DECIMAL(15,2),
    measurement_period ENUM('daily', 'weekly', 'monthly', 'quarterly', 'yearly') NOT NULL,
    measurement_date DATE NOT NULL,
    reference_type ENUM('company', 'department', 'client', 'lead', 'project') DEFAULT 'company',
    reference_id INTEGER,
    currency VARCHAR(3) DEFAULT 'INR',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER NOT NULL,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Create indexes for better performance
CREATE INDEX idx_finops_transactions_date ON finops_transactions(transaction_date);
CREATE INDEX idx_finops_transactions_type ON finops_transactions(transaction_type);
CREATE INDEX idx_finops_transactions_reference ON finops_transactions(reference_type, reference_id);
CREATE INDEX idx_finops_transaction_lines_account ON finops_transaction_lines(account_id);
CREATE INDEX idx_finops_invoices_client ON finops_invoices(client_id);
CREATE INDEX idx_finops_invoices_status ON finops_invoices(status);
CREATE INDEX idx_finops_invoices_date ON finops_invoices(invoice_date);
CREATE INDEX idx_finops_payments_invoice ON finops_payments(invoice_id);
CREATE INDEX idx_finops_costs_reference ON finops_costs(reference_type, reference_id);
CREATE INDEX idx_finops_costs_date ON finops_costs(cost_date);
CREATE INDEX idx_finops_metrics_date ON finops_metrics(measurement_date);

-- Insert default chart of accounts
INSERT INTO finops_accounts (account_code, account_name, account_type, balance_type, description) VALUES
-- Assets
('1000', 'Cash and Bank', 'asset', 'debit', 'Current assets - cash and bank accounts'),
('1100', 'Accounts Receivable', 'asset', 'debit', 'Money owed by customers'),
('1200', 'Inventory', 'asset', 'debit', 'Stock and inventory items'),
('1500', 'Fixed Assets', 'asset', 'debit', 'Long-term assets like equipment'),
('1600', 'Accumulated Depreciation', 'asset', 'credit', 'Depreciation of fixed assets'),

-- Liabilities
('2000', 'Accounts Payable', 'liability', 'credit', 'Money owed to suppliers'),
('2100', 'Accrued Expenses', 'liability', 'credit', 'Expenses incurred but not yet paid'),
('2200', 'Short-term Loans', 'liability', 'credit', 'Short-term debt obligations'),
('2500', 'Long-term Debt', 'liability', 'credit', 'Long-term debt obligations'),

-- Equity
('3000', 'Owner Equity', 'equity', 'credit', 'Owner investment in the business'),
('3100', 'Retained Earnings', 'equity', 'credit', 'Accumulated profits'),

-- Revenue
('4000', 'Service Revenue', 'revenue', 'credit', 'Revenue from services provided'),
('4100', 'Product Revenue', 'revenue', 'credit', 'Revenue from product sales'),
('4200', 'Consulting Revenue', 'revenue', 'credit', 'Revenue from consulting services'),
('4900', 'Other Income', 'revenue', 'credit', 'Miscellaneous income'),

-- Expenses
('5000', 'Cost of Goods Sold', 'expense', 'debit', 'Direct costs of services/products'),
('5100', 'Salaries and Wages', 'expense', 'debit', 'Employee compensation'),
('5200', 'Office Rent', 'expense', 'debit', 'Office space rental costs'),
('5300', 'Utilities', 'expense', 'debit', 'Electricity, internet, phone'),
('5400', 'Marketing Expenses', 'expense', 'debit', 'Advertising and marketing costs'),
('5500', 'Travel Expenses', 'expense', 'debit', 'Business travel costs'),
('5600', 'Professional Services', 'expense', 'debit', 'Legal, accounting, consulting fees'),
('5700', 'Technology Expenses', 'expense', 'debit', 'Software, hardware, cloud services'),
('5800', 'Insurance', 'expense', 'debit', 'Business insurance premiums'),
('5900', 'Depreciation', 'expense', 'debit', 'Asset depreciation expense'),
('5950', 'Miscellaneous Expenses', 'expense', 'debit', 'Other business expenses');

-- Insert sample data for testing
INSERT INTO finops_budgets (budget_name, budget_type, start_date, end_date, total_budget, status, description, created_by) VALUES
('Q1 2024 Marketing Budget', 'quarterly', '2024-01-01', '2024-03-31', 50000.00, 'active', 'Marketing budget for first quarter', 1),
('Annual Operations Budget 2024', 'annual', '2024-01-01', '2024-12-31', 500000.00, 'active', 'Annual operational expenses budget', 1),
('Client XYZ Project Budget', 'project', '2024-01-15', '2024-06-15', 75000.00, 'active', 'Budget for XYZ client project delivery', 1);

-- Create triggers for automated calculations
DELIMITER //

CREATE TRIGGER update_budget_spent_amount 
AFTER INSERT ON finops_costs 
FOR EACH ROW 
BEGIN
    UPDATE finops_budget_lines bl
    JOIN finops_budgets b ON bl.budget_id = b.id
    SET bl.spent_amount = (
        SELECT COALESCE(SUM(fc.cost_amount), 0)
        FROM finops_costs fc
        WHERE fc.reference_type = b.reference_type 
        AND fc.reference_id = b.reference_id
        AND fc.cost_category = bl.category_name
    )
    WHERE b.reference_type = NEW.reference_type 
    AND b.reference_id = NEW.reference_id;
END//

CREATE TRIGGER update_invoice_total
BEFORE UPDATE ON finops_invoices
FOR EACH ROW
BEGIN
    SET NEW.total_amount = NEW.subtotal + NEW.tax_amount - NEW.discount_amount;
END//

DELIMITER ;
