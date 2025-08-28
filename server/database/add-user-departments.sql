-- Add department and SSO fields to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS department VARCHAR(50),
ADD COLUMN IF NOT EXISTS sso_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS sso_provider VARCHAR(50) DEFAULT 'microsoft',
ADD COLUMN IF NOT EXISTS job_title VARCHAR(255);

-- Create departments table
CREATE TABLE IF NOT EXISTS departments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    code VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    permissions TEXT[], -- Array of permission codes
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create user_department_permissions table for more granular control
CREATE TABLE IF NOT EXISTS user_department_permissions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    department_code VARCHAR(50) REFERENCES departments(code) ON DELETE CASCADE,
    permissions TEXT[], -- Additional permissions for this user
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default departments
INSERT INTO departments (name, code, description, permissions) VALUES
('Human Resources', 'hr', 'Human Resources department', ARRAY['users', 'reports', 'settings']),
('Finance', 'finance', 'Finance department', ARRAY['finops', 'reports', 'billing']),
('Database', 'database', 'Database administration', ARRAY['admin', 'database', 'settings']),
('Frontend Development', 'frontend', 'Frontend development team', ARRAY['product', 'leads', 'vc']),
('Backend Development', 'backend', 'Backend development team', ARRAY['admin', 'product', 'database', 'leads', 'vc']),
('Infrastructure', 'infra', 'Infrastructure team', ARRAY['admin', 'settings', 'database'])
ON CONFLICT (code) DO NOTHING;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_sso_id ON users(sso_id);
CREATE INDEX IF NOT EXISTS idx_users_department ON users(department);
CREATE INDEX IF NOT EXISTS idx_user_dept_permissions_user_id ON user_department_permissions(user_id);
