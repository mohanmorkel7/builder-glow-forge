-- Integrated Workflow Schema for Lead-Product-FinOps Integration (PostgreSQL)
-- This schema handles the handoff and integration between different modules

-- Create ENUM types for PostgreSQL
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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_workflow_projects_source ON workflow_projects(source_type, source_id);
CREATE INDEX IF NOT EXISTS idx_workflow_projects_status ON workflow_projects(status);
CREATE INDEX IF NOT EXISTS idx_workflow_projects_type ON workflow_projects(project_type);

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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_workflow_steps_project ON workflow_steps(project_id);
CREATE INDEX IF NOT EXISTS idx_workflow_steps_status ON workflow_steps(status);
CREATE INDEX IF NOT EXISTS idx_workflow_steps_assigned ON workflow_steps(assigned_to);

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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_workflow_comments_project ON workflow_comments(project_id);
CREATE INDEX IF NOT EXISTS idx_workflow_comments_step ON workflow_comments(step_id);

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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_workflow_notifications_recipient ON workflow_notifications(recipient_id, is_read);
CREATE INDEX IF NOT EXISTS idx_workflow_notifications_created ON workflow_notifications(created_at);

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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_workflow_automations_active ON workflow_automations(is_active, next_run_at);

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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_workflow_documents_project ON workflow_documents(project_id);

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

-- Create indexes
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

-- Trigger function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS trigger_workflow_projects_updated_at ON workflow_projects;
CREATE TRIGGER trigger_workflow_projects_updated_at
    BEFORE UPDATE ON workflow_projects
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

DROP TRIGGER IF EXISTS trigger_workflow_steps_updated_at ON workflow_steps;
CREATE TRIGGER trigger_workflow_steps_updated_at
    BEFORE UPDATE ON workflow_steps
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

DROP TRIGGER IF EXISTS trigger_workflow_comments_updated_at ON workflow_comments;
CREATE TRIGGER trigger_workflow_comments_updated_at
    BEFORE UPDATE ON workflow_comments
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

DROP TRIGGER IF EXISTS trigger_workflow_automations_updated_at ON workflow_automations;
CREATE TRIGGER trigger_workflow_automations_updated_at
    BEFORE UPDATE ON workflow_automations
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

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

-- Grant permissions if needed
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO your_app_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO your_app_user;
