-- FinOps Task Management Database Schema
-- This schema handles automated FinOps processes with SLA tracking and alerting

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
    order_position INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'overdue', 'cancelled')),
    assigned_to VARCHAR(255),
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

-- FinOps Task Runs table - Track each execution of a task
CREATE TABLE IF NOT EXISTS finops_task_runs (
    id SERIAL PRIMARY KEY,
    task_id INTEGER NOT NULL,
    run_date DATE NOT NULL,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    status VARCHAR(20) DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed', 'cancelled')),
    total_subtasks INTEGER DEFAULT 0,
    completed_subtasks INTEGER DEFAULT 0,
    overdue_subtasks INTEGER DEFAULT 0,
    run_duration_seconds INTEGER,
    triggered_by VARCHAR(50) DEFAULT 'scheduled', -- 'scheduled', 'manual', 'system'
    triggered_by_user VARCHAR(255),
    error_message TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    FOREIGN KEY (task_id) REFERENCES finops_tasks(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_finops_tasks_active ON finops_tasks(is_active, effective_from);
CREATE INDEX IF NOT EXISTS idx_finops_tasks_next_run ON finops_tasks(next_run_at);
CREATE INDEX IF NOT EXISTS idx_finops_tasks_duration ON finops_tasks(duration);
CREATE INDEX IF NOT EXISTS idx_finops_subtasks_task ON finops_subtasks(task_id);
CREATE INDEX IF NOT EXISTS idx_finops_subtasks_status ON finops_subtasks(status);
CREATE INDEX IF NOT EXISTS idx_finops_subtasks_due ON finops_subtasks(due_at);
CREATE INDEX IF NOT EXISTS idx_finops_activity_log_task ON finops_activity_log(task_id);
CREATE INDEX IF NOT EXISTS idx_finops_activity_log_timestamp ON finops_activity_log(timestamp);
CREATE INDEX IF NOT EXISTS idx_finops_alerts_active ON finops_alerts(is_active, created_at);
CREATE INDEX IF NOT EXISTS idx_finops_task_runs_date ON finops_task_runs(run_date);
CREATE INDEX IF NOT EXISTS idx_finops_task_runs_status ON finops_task_runs(status);

-- Function to calculate next run time based on duration
CREATE OR REPLACE FUNCTION calculate_next_run(duration_type VARCHAR, last_run TIMESTAMP, effective_from DATE) 
RETURNS TIMESTAMP AS $$
BEGIN
    CASE duration_type
        WHEN 'daily' THEN
            IF last_run IS NULL THEN
                RETURN (effective_from + INTERVAL '1 day')::TIMESTAMP;
            ELSE
                RETURN last_run + INTERVAL '1 day';
            END IF;
        WHEN 'weekly' THEN
            IF last_run IS NULL THEN
                RETURN (effective_from + INTERVAL '1 week')::TIMESTAMP;
            ELSE
                RETURN last_run + INTERVAL '1 week';
            END IF;
        WHEN 'monthly' THEN
            IF last_run IS NULL THEN
                RETURN (effective_from + INTERVAL '1 month')::TIMESTAMP;
            ELSE
                RETURN last_run + INTERVAL '1 month';
            END IF;
        ELSE
            RETURN (effective_from + INTERVAL '1 day')::TIMESTAMP;
    END CASE;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate subtask due time based on SLA
CREATE OR REPLACE FUNCTION calculate_subtask_due_time(started_at TIMESTAMP, sla_hours INTEGER, sla_minutes INTEGER)
RETURNS TIMESTAMP AS $$
BEGIN
    IF started_at IS NULL THEN
        RETURN NULL;
    END IF;
    
    RETURN started_at + (sla_hours * INTERVAL '1 hour') + (sla_minutes * INTERVAL '1 minute');
END;
$$ LANGUAGE plpgsql;

-- Trigger to update next_run_at when task is completed
CREATE OR REPLACE FUNCTION update_next_run_trigger()
RETURNS TRIGGER AS $$
BEGIN
    -- Update next_run_at when task status changes or is completed
    UPDATE finops_tasks 
    SET next_run_at = calculate_next_run(duration, NEW.last_run_at, effective_from),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_next_run
    AFTER UPDATE OF last_run_at ON finops_tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_next_run_trigger();

-- Trigger to update subtask due_at when started
CREATE OR REPLACE FUNCTION update_subtask_due_trigger()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculate due_at when subtask is started
    IF NEW.started_at IS NOT NULL AND OLD.started_at IS NULL THEN
        NEW.due_at = calculate_subtask_due_time(NEW.started_at, NEW.sla_hours, NEW.sla_minutes);
    END IF;
    
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_subtask_due
    BEFORE UPDATE ON finops_subtasks
    FOR EACH ROW
    EXECUTE FUNCTION update_subtask_due_trigger();

-- Function to check for SLA breaches and create alerts
CREATE OR REPLACE FUNCTION check_sla_breaches()
RETURNS void AS $$
DECLARE
    subtask_record RECORD;
    warning_time TIMESTAMP;
    task_record RECORD;
BEGIN
    -- Check for subtasks that are approaching SLA breach (15 minutes warning)
    FOR subtask_record IN 
        SELECT st.*, t.reporting_managers, t.escalation_managers, t.task_name
        FROM finops_subtasks st
        JOIN finops_tasks t ON st.task_id = t.id
        WHERE st.status = 'in_progress' 
        AND st.due_at IS NOT NULL 
        AND st.due_at <= CURRENT_TIMESTAMP + INTERVAL '15 minutes'
        AND NOT EXISTS (
            SELECT 1 FROM finops_alerts 
            WHERE task_id = st.task_id 
            AND subtask_id = st.id 
            AND alert_type = 'sla_warning'
            AND created_at > CURRENT_TIMESTAMP - INTERVAL '1 hour'
        )
    LOOP
        -- Create warning alert (15 minutes before SLA breach)
        INSERT INTO finops_alerts (
            task_id, subtask_id, alert_type, alert_level, message, recipients
        ) VALUES (
            subtask_record.task_id,
            subtask_record.id,
            'sla_warning',
            'warning',
            format('SLA Warning: Subtask "%s" in task "%s" will breach SLA in 15 minutes', 
                   subtask_record.name, subtask_record.task_name),
            subtask_record.reporting_managers
        );
    END LOOP;
    
    -- Check for subtasks that have breached SLA
    FOR subtask_record IN 
        SELECT st.*, t.escalation_managers, t.task_name
        FROM finops_subtasks st
        JOIN finops_tasks t ON st.task_id = t.id
        WHERE st.status = 'in_progress' 
        AND st.due_at IS NOT NULL 
        AND st.due_at <= CURRENT_TIMESTAMP
        AND NOT EXISTS (
            SELECT 1 FROM finops_alerts 
            WHERE task_id = st.task_id 
            AND subtask_id = st.id 
            AND alert_type = 'sla_breach'
            AND created_at > CURRENT_TIMESTAMP - INTERVAL '30 minutes'
        )
    LOOP
        -- Update subtask status to overdue
        UPDATE finops_subtasks 
        SET status = 'overdue' 
        WHERE id = subtask_record.id;
        
        -- Create escalation alert
        INSERT INTO finops_alerts (
            task_id, subtask_id, alert_type, alert_level, message, recipients
        ) VALUES (
            subtask_record.task_id,
            subtask_record.id,
            'sla_breach',
            'escalation',
            format('SLA BREACH: Subtask "%s" in task "%s" has exceeded its SLA deadline', 
                   subtask_record.name, subtask_record.task_name),
            subtask_record.escalation_managers
        );
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Insert sample data for the example task
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

-- Insert sample subtasks for the main task
INSERT INTO finops_subtasks (task_id, name, description, sla_hours, sla_minutes, order_position) 
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
    unnest(ARRAY[0, 1, 2, 3, 4, 5, 6, 7])
FROM finops_tasks t 
WHERE t.task_name = 'CLEARING - FILE TRANSFER AND VALIDATION'
ON CONFLICT DO NOTHING;

-- Create a view for task monitoring dashboard
CREATE OR REPLACE VIEW finops_task_dashboard AS
SELECT 
    t.id,
    t.task_name,
    t.description,
    t.assigned_to,
    t.duration,
    t.is_active,
    t.status as task_status,
    t.next_run_at,
    t.last_run_at,
    COUNT(st.id) as total_subtasks,
    COUNT(CASE WHEN st.status = 'completed' THEN 1 END) as completed_subtasks,
    COUNT(CASE WHEN st.status = 'in_progress' THEN 1 END) as in_progress_subtasks,
    COUNT(CASE WHEN st.status = 'pending' THEN 1 END) as pending_subtasks,
    COUNT(CASE WHEN st.status = 'overdue' THEN 1 END) as overdue_subtasks,
    CASE 
        WHEN COUNT(CASE WHEN st.status = 'overdue' THEN 1 END) > 0 THEN 'overdue'
        WHEN COUNT(CASE WHEN st.status = 'completed' THEN 1 END) = COUNT(st.id) AND COUNT(st.id) > 0 THEN 'completed'
        WHEN COUNT(CASE WHEN st.status = 'in_progress' THEN 1 END) > 0 THEN 'in_progress'
        ELSE 'pending'
    END as overall_status
FROM finops_tasks t
LEFT JOIN finops_subtasks st ON t.id = st.task_id
WHERE t.deleted_at IS NULL
GROUP BY t.id, t.task_name, t.description, t.assigned_to, t.duration, t.is_active, t.status, t.next_run_at, t.last_run_at;
