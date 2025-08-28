-- Migration to update lead_chats foreign key to reference template_steps instead of lead_steps
-- Run this to fix the foreign key constraint issue

-- First drop the existing foreign key constraint
ALTER TABLE lead_chats DROP CONSTRAINT IF EXISTS lead_chats_step_id_fkey;

-- Add new foreign key constraint referencing template_steps
ALTER TABLE lead_chats ADD CONSTRAINT lead_chats_step_id_fkey 
    FOREIGN KEY (step_id) REFERENCES template_steps(id) ON DELETE CASCADE;

-- Update any existing records if needed (optional - only if you have data to migrate)
-- This would be needed if you have existing chat records that reference lead_steps IDs
-- and need to map them to template_steps IDs
