-- Update user roles based on their department assignments
-- This fixes the issue where all SSO users were assigned 'admin' role

UPDATE users
SET
    role = CASE
        WHEN department = 'hr' THEN 'hr_management'
        WHEN department = 'finance' THEN 'finance'
        WHEN department = 'finops' THEN 'finops'
        WHEN department = 'database' THEN 'db'
        WHEN department = 'frontend' THEN 'development'
        WHEN department = 'backend' THEN 'development'
        WHEN department = 'infra' THEN 'infra'
        ELSE 'development' -- Default fallback
    END,
    updated_at = NOW()
WHERE
    sso_provider = 'microsoft'
    AND department IS NOT NULL;

-- Verify the update
SELECT 
    id, 
    first_name, 
    last_name, 
    email, 
    department, 
    role,
    job_title
FROM users 
WHERE sso_provider = 'microsoft'
ORDER BY department, first_name;
