-- Migration: Fix lead_chats foreign key to reference lead_steps instead of template_steps
-- Date: 2025-08-08

-- Drop the existing foreign key constraint
ALTER TABLE lead_chats DROP CONSTRAINT IF EXISTS lead_chats_step_id_fkey;

-- Add the new foreign key constraint to reference lead_steps
ALTER TABLE lead_chats ADD CONSTRAINT lead_chats_step_id_fkey 
    FOREIGN KEY (step_id) REFERENCES lead_steps(id) ON DELETE CASCADE;

-- Add comment for documentation
COMMENT ON CONSTRAINT lead_chats_step_id_fkey ON lead_chats IS 'Chat messages belong to lead steps, not template steps';
