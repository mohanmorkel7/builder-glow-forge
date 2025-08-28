-- Ticketing System Database Schema

-- Table for ticket categories
CREATE TABLE IF NOT EXISTS ticket_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    color VARCHAR(7) DEFAULT '#6B7280', -- Hex color for UI
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table for ticket priorities
CREATE TABLE IF NOT EXISTS ticket_priorities (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE, -- Low, Medium, High, Critical
    level INTEGER NOT NULL UNIQUE, -- 1, 2, 3, 4 for sorting
    color VARCHAR(7) DEFAULT '#6B7280',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table for ticket statuses
CREATE TABLE IF NOT EXISTS ticket_statuses (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE, -- Open, In Progress, Resolved, Closed
    color VARCHAR(7) DEFAULT '#6B7280',
    is_closed BOOLEAN DEFAULT FALSE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Main tickets table
CREATE TABLE IF NOT EXISTS tickets (
    id SERIAL PRIMARY KEY,
    track_id VARCHAR(20) NOT NULL UNIQUE, -- Auto-generated unique track ID (TKT-XXXX)
    subject VARCHAR(255) NOT NULL,
    description TEXT,
    priority_id INTEGER REFERENCES ticket_priorities(id),
    status_id INTEGER REFERENCES ticket_statuses(id) DEFAULT 1,
    category_id INTEGER REFERENCES ticket_categories(id),
    
    -- User relationships
    created_by INTEGER REFERENCES users(id),
    assigned_to INTEGER REFERENCES users(id),
    
    -- Lead/Client relationships (optional)
    related_lead_id INTEGER REFERENCES leads(id),
    related_client_id INTEGER REFERENCES clients(id),
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP,
    closed_at TIMESTAMP,
    
    -- Additional metadata
    estimated_hours DECIMAL(5,2),
    actual_hours DECIMAL(5,2),
    tags TEXT[], -- Array of tags
    custom_fields JSONB -- Flexible custom fields
);

-- Table for ticket comments/chat
CREATE TABLE IF NOT EXISTS ticket_comments (
    id SERIAL PRIMARY KEY,
    ticket_id INTEGER REFERENCES tickets(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id),
    content TEXT NOT NULL,
    is_internal BOOLEAN DEFAULT FALSE, -- Internal comments vs customer-facing
    parent_comment_id INTEGER REFERENCES ticket_comments(id), -- For threaded discussions
    mentions TEXT[], -- Array of mentioned user IDs or track IDs
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    edited_at TIMESTAMP
);

-- Table for ticket attachments
CREATE TABLE IF NOT EXISTS ticket_attachments (
    id SERIAL PRIMARY KEY,
    ticket_id INTEGER REFERENCES tickets(id) ON DELETE CASCADE,
    comment_id INTEGER REFERENCES ticket_comments(id) ON DELETE CASCADE, -- Optional: attachment linked to specific comment
    user_id INTEGER REFERENCES users(id),
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT,
    mime_type VARCHAR(100),
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table for ticket activity log
CREATE TABLE IF NOT EXISTS ticket_activities (
    id SERIAL PRIMARY KEY,
    ticket_id INTEGER REFERENCES tickets(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id),
    action VARCHAR(100) NOT NULL, -- created, updated, assigned, status_changed, etc.
    field_name VARCHAR(100), -- Which field was changed
    old_value TEXT, -- Previous value
    new_value TEXT, -- New value
    description TEXT, -- Human readable description
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table for ticket notifications
CREATE TABLE IF NOT EXISTS ticket_notifications (
    id SERIAL PRIMARY KEY,
    ticket_id INTEGER REFERENCES tickets(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- assigned, mentioned, status_changed, comment_added
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP
);

-- Table for ticket watchers (users who want to be notified about ticket updates)
CREATE TABLE IF NOT EXISTS ticket_watchers (
    id SERIAL PRIMARY KEY,
    ticket_id INTEGER REFERENCES tickets(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(ticket_id, user_id)
);

-- Insert default priorities
INSERT INTO ticket_priorities (name, level, color) VALUES 
    ('Low', 1, '#10B981'),
    ('Medium', 2, '#F59E0B'),
    ('High', 3, '#EF4444'),
    ('Critical', 4, '#DC2626')
ON CONFLICT (name) DO NOTHING;

-- Insert default statuses
INSERT INTO ticket_statuses (name, color, is_closed, sort_order) VALUES 
    ('Open', '#3B82F6', FALSE, 1),
    ('In Progress', '#F59E0B', FALSE, 2),
    ('Pending', '#8B5CF6', FALSE, 3),
    ('Resolved', '#10B981', TRUE, 4),
    ('Closed', '#6B7280', TRUE, 5)
ON CONFLICT (name) DO NOTHING;

-- Insert default categories
INSERT INTO ticket_categories (name, description, color) VALUES 
    ('Technical Issue', 'Technical problems and bugs', '#EF4444'),
    ('Feature Request', 'New feature requests and enhancements', '#3B82F6'),
    ('Support', 'General support and questions', '#10B981'),
    ('Documentation', 'Documentation related tickets', '#8B5CF6'),
    ('Training', 'Training and onboarding related', '#F59E0B')
ON CONFLICT (name) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tickets_track_id ON tickets(track_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status_id);
CREATE INDEX IF NOT EXISTS idx_tickets_priority ON tickets(priority_id);
CREATE INDEX IF NOT EXISTS idx_tickets_assigned_to ON tickets(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tickets_created_by ON tickets(created_by);
CREATE INDEX IF NOT EXISTS idx_tickets_created_at ON tickets(created_at);
CREATE INDEX IF NOT EXISTS idx_ticket_comments_ticket_id ON ticket_comments(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_comments_created_at ON ticket_comments(created_at);
CREATE INDEX IF NOT EXISTS idx_ticket_attachments_ticket_id ON ticket_attachments(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_activities_ticket_id ON ticket_activities(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_notifications_user_id ON ticket_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_ticket_notifications_is_read ON ticket_notifications(is_read);

-- Function to auto-generate track_id
CREATE OR REPLACE FUNCTION generate_track_id() RETURNS TEXT AS $$
DECLARE
    new_id TEXT;
    done BOOLEAN := FALSE;
BEGIN
    WHILE NOT done LOOP
        new_id := 'TKT-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
        
        IF NOT EXISTS (SELECT 1 FROM tickets WHERE track_id = new_id) THEN
            done := TRUE;
        END IF;
    END LOOP;
    
    RETURN new_id;
END;
$$ LANGUAGE plpgsql;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_tickets_updated_at BEFORE UPDATE ON tickets 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ticket_categories_updated_at BEFORE UPDATE ON ticket_categories 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ticket_comments_updated_at BEFORE UPDATE ON ticket_comments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to auto-assign track_id before insert
CREATE OR REPLACE FUNCTION assign_track_id() RETURNS TRIGGER AS $$
BEGIN
    IF NEW.track_id IS NULL OR NEW.track_id = '' THEN
        NEW.track_id := generate_track_id();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-assign track_id
CREATE TRIGGER assign_ticket_track_id BEFORE INSERT ON tickets 
    FOR EACH ROW EXECUTE FUNCTION assign_track_id();
