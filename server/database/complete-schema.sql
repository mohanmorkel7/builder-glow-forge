-- Banani App Complete Database Schema

-- Create ENUM types for workflow integration
DO $$ BEGIN
    CREATE TYPE workflow_source_type AS ENUM ('lead', 'manual');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE workflow_project_type AS ENUM ('product_development', 'finops_process', 'integration');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE workflow_project_status AS ENUM ('created', 'in_progress', 'review', 'completed', 'on_hold', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE workflow_priority AS ENUM ('low', 'medium', 'high', 'critical');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE workflow_step_status AS ENUM ('pending', 'in_progress', 'completed', 'blocked', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE workflow_comment_type AS ENUM ('comment', 'status_update', 'assignment', 'alert', 'system');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE workflow_notification_type AS ENUM ('step_overdue', 'project_delayed', 'assignment', 'mention', 'process_failed', 'daily_task', 'system_alert');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE workflow_automation_type AS ENUM ('daily_task', 'scheduled_check', 'conditional_trigger', 'notification');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE workflow_document_type AS ENUM ('requirement', 'specification', 'design', 'report', 'contract', 'other');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'sales', 'product', 'development', 'db', 'finops', 'finance', 'hr_management', 'infra', 'switch_team', 'unknown')),
    department VARCHAR(100),
    job_title VARCHAR(255),
    manager_id INTEGER REFERENCES users(id),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
    start_date DATE,
    last_login TIMESTAMP,
    two_factor_enabled BOOLEAN DEFAULT false,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Clients table
CREATE TABLE IF NOT EXISTS clients (
    id SERIAL PRIMARY KEY,
    client_name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    company_size VARCHAR(50),
    industry VARCHAR(100),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    zip_code VARCHAR(20),
    country VARCHAR(100),
    expected_value DECIMAL(12,2),
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'onboarding', 'completed')),
    sales_rep_id INTEGER REFERENCES users(id),
    start_date DATE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Leads table
