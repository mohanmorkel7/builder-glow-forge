-- Fix foreign key constraints for better data integrity
-- This script updates the follow_ups table to properly handle lead deletions

-- Drop the existing foreign key constraint and recreate with CASCADE
ALTER TABLE follow_ups DROP CONSTRAINT IF EXISTS follow_ups_lead_id_fkey;
ALTER TABLE follow_ups ADD CONSTRAINT follow_ups_lead_id_fkey 
    FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE;

-- Also ensure client_id constraint has CASCADE
ALTER TABLE follow_ups DROP CONSTRAINT IF EXISTS follow_ups_client_id_fkey;
ALTER TABLE follow_ups ADD CONSTRAINT follow_ups_client_id_fkey 
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE;

-- Add timestamps with IST timezone support
ALTER TABLE follow_ups ALTER COLUMN created_at SET DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata');
ALTER TABLE follow_ups ALTER COLUMN updated_at SET DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata');

-- Update lead_chats to use IST
ALTER TABLE lead_chats ALTER COLUMN created_at SET DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata');

-- Update lead_steps to use IST  
ALTER TABLE lead_steps ALTER COLUMN created_at SET DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata');
ALTER TABLE lead_steps ALTER COLUMN updated_at SET DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata');

-- Update leads to use IST
ALTER TABLE leads ALTER COLUMN created_at SET DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata');
ALTER TABLE leads ALTER COLUMN updated_at SET DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata');
