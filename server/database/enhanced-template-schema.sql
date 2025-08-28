-- Enhanced Template System with Categories

-- Template Categories Table
CREATE TABLE IF NOT EXISTS template_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    color VARCHAR(7) DEFAULT '#6B7280', -- Hex color for UI
    icon VARCHAR(50), -- Icon name for UI
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Template Types Table (for better organization)
CREATE TABLE IF NOT EXISTS template_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    category_id INTEGER REFERENCES template_categories(id),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add category support to existing templates table
ALTER TABLE templates 
ADD COLUMN IF NOT EXISTS category_id INTEGER REFERENCES template_categories(id),
ADD COLUMN IF NOT EXISTS template_type_id INTEGER REFERENCES template_types(id),
ADD COLUMN IF NOT EXISTS tags TEXT[],
ADD COLUMN IF NOT EXISTS usage_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_used_at TIMESTAMP;

-- Template Step Categories for better organization
CREATE TABLE IF NOT EXISTS step_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    color VARCHAR(7) DEFAULT '#6B7280',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Enhanced template steps with more fields
ALTER TABLE template_steps 
ADD COLUMN IF NOT EXISTS step_category_id INTEGER REFERENCES step_categories(id),
ADD COLUMN IF NOT EXISTS assigned_role VARCHAR(50), -- which role typically handles this step
ADD COLUMN IF NOT EXISTS required_documents TEXT[], -- documents required for this step
ADD COLUMN IF NOT EXISTS approval_required BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS parallel_execution BOOLEAN DEFAULT FALSE, -- can be done parallel with other steps
ADD COLUMN IF NOT EXISTS dependencies TEXT[], -- step IDs this step depends on
ADD COLUMN IF NOT EXISTS custom_fields JSONB; -- flexible custom fields

-- Template Usage Tracking
CREATE TABLE IF NOT EXISTS template_usage (
    id SERIAL PRIMARY KEY,
    template_id INTEGER REFERENCES templates(id) ON DELETE CASCADE,
    used_by INTEGER REFERENCES users(id),
    used_for_entity_type VARCHAR(50), -- 'lead', 'project', 'onboarding', etc.
    used_for_entity_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default categories
INSERT INTO template_categories (name, description, color, icon, sort_order) VALUES 
    ('Product', 'Product development and management templates', '#3B82F6', 'Package', 1),
    ('Leads', 'Lead management and sales process templates', '#10B981', 'Target', 2),
    ('FinOps', 'Financial operations and accounting templates', '#F59E0B', 'DollarSign', 3),
    ('Onboarding', 'Employee and client onboarding templates', '#8B5CF6', 'UserPlus', 4),
    ('Support', 'Customer support and service templates', '#EF4444', 'HeadphonesIcon', 5),
    ('Marketing', 'Marketing campaigns and activities', '#EC4899', 'Megaphone', 6),
    ('Operations', 'General operational processes', '#6B7280', 'Settings', 7)
ON CONFLICT (name) DO NOTHING;

-- Insert default template types
INSERT INTO template_types (name, description, category_id) VALUES 
    ('Standard Lead Process', 'Standard lead qualification and conversion process', 
     (SELECT id FROM template_categories WHERE name = 'Leads')),
    ('Enterprise Lead Process', 'Extended process for enterprise leads', 
     (SELECT id FROM template_categories WHERE name = 'Leads')),
    ('Product Launch', 'New product launch workflow', 
     (SELECT id FROM template_categories WHERE name = 'Product')),
    ('Feature Development', 'Feature development lifecycle', 
     (SELECT id FROM template_categories WHERE name = 'Product')),
    ('Monthly Reconciliation', 'Monthly financial reconciliation process', 
     (SELECT id FROM template_categories WHERE name = 'FinOps')),
    ('Invoice Processing', 'Invoice creation and processing workflow', 
     (SELECT id FROM template_categories WHERE name = 'FinOps')),
    ('Employee Onboarding', 'New employee onboarding checklist', 
     (SELECT id FROM template_categories WHERE name = 'Onboarding')),
    ('Client Onboarding', 'New client setup and onboarding', 
     (SELECT id FROM template_categories WHERE name = 'Onboarding'))
ON CONFLICT (name) DO NOTHING;

-- Insert default step categories
INSERT INTO step_categories (name, description, color) VALUES 
    ('Initial Setup', 'Initial setup and preparation steps', '#3B82F6'),
    ('Documentation', 'Documentation and paperwork steps', '#8B5CF6'),
    ('Review & Approval', 'Review and approval processes', '#F59E0B'),
    ('Communication', 'Communication and notification steps', '#10B981'),
    ('Technical', 'Technical implementation steps', '#EF4444'),
    ('Financial', 'Financial and billing related steps', '#EC4899'),
    ('Final Steps', 'Completion and wrap-up steps', '#6B7280')
ON CONFLICT (name) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_templates_category_id ON templates(category_id);
CREATE INDEX IF NOT EXISTS idx_templates_template_type_id ON templates(template_type_id);
CREATE INDEX IF NOT EXISTS idx_templates_is_active ON templates(is_active);
CREATE INDEX IF NOT EXISTS idx_template_steps_category_id ON template_steps(step_category_id);
CREATE INDEX IF NOT EXISTS idx_template_usage_template_id ON template_usage(template_id);
CREATE INDEX IF NOT EXISTS idx_template_usage_used_by ON template_usage(used_by);

-- Function to increment template usage count
CREATE OR REPLACE FUNCTION increment_template_usage(template_id_param INTEGER, user_id_param INTEGER, entity_type_param VARCHAR, entity_id_param INTEGER)
RETURNS VOID AS $$
BEGIN
    -- Update usage count
    UPDATE templates 
    SET usage_count = COALESCE(usage_count, 0) + 1,
        last_used_at = CURRENT_TIMESTAMP
    WHERE id = template_id_param;
    
    -- Log usage
    INSERT INTO template_usage (template_id, used_by, used_for_entity_type, used_for_entity_id)
    VALUES (template_id_param, user_id_param, entity_type_param, entity_id_param);
END;
$$ LANGUAGE plpgsql;

-- Function to get template statistics
CREATE OR REPLACE FUNCTION get_template_stats()
RETURNS TABLE (
    total_templates BIGINT,
    active_templates BIGINT,
    total_usage BIGINT,
    most_used_template_id INTEGER,
    most_used_template_name VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*) FROM templates) as total_templates,
        (SELECT COUNT(*) FROM templates WHERE is_active = TRUE) as active_templates,
        (SELECT COALESCE(SUM(usage_count), 0) FROM templates) as total_usage,
        (SELECT t.id FROM templates t ORDER BY t.usage_count DESC LIMIT 1) as most_used_template_id,
        (SELECT t.name FROM templates t ORDER BY t.usage_count DESC LIMIT 1) as most_used_template_name;
END;
$$ LANGUAGE plpgsql;
