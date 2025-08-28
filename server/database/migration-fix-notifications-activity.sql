-- Migration to fix notifications and activity logs tables for production routes compatibility

-- 1. Update notifications table to include missing fields needed by production routes
ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS client_id INTEGER REFERENCES clients(id),
ADD COLUMN IF NOT EXISTS entity_type VARCHAR(50),
ADD COLUMN IF NOT EXISTS entity_id VARCHAR(50),
ADD COLUMN IF NOT EXISTS action_url TEXT,
ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'medium',
ADD COLUMN IF NOT EXISTS read BOOLEAN DEFAULT false;

-- Update existing records to have read column set based on read_at
UPDATE notifications SET read = (read_at IS NOT NULL) WHERE read IS NULL;

-- 2. Create activity_logs table as an alias/view for finops_activity_log
-- Since production routes expect activity_logs but schema has finops_activity_log

-- First check if activity_logs table exists, if not create it
CREATE TABLE IF NOT EXISTS activity_logs (
    id SERIAL PRIMARY KEY,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(100) NOT NULL,
    entity_name VARCHAR(255),
    user_id INTEGER REFERENCES users(id),
    client_id INTEGER REFERENCES clients(id),
    details TEXT,
    changes JSONB,
    status VARCHAR(50),
    previous_status VARCHAR(50),
    delay_reason VARCHAR(255)
);

-- 3. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_activity_logs_timestamp ON activity_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity ON activity_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_client ON activity_logs(client_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON activity_logs(action);

-- 4. Update notifications table indexes
CREATE INDEX IF NOT EXISTS idx_notifications_client ON notifications(client_id);
CREATE INDEX IF NOT EXISTS idx_notifications_entity ON notifications(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_priority ON notifications(priority);

-- 5. Insert some sample activity logs for testing (optional)
INSERT INTO activity_logs (action, entity_type, entity_id, entity_name, user_id, details, status)
VALUES 
    ('task_created', 'task', 'finops_001', 'Daily Reconciliation Task', 1, 'Created new FinOps daily reconciliation task', 'active'),
    ('subtask_status_changed', 'subtask', 'st_001', 'File Validation Subtask', 1, 'Status changed from pending to in_progress', 'in_progress'),
    ('sla_alert', 'task', 'finops_002', 'Weekly Reporting Task', 1, 'SLA warning - task approaching deadline', 'in_progress')
ON CONFLICT DO NOTHING;

-- 6. Insert some sample notifications for testing (optional)
INSERT INTO notifications (user_id, title, description, type, priority, read, client_id, entity_type, entity_id)
VALUES 
    (1, 'Task Overdue Alert', 'Daily reconciliation task is overdue by 2 hours', 'overdue', 'high', false, 1, 'task', 'finops_001'),
    (1, 'New Task Assignment', 'You have been assigned a new FinOps task', 'task_assigned', 'medium', false, 1, 'task', 'finops_003'),
    (1, 'SLA Breach Warning', 'Task approaching SLA deadline in 15 minutes', 'sla_alert', 'high', false, 2, 'task', 'finops_002')
ON CONFLICT DO NOTHING;

COMMIT;
