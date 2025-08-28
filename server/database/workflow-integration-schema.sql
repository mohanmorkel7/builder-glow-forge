-- Integrated Workflow Schema for Lead-Product-FinOps Integration
-- This schema handles the handoff and integration between different modules

-- Workflow Projects table - connects leads to product and finops work
CREATE TABLE IF NOT EXISTS workflow_projects (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    source_type ENUM('lead', 'manual') NOT NULL DEFAULT 'lead',
    source_id INTEGER, -- references leads.id when source_type = 'lead'
    project_type ENUM('product_development', 'finops_process', 'integration') NOT NULL,
    status ENUM('created', 'in_progress', 'review', 'completed', 'on_hold', 'cancelled') DEFAULT 'created',
    priority ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
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
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by INTEGER NOT NULL,
    FOREIGN KEY (project_manager_id) REFERENCES users(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    INDEX idx_source (source_type, source_id),
    INDEX idx_status (status),
    INDEX idx_project_type (project_type)
);

-- Workflow Steps table - custom steps for each project (like lead steps)
CREATE TABLE IF NOT EXISTS workflow_steps (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL,
    step_name VARCHAR(255) NOT NULL,
    step_description TEXT,
    step_order INTEGER NOT NULL DEFAULT 1,
    status ENUM('pending', 'in_progress', 'completed', 'blocked', 'cancelled') DEFAULT 'pending',
    assigned_to INTEGER,
    estimated_hours DECIMAL(5,2),
    actual_hours DECIMAL(5,2),
    start_date DATETIME,
    due_date DATETIME,
    completion_date DATETIME,
    dependencies TEXT, -- JSON array of step IDs this step depends on
    is_automated BOOLEAN DEFAULT false,
    automation_config JSON, -- Configuration for automated steps (time, conditions, etc.)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by INTEGER NOT NULL,
    FOREIGN KEY (project_id) REFERENCES workflow_projects(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_to) REFERENCES users(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    INDEX idx_project_status (project_id, status),
    INDEX idx_assigned (assigned_to),
    INDEX idx_due_date (due_date)
);

-- Workflow Comments table - chat and collaboration
CREATE TABLE IF NOT EXISTS workflow_comments (
    id SERIAL PRIMARY KEY,
    project_id INTEGER,
    step_id INTEGER,
    comment_text TEXT NOT NULL,
    comment_type ENUM('comment', 'status_update', 'assignment', 'alert', 'system') DEFAULT 'comment',
    mentioned_users JSON, -- Array of user IDs mentioned in the comment
    attachments JSON, -- Array of file URLs/paths
    is_internal BOOLEAN DEFAULT false, -- true for internal team comments, false for client-visible
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by INTEGER NOT NULL,
    FOREIGN KEY (project_id) REFERENCES workflow_projects(id) ON DELETE CASCADE,
    FOREIGN KEY (step_id) REFERENCES workflow_steps(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id),
    INDEX idx_project (project_id),
    INDEX idx_step (step_id),
    INDEX idx_created_at (created_at)
);

-- Workflow Notifications table - alerts and notifications
CREATE TABLE IF NOT EXISTS workflow_notifications (
    id SERIAL PRIMARY KEY,
    notification_type ENUM('step_overdue', 'project_delayed', 'assignment', 'mention', 'process_failed', 'daily_task', 'system_alert') NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    recipient_id INTEGER NOT NULL,
    project_id INTEGER,
    step_id INTEGER,
    source_type ENUM('lead', 'product', 'finops', 'system') NOT NULL,
    source_id INTEGER,
    priority ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
    is_read BOOLEAN DEFAULT false,
    is_email_sent BOOLEAN DEFAULT false,
    scheduled_for DATETIME, -- for future/scheduled notifications
    expires_at DATETIME, -- when notification becomes irrelevant
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP NULL,
    FOREIGN KEY (recipient_id) REFERENCES users(id),
    FOREIGN KEY (project_id) REFERENCES workflow_projects(id) ON DELETE CASCADE,
    FOREIGN KEY (step_id) REFERENCES workflow_steps(id) ON DELETE CASCADE,
    INDEX idx_recipient_unread (recipient_id, is_read),
    INDEX idx_scheduled (scheduled_for),
    INDEX idx_created_at (created_at)
);

-- Workflow Automations table - for scheduled and automated tasks
CREATE TABLE IF NOT EXISTS workflow_automations (
    id SERIAL PRIMARY KEY,
    automation_name VARCHAR(255) NOT NULL,
    automation_type ENUM('daily_task', 'scheduled_check', 'conditional_trigger', 'notification') NOT NULL,
    target_type ENUM('step', 'project', 'system') NOT NULL,
    target_id INTEGER,
    schedule_config JSON NOT NULL, -- cron-like schedule or conditions
    action_config JSON NOT NULL, -- what action to take
    is_active BOOLEAN DEFAULT true,
    last_run_at TIMESTAMP NULL,
    next_run_at TIMESTAMP NULL,
    run_count INTEGER DEFAULT 0,
    success_count INTEGER DEFAULT 0,
    failure_count INTEGER DEFAULT 0,
    last_error TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by INTEGER NOT NULL,
    FOREIGN KEY (created_by) REFERENCES users(id),
    INDEX idx_next_run (next_run_at, is_active),
    INDEX idx_automation_type (automation_type)
);

-- Project Documents table - links documents from leads and adds new ones
CREATE TABLE IF NOT EXISTS workflow_documents (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL,
    document_name VARCHAR(255) NOT NULL,
    document_type ENUM('requirement', 'specification', 'design', 'report', 'contract', 'other') NOT NULL,
    file_path VARCHAR(500),
    file_size INTEGER,
    mime_type VARCHAR(100),
    source_type ENUM('lead', 'uploaded', 'generated') DEFAULT 'uploaded',
    source_reference VARCHAR(255), -- lead document ID or other reference
    description TEXT,
    version VARCHAR(20) DEFAULT '1.0',
    is_latest_version BOOLEAN DEFAULT true,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    uploaded_by INTEGER NOT NULL,
    FOREIGN KEY (project_id) REFERENCES workflow_projects(id) ON DELETE CASCADE,
    FOREIGN KEY (uploaded_by) REFERENCES users(id),
    INDEX idx_project (project_id),
    INDEX idx_source (source_type, source_reference)
);

-- Lead to Project mapping table
CREATE TABLE IF NOT EXISTS lead_project_transitions (
    id SERIAL PRIMARY KEY,
    lead_id INTEGER NOT NULL,
    project_id INTEGER NOT NULL,
    transition_type ENUM('automatic', 'manual') DEFAULT 'manual',
    transition_reason TEXT,
    lead_completion_date DATETIME,
    project_creation_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    handoff_notes TEXT,
    created_by INTEGER NOT NULL,
    FOREIGN KEY (lead_id) REFERENCES leads(id),
    FOREIGN KEY (project_id) REFERENCES workflow_projects(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    UNIQUE KEY unique_lead_project (lead_id, project_id),
    INDEX idx_lead (lead_id),
    INDEX idx_project (project_id)
);

-- Create views for easier querying
CREATE VIEW workflow_project_summary AS
SELECT 
    wp.*,
    u1.name as project_manager_name,
    u2.name as creator_name,
    COUNT(DISTINCT ws.id) as total_steps,
    COUNT(DISTINCT CASE WHEN ws.status = 'completed' THEN ws.id END) as completed_steps,
    COUNT(DISTINCT CASE WHEN ws.status = 'in_progress' THEN ws.id END) as active_steps,
    COUNT(DISTINCT CASE WHEN ws.status = 'pending' THEN ws.id END) as pending_steps,
    COUNT(DISTINCT wc.id) as total_comments,
    COUNT(DISTINCT wd.id) as total_documents
FROM workflow_projects wp
LEFT JOIN users u1 ON wp.project_manager_id = u1.id
LEFT JOIN users u2 ON wp.created_by = u2.id
LEFT JOIN workflow_steps ws ON wp.id = ws.project_id
LEFT JOIN workflow_comments wc ON wp.id = wc.project_id
LEFT JOIN workflow_documents wd ON wp.id = wd.project_id
GROUP BY wp.id;

-- Insert sample workflow automations for FinOps
INSERT INTO workflow_automations (automation_name, automation_type, target_type, schedule_config, action_config, created_by) VALUES
('Daily Transaction Reconciliation', 'daily_task', 'system', 
 '{"time": "05:00", "days": ["monday", "tuesday", "wednesday", "thursday", "friday"]}',
 '{"action": "run_reconciliation", "notify_on_failure": true, "timeout_minutes": 30}', 1),

('Pre-5AM File Processing Check', 'scheduled_check', 'system',
 '{"time": "04:45", "days": ["monday", "tuesday", "wednesday", "thursday", "friday"]}',
 '{"action": "check_file_processing", "alert_if_not_ready": true, "escalate_after_minutes": 15}', 1),

('FinOps Daily Status Report', 'daily_task', 'system',
 '{"time": "09:00", "days": ["monday", "tuesday", "wednesday", "thursday", "friday"]}',
 '{"action": "generate_daily_report", "recipients": ["finops_team"], "include_metrics": true}', 1),

('Overdue Task Alerts', 'scheduled_check', 'step',
 '{"frequency": "every_hour", "hours": [9, 12, 15, 18]}',
 '{"action": "check_overdue_tasks", "alert_assignee": true, "alert_manager": true, "escalate_after_hours": 4}', 1);

-- Insert sample project templates
INSERT INTO workflow_projects (name, description, project_type, status, priority, assigned_team, estimated_hours, created_by) VALUES
('Lead-to-Product Template', 'Template for converting completed leads into product development projects', 'product_development', 'created', 'high', 'Product Team', 120, 1),
('FinOps Daily Operations', 'Template for daily financial operations and reconciliation processes', 'finops_process', 'in_progress', 'critical', 'FinOps Team', 40, 1);

-- Insert sample automation steps for the FinOps template
INSERT INTO workflow_steps (project_id, step_name, step_description, step_order, is_automated, automation_config, created_by) VALUES
(2, 'Daily Transaction Reconciliation', 'Run automated transaction reconciliation at 5:00 AM daily', 1, true, 
 '{"schedule": "0 5 * * 1-5", "timeout": 30, "retry_count": 3, "alert_on_failure": true}', 1),
(2, 'File Processing Check', 'Verify all files are processed before 5:00 AM cutoff', 2, true,
 '{"schedule": "45 4 * * 1-5", "timeout": 10, "alert_on_failure": true, "escalate_after": 15}', 1),
(2, 'Team Follow-up', 'Follow up with FinOps team members on daily tasks', 3, false, null, 1),
(2, 'Lead Team Notification', 'Notify lead team of any processing issues or delays', 4, true,
 '{"condition": "if_failures", "recipients": ["lead_team", "finops_team"], "priority": "high"}', 1);

-- Create triggers for automatic notifications
DELIMITER //

CREATE TRIGGER workflow_step_overdue_check
AFTER UPDATE ON workflow_steps
FOR EACH ROW
BEGIN
    IF NEW.due_date < NOW() AND NEW.status NOT IN ('completed', 'cancelled') AND OLD.due_date >= NOW() THEN
        INSERT INTO workflow_notifications (
            notification_type, title, message, recipient_id, project_id, step_id, 
            source_type, priority, created_at
        ) VALUES (
            'step_overdue',
            CONCAT('Step Overdue: ', NEW.step_name),
            CONCAT('Step "', NEW.step_name, '" is now overdue. Please take action.'),
            NEW.assigned_to,
            NEW.project_id,
            NEW.id,
            'system',
            'high',
            NOW()
        );
    END IF;
END//

CREATE TRIGGER workflow_project_progress_update
AFTER UPDATE ON workflow_steps
FOR EACH ROW
BEGIN
    IF NEW.status != OLD.status THEN
        -- Update project progress
        UPDATE workflow_projects SET 
            progress_percentage = (
                SELECT ROUND(
                    (COUNT(CASE WHEN status = 'completed' THEN 1 END) * 100.0) / COUNT(*)
                ) FROM workflow_steps WHERE project_id = NEW.project_id
            ),
            updated_at = NOW()
        WHERE id = NEW.project_id;
        
        -- Create status update comment
        INSERT INTO workflow_comments (
            project_id, step_id, comment_text, comment_type, created_by, created_at
        ) VALUES (
            NEW.project_id,
            NEW.id,
            CONCAT('Step status changed from "', OLD.status, '" to "', NEW.status, '"'),
            'status_update',
            NEW.created_by,
            NOW()
        );
    END IF;
END//

DELIMITER ;
