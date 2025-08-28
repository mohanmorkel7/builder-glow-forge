-- Create FinOps clients table for separate client management
CREATE TABLE IF NOT EXISTS finops_clients (
    id SERIAL PRIMARY KEY,
    company_name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    notes TEXT,
    created_by INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_finops_clients_company_name ON finops_clients(company_name);
CREATE INDEX IF NOT EXISTS idx_finops_clients_deleted_at ON finops_clients(deleted_at);
CREATE INDEX IF NOT EXISTS idx_finops_clients_created_by ON finops_clients(created_by);

-- Add some initial sample data
INSERT INTO finops_clients (company_name, contact_person, email, phone, address, notes, created_by) VALUES
('Acme Corporation', 'John Smith', 'john@acme.com', '+1 (555) 123-4567', '123 Business St, City, State 12345', 'Primary FinOps client for daily clearing operations', 1),
('TechCorp Solutions', 'Sarah Johnson', 'sarah@techcorp.com', '+1 (555) 987-6543', '456 Tech Ave, City, State 67890', 'Secondary client for weekly reconciliation tasks', 1),
('Global Finance Ltd', 'Michael Brown', 'michael@globalfinance.com', '+1 (555) 456-7890', '789 Finance Blvd, City, State 54321', 'Enterprise client for comprehensive FinOps management', 1)
ON CONFLICT DO NOTHING;
