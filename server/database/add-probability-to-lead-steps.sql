-- Add probability_percent field to lead_steps table
ALTER TABLE lead_steps ADD COLUMN IF NOT EXISTS probability_percent INTEGER DEFAULT 0;

-- Update existing lead steps to have probability based on equal distribution
-- This will help with existing data
UPDATE lead_steps 
SET probability_percent = (
    SELECT CASE 
        WHEN COUNT(*) > 0 THEN FLOOR(100.0 / COUNT(*))
        ELSE 0 
    END
    FROM lead_steps ls2 
    WHERE ls2.lead_id = lead_steps.lead_id
)
WHERE probability_percent = 0 OR probability_percent IS NULL;

-- Ensure probabilities don't exceed 100% per lead
WITH lead_totals AS (
    SELECT 
        lead_id,
        SUM(probability_percent) as total_prob,
        COUNT(*) as step_count
    FROM lead_steps 
    GROUP BY lead_id
),
updated_steps AS (
    SELECT 
        ls.id,
        ls.lead_id,
        CASE 
            WHEN lt.total_prob > 100 THEN FLOOR(100.0 / lt.step_count)
            ELSE ls.probability_percent
        END as new_prob
    FROM lead_steps ls
    JOIN lead_totals lt ON ls.lead_id = lt.lead_id
    WHERE lt.total_prob > 100
)
UPDATE lead_steps 
SET probability_percent = updated_steps.new_prob
FROM updated_steps
WHERE lead_steps.id = updated_steps.id;
