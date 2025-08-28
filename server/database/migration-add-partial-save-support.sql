-- Migration: Add partial save support to leads table

-- Add is_partial column to track partially saved leads
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS is_partial BOOLEAN DEFAULT false;

-- Add partial_data column to store incomplete lead data
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS partial_data JSONB DEFAULT '{}'::jsonb;

-- Add index for faster queries of partial leads
CREATE INDEX IF NOT EXISTS idx_leads_is_partial ON leads(is_partial) WHERE is_partial = true;

-- Allow client_name to be NULL for partial leads
ALTER TABLE leads
ALTER COLUMN client_name DROP NOT NULL;

-- Add constraint to ensure complete leads have required fields
ALTER TABLE leads
ADD CONSTRAINT check_complete_lead_required_fields
CHECK (
    (is_partial = true) OR
    (is_partial = false AND client_name IS NOT NULL)
);

-- Update existing leads to mark them as complete
UPDATE leads SET is_partial = false WHERE is_partial IS NULL;