CREATE TABLE IF NOT EXISTS leads (
    id SERIAL PRIMARY KEY,
    lead_id VARCHAR(50) UNIQUE NOT NULL,
    
    -- Lead Source Information
    lead_source VARCHAR(50) NOT NULL CHECK (lead_source IN ('email', 'social-media', 'phone', 'website', 'referral', 'cold-call', 'event', 'other')),
    lead_source_value TEXT,
    
    -- Project Information
    project_title VARCHAR(500),
    project_description TEXT,
    project_requirements TEXT,
    
    -- Enhanced Project Information
    solutions JSONB DEFAULT '[]'::jsonb,
    priority_level VARCHAR(20) DEFAULT 'medium' CHECK (priority_level IN ('high', 'medium', 'low')),
    start_date DATE,
    targeted_end_date DATE,
    expected_daily_txn_volume INTEGER,
    project_value DECIMAL(15,2),
    project_value_12m DECIMAL(15,2),
    project_value_24m DECIMAL(15,2),
    project_value_36m DECIMAL(15,2),
    spoc VARCHAR(255),
    
    -- Commercials
    commercials JSONB DEFAULT '[]'::jsonb,
    commercial_pricing JSONB DEFAULT '[]'::jsonb,
    
    -- Client Information
    client_name VARCHAR(255) NOT NULL,
    client_type VARCHAR(50) CHECK (client_type IN ('new', 'existing')),
    company VARCHAR(255),
    company_location VARCHAR(500),
    category VARCHAR(100) CHECK (category IN ('aggregator', 'banks', 'partner')),
    country VARCHAR(100) CHECK (country IN ('india', 'usa', 'uae', 'uk', 'singapore', 'canada', 'australia', 'other')),
    
    -- Contact Information (JSONB array for multiple contacts)
    contacts JSONB DEFAULT '[]'::jsonb,
    
    -- Additional Information
    status VARCHAR(20) DEFAULT 'in-progress' CHECK (status IN ('in-progress', 'won', 'lost', 'completed')),
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    expected_close_date DATE,
    probability INTEGER DEFAULT 0 CHECK (probability >= 0 AND probability <= 100),
    notes TEXT,
    
    -- Template Reference
    template_id INTEGER REFERENCES onboarding_templates(id),

    -- Metadata
    created_by INTEGER REFERENCES users(id),
    assigned_to INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Lead Steps table
CREATE TABLE IF NOT EXISTS lead_steps (
    id SERIAL PRIMARY KEY,
    lead_id INTEGER REFERENCES leads(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled', 'blocked')),
    step_order INTEGER DEFAULT 1,
    due_date DATE,
    completed_date TIMESTAMP,
    estimated_days INTEGER DEFAULT 1,
    assigned_to INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Lead Chat/Messages table
CREATE TABLE IF NOT EXISTS lead_chats (
    id SERIAL PRIMARY KEY,
    step_id INTEGER REFERENCES lead_steps(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id),
    user_name VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'file', 'system')),
    is_rich_text BOOLEAN DEFAULT false,
    attachments JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Lead Documents/Attachments table
CREATE TABLE IF NOT EXISTS lead_documents (
    id SERIAL PRIMARY KEY,
    lead_id INTEGER REFERENCES leads(id) ON DELETE CASCADE,
    step_id INTEGER REFERENCES lead_steps(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    file_path VARCHAR(1000) NOT NULL,
    file_size BIGINT,
    file_type VARCHAR(100),
    uploaded_by INTEGER REFERENCES users(id),
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Follow-ups table (enhanced)
CREATE TABLE IF NOT EXISTS follow_ups (
    id SERIAL PRIMARY KEY,
    client_id INTEGER REFERENCES clients(id),
    lead_id INTEGER REFERENCES leads(id),
    message_id INTEGER,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    due_date DATE,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'overdue')),
    follow_up_type VARCHAR(50) DEFAULT 'general' CHECK (follow_up_type IN ('call', 'email', 'meeting', 'document', 'proposal', 'contract', 'onboarding', 'general', 'sales', 'support', 'other')),
    assigned_to INTEGER REFERENCES users(id),
    created_by INTEGER REFERENCES users(id),
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Onboarding templates table
CREATE TABLE IF NOT EXISTS onboarding_templates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) DEFAULT 'standard' CHECK (type IN ('standard', 'enterprise', 'smb')),
    is_active BOOLEAN DEFAULT true,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Template steps table
CREATE TABLE IF NOT EXISTS template_steps (
    id SERIAL PRIMARY KEY,
    template_id INTEGER REFERENCES onboarding_templates(id) ON DELETE CASCADE,
    step_order INTEGER NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    default_eta_days INTEGER DEFAULT 3,
    auto_alert BOOLEAN DEFAULT false,
    email_reminder BOOLEAN DEFAULT false,
    probability_percent INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Client onboarding instances
CREATE TABLE IF NOT EXISTS client_onboarding (
    id SERIAL PRIMARY KEY,
    client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
    template_id INTEGER REFERENCES onboarding_templates(id),
    status VARCHAR(20) DEFAULT 'in_progress' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Onboarding step instances
CREATE TABLE IF NOT EXISTS onboarding_step_instances (
    id SERIAL PRIMARY KEY,
    onboarding_id INTEGER REFERENCES client_onboarding(id) ON DELETE CASCADE,
    template_step_id INTEGER REFERENCES template_steps(id),
    client_id INTEGER REFERENCES clients(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'overdue')),
    step_order INTEGER DEFAULT 1,
    due_date DATE,
    completed_date TIMESTAMP,
    estimated_days INTEGER DEFAULT 1,
    assigned_to INTEGER REFERENCES users(id),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Onboarding documents
CREATE TABLE IF NOT EXISTS onboarding_documents (
    id SERIAL PRIMARY KEY,
    step_id INTEGER REFERENCES onboarding_step_instances(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    file_path VARCHAR(1000) NOT NULL,
    file_size BIGINT,
    file_type VARCHAR(100),
    uploaded_by INTEGER REFERENCES users(id),
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Onboarding comments
CREATE TABLE IF NOT EXISTS onboarding_comments (
    id SERIAL PRIMARY KEY,
    step_id INTEGER REFERENCES onboarding_step_instances(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id),
    user_name VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    comment_type VARCHAR(20) DEFAULT 'note' CHECK (comment_type IN ('note', 'update', 'system')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    current_version VARCHAR(50),
    repository_url VARCHAR(500),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Deployments table
CREATE TABLE IF NOT EXISTS deployments (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(id),
    version VARCHAR(50) NOT NULL,
    environment VARCHAR(50) NOT NULL CHECK (environment IN ('development', 'staging', 'qa', 'production')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'scheduled', 'in_progress', 'completed', 'failed', 'cancelled')),
    description TEXT,
    assigned_to INTEGER REFERENCES users(id),
    scheduled_date TIMESTAMP,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    auto_rollback BOOLEAN DEFAULT true,
    run_tests BOOLEAN DEFAULT true,
    notify_team BOOLEAN DEFAULT true,
    require_approval BOOLEAN DEFAULT false,
    release_notes TEXT,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL,
    read_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);
CREATE INDEX IF NOT EXISTS idx_clients_sales_rep ON clients(sales_rep_id);
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);

CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_lead_id ON leads(lead_id);
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_created_by ON leads(created_by);
CREATE INDEX IF NOT EXISTS idx_leads_assigned_to ON leads(assigned_to);
CREATE INDEX IF NOT EXISTS idx_leads_client_name ON leads(client_name);

CREATE INDEX IF NOT EXISTS idx_lead_steps_lead_id ON lead_steps(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_steps_status ON lead_steps(status);
CREATE INDEX IF NOT EXISTS idx_lead_steps_assigned_to ON lead_steps(assigned_to);

CREATE INDEX IF NOT EXISTS idx_lead_chats_step_id ON lead_chats(step_id);
CREATE INDEX IF NOT EXISTS idx_lead_chats_user_id ON lead_chats(user_id);

CREATE INDEX IF NOT EXISTS idx_lead_documents_lead_id ON lead_documents(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_documents_step_id ON lead_documents(step_id);

CREATE INDEX IF NOT EXISTS idx_follow_ups_client_id ON follow_ups(client_id);
CREATE INDEX IF NOT EXISTS idx_follow_ups_lead_id ON follow_ups(lead_id);
CREATE INDEX IF NOT EXISTS idx_follow_ups_status ON follow_ups(status);
CREATE INDEX IF NOT EXISTS idx_follow_ups_assigned_to ON follow_ups(assigned_to);

CREATE INDEX IF NOT EXISTS idx_deployments_status ON deployments(status);
CREATE INDEX IF NOT EXISTS idx_deployments_environment ON deployments(environment);
CREATE INDEX IF NOT EXISTS idx_deployments_product_id ON deployments(product_id);

CREATE INDEX IF NOT EXISTS idx_onboarding_client ON client_onboarding(client_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_step_instances_client_id ON onboarding_step_instances(client_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_step_instances_status ON onboarding_step_instances(status);
CREATE INDEX IF NOT EXISTS idx_template_steps_template ON template_steps(template_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);

-- Insert default admin user (password: 'password')
INSERT INTO users (first_name, last_name, email, password_hash, role, status) 
VALUES ('John', 'Doe', 'admin@banani.com', '$2b$10$rOyZUjbEf8Z8gzLl5wF9YeS7YbZzI.sVGzJxJ8MG8KnYxRgQ8nO0y', 'admin', 'active')
ON CONFLICT (email) DO NOTHING;

INSERT INTO users (first_name, last_name, email, password_hash, role, status) 
VALUES ('Jane', 'Smith', 'sales@banani.com', '$2b$10$rOyZUjbEf8Z8gzLl5wF9YeS7YbZzI.sVGzJxJ8MG8KnYxRgQ8nO0y', 'sales', 'active')
ON CONFLICT (email) DO NOTHING;

INSERT INTO users (first_name, last_name, email, password_hash, role, status) 
VALUES ('Mike', 'Johnson', 'product@banani.com', '$2b$10$rOyZUjbEf8Z8gzLl5wF9YeS7YbZzI.sVGzJxJ8MG8KnYxRgQ8nO0y', 'product', 'active')
ON CONFLICT (email) DO NOTHING;

-- Insert sample products
INSERT INTO products (name, description, current_version) VALUES 
('Core App', 'Main application platform', 'v2.0.9'),
('Analytics Module', 'Data analytics and reporting', 'v1.5.1'),
('API Gateway', 'API management and routing', 'v3.0.0'),
('Mobile App', 'Mobile application', 'v1.2.2'),
('Reporting Service', 'Report generation service', 'v0.8.9')
ON CONFLICT DO NOTHING;

-- Insert sample onboarding templates
INSERT INTO onboarding_templates (name, description, type, created_by) VALUES 
('Standard Client Onboarding', 'A comprehensive template for standard client onboarding, covering initial contact to final setup.', 'standard', 1),
('Enterprise Client Onboarding', 'Tailored onboarding process for large enterprise clients with complex integration requirements.', 'enterprise', 1),
('SMB Onboarding Lite', 'A streamlined onboarding template for small to medium businesses with essential steps.', 'smb', 1)
ON CONFLICT DO NOTHING;

-- Insert template steps for standard onboarding
INSERT INTO template_steps (template_id, step_order, name, description, default_eta_days, auto_alert, email_reminder) VALUES 
(1, 1, 'Initial Contact', 'Reach out to the client to introduce the onboarding process.', 2, true, true),
(1, 2, 'Document Collection', 'Gather all necessary legal and financial documents from the client.', 5, true, true),
(1, 3, 'Contract Signing', 'Review and execute service agreements.', 3, true, false),
(1, 4, 'Account Setup', 'Create client accounts and configure initial settings.', 2, false, true),
(1, 5, 'Training Session', 'Conduct onboarding training and knowledge transfer.', 7, false, true)
ON CONFLICT DO NOTHING;

-- Create triggers to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to relevant tables
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_clients_updated_at ON clients;
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_leads_updated_at ON leads;
CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON leads FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_lead_steps_updated_at ON lead_steps;
CREATE TRIGGER update_lead_steps_updated_at BEFORE UPDATE ON lead_steps FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_follow_ups_updated_at ON follow_ups;
CREATE TRIGGER update_follow_ups_updated_at BEFORE UPDATE ON follow_ups FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_onboarding_step_instances_updated_at ON onboarding_step_instances;
CREATE TRIGGER update_onboarding_step_instances_updated_at BEFORE UPDATE ON onboarding_step_instances FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_deployments_updated_at ON deployments;
CREATE TRIGGER update_deployments_updated_at BEFORE UPDATE ON deployments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_onboarding_templates_updated_at ON onboarding_templates;
CREATE TRIGGER update_onboarding_templates_updated_at BEFORE UPDATE ON onboarding_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===============================
-- FINOPS TASK MANAGEMENT TABLES
-- ===============================

-- FinOps Tasks table - Main task definitions
CREATE TABLE IF NOT EXISTS finops_tasks (
    id SERIAL PRIMARY KEY,
    task_name VARCHAR(255) NOT NULL,
    description TEXT,
    assigned_to VARCHAR(255) NOT NULL,
    reporting_managers JSONB DEFAULT '[]'::jsonb, -- Array of manager names
    escalation_managers JSONB DEFAULT '[]'::jsonb, -- Array of escalation manager names
    effective_from DATE NOT NULL,
    duration VARCHAR(20) NOT NULL CHECK (duration IN ('daily', 'weekly', 'monthly')),
    is_active BOOLEAN DEFAULT true,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'completed', 'overdue')),
    last_run_at TIMESTAMP,
    next_run_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    created_by INTEGER NOT NULL,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- FinOps SubTasks table - Individual steps within a task
CREATE TABLE IF NOT EXISTS finops_subtasks (
    id SERIAL PRIMARY KEY,
    task_id INTEGER NOT NULL,
    name VARCHAR(500) NOT NULL,
    description TEXT,
    sla_hours INTEGER DEFAULT 1,
    sla_minutes INTEGER DEFAULT 0,
    start_time TIME DEFAULT '05:00:00', -- Daily start time
    order_position INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'overdue', 'delayed')),
    assigned_to VARCHAR(255),
    delay_reason VARCHAR(100), -- Reason for delay
    delay_notes TEXT, -- Additional delay notes
    alerts_sent TEXT[], -- Array of alert types sent
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    due_at TIMESTAMP, -- Calculated based on SLA
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (task_id) REFERENCES finops_tasks(id) ON DELETE CASCADE
);

-- FinOps Activity Log table - Track all activities and changes
CREATE TABLE IF NOT EXISTS finops_activity_log (
    id SERIAL PRIMARY KEY,
    task_id INTEGER NOT NULL,
    subtask_id INTEGER NULL,
    action VARCHAR(50) NOT NULL, -- 'created', 'started', 'completed', 'overdue', 'updated', 'deleted', 'manual_run'
    user_name VARCHAR(255) NOT NULL,
    user_id INTEGER,
    details TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'::jsonb,
    FOREIGN KEY (task_id) REFERENCES finops_tasks(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- FinOps Alerts table - SLA breach and escalation alerts
CREATE TABLE IF NOT EXISTS finops_alerts (
    id SERIAL PRIMARY KEY,
    task_id INTEGER NOT NULL,
    subtask_id INTEGER,
    alert_type VARCHAR(50) NOT NULL, -- 'sla_warning', 'sla_breach', 'escalation', 'completion'
    alert_level VARCHAR(20) NOT NULL CHECK (alert_level IN ('info', 'warning', 'critical', 'escalation')),
    message TEXT NOT NULL,
    recipients JSONB DEFAULT '[]'::jsonb, -- Array of email addresses or user names
    sent_at TIMESTAMP,
    acknowledged_at TIMESTAMP,
    acknowledged_by VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'::jsonb,
    FOREIGN KEY (task_id) REFERENCES finops_tasks(id) ON DELETE CASCADE,
    FOREIGN KEY (subtask_id) REFERENCES finops_subtasks(id) ON DELETE CASCADE
);

-- Create indexes for FinOps tables
CREATE INDEX IF NOT EXISTS idx_finops_tasks_active ON finops_tasks(is_active, effective_from);
CREATE INDEX IF NOT EXISTS idx_finops_tasks_next_run ON finops_tasks(next_run_at);
CREATE INDEX IF NOT EXISTS idx_finops_subtasks_task ON finops_subtasks(task_id);
CREATE INDEX IF NOT EXISTS idx_finops_subtasks_status ON finops_subtasks(status);
CREATE INDEX IF NOT EXISTS idx_finops_subtasks_due ON finops_subtasks(due_at);
CREATE INDEX IF NOT EXISTS idx_finops_activity_log_task ON finops_activity_log(task_id);

-- ===============================
-- WORKFLOW INTEGRATION TABLES
-- ===============================

-- Workflow Projects table - connects leads to product and finops work
CREATE TABLE IF NOT EXISTS workflow_projects (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    source_type workflow_source_type NOT NULL DEFAULT 'lead',
    source_id INTEGER, -- references leads.id when source_type = 'lead'
    project_type workflow_project_type NOT NULL,
    status workflow_project_status DEFAULT 'created',
    priority workflow_priority DEFAULT 'medium',
    assigned_team VARCHAR(100),
    project_manager_id INTEGER,
    start_date DATE,
    target_completion_date DATE,
    actual_completion_date DATE,
    budget DECIMAL(15,2),
    estimated_hours INTEGER,
    actual_hours INTEGER,
    progress_percentage INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER NOT NULL,
    CONSTRAINT fk_workflow_project_manager FOREIGN KEY (project_manager_id) REFERENCES users(id),
    CONSTRAINT fk_workflow_project_creator FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Workflow Steps table - custom steps for each project (like lead steps)
CREATE TABLE IF NOT EXISTS workflow_steps (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL,
    step_name VARCHAR(255) NOT NULL,
    step_description TEXT,
    step_order INTEGER NOT NULL DEFAULT 1,
    status workflow_step_status DEFAULT 'pending',
    assigned_to INTEGER,
    estimated_hours DECIMAL(5,2),
    actual_hours DECIMAL(5,2),
    start_date TIMESTAMP,
    due_date TIMESTAMP,
    completion_date TIMESTAMP,
    dependencies JSONB, -- JSON array of step IDs this step depends on
    is_automated BOOLEAN DEFAULT false,
    automation_config JSONB, -- Configuration for automated steps (time, conditions, etc.)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER NOT NULL,
    CONSTRAINT fk_workflow_step_project FOREIGN KEY (project_id) REFERENCES workflow_projects(id) ON DELETE CASCADE,
    CONSTRAINT fk_workflow_step_assignee FOREIGN KEY (assigned_to) REFERENCES users(id),
    CONSTRAINT fk_workflow_step_creator FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Workflow Comments table - chat and comments for collaboration
CREATE TABLE IF NOT EXISTS workflow_comments (
    id SERIAL PRIMARY KEY,
    project_id INTEGER,
    step_id INTEGER,
    comment_text TEXT NOT NULL,
    comment_type workflow_comment_type DEFAULT 'comment',
    mentioned_users JSONB, -- JSON array of user IDs mentioned in comment
    attachments JSONB, -- JSON array of file paths/URLs
    is_internal BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER NOT NULL,
    CONSTRAINT fk_workflow_comment_project FOREIGN KEY (project_id) REFERENCES workflow_projects(id) ON DELETE CASCADE,
    CONSTRAINT fk_workflow_comment_step FOREIGN KEY (step_id) REFERENCES workflow_steps(id) ON DELETE CASCADE,
    CONSTRAINT fk_workflow_comment_creator FOREIGN KEY (created_by) REFERENCES users(id),
    CONSTRAINT chk_workflow_comment_target CHECK (project_id IS NOT NULL OR step_id IS NOT NULL)
);

-- Workflow Notifications table - alerts and notifications
CREATE TABLE IF NOT EXISTS workflow_notifications (
    id SERIAL PRIMARY KEY,
    notification_type workflow_notification_type NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    recipient_id INTEGER NOT NULL,
    project_id INTEGER,
    step_id INTEGER,
    source_type VARCHAR(50), -- 'lead', 'product', 'finops', 'system'
    source_id INTEGER,
    priority workflow_priority DEFAULT 'medium',
    is_read BOOLEAN DEFAULT false,
    is_email_sent BOOLEAN DEFAULT false,
    scheduled_for TIMESTAMP,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP,
    CONSTRAINT fk_workflow_notification_recipient FOREIGN KEY (recipient_id) REFERENCES users(id),
    CONSTRAINT fk_workflow_notification_project FOREIGN KEY (project_id) REFERENCES workflow_projects(id) ON DELETE SET NULL,
    CONSTRAINT fk_workflow_notification_step FOREIGN KEY (step_id) REFERENCES workflow_steps(id) ON DELETE SET NULL
);

-- Workflow Automations table - automated processes and schedules
CREATE TABLE IF NOT EXISTS workflow_automations (
    id SERIAL PRIMARY KEY,
    automation_name VARCHAR(255) NOT NULL,
    automation_type workflow_automation_type NOT NULL,
    target_type VARCHAR(50), -- 'step', 'project', 'system'
    target_id INTEGER,
    schedule_config JSONB NOT NULL, -- Cron schedule, time, conditions
    action_config JSONB NOT NULL, -- What actions to take
    is_active BOOLEAN DEFAULT true,
    last_run_at TIMESTAMP,
    next_run_at TIMESTAMP,
    run_count INTEGER DEFAULT 0,
    success_count INTEGER DEFAULT 0,
    failure_count INTEGER DEFAULT 0,
    last_error TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER NOT NULL,
    CONSTRAINT fk_workflow_automation_creator FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Workflow Documents table - store and track documents related to projects
CREATE TABLE IF NOT EXISTS workflow_documents (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL,
    document_name VARCHAR(255) NOT NULL,
    document_type workflow_document_type DEFAULT 'other',
    file_path VARCHAR(500),
    file_size BIGINT,
    mime_type VARCHAR(100),
    source_type VARCHAR(50), -- 'lead', 'uploaded', 'generated'
    source_reference VARCHAR(255), -- Reference to original source
    description TEXT,
    version VARCHAR(20) DEFAULT '1.0',
    is_latest_version BOOLEAN DEFAULT true,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    uploaded_by INTEGER NOT NULL,
    CONSTRAINT fk_workflow_document_project FOREIGN KEY (project_id) REFERENCES workflow_projects(id) ON DELETE CASCADE,
    CONSTRAINT fk_workflow_document_uploader FOREIGN KEY (uploaded_by) REFERENCES users(id)
);

-- Lead Project Transitions table - track handoffs from leads to projects
CREATE TABLE IF NOT EXISTS lead_project_transitions (
    id SERIAL PRIMARY KEY,
    lead_id INTEGER NOT NULL,
    project_id INTEGER NOT NULL,
    transition_type VARCHAR(20) DEFAULT 'automatic', -- 'automatic', 'manual'
    transition_reason TEXT,
    lead_completion_date TIMESTAMP,
    project_creation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    handoff_notes TEXT,
    created_by INTEGER NOT NULL,
    CONSTRAINT fk_transition_project FOREIGN KEY (project_id) REFERENCES workflow_projects(id) ON DELETE CASCADE,
    CONSTRAINT fk_transition_creator FOREIGN KEY (created_by) REFERENCES users(id),
    UNIQUE(lead_id, project_id)
);

-- Create indexes for workflow tables
CREATE INDEX IF NOT EXISTS idx_workflow_projects_source ON workflow_projects(source_type, source_id);
CREATE INDEX IF NOT EXISTS idx_workflow_projects_status ON workflow_projects(status);
CREATE INDEX IF NOT EXISTS idx_workflow_projects_type ON workflow_projects(project_type);
CREATE INDEX IF NOT EXISTS idx_workflow_steps_project ON workflow_steps(project_id);
CREATE INDEX IF NOT EXISTS idx_workflow_steps_status ON workflow_steps(status);
CREATE INDEX IF NOT EXISTS idx_workflow_steps_assigned ON workflow_steps(assigned_to);
CREATE INDEX IF NOT EXISTS idx_workflow_comments_project ON workflow_comments(project_id);
CREATE INDEX IF NOT EXISTS idx_workflow_comments_step ON workflow_comments(step_id);
CREATE INDEX IF NOT EXISTS idx_workflow_notifications_recipient ON workflow_notifications(recipient_id, is_read);
CREATE INDEX IF NOT EXISTS idx_workflow_notifications_created ON workflow_notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_workflow_automations_active ON workflow_automations(is_active, next_run_at);
CREATE INDEX IF NOT EXISTS idx_workflow_documents_project ON workflow_documents(project_id);
CREATE INDEX IF NOT EXISTS idx_lead_transitions_lead ON lead_project_transitions(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_transitions_project ON lead_project_transitions(project_id);

-- Create a comprehensive view for project summary with stats
CREATE OR REPLACE VIEW workflow_project_summary AS
SELECT
    p.*,
    pm.name as project_manager_name,
    creator.name as creator_name,
    COALESCE(step_stats.total_steps, 0) as total_steps,
    COALESCE(step_stats.completed_steps, 0) as completed_steps,
    COALESCE(step_stats.active_steps, 0) as active_steps,
    COALESCE(step_stats.pending_steps, 0) as pending_steps,
    COALESCE(comment_stats.total_comments, 0) as total_comments,
    COALESCE(doc_stats.total_documents, 0) as total_documents
FROM workflow_projects p
LEFT JOIN users pm ON p.project_manager_id = pm.id
LEFT JOIN users creator ON p.created_by = creator.id
LEFT JOIN (
    SELECT
        project_id,
        COUNT(*) as total_steps,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_steps,
        SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as active_steps,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_steps
    FROM workflow_steps
    GROUP BY project_id
) step_stats ON p.id = step_stats.project_id
LEFT JOIN (
    SELECT
        project_id,
        COUNT(*) as total_comments
    FROM workflow_comments
    GROUP BY project_id
) comment_stats ON p.id = comment_stats.project_id
LEFT JOIN (
    SELECT
        project_id,
        COUNT(*) as total_documents
    FROM workflow_documents
    GROUP BY project_id
) doc_stats ON p.id = doc_stats.project_id;

-- Trigger function to update project progress based on step completion
CREATE OR REPLACE FUNCTION update_project_progress()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE workflow_projects
    SET
        progress_percentage = COALESCE((
            SELECT ROUND((SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END)::DECIMAL / COUNT(*)) * 100)
            FROM workflow_steps
            WHERE project_id = COALESCE(NEW.project_id, OLD.project_id)
        ), 0),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = COALESCE(NEW.project_id, OLD.project_id);

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create triggers for project progress updates
DROP TRIGGER IF EXISTS trigger_update_project_progress_insert ON workflow_steps;
CREATE TRIGGER trigger_update_project_progress_insert
    AFTER INSERT ON workflow_steps
    FOR EACH ROW EXECUTE FUNCTION update_project_progress();

DROP TRIGGER IF EXISTS trigger_update_project_progress_update ON workflow_steps;
CREATE TRIGGER trigger_update_project_progress_update
    AFTER UPDATE ON workflow_steps
    FOR EACH ROW EXECUTE FUNCTION update_project_progress();

DROP TRIGGER IF EXISTS trigger_update_project_progress_delete ON workflow_steps;
CREATE TRIGGER trigger_update_project_progress_delete
    AFTER DELETE ON workflow_steps
    FOR EACH ROW EXECUTE FUNCTION update_project_progress();

-- Trigger function to update updated_at timestamp for workflow tables
CREATE OR REPLACE FUNCTION update_workflow_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at on workflow tables
DROP TRIGGER IF EXISTS trigger_workflow_projects_updated_at ON workflow_projects;
CREATE TRIGGER trigger_workflow_projects_updated_at
    BEFORE UPDATE ON workflow_projects
    FOR EACH ROW EXECUTE FUNCTION update_workflow_modified_column();

DROP TRIGGER IF EXISTS trigger_workflow_steps_updated_at ON workflow_steps;
CREATE TRIGGER trigger_workflow_steps_updated_at
    BEFORE UPDATE ON workflow_steps
    FOR EACH ROW EXECUTE FUNCTION update_workflow_modified_column();

DROP TRIGGER IF EXISTS trigger_workflow_comments_updated_at ON workflow_comments;
CREATE TRIGGER trigger_workflow_comments_updated_at
    BEFORE UPDATE ON workflow_comments
    FOR EACH ROW EXECUTE FUNCTION update_workflow_modified_column();

DROP TRIGGER IF EXISTS trigger_workflow_automations_updated_at ON workflow_automations;
CREATE TRIGGER trigger_workflow_automations_updated_at
    BEFORE UPDATE ON workflow_automations
    FOR EACH ROW EXECUTE FUNCTION update_workflow_modified_column();

-- Insert sample automation tasks for FinOps
INSERT INTO workflow_automations (automation_name, automation_type, target_type, schedule_config, action_config, created_by)
VALUES
(
    'Daily Transaction Reconciliation',
    'daily_task',
    'system',
    '{"time": "05:00", "days": ["monday", "tuesday", "wednesday", "thursday", "friday"], "timezone": "Asia/Kolkata"}',
    '{"task": "reconcile_transactions", "alert_on_failure": true, "timeout": 30}',
    1
),
(
    'Pre-5AM File Processing Check',
    'scheduled_check',
    'system',
    '{"time": "04:45", "days": ["monday", "tuesday", "wednesday", "thursday", "friday"], "timezone": "Asia/Kolkata"}',
    '{"task": "check_file_processing", "alert_on_failure": true, "escalate_after": 15}',
    1
),
(
    'FinOps Team Follow-up Reminder',
    'notification',
    'system',
    '{"time": "09:00", "days": ["monday", "tuesday", "wednesday", "thursday", "friday"], "timezone": "Asia/Kolkata"}',
    '{"task": "send_followup_reminder", "recipients": ["finops_team"], "include_lead_data": true}',
    1
)
ON CONFLICT DO NOTHING;

-- Insert sample FinOps task data
INSERT INTO finops_tasks (
    task_name, description, assigned_to, reporting_managers, escalation_managers,
    effective_from, duration, is_active, created_by
) VALUES (
    'CLEARING - FILE TRANSFER AND VALIDATION',
    'clearing daily steps for file transfer',
    'John Durairaj',
    '["Albert", "Hari"]'::jsonb,
    '["Albert", "Hari"]'::jsonb,
    CURRENT_DATE,
    'daily',
    true,
    1
) ON CONFLICT DO NOTHING;

-- Insert sample subtasks for the main task with enhanced tracking
INSERT INTO finops_subtasks (task_id, name, description, sla_hours, sla_minutes, start_time, order_position, status, assigned_to)
SELECT
    t.id,
    unnest(ARRAY[
        'RBL DUMP VS TCP DATA (DAILY ALERT MAIL) VS DAILY STATUS FILE COUNT',
        'MASTER AND VISA FILE VALIDATION',
        'VISA - VALIDATION OF THE BASE 2 FILE',
        'SHARING OF THE FILE TO M2P',
        'MASTER - IPM FILE - upload the file in TDG, count check, change format as clearing upload tool',
        'MASTER - IPM FILE - upload in clearing optimizer and run, report check if rejections present validation to be done and run again',
        'MASTER - IPM FILE - saving no error file in TDG in original format and paste it in end point folder',
        'MASTER - IPM FILE - login MFE, check for no error file and delete in endpoint folder and transfer the file to network'
    ]),
    unnest(ARRAY[
        'Daily reconciliation check',
        'Validate master and visa files',
        'Base 2 file validation for Visa',
        'Share validated files to M2P',
        'IPM file processing in TDG',
        'Clearing optimizer processing',
        'Save processed files to endpoint',
        'Final file transfer to network'
    ]),
    unnest(ARRAY[2, 1, 0, 0, 1, 2, 0, 1]),
    unnest(ARRAY[30, 0, 45, 30, 30, 0, 30, 0]),
    unnest(ARRAY['05:00:00'::TIME, '05:30:00'::TIME, '06:00:00'::TIME, '06:30:00'::TIME, '07:00:00'::TIME, '08:00:00'::TIME, '09:00:00'::TIME, '09:30:00'::TIME]),
    unnest(ARRAY[0, 1, 2, 3, 4, 5, 6, 7]),
    unnest(ARRAY['completed', 'in_progress', 'pending', 'pending', 'pending', 'pending', 'pending', 'pending']),
    t.assigned_to
FROM finops_tasks t
WHERE t.task_name = 'CLEARING - FILE TRANSFER AND VALIDATION'
AND NOT EXISTS (SELECT 1 FROM finops_subtasks WHERE task_id = t.id);
