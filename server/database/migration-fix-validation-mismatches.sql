-- Migration to fix validation mismatches between database schema and application code
-- Run this on existing databases to align with updated validation requirements

-- Fix 1: Update users table role constraint to include all roles used by the application
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check 
CHECK (role IN ('admin', 'sales', 'product', 'development', 'db', 'finops', 'finance', 'hr_management', 'infra', 'switch_team'));

-- Fix 2: Update lead_steps table to include 'blocked' status used in application code
ALTER TABLE lead_steps DROP CONSTRAINT IF EXISTS lead_steps_status_check;
ALTER TABLE lead_steps ADD CONSTRAINT lead_steps_status_check 
CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled', 'blocked'));

-- Fix 3: Ensure onboarding_step_instances includes 'blocked' status if used
-- This table uses different statuses but let's ensure consistency
-- Current: ('pending', 'in_progress', 'completed', 'overdue')
-- Keep as is since this table uses 'overdue' instead of 'blocked'

-- Fix 4: Update client_onboarding_steps to be consistent
-- Current: ('pending', 'in_progress', 'completed')
-- This seems correct for this specific table

-- Fix 5: Ensure workflow tables have proper constraints (they use ENUMs so should be OK)
-- The workflow tables use PostgreSQL ENUMs which are defined correctly in the schema

-- Add indexes for performance on new constraint fields if needed
CREATE INDEX IF NOT EXISTS idx_users_role_status ON users(role, status);
CREATE INDEX IF NOT EXISTS idx_lead_steps_status_updated ON lead_steps(status, updated_at);

-- Migration completed
-- Validation: Check that all constraints are properly applied
SELECT 
    'users_role_check' as constraint_name,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'users_role_check' 
        AND check_clause LIKE '%finops%'
    ) THEN 'APPLIED' ELSE 'MISSING' END as status
UNION ALL
SELECT 
    'lead_steps_status_check' as constraint_name,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'lead_steps_status_check' 
        AND check_clause LIKE '%blocked%'
    ) THEN 'APPLIED' ELSE 'MISSING' END as status;
