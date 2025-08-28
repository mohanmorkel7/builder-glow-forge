-- Add Azure AD related fields to users table
-- This migration adds fields needed for Azure AD integration

-- Add columns if they don't exist
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS azure_object_id VARCHAR(255) UNIQUE,
ADD COLUMN IF NOT EXISTS sso_provider VARCHAR(50),
ADD COLUMN IF NOT EXISTS sso_external_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS profile_picture_url TEXT;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_azure_object_id ON users(azure_object_id);
CREATE INDEX IF NOT EXISTS idx_users_sso_provider ON users(sso_provider);

-- Update existing constraint to allow unknown role
-- First, remove the old check constraint if it exists
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

-- Add new check constraint with unknown role
ALTER TABLE users ADD CONSTRAINT users_role_check 
CHECK (role IN (
  'admin', 'sales', 'product', 'development', 'db', 
  'finops', 'finance', 'hr_management', 'infra', 'switch_team', 'unknown'
));

-- Add comments for documentation
COMMENT ON COLUMN users.azure_object_id IS 'Azure AD Object ID for SSO users';
COMMENT ON COLUMN users.sso_provider IS 'SSO provider name (microsoft, google, etc.)';
COMMENT ON COLUMN users.sso_external_id IS 'External ID from SSO provider';
COMMENT ON COLUMN users.profile_picture_url IS 'URL to user profile picture from SSO provider';

-- Create a view for unknown users that need role assignment
CREATE OR REPLACE VIEW users_need_role_assignment AS
SELECT 
  id,
  first_name,
  last_name,
  email,
  department,
  azure_object_id,
  sso_provider,
  created_at,
  updated_at
FROM users 
WHERE role = 'unknown' 
  AND sso_provider IS NOT NULL
ORDER BY created_at DESC;

COMMENT ON VIEW users_need_role_assignment IS 'Users imported from SSO that need manual role assignment';

-- Insert some sample data for testing (optional)
-- INSERT INTO users (first_name, last_name, email, password_hash, role, azure_object_id, sso_provider, status, two_factor_enabled) 
-- VALUES 
--   ('Test', 'Azure User', 'test.azure@mylapay.com', 'SSO_AUTH_NO_PASSWORD', 'unknown', 'sample-azure-id-123', 'microsoft', 'active', false)
-- ON CONFLICT (email) DO NOTHING;

COMMIT;
