-- Fix lead_chats foreign key constraint to allow proper deletion
-- This ensures that when a lead step is deleted, associated chats are also deleted

-- Drop the existing constraint if it exists
ALTER TABLE lead_chats 
DROP CONSTRAINT IF EXISTS lead_chats_step_id_fkey;

-- Recreate the constraint with CASCADE deletion
ALTER TABLE lead_chats 
ADD CONSTRAINT lead_chats_step_id_fkey 
FOREIGN KEY (step_id) REFERENCES lead_steps(id) ON DELETE CASCADE;

-- Verify the constraint was created correctly
SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    rc.delete_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
JOIN information_schema.referential_constraints AS rc
    ON tc.constraint_name = rc.constraint_name
    AND tc.table_schema = rc.constraint_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name = 'lead_chats'
    AND kcu.column_name = 'step_id';
