-- Migration: Add 'partner' category to leads table
-- Date: $(date)

-- Remove the existing constraint
ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_category_check;

-- Add the new constraint with 'partner' included
ALTER TABLE leads ADD CONSTRAINT leads_category_check 
CHECK (category IN ('aggregator', 'banks', 'partner'));

-- Update any existing null category values to 'aggregator' (default)
UPDATE leads SET category = 'aggregator' WHERE category IS NULL;
