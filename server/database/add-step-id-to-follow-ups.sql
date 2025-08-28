-- Migration to add step_id column to follow_ups table

-- Add step_id column if it doesn't exist
ALTER TABLE follow_ups 
ADD COLUMN IF NOT EXISTS step_id INTEGER REFERENCES lead_steps(id) ON DELETE CASCADE;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_follow_ups_step_id ON follow_ups(step_id);

-- Update status enum to include 'in_progress' if it doesn't exist
-- Drop and recreate the status check constraint with 'in_progress'
ALTER TABLE follow_ups DROP CONSTRAINT IF EXISTS follow_ups_status_check;
ALTER TABLE follow_ups ADD CONSTRAINT follow_ups_status_check
CHECK (status IN ('pending', 'in_progress', 'completed', 'overdue'));

COMMENT ON COLUMN follow_ups.step_id IS 'Links follow-up to specific lead step for chat notifications';
