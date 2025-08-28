-- Migration: Add commercials configuration fields to leads table
-- This migration adds support for the new commercials configuration features

-- Add new transaction volume fields for different years
ALTER TABLE leads ADD COLUMN IF NOT EXISTS expected_daily_txn_volume_year1 INTEGER;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS expected_daily_txn_volume_year2 INTEGER;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS expected_daily_txn_volume_year3 INTEGER;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS expected_daily_txn_volume_year5 INTEGER;

-- Add lead_created_by field
ALTER TABLE leads ADD COLUMN IF NOT EXISTS lead_created_by VARCHAR(255);

-- Add billing currency field
ALTER TABLE leads ADD COLUMN IF NOT EXISTS billing_currency VARCHAR(3) DEFAULT 'INR' CHECK (billing_currency IN ('INR', 'USD', 'AED'));

-- Add flat fee configuration as JSONB
ALTER TABLE leads ADD COLUMN IF NOT EXISTS flat_fee_config JSONB DEFAULT '[]'::jsonb;

-- Add transaction fee configuration as JSONB  
ALTER TABLE leads ADD COLUMN IF NOT EXISTS transaction_fee_config JSONB DEFAULT '[]'::jsonb;

-- Remove old project value fields that are no longer used
-- ALTER TABLE leads DROP COLUMN IF EXISTS project_value;
-- ALTER TABLE leads DROP COLUMN IF EXISTS project_value_12m;
-- ALTER TABLE leads DROP COLUMN IF EXISTS project_value_24m;
-- ALTER TABLE leads DROP COLUMN IF EXISTS project_value_36m;

-- Remove old commercials fields that are replaced by new config
-- ALTER TABLE leads DROP COLUMN IF EXISTS commercials;
-- ALTER TABLE leads DROP COLUMN IF EXISTS commercial_pricing;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_leads_billing_currency ON leads(billing_currency);
CREATE INDEX IF NOT EXISTS idx_leads_created_by ON leads(lead_created_by);

-- Update existing leads to have default billing currency if null
UPDATE leads SET billing_currency = 'INR' WHERE billing_currency IS NULL;

-- Update existing leads to have empty arrays for new config fields if null
UPDATE leads SET flat_fee_config = '[]'::jsonb WHERE flat_fee_config IS NULL;
UPDATE leads SET transaction_fee_config = '[]'::jsonb WHERE transaction_fee_config IS NULL;

-- Add comment to track migration
COMMENT ON COLUMN leads.billing_currency IS 'Default billing currency for all commercial calculations';
COMMENT ON COLUMN leads.flat_fee_config IS 'JSON array containing flat fee configurations with one-time and recurring fees';
COMMENT ON COLUMN leads.transaction_fee_config IS 'JSON array containing transaction-based fee configurations per solution';
COMMENT ON COLUMN leads.expected_daily_txn_volume_year1 IS 'Expected daily transaction volume for first year';
COMMENT ON COLUMN leads.expected_daily_txn_volume_year2 IS 'Expected daily transaction volume for second year';
COMMENT ON COLUMN leads.expected_daily_txn_volume_year3 IS 'Expected daily transaction volume for third year';
COMMENT ON COLUMN leads.expected_daily_txn_volume_year5 IS 'Expected daily transaction volume for fifth year';
COMMENT ON COLUMN leads.lead_created_by IS 'Email of the user who created this lead';
