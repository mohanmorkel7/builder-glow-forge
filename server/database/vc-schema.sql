-- VC (Venture Capital) Tables Schema

-- VC opportunities table
CREATE TABLE IF NOT EXISTS vcs (
    id SERIAL PRIMARY KEY,
    vc_id VARCHAR(50) UNIQUE NOT NULL, -- #VC001, #VC002, etc.
    
    -- Lead Source Information
    lead_source VARCHAR(50) NOT NULL CHECK (lead_source IN ('email', 'social-media', 'phone', 'website', 'referral', 'cold-call', 'event', 'other')),
    lead_source_value TEXT,
    lead_created_by VARCHAR(255),
    
    -- Status
    status VARCHAR(20) DEFAULT 'in-progress' CHECK (status IN ('in-progress', 'won', 'lost', 'completed')),
    
    -- Round Information
    round_title VARCHAR(255),
    round_description TEXT,
    round_stage VARCHAR(50) CHECK (round_stage IN ('pre_seed', 'seed', 'series_a', 'series_b', 'series_c', 'bridge', 'growth', 'ipo')),
    round_size VARCHAR(100), -- Storing as string to allow flexible formats like "$10M", "₹50Cr"
    valuation VARCHAR(100),
    
    -- Investor Information
    investor_category VARCHAR(50) CHECK (investor_category IN ('angel', 'vc', 'private_equity', 'family_office', 'merchant_banker')),
    investor_name VARCHAR(255),
    contact_person VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(20),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100),
    website VARCHAR(255),
    company_size VARCHAR(50),
    industry VARCHAR(100),
    
    -- Investment Details
    potential_lead_investor BOOLEAN DEFAULT false,
    minimum_size BIGINT, -- in smallest currency unit (e.g., paise)
    maximum_size BIGINT,
    minimum_arr_requirement BIGINT,
    
    -- Enhanced Round Info
    priority_level VARCHAR(20) DEFAULT 'medium' CHECK (priority_level IN ('high', 'medium', 'low')),
    start_date DATE,
    targeted_end_date DATE,
    spoc VARCHAR(255), -- Single Point of Contact
    
    -- Billing
    billing_currency VARCHAR(3) DEFAULT 'INR' CHECK (billing_currency IN ('INR', 'USD', 'AED')),

    -- Template association
    template_id INTEGER REFERENCES onboarding_templates(id) ON DELETE SET NULL,

    -- Additional contacts (JSON field)
    contacts TEXT, -- JSON array of contact objects

    -- Metadata
    created_by INTEGER REFERENCES users(id),
    assigned_to INTEGER REFERENCES users(id),
    notes TEXT,
    is_partial BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- VC Steps table (similar to lead steps but for VCs)
CREATE TABLE IF NOT EXISTS vc_steps (
    id SERIAL PRIMARY KEY,
    vc_id INTEGER NOT NULL REFERENCES vcs(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
    assigned_to INTEGER REFERENCES users(id),
    due_date DATE,
    completed_date DATE,
    order_index INTEGER NOT NULL DEFAULT 0,
    created_by INTEGER NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure proper ordering within each VC
    UNIQUE(vc_id, order_index)
);

-- VC Comments/Chat table
CREATE TABLE IF NOT EXISTS vc_comments (
    id SERIAL PRIMARY KEY,
    vc_id INTEGER NOT NULL REFERENCES vcs(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    created_by INTEGER NOT NULL REFERENCES users(id),
    created_by_name VARCHAR(255), -- Denormalized for performance
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- VC Activity Log table (for tracking status changes and important events)
CREATE TABLE IF NOT EXISTS vc_activity_log (
    id SERIAL PRIMARY KEY,
    vc_id INTEGER NOT NULL REFERENCES vcs(id) ON DELETE CASCADE,
    activity_type VARCHAR(50) NOT NULL, -- 'status_change', 'step_completed', 'comment_added', etc.
    description TEXT NOT NULL,
    old_value TEXT,
    new_value TEXT,
    created_by INTEGER REFERENCES users(id),
    created_by_name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_vcs_status ON vcs(status);
CREATE INDEX IF NOT EXISTS idx_vcs_investor_category ON vcs(investor_category);
CREATE INDEX IF NOT EXISTS idx_vcs_created_by ON vcs(created_by);
CREATE INDEX IF NOT EXISTS idx_vcs_created_at ON vcs(created_at);
CREATE INDEX IF NOT EXISTS idx_vcs_round_stage ON vcs(round_stage);
CREATE INDEX IF NOT EXISTS idx_vcs_template_id ON vcs(template_id);

CREATE INDEX IF NOT EXISTS idx_vc_steps_vc_id ON vc_steps(vc_id);
CREATE INDEX IF NOT EXISTS idx_vc_steps_status ON vc_steps(status);
CREATE INDEX IF NOT EXISTS idx_vc_steps_assigned_to ON vc_steps(assigned_to);
CREATE INDEX IF NOT EXISTS idx_vc_steps_due_date ON vc_steps(due_date);
CREATE INDEX IF NOT EXISTS idx_vc_steps_order ON vc_steps(vc_id, order_index);

CREATE INDEX IF NOT EXISTS idx_vc_comments_vc_id ON vc_comments(vc_id);
CREATE INDEX IF NOT EXISTS idx_vc_comments_created_at ON vc_comments(created_at);

CREATE INDEX IF NOT EXISTS idx_vc_activity_log_vc_id ON vc_activity_log(vc_id);
CREATE INDEX IF NOT EXISTS idx_vc_activity_log_created_at ON vc_activity_log(created_at);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply the trigger to VC tables
CREATE TRIGGER update_vcs_updated_at BEFORE UPDATE ON vcs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_vc_steps_updated_at BEFORE UPDATE ON vc_steps FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_vc_comments_updated_at BEFORE UPDATE ON vc_comments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
