-- Migration: Update probability default value from 50 to 0
-- Date: 2025-01-07
-- Description: Changes the default probability value from 50% to 0% for new leads

-- Update the column default value
ALTER TABLE leads 
ALTER COLUMN probability SET DEFAULT 0;

-- Optional: Update existing leads that have probability = 50 to 0 
-- (uncomment the line below if you want to reset existing 50% probabilities to 0%)
-- UPDATE leads SET probability = 0 WHERE probability = 50;

-- Verify the change
SELECT column_name, column_default, data_type 
FROM information_schema.columns 
WHERE table_name = 'leads' AND column_name = 'probability';
