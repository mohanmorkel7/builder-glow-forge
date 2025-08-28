-- Migration: Add template_id field to leads table
-- Date: $(date)

-- Add template_id column to leads table
ALTER TABLE leads 
ADD COLUMN template_id INTEGER REFERENCES onboarding_templates(id);

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_leads_template_id ON leads(template_id);

-- Add comment for documentation
COMMENT ON COLUMN leads.template_id IS 'Reference to the template used when creating this lead (optional)';
