-- Migration script to update follow_ups table with missing columns and constraints

-- First, add the missing columns if they don't exist
ALTER TABLE follow_ups 
ADD COLUMN IF NOT EXISTS lead_id INTEGER REFERENCES leads(id),
ADD COLUMN IF NOT EXISTS message_id INTEGER;

-- Drop the existing constraint if it exists
ALTER TABLE follow_ups DROP CONSTRAINT IF EXISTS follow_ups_follow_up_type_check;

-- Add the follow_up_type column if it doesn't exist with new constraint
ALTER TABLE follow_ups 
ADD COLUMN IF NOT EXISTS follow_up_type VARCHAR(50) DEFAULT 'general';

-- Add the new constraint with all allowed values
ALTER TABLE follow_ups 
ADD CONSTRAINT follow_ups_follow_up_type_check 
CHECK (follow_up_type IN ('call', 'email', 'meeting', 'document', 'proposal', 'contract', 'onboarding', 'general', 'sales', 'support', 'other'));

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_follow_ups_client_id ON follow_ups(client_id);
CREATE INDEX IF NOT EXISTS idx_follow_ups_lead_id ON follow_ups(lead_id);
CREATE INDEX IF NOT EXISTS idx_follow_ups_status ON follow_ups(status);
CREATE INDEX IF NOT EXISTS idx_follow_ups_assigned_to ON follow_ups(assigned_to);
