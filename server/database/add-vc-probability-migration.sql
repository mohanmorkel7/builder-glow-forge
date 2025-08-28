-- Migration: Add probability_percent column to vc_steps table

-- Check if column exists and add if not
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'vc_steps' AND column_name = 'probability_percent'
    ) THEN
        -- Add the column
        ALTER TABLE vc_steps 
        ADD COLUMN probability_percent DECIMAL(5,2) DEFAULT 16.67;
        
        -- Update existing records with equal distribution per VC
        WITH vc_step_counts AS (
            SELECT vc_id, COUNT(*) as step_count
            FROM vc_steps
            GROUP BY vc_id
        ),
        vc_probabilities AS (
            SELECT vc_id, 
                   CASE 
                       WHEN step_count > 0 THEN ROUND((100.0 / step_count)::numeric, 2)
                       ELSE 0
                   END as probability
            FROM vc_step_counts
        )
        UPDATE vc_steps
        SET probability_percent = vp.probability
        FROM vc_probabilities vp
        WHERE vc_steps.vc_id = vp.vc_id;
        
        RAISE NOTICE 'Added probability_percent column and updated existing records';
    ELSE
        RAISE NOTICE 'probability_percent column already exists';
    END IF;
END $$;
