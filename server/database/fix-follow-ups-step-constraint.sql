-- Fix follow_ups step_id foreign key constraint to allow step deletion

-- Drop the existing foreign key constraint that's preventing deletion
ALTER TABLE follow_ups DROP CONSTRAINT IF EXISTS follow_ups_step_id_fkey;

-- Add the constraint with ON DELETE CASCADE to allow step deletion
ALTER TABLE follow_ups 
ADD CONSTRAINT follow_ups_step_id_fkey 
FOREIGN KEY (step_id) REFERENCES lead_steps(id) ON DELETE CASCADE;

-- Add comment for documentation
COMMENT ON CONSTRAINT follow_ups_step_id_fkey ON follow_ups 
IS 'Follow-ups are deleted when their associated lead step is deleted';
