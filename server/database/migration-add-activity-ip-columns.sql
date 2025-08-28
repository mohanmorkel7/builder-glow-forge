-- Migration: Add ip_address and user_agent columns to finops_activity_log
-- This fixes the error when logging activity with ip_address and user_agent data

BEGIN;

-- Add ip_address column if it doesn't exist
ALTER TABLE finops_activity_log 
ADD COLUMN IF NOT EXISTS ip_address VARCHAR(100);

-- Add user_agent column if it doesn't exist  
ALTER TABLE finops_activity_log 
ADD COLUMN IF NOT EXISTS user_agent VARCHAR(500);

-- Add index for performance on ip_address lookups (optional but good practice)
CREATE INDEX IF NOT EXISTS idx_finops_activity_log_ip ON finops_activity_log (ip_address);

COMMIT;
