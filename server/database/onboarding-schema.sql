-- Client Onboarding Steps Table
CREATE TABLE IF NOT EXISTS client_onboarding_steps (
    id SERIAL PRIMARY KEY,
    client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
    step_order INTEGER NOT NULL DEFAULT 1,
    due_date DATE,
    completed_date DATE,
    estimated_days INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Step Documents Table
CREATE TABLE IF NOT EXISTS client_step_documents (
    id SERIAL PRIMARY KEY,
    step_id INTEGER NOT NULL REFERENCES client_onboarding_steps(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT NOT NULL,
    file_type VARCHAR(100),
    uploaded_by VARCHAR(255) NOT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Step Comments Table
CREATE TABLE IF NOT EXISTS client_step_comments (
    id SERIAL PRIMARY KEY,
    step_id INTEGER NOT NULL REFERENCES client_onboarding_steps(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    user_name VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    comment_type VARCHAR(20) DEFAULT 'note' CHECK (comment_type IN ('note', 'update', 'system')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_client_onboarding_steps_client_id ON client_onboarding_steps(client_id);
CREATE INDEX IF NOT EXISTS idx_client_onboarding_steps_order ON client_onboarding_steps(client_id, step_order);
CREATE INDEX IF NOT EXISTS idx_client_step_documents_step_id ON client_step_documents(step_id);
CREATE INDEX IF NOT EXISTS idx_client_step_comments_step_id ON client_step_comments(step_id);
CREATE INDEX IF NOT EXISTS idx_client_step_comments_created_at ON client_step_comments(created_at);

-- Update timestamp function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for updating updated_at column
CREATE TRIGGER update_client_onboarding_steps_updated_at 
    BEFORE UPDATE ON client_onboarding_steps 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
